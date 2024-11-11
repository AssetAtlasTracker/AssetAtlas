import Template, { type ITemplate } from "../models/template";
import { CSVSplitter } from "./CSVSplitter";
import type { Parser } from "./Parser";


export class CSVTemplateParser implements Parser {
    templatesToAdd : ITemplate[] = [];

    parse(input: String): void {
        let data = CSVSplitter.split(input);

        for (var i = 1; i < data.length; i += 2) {
            let template = new Template();
            template.name = data[i][0].toString();

            this.checkTypeRow(data[i+1]);
            
            for (var j = 1; j < data[i].length; j++) {
                const key = data[i][j].toString();

                this.checkEmptyKey(key);

                const valueType = data[i+1][j].toString();
                template.fields.push({key: key, valueType: valueType});
            }
            this.templatesToAdd.push(template);
        }
    }

    checkTypeRow(row : String[]) {
        if (row[0].length > 0) {
            throw new Error("Named Type Row or Missing Type Row");
        }
    }

    checkEmptyKey(key : string) {
        if (key.length === 0) {
            throw new Error("Missing Key");
        }
    }

    canParse(columns: String[]): boolean {
        return columns.length === 1 && columns[0].toLocaleLowerCase() === "template name";
    }
    
}