import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import BasicItem from '$lib/server/db/models/basicItem.js';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { parentID } = params;

    if (!mongoose.Types.ObjectId.isValid(parentID)) {
      throw error(400, 'Not a valid MongoDB ID');
    }

    const parentItem = await BasicItem.findById(parentID).populate('containedItems').exec();

    if (!parentItem) {
      throw error(404, 'Parent item not found');
    }

    return json({ containedItems: parentItem.containedItems });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error fetching contained items:', err);
    throw error(500, 'An error occurred while fetching contained items');
  }
};