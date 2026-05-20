import { retrieveAttributeWhenGiven } from '$lib/utility/attributeRetriever';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	return retrieveAttributeWhenGiven('name', url);
};
