import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import Template from '$lib/server/db/models/template.js';
import BasicItem from '$lib/server/db/models/basicItem.js';

export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const { name, fields } = await request.json();

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw error(400, 'Invalid template ID');
  }

  if (!name || !fields) {
    throw error(400, 'Name and fields are required');
  }

  const existingTemplate = await Template.findOne({ name });
  if (existingTemplate && existingTemplate._id.toString() !== id.toString()) {
    throw error(400, 'Template name must be unique');
  }

  const template = await Template.findById(id);
  if (!template) {
    throw error(404, 'Template not found');
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
};