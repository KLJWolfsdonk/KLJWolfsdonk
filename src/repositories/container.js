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

import { SupabasePostRepository }
from './supabase/SupabasePostRepository.js';

import { SupabaseNavigationRepository }
from './supabase/SupabaseNavigationRepository.js';

import { SupabaseKampRepository }
from './supabase/SupabaseKampRepository.js';

import { SupabasePageSectionRepository }
from './supabase/SupabasePageSectionRepository.js';

import { SupabaseSiteSettingsRepository }
from './supabase/SupabaseSiteSettingsRepository.js';

import { SupabaseFotoAlbumRepository }
from './supabase/SupabaseFotoAlbumRepository.js';

import { SupabaseSponsorRepository }
from './supabase/SupabaseSponsorRepository.js';



export function createRepositories() {


	if(appConfig.repositoryMode === "supabase") {


		return {


			products:
				new SupabaseProductRepository(),


			customers:
				new SupabaseCustomerRepository(),


			reservations:
				new SupabaseReservationRepository(),


			posts:
				new SupabasePostRepository(),


			navigation:
				new SupabaseNavigationRepository(),


			kamp:
				new SupabaseKampRepository(),


			pageSections:
				new SupabasePageSectionRepository(),


			siteSettings:
				new SupabaseSiteSettingsRepository(),


			fotoAlbums:
				new SupabaseFotoAlbumRepository(),


			sponsors:
				new SupabaseSponsorRepository()


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