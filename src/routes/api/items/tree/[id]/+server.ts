import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import BasicItem from '$lib/server/db/models/basicItem.js';

interface TreeItem {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  children: TreeItem[];
  hasChildren: boolean;
}

const getItemChildren = async (parentId: mongoose.Types.ObjectId | null): Promise<TreeItem[]> => {
	const query = parentId ? { parentItem: parentId } : { parentItem: null };
	const items = await BasicItem.find(query).select('name description _id parentItem').lean();

	return Promise.all(items.map(async (item) => {
		const children = await getItemChildren(item._id);
		return {
			...item,
			children,
			hasChildren: children.length > 0
		};
	}));
};

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	if (!id || id.trim() === 'all') {
		const tree = await getItemChildren(null);
		return json(tree);
	}

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw error(400, 'Invalid item ID');
	}

	const root = await BasicItem.findById(id)
		.select('name description _id parentItem')
		.lean();

	if (!root) {
		throw error(404, 'Item not found');
	}

	const children = await getItemChildren(root._id);
  
	return json({
		...root,
		children,
		hasChildren: children.length > 0
	});
};