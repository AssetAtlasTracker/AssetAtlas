import fs from "fs";

export class FileLoader {
    async readFile(filePath: string): Promise<string> {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          return content;
        } catch (err) {
          console.error('Error reading file:', err);
          throw err;
        }
      }
}