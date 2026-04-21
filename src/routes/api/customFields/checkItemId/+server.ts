import { checkItemAttribute } from '$lib/utility/checkItemHelper';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	return checkItemAttribute('id', url);
};
