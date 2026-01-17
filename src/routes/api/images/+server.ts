import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { uploadImage } from '$lib/utility/imageUpload';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const files: File[] = [];

	// Collect all files from formData
	for (const [key, value] of formData.entries()) {
		if (key === 'images' && value instanceof File && value.size > 0) {
			files.push(value);
		}
	}

	if (files.length === 0) {
		throw error(400, 'No files provided');
	}

	const uploadedFilenames = await Promise.all(
		files.map(async (file) => {
			const filename = await uploadImage(file);
			return filename;
		})
	);

	return json({ ids: uploadedFilenames }, { status: 201 });
};