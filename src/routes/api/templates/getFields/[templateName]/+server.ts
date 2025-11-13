import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import Template from '$lib/server/db/models/template.js';

export const GET: RequestHandler = async ({ params }) => {
  const { templateName } = params;

  // Find the template by its name and populate fields
  const template = await Template.findOne({ name: templateName })
    .populate('fields')
    .exec();

  if (!template) {
    throw error(404, 'Template not found');
  }

  return json({ fields: template.fields });
};