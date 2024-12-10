import type { Types } from "mongoose";
import type { IBasicItem } from "../../models/basicItem";
import type { ITemplate } from "../../models/template";
import type { Formatter } from "./Formatter";
import type { ICustomField } from "../../models/customField";

export class CSVFormatter implements Formatter {
    // TODO: test and debug, block: get custom field by id


    formatTemplates(templates: ITemplate[]): String {
        let csv = "template name\n";
        for (var i = 0; i < templates.length; i++) {
            csv += this.formatTemplate(templates[i]);
            if (i == templates.length - 1) {
                csv = csv.substring(0, templates.length);
            }
        }
        return csv;
    }

    formatTemplate(template: ITemplate) {
        let firstline = "";
        let secondline = "";
        firstline += template.name + ",";
        secondline += ",";
        for (var i = 0; i < template.fields.length; i++) {
            let field = template.fields[i];
            firstline += field.key;
            secondline += field.valueType;
            if (i != template.fields.length - 1) {
                firstline += ",";
                secondline += ","
            }
        }
        firstline += "\n";
        secondline += "\n";
        return firstline + secondline;
    }

    
    formatItems(itemTree: IBasicItem[], itemMap: Map<Types.ObjectId, IBasicItem>): String {
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

    formatItemsHelper(itemTree: IBasicItem[], itemMap: Map<Types.ObjectId, IBasicItem>, columns: string[]) : string[] {
        let csv = "";
        for (var i = 0; i < itemTree.length; i++) {
            let item = itemTree[i];
            columns = columns.concat(this.addColumns(item, columns));
            csv += this.formatItem(item, columns);
            if (item.containedItems !== undefined && item.containedItems.length !== 0) {
                csv += ">\n";
                const subItemIds = item.containedItems!;
                const subItems = subItemIds.map(id => itemMap.get(id)).map(subItem => subItem as IBasicItem);
                columns = this.formatItemsHelper(subItems, itemMap, columns);
                csv += columns.pop();
                csv += "<\n";
            }
        }
        columns.push(csv);
        return columns;
    }

    addColumns(item: IBasicItem, columns: string[]): string[] {
        return this.getColumns(item).filter(ele => !columns.includes(ele));
    }

    getColumns(item: IBasicItem) : string[] {
        return item.customFields!.map(ele => ele.field as ICustomField).map(custom => custom.fieldName).filter(ele => ele !== undefined);
    }

    formatItem(item: IBasicItem, columns: string[]) {
        let line = item.name + "," + item.templateName + "," + item.description + ",";
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
        let match = line.match(/,*$/);
        if (match !== undefined && match !== null && match.length !== 0) {
            let strMatch = match[0];
            let index = line.lastIndexOf(strMatch);
            line = line.substring(0, index);
        }

        return line + "\n";
    }
    
}