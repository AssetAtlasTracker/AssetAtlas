import BasicItem from '$lib/server/db/models/basicItem.js';
import { deleteHelper, getHelper } from '$lib/utility/routesHelper';
import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	return await getHelper(params, getItem);
};

const getItem = async (id: string) => {
	return await BasicItem.findById(id)
		.populate('templates.field')
		.populate('parentItem')
		.populate('homeItem')
		.populate('containedItems')
		.populate('customFields.field')
		.populate('itemHistory.location')
		.exec();
}

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { id } = params;

	const contentType = request.headers.get('content-type');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let bodyData: any;

	if (contentType?.includes('multipart/form-data')) {
		const formData = await request.formData();
		bodyData = {};
    
		for (const [key, value] of formData.entries()) {
			bodyData[key] = value;
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
	if (typeof bodyData.templates === 'string') {
		try {
			const parsedTemplates = JSON.parse(bodyData.templates);
			bodyData.templates = Array.isArray(parsedTemplates) ? parsedTemplates : [];
		} catch {
			bodyData.templates = [];
		}
	}

	const item = await BasicItem.findById(id)
		.populate('templates.field')
		.exec();

	if (!item) {
		throw error(404, 'Item not found');
	}

	if (bodyData.removeImage === 'true' || bodyData.removeImage === true) {
		item.image = undefined;
	}

	Object.assign(item, bodyData);
	const savedItem = await item.save();

	return json(savedItem, { status: 200 });
};

export const DELETE: RequestHandler = async ({ params }) => {
	return await deleteHelper(params, deleteItem);
};

const deleteItem = async (id: string) => {
	return await BasicItem.findOneAndDelete({ _id: id });
}
