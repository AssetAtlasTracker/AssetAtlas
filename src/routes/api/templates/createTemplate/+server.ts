import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import Template from '$lib/server/db/models/template.js';

export const POST: RequestHandler = async ({ request }) => {
	const { name, fields } = await request.json();

	if (!name || !fields) {
		throw error(400, 'Failed to create template: missing name and/or fields');
	}

	const newTemplate = new Template({ name, fields });
	await newTemplate.save();
  
	return json(newTemplate, { status: 201 });
};