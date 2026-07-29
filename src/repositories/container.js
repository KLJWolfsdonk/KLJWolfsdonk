import { appConfig } 
from '../shared/config.js';


import { ProductRepository }
from './mock/ProductRepository.js';

import { CustomerRepository }
from './mock/CustomerRepository.js';

import { ReservationRepository }
from './mock/ReservationRepository.js';



import { SupabaseProductRepository }
from './supabase/SupabaseProductRepository.js';

import { SupabaseCustomerRepository }
from './supabase/SupabaseCustomerRepository.js';

import { SupabaseReservationRepository }
from './supabase/SupabaseReservationRepository.js';



export function createRepositories() {


	if(appConfig.repositoryMode === "supabase") {


		return {


			products:
				new SupabaseProductRepository(),


			customers:
				new SupabaseCustomerRepository(),


			reservations:
				new SupabaseReservationRepository()


		};


	}



	return {


		products:
			new ProductRepository(),


		customers:
			new CustomerRepository(),


		reservations:
			new ReservationRepository()


	};


}


export const repositories = createRepositories();