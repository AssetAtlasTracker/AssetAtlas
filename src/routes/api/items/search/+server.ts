import type { IBasicItemPopulated } from '$lib/server/db/models/basicItem';
import BasicItem from '$lib/server/db/models/basicItem.js';
import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import type { FuseResult } from 'fuse.js';
import Fuse from 'fuse.js';

function sortItems(items: IBasicItemPopulated[], sortOption: string): IBasicItemPopulated[] {
	return [...items].sort((a, b) => {
		switch (sortOption) {
			case 'alphabetical':
				return a.name.localeCompare(b.name);
			case 'firstAdded':
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			case 'lastAdded':
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			default:
				return a.name.localeCompare(b.name);
		}
	});
}

export const GET: RequestHandler = async ( {url} ) => {
	const name = url.searchParams.get('name');
	const sort = url.searchParams.get('sort') || 'alphabetical';
	const exact = url.searchParams.get('exact');

	try {
		const items = await BasicItem.find({})
			.populate('template')
			.populate('parentItem')
			.populate('homeItem')
			.populate('containedItems')
			.populate('customFields.field')
			.populate('itemHistory.location')
			.lean<IBasicItemPopulated[]>()
			.exec();

		// If no query, return all items directly
		if (!name || name.trim() === '') {
			const sortedItems = sortItems(items, sort);
			return json(sortedItems);
		}

		const fuse = new Fuse(items, {
			keys: ['name'],
			threshold: exact === 'true' ? 0 : 0.3,
			findAllMatches: exact !== 'true',
			location: 0,
			distance: exact === 'true' ? 0 : 100
		});

		const fuzzyResults = fuse.search(name);
		const resultItems = fuzzyResults.map((r: FuseResult<IBasicItemPopulated>) => r.item);

		const sortedItems = sortItems(resultItems, sort);
		return json(sortedItems);
	} catch (err) {
		console.error('Error during search:', err);
		throw error(500, 'Failed to search items');
	}
};
