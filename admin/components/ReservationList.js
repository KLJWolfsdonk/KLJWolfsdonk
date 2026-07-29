import { escapeHtml } from "../../src/shared/helpers.js";


export class ReservationList {


	constructor(
		container,
		onUpdated = null,
		onMarkPaid = null,
		onDelete = null
	) {

		this.container = container;
		this.onUpdated = onUpdated;
		this.onMarkPaid = onMarkPaid;
		this.onDelete = onDelete;

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



						${
							reservation.adminNotities
							?
							`

							<h3>
								Admin notities
							</h3>

							<p>
								${escapeHtml(reservation.adminNotities)}
							</p>

							`
							:
							""
						}


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
                        reservation.betaling?.status !== "paid"
                        ?
                        `

                        <button
                            class="mark-paid-btn"
                            data-id="${reservation.id}"
                        >
                            Markeer als betaald
                        </button>

                        `
                        :
                        ""
                    }



                    ${
                        reservation.status === "voltooid" ||
                        reservation.status === "geweigerd"
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
						button
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




	async handleMarkPaid(id, element) {

		try {


			element.disabled = true;


			if (this.onMarkPaid) {

				await this.onMarkPaid(id);

			}


		}
		catch (error) {


			console.error(
				"Markeren als betaald mislukt:",
				error
			);


			alert(
				`Kon niet als betaald markeren: ${error.message}`
			);


		}
		finally {


			element.disabled = false;


		}

	}




	async handleDelete(id, element) {

		const akkoord =
			confirm(
				"Weet je zeker dat je deze voltooide reservatie permanent wilt verwijderen? Dit kan niet ongedaan gemaakt worden."
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


}