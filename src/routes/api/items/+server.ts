import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import BasicItem from '$lib/server/db/models/basicItem.js';
import { uploadToGridFS } from '$lib/server/db/gridfs';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
  
	const itemData: any = {};
  
	for (const [key, value] of formData.entries()) {
		if (key !== 'file' && key !== 'image') {
			itemData[key] = value;
		}
	}
  
	if (typeof itemData.tags === 'string') {
		try {
			itemData.tags = JSON.parse(itemData.tags);
		} catch {
			itemData.tags = [];
		}
	}
	if (typeof itemData.customFields === 'string') {
		try {
			const parsedFields = JSON.parse(itemData.customFields);
			itemData.customFields = Array.isArray(parsedFields) ? parsedFields : [];
		} catch {
			itemData.customFields = [];
		}
	}

	// Handle file upload
	const file = formData.get('file') || formData.get('image');
	if (file && file instanceof File && file.size > 0) {
		console.log('File received:', {
			name: file.name,
			size: file.size,
			type: file.type
		});

		const gridFSFileId = await uploadToGridFS(file);
		itemData.image = gridFSFileId;
	}

	console.log('Creating item with data:', itemData);
	const newItem = new BasicItem(itemData);
	const savedItem = await newItem.save();

	return json(savedItem, { status: 201 });
};