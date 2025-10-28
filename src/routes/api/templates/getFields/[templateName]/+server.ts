import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import Template from '$lib/server/db/models/template.js';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { templateName } = params;

    // Find the template by its name and populate fields
    const template = await Template.findOne({ name: templateName })
      .populate('fields')
      .exec();

    if (!template) {
      return json({ message: 'Template not found' }, { status: 404 });
    }

    return json({ fields: template.fields });
  } catch (err) {
    console.error('Error retrieving template fields:', err);
    return json({ 
      message: 'Error retrieving template fields', 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};