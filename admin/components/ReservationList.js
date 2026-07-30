import { escapeHtml } from "../../src/shared/helpers.js";
import { downloadContractPdf } from "../../src/shared/contractPdf.js";


export class ReservationList {


	constructor(
		container,
		onUpdated = null,
		onMarkPaid = null,
		onDelete = null,
		onAddNote = null,
		onResendConfirmation = null,
		onResetContract = null,
		onEditDetails = null,
		onUpdateDepositStatus = null
	) {

		this.container = container;
		this.onUpdated = onUpdated;
		this.onMarkPaid = onMarkPaid;
		this.onDelete = onDelete;
		this.onAddNote = onAddNote;
		this.onResendConfirmation = onResendConfirmation;
		this.onResetContract = onResetContract;
		this.onEditDetails = onEditDetails;
		this.onUpdateDepositStatus = onUpdateDepositStatus;

		this.allProducts = [];
		this.editingId = null;
		this.editDraft = null;

	}




	setProducts(products) {

		this.allProducts = products ?? [];

	}




	render(reservations) {


		if (!reservations || reservations.length === 0) {


			this.container.innerHTML = `

				<p>
					Geen reservaties gevonden.
				</p>

			`;

			return;

		}


		this.reservations = reservations;




		this.container.innerHTML =
			reservations.map(reservation => {


				const klant =
					escapeHtml(
						reservation.klant ||
						reservation.customerSnapshot?.naam ||
						"-"
					);


				const email =
					escapeHtml(
						reservation.email ||
						reservation.customerSnapshot?.email ||
						"-"
					);


				const telefoon =
					escapeHtml(
						reservation.telefoon ||
						reservation.customerSnapshot?.telefoon ||
						"-"
					);



				return `

				<article class="reservation-card">


					<header>

						<h2>
							Reservatie
						</h2>


						<p>
							<small>
								ID:
								${reservation.id}
							</small>
						</p>


						<p>
							Aangevraagd:
							${
								reservation.aangemaaktOp
								?
								new Date(
									reservation.aangemaaktOp
								).toLocaleString("nl-BE")
								:
								"-"
							}
						</p>


						<span class="status ${reservation.status}">
							${reservation.status}
						</span>

						<span class="status payment-${reservation.betaling?.status === "paid" ? "paid" : "none"}">
							${reservation.betaling?.status === "paid" ? "Betaald" : "Niet betaald"}
						</span>

						<span class="status contract-${reservation.contractSignedAt ? "signed" : "unsigned"}">
							${
								reservation.contractSignedAt
								?
								`Contract getekend (${new Date(reservation.contractSignedAt).toLocaleString("nl-BE")})`
								:
								"Contract niet getekend"
							}
						</span>

						<span class="status deposit-${reservation.waarborg?.status === "teruggegeven" ? "returned" : "open"}">
							${reservation.waarborg?.status === "teruggegeven" ? "Waarborg teruggegeven" : "Waarborg open"}
						</span>


					</header>





					<section class="customer-info">


						<h3>
							Klantgegevens
						</h3>


						<p>
							<strong>
								Naam:
							</strong>

							${klant}
						</p>



						<p>

							<strong>
								E-mail:
							</strong>

							<a href="mailto:${email}">
								${email}
							</a>

						</p>




						<p>

							<strong>
								Telefoon:
							</strong>


							<a href="tel:${telefoon}">
								${telefoon}
							</a>

						</p>





						${
							reservation.opmerkingen
							?
							`

							<p>

								<strong>
									Opmerking:
								</strong>

								${escapeHtml(reservation.opmerkingen)}

							</p>

							`
							:
							""
						}



						<h3>
							Admin notities
						</h3>

						<ul class="admin-notes-list">
							${
								(reservation.notities ?? []).length
								?
								reservation.notities
								.map(note => `
									<li class="admin-note">
										<div class="admin-note-meta">
											<span class="admin-note-author">${escapeHtml(note.auteurEmail)}</span>
											<span class="admin-note-date">${new Date(note.aangemaaktOp).toLocaleString("nl-BE")}</span>
										</div>
										<p class="admin-note-text">${escapeHtml(note.tekst)}</p>
									</li>
								`)
								.join("")
								:
								`
									<li class="admin-note admin-note-empty">
										Nog geen notities.
									</li>
								`
							}
						</ul>

						<textarea
							class="admin-notes-input"
							data-id="${reservation.id}"
							rows="3"
							placeholder="Nieuwe interne notitie (enkel zichtbaar voor beheerders)"
						></textarea>

						<button
							type="button"
							class="save-notes-btn"
							data-id="${reservation.id}"
						>
							Notitie toevoegen
						</button>


					</section>






					<section>


						<h3>
							Periode
						</h3>


						<p>
							${reservation.startDatum}
							 →
							${reservation.eindDatum}
						</p>


					</section>






					<section>


						<h3>
							Producten
						</h3>


						<ul>


						${
							reservation.producten?.map(product => `

								<li>

									<strong>
										${escapeHtml(product.productNaamSnapshot)}
									</strong>


									(${product.quantity}x)


									<br>


									€ ${
										(
											product.linePrijs / 100
										).toFixed(2)
									}


								</li>

							`).join("")
						}


						</ul>


					</section>


					${this._renderEditForm(reservation)}






					<section class="reservation-total">


						<p>

							Huurprijs:

							<strong>
								€ ${
									(
										reservation.prijs?.subtotaal / 100
									).toFixed(2)
								}
							</strong>

						</p>



						<p>

							Totaal:

							<strong>
								€ ${
									(
										reservation.prijs?.totaal / 100
									).toFixed(2)
								}
							</strong>

						</p>



						<p>

							Waarborg:

							<strong>
								€ ${
									(
										reservation.waarborg?.totaal / 100
									).toFixed(2)
								}
							</strong>

						</p>


					</section>







					${
						reservation.contractSignatureData
						?
						`

						<section class="contract-signature">

							<h3>
								Handtekening
							</h3>

							<img
								src="${reservation.contractSignatureData}"
								alt="Handtekening van ${klant}"
								class="signature-image"
							>

							<p>
								<button
									type="button"
									class="reset-contract-btn"
									data-id="${reservation.id}"
								>
									Handtekening resetten (opnieuw laten ondertekenen)
								</button>
							</p>

						</section>

						`
						:
						""
					}




					<section class="reservation-status">


						<label>

							Status aanpassen


							<select
                                class="status-select"
                                data-id="${reservation.id}"
                            >


                            <option value="aanvraag"
                            ${
                                reservation.status === "aanvraag"
                                ? "selected"
                                : ""
                            }
                            >
                                Aanvraag
                            </option>



                            <option value="bevestigd"
                            ${
                                reservation.status === "bevestigd"
                                ? "selected"
                                : ""
                            }
                            >
                                Bevestigd
                            </option>



                            <option value="geweigerd"
                            ${
                                reservation.status === "geweigerd"
                                ? "selected"
                                : ""
                            }
                            >
                                Geweigerd
                            </option>



                            <option value="voltooid"
                            ${
                                reservation.status === "voltooid"
                                ? "selected"
                                : ""
                            }
                            >
                                Voltooid
                            </option>


                            </select>


						</label>


					</section>








                    <section class="reservation-actions">


                    <button
                        class="edit-reservation-btn"
                        data-id="${reservation.id}"
                    >
                        ${this.editingId === reservation.id ? "Bewerken annuleren" : "Bewerken"}
                    </button>


                    ${
                        reservation.status === "aanvraag"
                        ?
                        `

                        <button
                            class="approve-btn"
                            data-id="${reservation.id}"
                        >
                            Bevestigen
                        </button>


                        <button
                            class="reject-btn"
                            data-id="${reservation.id}"
                        >
                            Weigeren
                        </button>

                        `
                        :
                        ""
                    }



                    ${
                        reservation.status === "bevestigd"
                        ?
                        `

                        <button
                            class="complete-btn"
                            data-id="${reservation.id}"
                        >
                            Markeer voltooid
                        </button>


                        <button
                            class="reopen-btn"
                            data-id="${reservation.id}"
                        >
                            Terug naar aanvraag
                        </button>


                        <button
                            class="resend-confirmation-btn"
                            data-id="${reservation.id}"
                        >
                            Bevestigingsmail opnieuw versturen
                        </button>

                        `
                        :
                        ""
                    }



                    ${
                        reservation.status === "geweigerd"
                        ?
                        `

                        <button
                            class="reopen-btn"
                            data-id="${reservation.id}"
                        >
                            Heropen aanvraag
                        </button>

                        `
                        :
                        ""
                    }



                    ${
                        reservation.betaling?.status === "paid"
                        ?
                        `

                        <button
                            class="unmark-paid-btn"
                            data-id="${reservation.id}"
                        >
                            Markeer als niet betaald
                        </button>

                        `
                        :
                        `

                        <button
                            class="mark-paid-btn"
                            data-id="${reservation.id}"
                        >
                            Markeer als betaald
                        </button>

                        `
                    }



                    ${
                        (reservation.waarborg?.totaal ?? 0) > 0
                        ?
                        (
                            reservation.waarborg?.status === "teruggegeven"
                            ?
                            `

                            <button
                                class="mark-deposit-open-btn"
                                data-id="${reservation.id}"
                            >
                                Markeer waarborg als open
                            </button>

                            `
                            :
                            `

                            <button
                                class="mark-deposit-returned-btn"
                                data-id="${reservation.id}"
                            >
                                Markeer waarborg als teruggegeven
                            </button>

                            `
                        )
                        :
                        ""
                    }



                    ${
                        reservation.contractSignedAt
                        ?
                        `

                        <button
                            class="download-contract-btn"
                            data-id="${reservation.id}"
                        >
                            Download contract (PDF)
                        </button>

                        `
                        :
                        ""
                    }



                    ${
                        reservation.status === "voltooid" ||
                        reservation.status === "geweigerd" ||
                        reservation.status === "aanvraag"
                        ?
                        `

                        <button
                            class="delete-reservation-btn"
                            data-id="${reservation.id}"
                        >
                            Verwijder
                        </button>

                        `
                        :
                        ""
                    }
                    </section>

				</article>


				`;

			}).join("");




		this.attachEvents();

	}




	_renderEditForm(reservation) {

		if (this.editingId !== reservation.id) {
			return "";
		}

		const draft = this.editDraft;

		const usedProductIds =
			new Set(draft.producten.map(item => item.productId));

		const availableProducts =
			this.allProducts.filter(
				product => !usedProductIds.has(product.id)
			);

		return `

			<section class="reservation-edit">

				<h3>
					Reservatie bewerken
				</h3>

				<div class="inline-fields">

					<label>
						Startdatum
						<input type="date" class="edit-start-date" value="${draft.startDatum ?? ""}">
					</label>

					<label>
						Einddatum
						<input type="date" class="edit-end-date" value="${draft.eindDatum ?? ""}">
					</label>

				</div>

				<ul class="edit-products-list">

					${draft.producten.map(item => `

						<li data-product-id="${item.productId}">

							<span>${escapeHtml(item.naam)}</span>

							<input
								type="number"
								min="1"
								class="edit-qty-input"
								data-product-id="${item.productId}"
								value="${item.quantity}"
							>

							<button
								type="button"
								class="edit-remove-product-btn"
								data-product-id="${item.productId}"
							>
								Verwijder
							</button>

						</li>

					`).join("")}

				</ul>

				<div class="inline-fields">

					<select class="edit-add-product-select">
						<option value="">— product toevoegen —</option>
						${availableProducts.map(product => `
							<option value="${product.id}">${escapeHtml(product.naam)}</option>
						`).join("")}
					</select>

					<button type="button" class="edit-add-product-btn" data-id="${reservation.id}">
						Toevoegen
					</button>

				</div>

				<p class="edit-error error-message" hidden></p>

				<div class="inline-fields">

					<button type="button" class="save-edit-btn" data-id="${reservation.id}">
						Wijzigingen opslaan
					</button>

					<button type="button" class="cancel-edit-btn" data-id="${reservation.id}">
						Annuleren
					</button>

				</div>

			</section>

		`;

	}







	attachEvents() {



		this.container
		.querySelectorAll(".status-select")
		.forEach(select => {


			select.addEventListener(
				"change",
				async event => {


					await this.handleUpdate(
						event.target.dataset.id,
						event.target.value,
						event.target
					);


				}
			);


		});





		this.container
		.querySelectorAll(".approve-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				async () => {


					await this.handleUpdate(
						button.dataset.id,
						"bevestigd",
						button
					);


				}
			);


		});






		this.container
		.querySelectorAll(".reject-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				async () => {


					await this.handleUpdate(
						button.dataset.id,
						"geweigerd",
						button
					);


				}
			);


		});






		this.container
		.querySelectorAll(".complete-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				async () => {


					await this.handleUpdate(
						button.dataset.id,
						"voltooid",
						button
					);


				}
			);


		});




        this.container
        .querySelectorAll(".reopen-btn")
        .forEach(button => {


            button.addEventListener(
                "click",
                () => {


                    this.handleUpdate(
                        button.dataset.id,
                        "aanvraag",
                        button
                    );


                }
            );


        });




		this.container
		.querySelectorAll(".mark-paid-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {


					this.handleMarkPaid(
						button.dataset.id,
						button,
						true
					);


				}
			);


		});




		this.container
		.querySelectorAll(".unmark-paid-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {


					const akkoord =
						confirm(
							"Weet je zeker dat je deze reservatie terug als niet betaald wilt markeren?"
						);

					if (!akkoord) {
						return;
					}

					this.handleMarkPaid(
						button.dataset.id,
						button,
						false
					);


				}
			);


		});




		this.container
		.querySelectorAll(".mark-deposit-returned-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {


					this.handleUpdateDepositStatus(
						button.dataset.id,
						button,
						"teruggegeven"
					);


				}
			);


		});




		this.container
		.querySelectorAll(".mark-deposit-open-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {


					const akkoord =
						confirm(
							"Weet je zeker dat je deze waarborg terug als open wilt markeren?"
						);

					if (!akkoord) {
						return;
					}

					this.handleUpdateDepositStatus(
						button.dataset.id,
						button,
						"open"
					);


				}
			);


		});




		this.container
		.querySelectorAll(".delete-reservation-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {


					this.handleDelete(
						button.dataset.id,
						button
					);


				}
			);


		});




		this.container
		.querySelectorAll(".save-notes-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {


					const textarea =
						this.container.querySelector(
							`.admin-notes-input[data-id="${button.dataset.id}"]`
						);

					this.handleAddNote(
						button.dataset.id,
						textarea.value,
						button
					);


				}
			);


		});




		this.container
		.querySelectorAll(".resend-confirmation-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {


					this.handleResendConfirmation(
						button.dataset.id,
						button
					);


				}
			);


		});




		this.container
		.querySelectorAll(".download-contract-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {


					this.handleDownloadContract(
						button.dataset.id,
						button
					);


				}
			);


		});




		this.container
		.querySelectorAll(".reset-contract-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {


					const akkoord =
						confirm(
							"Weet je zeker dat je deze handtekening wilt resetten? De huurder kan dan opnieuw tekenen via dezelfde link. Dit kan niet ongedaan gemaakt worden."
						);

					if (!akkoord) {
						return;
					}

					this.handleResetContract(
						button.dataset.id,
						button
					);


				}
			);


		});






		this.container
		.querySelectorAll(".edit-reservation-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {

					this.toggleEdit(button.dataset.id);

				}
			);


		});




		this.container
		.querySelectorAll(".edit-remove-product-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {

					this._syncEditDraftQuantities();

					this.editDraft.producten =
						this.editDraft.producten.filter(
							item => item.productId !== button.dataset.productId
						);

					this.render(this.reservations);

				}
			);


		});




		this.container
		.querySelectorAll(".edit-add-product-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {

					const select =
						this.container.querySelector(".edit-add-product-select");

					const productId = select?.value;

					if (!productId) {
						return;
					}

					const product =
						this.allProducts.find(item => item.id === productId);

					if (!product) {
						return;
					}

					this._syncEditDraftQuantities();

					this.editDraft.producten.push({
						productId: product.id,
						naam: product.naam,
						quantity: 1
					});

					this.render(this.reservations);

				}
			);


		});




		this.container
		.querySelectorAll(".cancel-edit-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {

					this.editingId = null;
					this.editDraft = null;

					this.render(this.reservations);

				}
			);


		});




		this.container
		.querySelectorAll(".save-edit-btn")
		.forEach(button => {


			button.addEventListener(
				"click",
				() => {

					this.handleSaveEdit(
						button.dataset.id,
						button
					);

				}
			);


		});


	}




	_syncEditDraftQuantities() {

		if (!this.editDraft) {
			return;
		}

		this.container
			.querySelectorAll(".edit-qty-input")
			.forEach(input => {

				const item =
					this.editDraft.producten.find(
						product => product.productId === input.dataset.productId
					);

				if (item) {

					const quantity = parseInt(input.value, 10);

					item.quantity =
						Number.isFinite(quantity) && quantity > 0
							? quantity
							: 1;

				}

			});

	}




	toggleEdit(id) {

		if (this.editingId === id) {

			this.editingId = null;
			this.editDraft = null;

		}
		else {

			const reservation =
				this.reservations?.find(item => item.id === id);

			if (!reservation) {
				return;
			}

			this.editingId = id;

			this.editDraft = {
				startDatum: reservation.startDatum,
				eindDatum: reservation.eindDatum,
				producten: (reservation.producten ?? []).map(item => ({
					productId: item.productId,
					naam: item.productNaamSnapshot,
					quantity: item.quantity
				}))
			};

		}

		this.render(this.reservations);

	}




	async handleSaveEdit(id, element) {

		this._syncEditDraftQuantities();

		const startDatum =
			this.container.querySelector(".edit-start-date")?.value;

		const eindDatum =
			this.container.querySelector(".edit-end-date")?.value;

		const errorEl =
			this.container.querySelector(".edit-error");

		if (errorEl) {
			errorEl.hidden = true;
		}

		if (!startDatum || !eindDatum || startDatum > eindDatum) {

			if (errorEl) {

				errorEl.textContent = "Kies een geldige periode.";
				errorEl.hidden = false;

			}

			return;

		}

		if (!this.editDraft.producten || this.editDraft.producten.length === 0) {

			if (errorEl) {

				errorEl.textContent = "Kies minstens één product.";
				errorEl.hidden = false;

			}

			return;

		}

		try {

			element.disabled = true;

			if (this.onEditDetails) {

				await this.onEditDetails(id, {
					startDatum,
					eindDatum,
					producten: this.editDraft.producten.map(item => ({
						productId: item.productId,
						quantity: item.quantity
					}))
				});

			}

			this.editingId = null;
			this.editDraft = null;

			this.render(this.reservations);

		}
		catch (error) {


			console.error(
				"Reservatie bewerken mislukt:",
				error
			);


			if (errorEl) {

				errorEl.textContent = `Kon wijzigingen niet opslaan: ${error.message}`;
				errorEl.hidden = false;

			}

			element.disabled = false;

			return;

		}

	}










	async handleUpdate(id,status,element) {

        if(status === "geweigerd"){

            const akkoord =
                confirm(
                    "Weet je zeker dat je deze aanvraag weigert?"
                );


            if(!akkoord){
                return;
            }

        }


		try {


			element.disabled = true;



			if(this.onUpdated){

				await this.onUpdated(
					id,
					status
				);

			}




		}
		catch(error){


			console.error(
				"Status update mislukt:",
				error
			);


			alert(
				`Status kon niet worden aangepast: ${error.message}`
			);


		}
		finally {


			element.disabled = false;


		}


	}




	async handleMarkPaid(id, element, paid) {

		try {


			element.disabled = true;


			if (this.onMarkPaid) {

				await this.onMarkPaid(id, paid);

			}


		}
		catch (error) {


			console.error(
				"Betaalstatus aanpassen mislukt:",
				error
			);


			alert(
				`Kon betaalstatus niet aanpassen: ${error.message}`
			);


		}
		finally {


			element.disabled = false;


		}

	}




	async handleUpdateDepositStatus(id, element, status) {

		try {


			element.disabled = true;


			if (this.onUpdateDepositStatus) {

				await this.onUpdateDepositStatus(id, status);

			}


		}
		catch (error) {


			console.error(
				"Waarborgstatus aanpassen mislukt:",
				error
			);


			alert(
				`Kon waarborgstatus niet aanpassen: ${error.message}`
			);


		}
		finally {


			element.disabled = false;


		}

	}




	async handleDelete(id, element) {

		const akkoord =
			confirm(
				"Weet je zeker dat je deze reservatie permanent wilt verwijderen? Dit kan niet ongedaan gemaakt worden."
			);


		if (!akkoord) {
			return;
		}


		try {


			element.disabled = true;


			if (this.onDelete) {

				await this.onDelete(id);

			}


		}
		catch (error) {


			console.error(
				"Reservatie verwijderen mislukt:",
				error
			);


			alert(
				`Kon reservatie niet verwijderen: ${error.message}`
			);


			element.disabled = false;


		}

	}




	async handleAddNote(id, notes, element) {

		if (!notes || !notes.trim()) {

			return;

		}

		try {

			element.disabled = true;

			if (this.onAddNote) {

				await this.onAddNote(id, notes);

			}

		}
		catch (error) {


			console.error(
				"Notitie opslaan mislukt:",
				error
			);


			alert(
				`Kon notitie niet opslaan: ${error.message}`
			);


		}
		finally {

			element.disabled = false;

		}

	}




	async handleResendConfirmation(id, element) {

		try {

			element.disabled = true;

			if (this.onResendConfirmation) {

				await this.onResendConfirmation(id);

			}

			alert("Bevestigingsmail opnieuw verstuurd.");

		}
		catch (error) {


			console.error(
				"Bevestigingsmail opnieuw versturen mislukt:",
				error
			);


			alert(
				`Kon bevestigingsmail niet opnieuw versturen: ${error.message}`
			);


		}
		finally {

			element.disabled = false;

		}

	}




	async handleResetContract(id, element) {

		try {

			element.disabled = true;

			if (this.onResetContract) {

				await this.onResetContract(id);

			}

		}
		catch (error) {


			console.error(
				"Handtekening resetten mislukt:",
				error
			);


			alert(
				`Kon handtekening niet resetten: ${error.message}`
			);


		}
		finally {

			element.disabled = false;

		}

	}




	async handleDownloadContract(id, element) {

		const reservation =
			this.reservations?.find(
				item => item.id === id
			);

		if (!reservation) {
			return;
		}

		try {

			element.disabled = true;

			await downloadContractPdf(reservation);

		}
		catch (error) {


			console.error(
				"Kon contract-PDF niet genereren:",
				error
			);


			alert(
				`Kon contract-PDF niet genereren: ${error.message}`
			);


		}
		finally {

			element.disabled = false;

		}

	}


}