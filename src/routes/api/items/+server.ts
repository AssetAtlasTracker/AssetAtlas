import BasicItem from '$lib/server/db/models/basicItem.js';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
  
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const itemData: any = {};
  
	for (const [key, value] of formData.entries()) {
		itemData[key] = value;
	}
  
	if (typeof itemData.tags === 'string') {
		try {
			itemData.tags = JSON.parse(itemData.tags);
		} catch {
			itemData.tags = [];
		}
	}
	if (typeof itemData.customFields === 'string') {
		try {
			const parsedFields = JSON.parse(itemData.customFields);
			itemData.customFields = Array.isArray(parsedFields) ? parsedFields : [];
		} catch {
			itemData.customFields = [];
		}
	}

	console.log('Creating item with data:', itemData);
	const newItem = new BasicItem(itemData);
	const savedItem = await newItem.save();

	return json(savedItem, { status: 201 });
};
