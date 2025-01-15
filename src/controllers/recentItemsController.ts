import type { Request, Response } from 'express';
import { RecentItems } from '../models/recentItems.js';

const MAX_RECENT_ITEMS = 5;

export const getRecentsByType = async (req: Request, res: Response) => {
  const { type } = req.params;
  
  let normalizedType = type; //if you are reading this then you have seen some stupid code. sowwy. 
  if (type === 'items') normalizedType = 'item';
  else if (type === 'templates') normalizedType = 'template';
  else if (type === 'customFields') normalizedType = 'customField';
  
  try {
    let recents = await RecentItems.findOne({ type: normalizedType })
      .populate({
        path: 'recentIds',
        select: 'name fieldName dataType',
      })
      .exec();

    if (!recents) {
      recents = await RecentItems.create({ type: normalizedType, recentIds: [] });
    }

    res.status(200).json(recents.recentIds);
  } catch (err) {
    console.error('Error in getRecentsByType:', err);
    res.status(500).json({ message: 'Error fetching recent items', error: err });
  }
};