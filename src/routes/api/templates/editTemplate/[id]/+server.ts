import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import Template from '$lib/server/db/models/template.js';
import BasicItem from '$lib/server/db/models/basicItem.js';

export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const { name, fields } = await request.json();

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return json({ message: 'Invalid template ID' }, { status: 400 });
  }

  if (!name || !fields) {
    return json({ message: 'Name and fields are required' }, { status: 400 });
  }

  try {
    const existingTemplate = await Template.findOne({ name });
    if (existingTemplate && existingTemplate._id.toString() !== id.toString()) {
      return json({ message: 'Template name must be unique' }, { status: 400 });
    }

    const template = await Template.findById(id);
    if (!template) {
      return json({ message: 'Template not found' }, { status: 404 });
    }

    const oldFields = template.fields.map(field => field.toString());
    const newFields: string[] = fields.map((field: mongoose.Types.ObjectId) => field.toString());

    template.name = name;
    template.fields = fields;

    await template.save();

    // Handle adding new fields to items using this template
    const addedFields = newFields.filter(field => !oldFields.includes(field));
    if (addedFields.length > 0) {
      await BasicItem.updateMany(
        { template: template._id },
        { $addToSet: { customFields: { $each: addedFields.map(field => ({ field, value: "" })) } } }
      ).exec();
    }

    return json(template, { status: 200 });
  } catch (error) {
    console.error('Error editing template:', error);
    return json({ 
      message: 'Failed to edit template', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};