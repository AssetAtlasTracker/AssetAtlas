import type { IBasicItem } from "../models/basicItem";
import BasicItem from "../models/basicItem";
import CustomField from "../models/customField";
import type { ITemplate } from "../models/template";
import { CSVSplitter } from "./CSVSplitter";
import type { Parser } from "./Parser";

export class CSVItemParser implements Parser {
    itemTree: IBasicItem[] = [];
    columns: String[] = [];
    columnTypes: Map<String, string> = new Map<String, string>;
    templates: Map<String, ITemplate> = new Map<String, ITemplate>

    constructor(templates : ITemplate[]) {
        for (var i = 0; i < templates.length; i++) {
            this.templates.set(templates[i].name, templates[i]);
        }
    }

    collectColumnTypes(data: String[][], columns: String[]){
        for (var i = 3; i < columns.length; i++) { // first 3 columns are reserved - determine types for 4th+
            let column = data.map(row => row[i].trim());
            this.columnTypes.set(columns[i], this.determineTypeOfColumn(column));
        }
    }

    determineTypeOfColumn(column: String[]) : string {
        // TODO: determine if ideal functionality
        // there is an instance where if we have all blank values, this will assume a field is a number. We could change that to assume string.

        // String will be default
        // Regex for number and boolean
        // No other types necessary
        let numberRegEx = /^\d*.?\d*$/;
        let booleanRegEx = /^true$|^false$|^t$|^f$|^0$|^1$/;
        let currentType = "number";
        for (var i = 1; i < column.length; i++) {
            let entry = column[i].toLowerCase();
            if (entry.length != 0) {
                if (currentType == "string") {
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

    parse(input: String): void {
        var data = CSVSplitter.split(input);
        this.columns = data[0];
        this.collectColumnTypes(data, this.columns)

        var i = 1;
        // get first item

        var items: IBasicItem[] = [];
        var last_item : IBasicItem | null = null;
        this.parseHelper(data, i, items, last_item);     
    }

    parseHelper(data : String[][], i : number, items: IBasicItem[], last_item : IBasicItem | null) {
        if (i == data.length) {
            return;
        }

        switch (data[i][0]) {
            case ">": this.parseHelperIn(data, i, items, last_item);
            case "<": this.parseHelperOut(data,i, items, last_item);
            default: this.parseHelperItem(data,i, items, last_item);
        }
    }

    parseHelperItem(data: String[][], i: number, items: IBasicItem[], last_item: IBasicItem | null) {
        if (!last_item) {
            throw new Error("Incorrect Formatting: No Item as Container");
        } else {
            items.push(last_item!);
            this.parseHelper(data, i+1, items, null);
        }
    }

    parseHelperOut(data: String[][], i: number, items: IBasicItem[], last_item: IBasicItem | null) {
        if (items.length === 0) {
            throw new Error("Incorrect Formatting: No Items When Popping Out");
        } else {
            items.pop();
            this.parseHelper(data, i+1, items, null); // is null the right choice here? more strict but better
        }
    }
    parseHelperIn(data: String[][], i: number, items: IBasicItem[], last_item: IBasicItem | null) {
        let new_item = this.parseItemFromLine(data[i], i);
        if (items.length > 0) {
            let upper_item = items.pop() as IBasicItem;
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

    canParse(columns: String[]): boolean {
        return columns.map(ele => ele.toLocaleLowerCase()).includes("item name");
    }

    parseItemFromLine(line: String[], id: number) : IBasicItem {
        let item = new BasicItem();
        item.id = id;

        // get values from required columns.
        item.name = line[0].toString();
        item.templateName = line[1].toString();
        item.description = line[2].toString();
    
        // get custom fields.
        for (var i = 3; i < line.length; i++) {
            if (line[i].length > 0) {
                this.addCustomFieldToItem(line, item, id, i)
            } else {
                // consider templates
                let template = this.templates.get(item.templateName);
                if (template !== undefined) {
                    // consider if this column is in the template
                    if (template.fields.map(field => field.key).includes(this.columns[i].toLowerCase())) {
                        this.addCustomFieldToItem(line, item, id, i)
                    }
                }
            }
        }
        return item;
    }

    addCustomFieldToItem(line: String[], item: IBasicItem, id: number, i: number) {
        if (!item.customFields) {
            item.customFields = [];
        }
        let customField = new CustomField();
        customField.fieldName = this.columns[i].toString();
        let dataType = this.columnTypes.get(this.columns[id]);

        if (dataType === undefined) {
            throw new Error();
        }
        customField.dataType = dataType as string;
        item.customFields.push({field: customField, value: line[i]});
    }
    
}

