import { Reservation } from '../models/Reservation.js';
import { countInclusiveDays, rangesOverlap } from '../shared/helpers.js';
import { repositories } from '../repositories/container.js';
import { notifyCustomerOfConfirmation, notifyCustomerOfRejection } from '../shared/notifications.js';



/**
 * Business rules for reservations.
 */
export class ReservationService {


	constructor(
		reservations = repositories.reservations,
		customers = repositories.customers,
		products = repositories.products
	) {

		this.reservations = reservations;
		this.customers = customers;
		this.products = products;

	}





	async getAll() {

		return this.reservations.getAll();

	}





	async getById(id) {

		return this.reservations.getById(id);

	}




	async addNote(id, text) {

		if (!text || !text.trim()) {

			throw new Error('Vul een notitie in.');

		}

		return this.reservations.addNote(id, text.trim());

	}





	async search(query) {

		return this.reservations.search(query);

	}







	async create(input) {


		/*
			Pricing, stock validation, and customer creation now happen
			server-side (see sql/secure_reservation_creation.sql) so a client
			can only pick products/quantities/dates — never the price. The
			raw booking input is passed straight through instead of being
			pre-priced here.
		*/
		return this.reservations.create(input);

	}









	async update(id, input) {


		const currentReservation =
			await this.reservations.getById(id);




		if (!currentReservation) {

			return null;

		}




		const oldStatus =
			currentReservation.status;



		const newStatus =
			input.status ?? oldStatus;





		if (input.status) {


			this._validateStatusTransition(

				oldStatus,

				newStatus

			);


		}







		const preparedReservation =
			await this._prepareReservation(


				{

					...currentReservation.toJSON(),

					...input,

					id

				},


				{

					skipStockCheck:true

				}


			);







		const updatedReservation =
			await this.reservations.update(

				id,

				preparedReservation.toJSON()

			);













		if (

			oldStatus === "aanvraag" &&

			newStatus === "bevestigd"

		) {


			notifyCustomerOfConfirmation(

				updatedReservation

			);


		}


		if (

			oldStatus === "aanvraag" &&

			newStatus === "geweigerd"

		) {


			notifyCustomerOfRejection(

				updatedReservation

			);


		}




		return updatedReservation;


	}









	async delete(id) {


		const reservation =
			await this.reservations.getById(id);


		await this.reservations.delete(id);


		if (reservation?.customerId) {

			try {

				await this.customers.deleteIfOrphan(
					reservation.customerId
				);

			}
			catch (error) {

				console.warn(
					"Kon klantgegevens niet opruimen na verwijderen reservatie:",
					error
				);

			}

		}


		return true;


	}









	async resetContract(id) {

		return this.reservations.resetContract(id);

	}




	async getByStatus(status) {


		const reservations =

			await this.reservations.getAll();




		return reservations.filter(

			reservation =>

				reservation.status === status

		);


	}









	async _prepareReservation(

		input,

		options = {}

	) {



		const customer =

			await this._resolveCustomer(input);






		const products =

			await this._resolveProducts(input);







		if (!options.skipStockCheck) {


			await this._checkStockAvailability(

				products

			);


		}







		const aantalDagen =

			countInclusiveDays(

				input.startDatum,

				input.eindDatum

			);







		const pricing =

			this._calculatePricing(

				products,

				aantalDagen

			);







		const deposit =

			this._calculateDeposit(

				products,

				pricing

			);








		return Reservation.from({



			...input,





			customerId:

				customer.id,






			customerSnapshot:{


				naam:

					customer.naam,


				email:

					customer.email,


				telefoon:

					customer.telefoon,


				adres:

					customer.adres


			},







			klant:

				customer.naam,



			email:

				customer.email,



			telefoon:

				customer.telefoon,







			productIds:

				products.map(

					item => item.product.id

				),








			producten:

				this._buildReservationLines(

					products,

					aantalDagen

				),






			prijs:

				pricing,







			waarborg:

				deposit




		});



	}









	async _resolveCustomer(input) {



		if (input.customerId) {


			const customer =

				await this.customers.getById(

					input.customerId

				);




			if (customer) {

				return customer;

			}


		}



		return this.customers.create({


			naam:

				input.klant ?? "",



			email:

				input.email ?? "",



			telefoon:

				input.telefoon ?? "",



			adres:

				input.adres ?? {}



		});



	}









	async _resolveProducts(input) {



		const requestedItems =

			Array.isArray(input.producten)

				? input.producten

				: [];





		const resolvedProducts = [];







		for (const item of requestedItems) {



			const product =

				await this.products.getById(

					item.productId

				);





			if (!product) {

				continue;

			}







			resolvedProducts.push({

				product,


				quantity:

					item.quantity ?? 1


			});


		}







		return resolvedProducts;


	}

    	_calculatePricing(products, days) {


		const subtotaal =

			products.reduce(

				(total, item) => {


					return total +

						(

							item.product.prijsPerDag *

							item.quantity *

							days

						);


				},

				0

			);





		return {

			aantalDagen: days,

			subtotaal,

			korting: 0,

			totaal: subtotaal,

			valuta: "EUR"

		};


	}








	_calculateDeposit(products, pricing) {



		const totaal =

			products.reduce(

				(sum, item) => {


					return sum +

						(

							item.product.waarborg *

							item.quantity

						);


				},

				0

			);






		return {


			totaal,


			terugbetaald: 0,


			status:

				pricing.totaal > 0

					? "open"

					: "vrijgegeven"


		};


	}









	_buildReservationLines(products, days) {



		return products.map(item => ({



			productId:

				item.product.id,





			productNaamSnapshot:

				item.product.naam,





			categorieSnapshot:

				item.product.categorie,





			quantity:

				item.quantity,





			prijsPerDagSnapshot:

				item.product.prijsPerDag,





			waarborgPerStukSnapshot:

				item.product.waarborg,





			linePrijs:

				item.product.prijsPerDag *

				item.quantity *

				days,





			lineWaarborg:

				item.product.waarborg *

				item.quantity,





			actief:true



		}));


	}









	async findConflicts(startDatum, eindDatum) {



		const reservations =

			await this.reservations.getAll();





		return reservations.filter(


			reservation =>



				rangesOverlap(

					reservation.startDatum,

					reservation.eindDatum,

					startDatum,

					eindDatum

				)


		);


	}









	_validateStatusTransition(

		currentStatus,

		newStatus

	) {



		const transitions = {



			aanvraag:[

				"bevestigd",

				"geweigerd"

			],





			bevestigd:[

				"voltooid",

				"geweigerd",

				"aanvraag"

			],





			geweigerd:[

				"aanvraag"

			],





			voltooid:[

				"aanvraag"

			]



		};






		const allowed =

			transitions[currentStatus] ?? [];







		if (!allowed.includes(newStatus)) {



			throw new Error(

				`Ongeldige status overgang: ${currentStatus} → ${newStatus}`

			);


		}


	}









	async _checkStockAvailability(products) {



		for (const item of products) {



			const available =

				item.product.voorraad;





			if (

				item.quantity >

				available

			) {



				throw new Error(

					`Onvoldoende voorraad voor ${item.product.naam}. Gevraagd: ${item.quantity}, beschikbaar: ${available}`

				);


			}


		}


	}


}





export const reservationService =

	new ReservationService();