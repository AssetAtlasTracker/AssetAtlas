import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import BasicItem from '$lib/server/db/models/basicItem.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { itemId, newParentId } = await request.json();
    
    //Treat an empty string (or only whitespace) as no parent
    const newParent = newParentId && newParentId.trim() !== "" ? newParentId : null;

    const item = await BasicItem.findById(itemId).exec();

    if (!item) {
      throw error(404, 'Item not found');
    }

    if (newParent) {
      const newParentItem = await BasicItem.findById(newParent).exec();

      if (!newParentItem) {
        throw error(404, 'New parent item not found');
      }

      //self-reference and cyclic checks here based on newParent
    }

    item.parentItem = newParent;

    //pre-save will handle the history and parent containers
    await item.save();

    return json({ message: 'Item moved successfully' });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error moving item:', err);
    throw error(500, 'An error occurred while moving the item');
  }
};