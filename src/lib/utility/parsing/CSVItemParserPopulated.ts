import { Types } from "mongoose";
import type { IBasicItem } from "$lib/server/db/models/basicItem.js";
import BasicItem from "$lib/server/db/models/basicItem.js";
import CustomField, { type ICustomField } from "$lib/server/db/models/customField.js";
import type { ITemplate, ITemplatePopulated } from "$lib/server/db/models/template.js";
import { CSVPreProcessor } from "../CSVPreProcessor.js";
import { CSVSplitter } from "../CSVSplitter.js";
import type { Parser } from "./Parser.js";

export class CSVItemParserPopulated implements Parser {
	itemTree: IBasicItem[] = [];
	itemMap: Map<Types.ObjectId,IBasicItem> = new Map<Types.ObjectId, IBasicItem>();
	customFieldMap: Map<Types.ObjectId, ICustomField> = new Map<Types.ObjectId, ICustomField>();
	columns: string[] = [];
	columnTypes: Map<string, string> = new Map<string, string>;
	templates: Map<string, ITemplatePopulated> = new Map<string, ITemplatePopulated>();
	imageNameIdMap : Map<string, Types.ObjectId> = new Map<string, Types.ObjectId>()

	constructor(templates : ITemplatePopulated[], names: string[], ids: string[]) {
		for (let i = 0; i < templates.length; i++) {
			this.templates.set(templates[i].name, templates[i]);
		}
		if (ids) {
			for (let j = 0; j < ids.length; j++) {
				this.imageNameIdMap.set(names[j], ids[j] as unknown as Types.ObjectId)
			}
		}
	}

	getEntitiesToAdd(): ITemplate[] | IBasicItem[] {
		return this.itemTree;
	}

	collectColumnTypes(data: string[][], columns: string[]){
		for (var i = 3; i < columns.length; i++) { // first 3 columns are reserved - determine types for 4th+
			const column = data.map(row => {
				if (!row[i]) {
					row[i] = ""; // fill in empty rows with no value // TODO: determine if this is the best way, else, append commas
				}
				return row[i].trim();
			});
			this.columnTypes.set(columns[i], this.determineTypeOfColumn(column));
		}
	}

	determineTypeOfColumn(column: string[]) : string {
		// TODO: determine if ideal functionality
		// there is an instance where if we have all blank values, this will assume a field is a number. We could change that to assume string.

		// string will be default
		// Regex for number and boolean
		// No other types necessary
		const numberRegEx = /^\d*.?\d*$/;
		const booleanRegEx = /^true$|^false$|^t$|^f$|^0$|^1$/;
		let currentType = "number";
		for (let i = 1; i < column.length; i++) {
			const entry = column[i].toString();
			if (entry.length != 0) {
				if (currentType == "number") {
					// check if still a number
					if (!numberRegEx.test(entry)) {
						if (booleanRegEx.test(entry)) {
							currentType = "boolean";
						} else {
							return "string";
						}
					}
				} else if (currentType == "boolean") {
					if (!booleanRegEx.test(entry)) {
						return "string";
					}
				}
			}
		}
		return currentType;
	}

	parse(input: string): void {
		const data = CSVPreProcessor.preprocess(CSVSplitter.split(input));
		this.columns = data[0];
		this.collectColumnTypes(data, this.columns);

		const i = 1;
		// get first item

		const items: IBasicItem[] = [];
		const last_item : IBasicItem | null = null;
		this.parseHelper(data, i, items, last_item);    
	}

	parseHelper(data : string[][], i : number, items: IBasicItem[], last_item : IBasicItem | null) {
		if (i == data.length) {
			return;
		}
		switch (data[i][0]) {
		case ">": this.parseHelperIn(data, i, items, last_item); break;
		case "<": this.parseHelperOut(data,i, items); break;
		default: this.parseHelperItem(data,i, items, last_item);
		}
	}

    

	parseHelperIn(data: string[][], i: number, items: IBasicItem[], last_item: IBasicItem | null) {
		if (!last_item) {
			this.parseHelperItem(data, i, items, last_item);
		} else {
			items.push(last_item!);
			this.parseHelper(data, i+1, items, null);
		}
	}

	parseHelperOut(data: string[][], i: number, items: IBasicItem[]) {
		if (items.length === 0) {
			throw new Error("Incorrect Formatting: No Items When Popping Out");
		} else {
			items.pop();
			this.parseHelper(data, i+1, items, null);
		}
	}
    
	parseHelperItem(data: string[][], i: number, items: IBasicItem[], last_item: IBasicItem | null) {
		const new_item = this.parseItemFromLine(data[i]);
		if (items.length > 0) {
			const upper_item = items.pop() as IBasicItem;
			new_item.parentItem = upper_item!.id;
			if (!upper_item.containedItems) {
				upper_item.containedItems = [];
			}
			upper_item.containedItems.push(new_item.id);
			items.push(upper_item);
		} else {
			this.itemTree.push(new_item);
		}
		last_item = new_item;
		this.parseHelper(data, i+1, items, last_item);
	}

	canParse(columns: string[]): boolean {
		return columns[0] === "item name" && columns[1] === "template" && columns[2] === "description";
	}

	parseItemFromLine(line: string[]) : IBasicItem {
		const item = new BasicItem();
		const id = new Types.ObjectId();
		item.id = id;

		// get values from required columns.
		item.name = line[0].toString();
		const templateName = line[1].toString();
		const template = this.templates.get(templateName);
		if (template !== undefined) {
			item.template = template!.id;
		}
		item.description = line[2].toString();
    
		// get custom fields.
		for (let i = 3; i < line.length; i++) {
			if (line[i].length > 0) {
				if (this.columns[i] == "image") {
					const imageId = this.imageNameIdMap.get(line[i]);
					if (imageId) {
						item.image = imageId.toHexString() as unknown as Types.ObjectId;
					} else {
						throw new Error("Error: Unable to find uploaded image " + line[i]);
					}
				} else {
					this.addCustomFieldToItem(line, item, i);
				}
			} else {
				// consider templates         
				if (template !== undefined) {
					// consider if this column is in the template
					if (template.fields.map(custom => custom.fieldName).includes(this.columns[i].toString())) {
						this.addCustomFieldToItem(line, item, i);
					}
				}
			}
		}
		console.log(item.image);
		this.itemMap.set(item.id, item); // TODO: see if this works
		return item;
	}

	addCustomFieldToItem(line: string[], item: IBasicItem, i: number) {
		if (!item.customFields) {
			item.customFields = [];
		}
		const customField = new CustomField();
		customField.id=i;
		customField.fieldName = this.columns[i].toString();
		const dataType = this.columnTypes.get(this.columns[i]);

		if (dataType === undefined) {
			throw new Error();
		}
		customField.dataType = dataType.toString();
		item.customFields.push({field: customField.id, value: line[i]});
		this.customFieldMap.set(customField.id, customField);
	} 
}

