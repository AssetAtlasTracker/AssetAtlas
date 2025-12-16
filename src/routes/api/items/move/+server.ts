import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import BasicItem from '$lib/server/db/models/basicItem.js';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.json();
	const {itemId, newParentId	} = formData;
	//Treat an empty string (or only whitespace) as no parent
	const newParent = newParentId && newParentId.trim() !== "" ? newParentId : null;

	const item = await BasicItem.findById(itemId).exec();

	if (!item) {
		throw error(404, 'Item not found');
	}

	if (newParent) {
		const newParentItem = await BasicItem.findById(newParent).exec();

		if (!newParentItem) {
			throw error(404, 'New parent item dockernot found');
		}
	}

	item.parentItem = newParent;

	//pre-save will handle the history and parent containers
	await item.save();

	return json({ message: 'Item moved successfully' });
};