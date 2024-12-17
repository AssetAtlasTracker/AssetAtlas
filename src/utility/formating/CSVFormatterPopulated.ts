import type { Types } from "mongoose";
import type { IBasicItem, IBasicItemPopulated } from "../../models/basicItem";
import type { ITemplate, ITemplatePopulated } from "../../models/template";
import type { Formatter } from "./Formatter";
import type { ICustomField } from "../../models/customField";

export class CSVFormatterPopulated {
    itemMap : Map<Types.ObjectId, IBasicItemPopulated>;
    templateMap : Map<Types.ObjectId, ITemplatePopulated>;

    constructor (itemMap: Map<Types.ObjectId, IBasicItemPopulated>, templateMap : Map<Types.ObjectId, ITemplatePopulated>) {
        this.itemMap = itemMap;
        this.templateMap = templateMap;
    }


    formatTemplates(templates: ITemplatePopulated[]): String {
        let csv = "template name\n";
        for (var i = 0; i < templates.length; i++) {
            csv += this.formatTemplate(templates[i]);
            if (i == templates.length - 1) {
                csv = csv.substring(0, templates.length);
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

    
    formatItems(itemTree: IBasicItemPopulated[], itemMap: Map<Types.ObjectId, IBasicItemPopulated>): String {
        let columns = ["item name", "template", "description"];
        columns = this.formatItemsHelper(itemTree, itemMap, columns);
        let csv = columns.pop();
        let line = columns.join(",");
        const indexC = line.lastIndexOf(",");
        if (indexC == line.length -1) {
            line = line.substring(0, indexC);
        }
        const indexN = csv!.lastIndexOf("\n");
        if (indexN == csv!.length-1) {
            csv = csv!.substring(0, indexN)
        }
        return line + "\n" + csv;
    }

    formatItemsHelper(itemTree: IBasicItemPopulated[], itemMap: Map<Types.ObjectId, IBasicItemPopulated>, columns: string[]) : string[] {
        let csv = "";
        for (var i = 0; i < itemTree.length; i++) {
            let item = itemTree[i];
            columns = columns.concat(this.addColumns(item, columns));
            csv += this.formatItem(item, columns);
            if (item.containedItems !== undefined && item.containedItems.length !== 0) {
                csv += ">\n";
                const subItemIds = item.containedItems!.map(ele => ele.id);
                const subItems = subItemIds.map(id => itemMap.get(id.toHexString() as unknown as Types.ObjectId)).map(subItem => subItem as IBasicItemPopulated);
                columns = this.formatItemsHelper(subItems, itemMap, columns);
                csv += columns.pop();
                csv += "<\n";
            }
        }
        columns.push(csv);
        return columns;
    }

    addColumns(item: IBasicItemPopulated, columns: string[]): string[] {
        return this.getColumns(item).filter(ele => !columns.includes(ele));
    }

    getColumns(item: IBasicItemPopulated) : string[] {
        if (item.customFields === undefined || item.customFields === null) {
            return [];
        }
        return item.customFields!.map(custom => custom.field.fieldName);
    }

    formatItem(item: IBasicItemPopulated, columns: string[]) {
        let templateName = "";
        if (item.template !== undefined && item.template !== null) {
            templateName = item.template.name;
        }
        let line = item.name + "," + templateName + "," + item.description + ",";
        if (item.customFields !== undefined) {
            const custom = this.getColumns(item);
            let numNotIncluded = 0;
            for (var i = 3; i < columns.length; i++) {
                let column = columns[i];
                if (custom.includes(column)) {
                    const index = custom.indexOf(column);
                    line += item.customFields![index].value;
                    numNotIncluded++;
                }
                line += ",";
            }
        }
        let match = line.match(/,*$/);
        if (match !== undefined && match !== null && match.length !== 0) {
            let strMatch = match[0];
            let index = line.lastIndexOf(strMatch);
            line = line.substring(0, index);
        }

        return line + "\n";
    }
    
}