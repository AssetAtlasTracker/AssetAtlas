import BasicItem from '$lib/server/db/models/basicItem.js';
import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import Fuse from 'fuse.js';
import mongoose from 'mongoose';

interface TreeItem {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  children: TreeItem[];
  hasChildren: boolean;
	pinned: boolean;
}

const getItemChildren = async (
	parentId: mongoose.Types.ObjectId | null, 
	searchName?: string,
	exactSearch?: boolean
): Promise<TreeItem[]> => {
	const query = parentId ? { parentItem: parentId } : { parentItem: null };
	const items = await BasicItem.find(query).select('name description _id parentItem pinned').lean();

	let filteredItems = items;
	if (searchName && searchName.trim() !== '') {
		const fuse = new Fuse(items, {
			keys: ['name'],
			threshold: exactSearch ? 0 : 0.3,
			findAllMatches: !exactSearch,
			location: 0,
			distance: exactSearch ? 0 : 100
		});
		const fuzzyResults = fuse.search(searchName);
		filteredItems = fuzzyResults.map(r => r.item);
	}

	return Promise.all(filteredItems.map(async (item) => {
		const children = await getItemChildren(item._id as mongoose.Types.ObjectId, searchName, exactSearch);
		return {
			_id: item._id as mongoose.Types.ObjectId,
			name: item.name,
			description: item.description,
			children,
			hasChildren: children.length > 0,
			pinned: item.pinned
		};
	}));
};

export const GET: RequestHandler = async ({ params, url }) => {
	const { id } = params;
	const searchName = url.searchParams.get('name') || undefined;
	const exactSearch = url.searchParams.get('exact') === 'true';

	if (!id || id.trim() === 'all') {
		const tree = await getItemChildren(null, searchName, exactSearch);
		return json(tree);
	}

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw error(400, 'Invalid item ID');
	}

	const root = await BasicItem.findById(id)
		.select('name description _id parentItem pinned')
		.lean() as { _id: mongoose.Types.ObjectId; name: string; description?: string; parentItem?: mongoose.Types.ObjectId; pinned: boolean } | null;

	if (!root) {
		throw error(404, 'Item not found');
	}

	const children = await getItemChildren(root._id as mongoose.Types.ObjectId, searchName, exactSearch);
  
	return json({
		_id: root._id as mongoose.Types.ObjectId,
		name: root.name,
		description: root.description,
		children,
		hasChildren: children.length > 0,
		pinned: root.pinned
	});
};

export const PATCH: RequestHandler = async ({ params }) => {
	const { id } = params;

	if (!id || id.trim() === 'all' || !mongoose.Types.ObjectId.isValid(id)) {
		throw error(400, 'Invalid item ID');
	}

	const item = await BasicItem.findById(id).exec();

	if (!item) {
		throw error(404, 'Item not found');
	}

	item.pinned = !item.pinned;
	const savedItem = await item.save();

	return json({
		_id: savedItem._id,
		pinned: savedItem.pinned
	}, { status: 200 });
}