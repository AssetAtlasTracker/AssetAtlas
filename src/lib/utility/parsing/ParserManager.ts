import type {ITemplatePopulated } from "$lib/server/db/models/template.js";
import { CSVTemplateParser } from "./CSVTemplateParser.js";
import { CSVPreProcessor } from "../CSVPreProcessor.js";
import { EntityAdder } from "../EntityAdder.js";
import { CSVItemParserPopulated } from "./CSVItemParserPopulated.js";
import Template from "$lib/server/db/models/template.js";

export class ParserManager {

	async parseFromFiles(data: string[], names: string[], ids: string[]) {
		const adder = new EntityAdder();
		const templateParser = new CSVTemplateParser();
		let itemData = "";

		console.log("Data is", data);
		for (let i=0; i < data.length; i++) {
			const contents = data[i]
			if (templateParser.canParse(CSVPreProcessor.getColumns(contents))) {
				console.log("Parsing Templates From:", contents);
				templateParser.parse(contents);
				const templates = templateParser.templatesToAdd;
				console.log("Parsed Templates:", templates);
				const customFields = templateParser.customFieldMap;
				console.log("Parsed Custom Fields:", customFields);
				await adder.addCustomFields(customFields);
				await adder.addTemplates(templates);
				console.log("Finished adding Template data.");
			} else {
				itemData = contents;
			}
		}

		if (itemData !== "" ) {
			//get existing templates ==> will be populated
			const templates : ITemplatePopulated[] =  await Template.find().populate('fields').exec() as unknown as ITemplatePopulated[];

			const contents = itemData;
			const itemParser = new CSVItemParserPopulated(templates, names, ids);
			if (itemParser.canParse(CSVPreProcessor.getColumns(contents))) {
				itemParser.parse(contents);
				const customFields = itemParser.customFieldMap;
				await adder.addCustomFields(customFields);
				await adder.addItems(itemParser.itemTree, itemParser.itemMap);
			} else {
				throw Error("Error: Cannot parse item data contents.");
			}
		}
	}
}