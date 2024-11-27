import * as fs from 'fs';

export class FileLoader {
    static readFile(filePath: string): string {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          return content;
        } catch (err) {
          console.error('Error reading file:', err);
          return ''; // Return an empty string in case of an error
        }
      }
}