import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import BasicItem from '$lib/server/db/models/basicItem.js';
import { getGridFSBucket } from '$lib/server/db/gridfs.js';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw error(400, 'Invalid item ID');
		}

		const item = await BasicItem.findById(id).select('image').lean();
    
		if (!item?.image) {
			throw error(404, 'No image found');
		}

		const gfs = getGridFSBucket();

		const files = await gfs.find({ _id: item.image }).toArray();
    
		if (!files || files.length === 0) {
			throw error(404, 'No image found');
		}

		const file = files[0];

		const downloadStream = gfs.openDownloadStream(file._id);

		const chunks: Buffer[] = [];
		for await (const chunk of downloadStream) {
			chunks.push(chunk);
		}
		const buffer = Buffer.concat(chunks);

		return new Response(buffer, {
			headers: {
				'Content-Type': file.contentType || 'image/jpeg',
				'Content-Length': buffer.length.toString()
			}
		});
	} catch (err) {
		console.error('Error serving image:', err);
    
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
    
		throw error(500, 'Error getting image');
	}
};