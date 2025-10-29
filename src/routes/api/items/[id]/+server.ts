import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import BasicItem from '$lib/server/db/models/basicItem.js';
import { uploadToGridFS, UploadsFiles } from '$lib/server/db/gridfs';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return json({ message: 'Not a valid MongoDB ID' }, { status: 400 });
  }

  try {
    console.log('Fetching item:', id);
    const item = await BasicItem.findById(id)
      .populate('template')
      .populate('parentItem')
      .populate('homeItem')
      .populate('containedItems')
      .populate('customFields.field')
      .populate('itemHistory.location')
      .populate({
        path: 'image',
        model: UploadsFiles
      })
      .exec();

    console.log('Found item:', JSON.stringify(item, null, 2));
    
    if (item) {
      return json(item, { status: 200 });
    } else {
      return json({ message: 'Cannot get: Item not found' }, { status: 404 });
    }
  } catch (err) {
    console.error('Error in getItemById:', err);
    return json({ 
      message: 'Error fetching item', 
      error: err 
    }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const { id } = params;

  try {
    const contentType = request.headers.get('content-type');
    let bodyData: any;
    let file: File | null = null;

    // Handle both JSON and FormData
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      bodyData = {};
      
      // Extract form fields
      for (const [key, value] of formData.entries()) {
        if (key === 'file' || key === 'image') {
          if (value instanceof File && value.size > 0) {
            file = value;
          }
        } else {
          bodyData[key] = value;
        }
      }
    } else {
      bodyData = await request.json();
    }

    // Parse JSON strings
    if (typeof bodyData.tags === 'string') {
      bodyData.tags = JSON.parse(bodyData.tags);
    }
    if (typeof bodyData.customFields === 'string') {
      const parsedFields = JSON.parse(bodyData.customFields);
      bodyData.customFields = Array.isArray(parsedFields) ? parsedFields : [];
    }

    const item = await BasicItem.findById(id)
      .populate<{ template: ITemplate }>('template')
      .exec();

    if (!item) {
      return json({ message: 'Item not found' }, { status: 404 });
    }

    // Handle image updates
    if (bodyData.removeImage === 'true' || bodyData.removeImage === true) {
      item.image = undefined; // Remove image reference
    } else if (file) {
      console.log('Processing uploaded file:', file);
      const fileId = await uploadToGridFS(file);
      if (fileId) {
        item.image = new mongoose.Types.ObjectId(fileId);
      }
    }

    // Update other fields
    Object.assign(item, bodyData);
    const savedItem = await item.save();

    return json(savedItem, { status: 200 });
  } catch (err) {
    console.error('Error updating item:', err);
    return json({ 
      message: 'Error updating item', 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return json({ message: 'Not a valid MongoDB ID' }, { status: 400 });
  }

  try {
    const item = await BasicItem.findOneAndDelete({ _id: id });
    
    if (item) {
      return json({ message: 'Item deleted successfully', item }, { status: 200 });
    } else {
      return json({ message: 'Cannot delete: Item not found' }, { status: 404 });
    }
  } catch (err) {
    console.error('Error deleting item:', err);
    return json({ message: 'Error deleting item', error: err }, { status: 500 });
  }
};