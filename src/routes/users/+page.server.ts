import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const authToken = cookies.get('auth_token');
    
	return {
		isLoggedIn: !!authToken
	};
};