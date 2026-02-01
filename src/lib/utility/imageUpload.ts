import { browser } from "$app/environment";
import * as tus from "tus-js-client";

export async function uploadImage(file: File): Promise<string> {
	if (!browser) {
		throw new Error("uploadImage can only be called in the browser");
	}

	const protocol = window.location.protocol;
	const hostname = window.location.hostname;
	const endpoint = `${protocol}//${hostname}:1080/files/`;

	return new Promise((resolve, reject) => {
		const upload = new tus.Upload(file, {
			endpoint,
			retryDelays: [0, 1000, 3000, 5000],
			chunkSize: 5 * 1024 * 1024,
			metadata: {
				filename: file.name,
				filetype: file.type
			},
			onError(error) {
				console.error("Upload failed:", error);
				reject(error);
			},
			onProgress(bytesUploaded, bytesTotal) {
				const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(1);
			},
			onSuccess() {
				const filename = upload.url?.split('/').pop() || file.name;
				resolve(filename);
			}
		});

		upload.start();
	});
}