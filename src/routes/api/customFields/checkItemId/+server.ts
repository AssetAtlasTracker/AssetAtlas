import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import BasicItem from '$lib/server/db/models/basicItem';

export const GET: RequestHandler = async ({ url }) => {
	const itemID = url.searchParams.get('itemID');

	if (!itemID) {
		throw error(400, 'No item ID provided');
	}

	const itemName = await BasicItem.findOne({ _id: itemID }).select('name').exec();

	if (!itemName) {
		return json({ name: null });
	}

	return json({ name: itemName.name });
};