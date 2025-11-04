import { json } from '@sveltejs/kit';
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
  try {
    const { id } = params;

    if (!id || id.trim() === 'all') {
      const tree = await getItemChildren(null);
      return json(tree);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return json({ message: 'Invalid item ID' }, { status: 400 });
    }

    const root = await BasicItem.findById(id)
      .select('name description _id parentItem')
      .lean();

    if (!root) {
      return json({ message: 'Item not found' }, { status: 404 });
    }

    const children = await getItemChildren(root._id);
    
    return json({
      ...root,
      children,
      hasChildren: children.length > 0
    });

  } catch (err) {
    console.error('Error generating tree:', err);
    return json({ 
      message: 'Error generating tree', 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};