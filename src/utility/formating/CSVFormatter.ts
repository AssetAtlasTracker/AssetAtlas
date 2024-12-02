import type { Types } from "mongoose";
import type { IBasicItem } from "../../models/basicItem";
import type { ITemplate } from "../../models/template";
import type { Formatter } from "./Formatter";
import type { ICustomField } from "../../models/customField";

export class CSVFormatter implements Formatter {
    // TODO: test and debug, block: get custom field by id

    formatTemplates(templates: ITemplate[]): String {
        let csv = "template name,\n";
        for (var i = 0; i < templates.length; i++) {
            csv += this.formatTemplate(templates[i]);
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
            firstline += field.key + ",";
            secondline += field.valueType + ",";
        }
        firstline += "\n";
        secondline += "\n";
        return firstline + secondline;
    }

    
    formatItems(itemTree: IBasicItem[], itemMap: Map<Types.ObjectId, IBasicItem>): String {
        let columns = ["item name"];
        return this.formatItemsHelper(itemTree, itemMap, columns);
    }

    formatItemsHelper(itemTree: IBasicItem[], itemMap: Map<Types.ObjectId, IBasicItem>, columns: string[]) : String {
        let csv = "";
        for (var i = 0; i < itemTree.length; i++) {
            let item = itemTree[i];
            columns = columns.concat(this.addColumns(item, columns));
            csv += this.formatItem(item, columns);
            if (item.containedItems !== undefined && item.containedItems.length !== 0) {
                csv += ">,\n";
                const subItems = item.containedItems.map(id => itemMap.get(id)).filter(ele => ele !== undefined);
                csv += this.formatItemsHelper(subItems, itemMap, columns);
                csv += "<,\n";
            }
        }
        return columns.join(",") + "\n" + csv;
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
        for (var i = 0; i < columns.length; i++) {
            let column = columns[i];
            if (custom.includes(column)) {
                const index = custom.indexOf(column);
                line += item.customFields![index].value;
            }
            line += ",";
        }
        return line + "\n";
    }
    
}