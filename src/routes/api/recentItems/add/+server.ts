import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
const { Types } = mongoose;
import { addToRecents } from '$lib/server/db/models/recentItems.js';

const validTypes = ['item', 'template', 'customField'];

export const POST: RequestHandler = async ({ request }) => {
	const { type, itemId } = await request.json();

	if (!validTypes.includes(type)) {
		throw error(400, 'Invalid type parameter: ' + type);
	}

	const result = await addToRecents(type, new Types.ObjectId(itemId));

	if (!result) {
		throw error(400, 'Failed to add to recents');
	}

	return json({ message: 'Successfully added to recents' });
};