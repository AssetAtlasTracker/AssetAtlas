import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import BasicItem from '$lib/server/db/models/basicItem.js';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const chain = [];
    let currentItem = await BasicItem.findById(id).exec();
    if (!currentItem) {
      throw error(404, 'Item not found');
    }
    while (currentItem) {
      chain.unshift(currentItem);
      currentItem = currentItem.parentItem
        ? await BasicItem.findById(currentItem.parentItem).exec()
        : null;
    }
    return json(chain);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error fetching parent chain:', err);
    throw error(500, 'Internal Server Error');
  }
};