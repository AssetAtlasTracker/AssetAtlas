import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import BasicItem from '$lib/server/db/models/basicItem';

export const GET: RequestHandler = async ({ url }) => {
	const itemName = url.searchParams.get('itemName');

	if (!itemName) {
		throw error(400, 'No item name provided');
	}

	const itemId = await BasicItem.findOne({ name: itemName }).select('_id').exec();

	if (!itemId) {
		return json({ id: null });
	}

	return json({ id: itemId._id.toString() });
};