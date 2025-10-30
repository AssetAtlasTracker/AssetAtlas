import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { RecentItems, addToRecents } from '../models/recentItems.js';

const validTypes = ['item', 'template', 'customField'];
const defaultMaxItems = 5;

export const getRecentsByType = async (req: Request, res: Response) => {
	const { type } = req.params;

	if (!validTypes.includes(type)) {
		res.status(400).json({ message: 'Invalid type parameter' });
		return;
	}

	try {
		let recents = await RecentItems.findOne({ type: type })
			.populate({ path: 'recentIds', select: 'name fieldName dataType', })
			.exec();

		if (!recents) {
			recents = await RecentItems.create({ type: type, recentIds: [], maxItems: defaultMaxItems });
		}

		res.status(200).json(recents.recentIds);
	} catch (err) {
		console.error('Error in getRecentsByType:', err);
		res.status(500).json({ message: 'Error fetching recent items', error: err });
	}
};

export const addManualRecent = async (req: Request, res: Response) => {
	const { type, itemId } = req.body;

	if (!validTypes.includes(type)) {
		res.status(400).json({ message: 'Invalid type parameter' });
		return;
	}

	try {
		const result = await addToRecents(type, new Types.ObjectId(itemId));

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