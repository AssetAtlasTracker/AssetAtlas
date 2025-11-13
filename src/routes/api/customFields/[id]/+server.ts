import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import CustomField from '$lib/server/db/models/customField.js';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw error(400, 'Invalid ID format');
  }

  const field = await CustomField.findById(id).exec();
  
  if (!field) {
    throw error(404, 'Custom field not found');
  }

  return json(field);
};