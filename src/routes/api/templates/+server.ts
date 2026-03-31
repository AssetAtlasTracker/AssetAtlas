import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import Template from '$lib/server/db/models/template.js';
import Fuse from 'fuse.js';

export const GET: RequestHandler = async ({ url }) => {
	const templateName = url.searchParams.get('name');

	try {
		const templates = await Template.find().populate('fields').exec();

		if (templateName) {
			const fuse = new Fuse(templates, {
				keys: ['name'],
				threshold: 0.3,
			});

			const fuzzyResults = fuse.search(templateName);
			const resultTemplates = fuzzyResults.map(result => result.item);

			return json(resultTemplates);
		} else {
			return json(templates);
		}
	} catch (error) {
		console.error('Error during template search:', error);
		return json({ 
			error: 'Failed to search templates',
			message: error instanceof Error ? error.message : String(error)
		}, { status: 500 });
	}
};
