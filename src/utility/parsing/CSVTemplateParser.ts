import type { Types } from "mongoose";
import type { IBasicItem } from "../../models/basicItem";
import CustomField, { type ICustomField } from "../../models/customField";
import Template, { type ITemplate } from "../../models/template";
import { CSVPreProcessor } from "../CSVPreProcessor";
import { CSVSplitter } from "../CSVSplitter";
import type { Parser } from "./Parser";


export class CSVTemplateParser implements Parser {
    templatesToAdd : ITemplate[] = [];
    customFieldMap: Map<Types.ObjectId, ICustomField> = new Map<Types.ObjectId, ICustomField>;

    getEntitiesToAdd(): ITemplate[] | IBasicItem[] {
        return this.templatesToAdd;
    }

    parse(input: String): void {
        let data = CSVPreProcessor.preprocess(CSVSplitter.split(input));

        for (var i = 1; i < data.length; i += 2) {
            let template = new Template();
            template.name = data[i][0].toString();

            this.checkTypeRow(data[i+1]);
            
            for (var j = 1; j < data[i].length; j++) {
                const key = data[i][j].toString();
                this.checkEmptyKey(key);

                let customField = new CustomField();
                const valueType = data[i+1][j].toString();
                customField.dataType = valueType;
                customField.fieldName = key;
                template.fields.push(customField.id);
                this.customFieldMap.set(customField.id, customField);
            }
            this.templatesToAdd.push(template);
        }
    }

    checkTypeRow(row : String[]) {
        if (row[0].length > 0) {
            throw new Error("Named Type Row or Missing Type Row: " + row.toString());
        }
    }

    checkEmptyKey(key : string) {
        if (key.length === 0) {
            throw new Error("Missing Key");
        }
    }

    canParse(columns: String[]): boolean {
        let tempName = (columns[0] === "template name");
        columns.shift();
        let blankColumns = (columns.filter(ele => ele !== "").length === 0);
        return tempName && blankColumns;
    }
    
}