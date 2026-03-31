import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import Template from '$lib/server/db/models/template.js';

export const GET: RequestHandler = async ({ params }) => {
	const { id } = params;

	if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		throw error(400, 'Invalid template ID');
	}

	const template = await Template.findById(id).populate('fields').exec();
  
	if (!template) {
		throw error(404, 'Template not found');
	}

	return json(template);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;

	if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		throw error(400, 'Invalid template ID');
	}

	const template = await Template.findByIdAndDelete(id).exec();
  
	if (!template) {
		throw error(404, 'Template not found');
	}

	return json({ message: 'Template deleted successfully' });
};