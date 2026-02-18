import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import BasicItem from '$lib/server/db/models/basicItem.js';
import { retrieveImage } from '$lib/server/imageRetrieve';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			console.log("IMAGE: invalid ID");
			throw error(400, 'Invalid item ID');
		}

		const item = await BasicItem.findById(id).populate('image');
    
		if (!item?.image) {
			console.log("IMAGE: No Image");
			throw error(404, 'No image found');
		}

		const buffer = await retrieveImage(item.image);

		return new Response(buffer, {
			headers: {
				'Content-Type': 'image/jpeg',
				'Content-Length': buffer.length.toString()
			}
		});
	} catch (err) {
		console.error('Error serving image:', err);
    
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
    
		throw error(500, 'Error getting image' + err);
	}
};