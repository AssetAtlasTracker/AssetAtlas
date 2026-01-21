import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.IMAGE_UPLOAD_DIR || path.join(process.cwd(), 'uploads');

export async function retrieveImage(filename: string): Promise<Buffer> {
	const filePath = path.join(UPLOAD_DIR, filename);
	const buffer = await fs.readFile(filePath);
	return buffer;
}
