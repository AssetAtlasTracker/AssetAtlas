import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import CustomField from '$lib/server/db/models/customField.js';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const field = await CustomField.findById(id).exec();
    
    if (!field) {
      return json({ message: 'Custom field not found' }, { status: 404 });
    }

    return json(field);
  } catch (error) {
    console.error('Error fetching custom field by id:', error);
    return json({ 
      message: 'Failed to fetch custom field', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};