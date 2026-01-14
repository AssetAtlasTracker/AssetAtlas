import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.IMAGE_UPLOAD_DIR || path.join(process.cwd(), 'uploads');

async function ensureUploadDir() {
	try {
		await fs.access(UPLOAD_DIR);
	} catch {
		await fs.mkdir(UPLOAD_DIR, { recursive: true });
	}
}

export async function uploadImage(file: File) {
	await ensureUploadDir();

	const filePath = path.join(UPLOAD_DIR, file.name);

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	await fs.writeFile(filePath, buffer);

	return file.name;
}

export async function retrieveImage(filename: string): Promise<Buffer> {
	console.log("GOT NAME:" + filename);
	const filePath = path.join(UPLOAD_DIR, filename);
	const buffer = await fs.readFile(filePath);
	return buffer;
}