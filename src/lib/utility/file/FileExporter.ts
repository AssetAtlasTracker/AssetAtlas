import fs from "fs/promises";

export class FileExporter {
	async export(filename: string, path:string, data:string, extension:string=".csv") : Promise<string> {
		console.log("Attempting to export to " + path + " file " + filename + ".");
		console.log("Attempting to write:", data.trim());
		let message = "";
		try {
			await fs.writeFile(`${path}/${filename}${extension}`, data)
			message = 'It\'s saved!';
			console.log(message);
		} catch (err) {
			if (err) {
				console.error(err);
				message = 'Some error occurred - file either not saved or corrupted file saved.';
				console.error(message);
			}
		} 
		return message;
	}
}