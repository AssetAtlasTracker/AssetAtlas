import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { uploadToGridFS } from '$lib/server/db/gridfs.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const files: File[] = [];

    // Collect all files from formData
    for (const [key, value] of formData.entries()) {
      if (key === 'images' && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return json({ message: 'No files provided' }, { status: 400 });
    }

    console.log('Got', files.length, 'files');

    // Upload all files to GridFS
    const uploadPromises = files.map(file => uploadToGridFS(file));
    const ids = await Promise.all(uploadPromises);

    console.log('Uploaded IDs:', ids);

    return json({ ids }, { status: 201 });
  } catch (err) {
    console.error('Error uploading images:', err);
    return json({ 
      message: 'Error uploading images',
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};