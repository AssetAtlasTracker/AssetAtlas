import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import Template from '$lib/server/db/models/template.js';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return json({ message: 'Invalid template ID' }, { status: 400 });
  }

  try {
    const template = await Template.findById(id).populate('fields').exec();
    
    if (!template) {
      return json({ message: 'Template not found' }, { status: 404 });
    }

    return json(template);
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    return json({ 
      message: 'Failed to fetch template', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return json({ message: 'Invalid template ID' }, { status: 400 });
  }

  try {
    const template = await Template.findByIdAndDelete(id).exec();
    
    if (!template) {
      return json({ message: 'Template not found' }, { status: 404 });
    }

    return json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return json({ 
      message: 'Failed to delete template', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};