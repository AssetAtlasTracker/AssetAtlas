import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import Template from '$lib/server/db/models/template.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, fields } = await request.json();

    if (!name || !fields) {
      return json({ 
        message: 'Failed to create template: missing name and/or fields' 
      }, { status: 400 });
    }

    const newTemplate = new Template({ name, fields });
    await newTemplate.save();
    
    return json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return json({ 
      message: 'Failed to create template', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};