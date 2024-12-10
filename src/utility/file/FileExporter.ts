import * as fs from 'fs';
var dataToWrite;

export class FileExporter {
    export(filename: string, path:string, data:string, extension:string=".csv") {
        fs.writeFile(`${path}/${filename}${extension}`, data, 'utf8', function (err) {
            if (err) {
                console.log('Some error occured - file either not saved or corrupted file saved.');
            } else{
                console.log('It\'s saved!');
            }
        });
    }
}