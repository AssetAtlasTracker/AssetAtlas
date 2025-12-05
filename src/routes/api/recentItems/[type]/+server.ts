import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { RecentItems } from '$lib/server/db/models/recentItems.js';

const validTypes = ['item', 'template', 'customField'];

export const GET: RequestHandler = async ({ params }) => {
	const { type } = params;

	if (!type || !validTypes.includes(type)) {
		throw error(400, 'Invalid type parameter: ' + type);
	}

	let recents = await RecentItems.findOne({ type: type })
		.populate({ path: 'recentIds', select: 'name fieldName dataType' })
		.exec();

	if (!recents) {
		recents = await RecentItems.create({ type: type, recentIds: [] });
	}

	return json(recents.recentIds);
};