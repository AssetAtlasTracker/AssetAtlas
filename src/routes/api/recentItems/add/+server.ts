import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { Types } from 'mongoose';
import { addToRecents } from '$lib/server/db/models/recentItems.js';

const validTypes = ['item', 'template', 'customField'];

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { type, itemId } = await request.json();

    if (!validTypes.includes(type)) {
      return json({ message: 'Invalid type parameter: ' + type }, { status: 400 });
    }

    const result = await addToRecents(type, new Types.ObjectId(itemId));

    if (result) {
      return json({ message: 'Successfully added to recents' });
    } else {
      return json({ message: 'Failed to add to recents' }, { status: 400 });
    }
  } catch (err) {
    console.error('Error in addManualRecent:', err);
    return json({ 
      message: 'Error adding recent item', 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};