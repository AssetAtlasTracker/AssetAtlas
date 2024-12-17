import { Types } from "mongoose";
import BasicItem, { IBasicItem } from "../src/models/basicItem";
import CustomField, { ICustomField } from "../src/models/customField";

import {test} from "../src/utility"

const resources = test();
const CSVFormatter = resources.formatter;
const FileLoader = resources.loader;
const FileExporter = resources.exporter;

describe("Testing Item Exporting", () => {

    it("Should format one item with all types of data", async () => {
        const csvContent = `item name,template,description,amount,seller,sold\ncat,,a black cat,1,barbra,false`;

        let firstItem = new BasicItem();
        firstItem.id = 1;
        firstItem.name = "cat";
        firstItem.templateName = "";
        firstItem.description = "a black cat"
        
        let fieldMap = new Map<Types.ObjectId, ICustomField>();
        firstItem.customFields = [];
        let amountField = new CustomField();
        amountField.id = 20;
        amountField.fieldName = "amount";
        amountField.dataType = "number";
        fieldMap.set(amountField.id, amountField);
        firstItem.customFields.push({field: amountField.id, value: "1"});
        let sellerField = new CustomField();
        sellerField.id = 21;
        sellerField.fieldName = "seller";
        sellerField.dataType = "string";
        fieldMap.set(sellerField.id, sellerField);
        firstItem.customFields.push({field: sellerField.id, value: "barbra"});
        let soldField = new CustomField();
        soldField.id = 22;
        soldField.fieldName = "sold";
        soldField.dataType = "boolean";
        fieldMap.set(soldField.id, soldField);
        firstItem.customFields.push({field: soldField.id, value: "false"});
        
        const formatter = new CSVFormatter();
        let itemMap = new Map<Types.ObjectId,IBasicItem>();
        itemMap.set(firstItem.id!, firstItem);
        expect(formatter.formatItems([firstItem],itemMap,fieldMap)).toBe(csvContent);

    });

    it("Should format an item with a subitem and export the content", async () => {
        const path = "./tests/resource";
        const filename = "test-csv-item-2";
        const extension = ".csv";
        const itemMap = new Map<Types.ObjectId, IBasicItem>();

        const firstItem = new BasicItem();
        firstItem.id = 1;
        firstItem.name = "dog";
        firstItem.templateName = "";
        firstItem.description = "a german shepherd";
        itemMap.set(firstItem.id!, firstItem);

        const secondItem = new BasicItem();
        secondItem.id = 2;
        secondItem.name = "collar";
        secondItem.templateName = "";
        secondItem.description = "a blue collar with a dog tag";
        itemMap.set(secondItem.id!, secondItem);

        firstItem.containedItems = [secondItem.id];
        secondItem.parentItem = firstItem.id;
        
        const formatter = new CSVFormatter();
        const result = formatter.formatItems([firstItem], itemMap, new Map<Types.ObjectId, ICustomField>());

        const csvContent = `item name,template,description\ndog,,a german shepherd\n>\ncollar,,a blue collar with a dog tag\n<`;
        expect(result).toBe(csvContent);
        console.log(result);

        FileExporter.export(filename, path, result.toString(), extension);

        const result2 = FileLoader.readFile(`${path}/${filename}${extension}`);
        expect(result2 == csvContent);
    });
});