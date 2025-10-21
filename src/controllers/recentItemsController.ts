import type { Request, Response } from 'express';
import { RecentItems, addToRecents } from '../models/recentItems.js';
import { Types } from 'mongoose';

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

export const addManualRecent = async (req: Request, res: Response) => {
  const { type, itemId } = req.body;

  let normalizedType = type;
  if (type === 'items') normalizedType = 'item';
  else if (type === 'templates') normalizedType = 'template';
  else if (type === 'customFields') normalizedType = 'customField';

  try {
    const result = await addToRecents(normalizedType, new Types.ObjectId(itemId));

    if (result) {
      res.status(200).json({ message: 'Successfully added to recents' });
    } else {
      res.status(400).json({ message: 'Failed to add to recents' });
    }
  } catch (err) {
    console.error('Error in addManualRecent:', err);
    res.status(500).json({ message: 'Error adding recent item', error: err });
  }
};