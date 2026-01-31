import { Types } from "mongoose";
import type { IBasicItem } from "$lib/server/db/models/basicItem.js";
import CustomField, { type ICustomField } from "$lib/server/db/models/customField.js";
import Template, { type ITemplate } from "$lib/server/db/models/template.js";
import { CSVPreProcessor } from "../CSVPreProcessor.js";
import { CSVSplitter } from "../CSVSplitter.js";
import type { Parser } from "./Parser.js";


export class CSVTemplateParser implements Parser {
	templatesToAdd : ITemplate[] = [];
	customFieldMap: Map<Types.ObjectId, ICustomField> = new Map<Types.ObjectId, ICustomField>;

	getEntitiesToAdd(): ITemplate[] | IBasicItem[] {
		return this.templatesToAdd;
	}

	parse(input: string): void {
		const data = CSVPreProcessor.preprocess(CSVSplitter.split(input));

		for (let i = 1; i < data.length; i += 2) {
			const template = new Template();
			template.name = data[i][0].toString();

			this.checkTypeRow(data[i+1]);
            
			for (let j = 1; j < data[i].length; j++) {
				const key = data[i][j].toString();
				this.checkEmptyKey(key);
				const customField = new CustomField();
				const newId = new Types.ObjectId();
				customField.id = newId;
				const valueType = data[i+1][j].toString();
				customField.dataType = valueType;
				customField.fieldName = key;
				template.fields.push(customField.id);
				this.customFieldMap.set(customField.id, customField);
			}
			this.templatesToAdd.push(template);
		}
	}

	checkTypeRow(row : string[]) {
		if (row[0].length > 0) {
			throw new Error("Named Type Row or Missing Type Row: " + row.toString());
		}
	}

	checkEmptyKey(key : string) {
		if (key.length === 0) {
			throw new Error("Missing Key");
		}
	}

	canParse(columns: string[]): boolean {
		const tempName = (columns[0] === "template name");
		columns.shift();
		const blankColumns = (columns.filter(ele => ele !== "").length === 0);
		return tempName && blankColumns;
	}
    
}