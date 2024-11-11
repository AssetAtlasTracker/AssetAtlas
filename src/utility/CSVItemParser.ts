import type { IBasicItem } from "../models/basicItem";
import BasicItem from "../models/basicItem";
import CustomField from "../models/customField";
import { CSVSplitter } from "./CSVSplitter";
import type { Parser } from "./Parser";

export class CSVItemParser implements Parser {
    itemTree: IBasicItem[] = [];
    columns: String[] = [];

    parse(input: String): void {
        var data = CSVSplitter.split(input);
        this.columns = data[0];

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
        let new_item = this.parseItemFromLine(data[i]);
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

    parseItemFromLine(line: String[]): IBasicItem {
        // TODO: typing, empty values for templates.
        let item = new BasicItem();

        // get values from required columns.
        item.name = line[0].toString();
        item.templateName = line[1].toString();
        item.description = line[2].toString();
    
        // get custom fields.
        for (var i = 3; i < line.length; i++) {
            if (line[i].length > 0) {
                if (!item.customFields) {
                    item.customFields = [];
                }
                let customField = new CustomField();
                customField.fieldName = this.columns[i].toString();
                // figure out typing
                item.customFields.push({field: customField, value: line[i]});
            }
        }
    
        return item;
    }
    
}

