import type { Types } from "mongoose";
import type { IBasicItemPopulated } from "../../models/basicItem";
import type { ITemplatePopulated } from "../../models/template";

export class CSVFormatterPopulated {
    itemMap : Map<Types.ObjectId, IBasicItemPopulated>;
    templateMap : Map<Types.ObjectId, ITemplatePopulated>;
    itemTree : IBasicItemPopulated[];
    templates : ITemplatePopulated[];

    constructor(items: IBasicItemPopulated[], templates: ITemplatePopulated[], itemTree: IBasicItemPopulated[]) {
        this.itemMap = new Map<Types.ObjectId, IBasicItemPopulated>();
        items.forEach(item => this.itemMap.set(item._id, item));
        this.templateMap = new Map<Types.ObjectId, ITemplatePopulated>();
        templates.forEach(template => this.templateMap.set(template.id, template));
        this.itemTree = itemTree;
        this.templates = templates;
    }

    formatTemplates(): string {
        let csv = "template name\n";
        for (var i = 0; i < this.templates.length; i++) {
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
        for (var i = 0; i < template.fields.length; i++) {
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
        for (var i = 0; i < itemTree.length; i++) {
            let item = itemTree[i];
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
        let line = item.name + "," + templateName + "," + item.description + ",";
        if (item.customFields) {
            const custom = this.getColumns(item);
            for (var i = 3; i < columns.length; i++) {
                let column = columns[i];
                if (custom.includes(column)) {
                    const index = custom.indexOf(column);
                    line += item.customFields![index].value;
                }
                line += ",";
            }
        }
        let match = line.match(/,*$/);
        if (match && match.length !== 0) {
            let strMatch = match[0];
            let index = line.lastIndexOf(strMatch);
            line = line.substring(0, index);
        }

        return line + "\n";
    }
    
}