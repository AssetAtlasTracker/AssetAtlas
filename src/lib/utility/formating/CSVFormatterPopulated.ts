import type { Types } from "mongoose";
import type { IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
import type { ITemplatePopulated } from "$lib/server/db/models/template.js";

export class CSVFormatterPopulated {
	itemMap : Map<Types.ObjectId, IBasicItemPopulated>;
	templateMap : Map<Types.ObjectId, ITemplatePopulated>;
	imageMap : Map<Types.ObjectId, string>;
	itemTree : IBasicItemPopulated[];
	templates : ITemplatePopulated[];

	constructor(items: IBasicItemPopulated[], templates: ITemplatePopulated[], itemTree: IBasicItemPopulated[], images: {_id: Types.ObjectId, filename: string}[]) {
		this.itemMap = new Map<Types.ObjectId, IBasicItemPopulated>();
		items.forEach(item => this.itemMap.set(item._id, item));
		this.templateMap = new Map<Types.ObjectId, ITemplatePopulated>();
		templates.forEach(template => this.templateMap.set(template.id, template));
		this.imageMap = new Map<Types.ObjectId, string>();
		if (images) {
			images.map(image => this.imageMap.set(image._id, image.filename));
		}
		this.itemTree = itemTree;
		this.templates = templates;
	}

	formatTemplates(): string {
		let csv = "template name\n";
		for (let i = 0; i < this.templates.length; i++) {
			csv += this.formatTemplate(this.templates[i]);
			if (i == this.templates.length - 1) {
				csv = csv.substring(0, csv.length -1);
			}
		}
		return csv;
	}

	formatTemplate(template: ITemplatePopulated) {
		let firstline = "";
		let secondline = "";
		firstline += template.name + ",";
		secondline += ",";
		for (let i = 0; i < template.fields.length; i++) {
			const customField = template.fields[i];
			firstline += customField.fieldName;
			secondline += customField.dataType;
			if (i != template.fields.length - 1) {
				firstline += ",";
				secondline += ","
			}
		}
		firstline += "\n";
		secondline += "\n";
		return firstline + secondline;
	}
    
	formatItems(): string {
		let columns = ["item name", "template", "description"];
		if (this.imageMap.size > 0) {
			columns.push('image');
		}
		columns = this.formatItemsHelper(this.itemTree, this.itemMap, columns);
		let csv = columns.pop();
		let line = columns.join(",");
		const indexC = line.lastIndexOf(",");
		if (indexC == line.length -1) {
			line = line.substring(0, indexC);
		}
		const indexN = csv!.lastIndexOf("\n");
		if (indexN == csv!.length-1) {
			csv = csv!.substring(0, csv!.length-1)
		}
		const final = line + "\n" + csv!;
		return final;
	}

	formatItemsHelper(itemTree: IBasicItemPopulated[], itemMap: Map<Types.ObjectId, IBasicItemPopulated>, columns: string[]) : string[] {
		let csv = "";
		for (let i = 0; i < itemTree.length; i++) {
			const item = itemTree[i];
			columns = columns.concat(this.addColumns(item, columns));
			csv += this.formatItem(item, columns);
			if (item.containedItems !== undefined && item.containedItems.length !== 0) {
				csv += ">\n";
				const subItemIds = item.containedItems!.map(item => {return item._id});
				const populatedItems = subItemIds.map(id => {return itemMap.get(id)!});
				columns = this.formatItemsHelper(populatedItems, itemMap, columns);
				csv += columns.pop();
				csv += "<\n";
			}
		}
		columns.push(csv);
		return columns;
	}

	addColumns(item: IBasicItemPopulated, columns: string[]): string[] {
		return this.getColumns(item).filter(ele => {return !columns.includes(ele)});
	}

	getColumns(item: IBasicItemPopulated) : string[] {
		if (!item.customFields) {
			return [];
		}
		return item.customFields!.map(custom => {return custom.field.fieldName});
	}

	formatItem(item: IBasicItemPopulated, columns: string[]) {
		let templateName = "";
		if (item.template) {
			templateName = item.template.name;
		}
		const imageFile = item.image ? item.image!.filename : "";
		let line = item.name + "," + templateName + "," + item.description + ",";
		if (this.imageMap.size > 0) {
			line += imageFile + ",";
		}
		if (item.customFields) {
			const custom = this.getColumns(item);
			for (let i = 3; i < columns.length; i++) {
				const column = columns[i];
				if (custom.includes(column)) {
					const index = custom.indexOf(column);
					line += item.customFields![index].value;
				}
				line += ",";
			}
		}
		const match = line.match(/,*$/);
		if (match && match.length !== 0) {
			const strMatch = match[0];
			const index = line.lastIndexOf(strMatch);
			line = line.substring(0, index);
		}

		return line + "\n";
	}
    
}