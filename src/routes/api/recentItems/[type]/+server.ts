import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { RecentItems } from '$lib/server/db/models/recentItems.js';

const validTypes = ['item', 'template', 'customField'];

export const GET: RequestHandler = async ({ params }) => {
  const { type } = params;

  if (!validTypes.includes(type)) {
    return json({ message: 'Invalid type parameter: ' + type }, { status: 400 });
  }

  try {
    let recents = await RecentItems.findOne({ type: type })
      .populate({ path: 'recentIds', select: 'name fieldName dataType' })
      .exec();

    if (!recents) {
      recents = await RecentItems.create({ type: type, recentIds: [] });
    }

    return json(recents.recentIds);
  } catch (err) {
    console.error('Error in getRecentsByType:', err);
    return json({ 
      message: 'Error fetching recent items', 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};