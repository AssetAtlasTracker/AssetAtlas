import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import BasicItem from '$lib/server/db/models/basicItem.js';
import { uploadToGridFS, UploadsFiles } from '$lib/server/db/gridfs';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;
  
	if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		throw error(400, 'Not a valid MongoDB ID');
	}

	console.log('Fetching item:', id);
	const item = await BasicItem.findById(id)
		.populate('template')
		.populate('parentItem')
		.populate('homeItem')
		.populate('containedItems')
		.populate('customFields.field')
		.populate('itemHistory.location')
		.populate({
			path: 'image',
			model: UploadsFiles
		})
		.exec();

	if (!item) {
		throw error(404, 'Cannot get: Item not found');
	}

	return json(item, { status: 200 });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { id } = params;

	const contentType = request.headers.get('content-type');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let bodyData: any;
	let file: File | null = null;

	if (contentType?.includes('multipart/form-data')) {
		const formData = await request.formData();
		bodyData = {};
    
		for (const [key, value] of formData.entries()) {
			if (key === 'file' || key === 'image') {
				if (value instanceof File && value.size > 0) {
					file = value;
				}
			} else {
				bodyData[key] = value;
			}
		}
	} else {
		try {
			bodyData = await request.json();
		} catch {
			bodyData = {};
		}
	}

	if (typeof bodyData.tags === 'string') {
		bodyData.tags = JSON.parse(bodyData.tags);
	}
	if (typeof bodyData.customFields === 'string') {
		const parsedFields = JSON.parse(bodyData.customFields);
		bodyData.customFields = Array.isArray(parsedFields) ? parsedFields : [];
	}

	const item = await BasicItem.findById(id)
		.populate('template')
		.exec();

	if (!item) {
		throw error(404, 'Item not found');
	}

	if (bodyData.removeImage === 'true' || bodyData.removeImage === true) {
		item.image = undefined;
	} else if (file) {
		console.log('Processing uploaded file:', file);
		const fileId = await uploadToGridFS(file);
		if (fileId) {
			item.image = new mongoose.Types.ObjectId(fileId);
		}
	}

	Object.assign(item, bodyData);
	const savedItem = await item.save();

	return json(savedItem, { status: 200 });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;
  
	if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		throw error(400, 'Not a valid MongoDB ID');
	}

	const item = await BasicItem.findOneAndDelete({ _id: id });
  
	if (!item) {
		throw error(404, 'Cannot delete: Item not found');
	}

	return json({ message: 'Item deleted successfully', item }, { status: 200 });
};