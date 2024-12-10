import { Types } from "mongoose";
import BasicItem from "../src/models/basicItem";
import CustomField, { ICustomField } from "../src/models/customField";

import {test} from "../src/utility"

const resources = test();
const CSVItemParser = resources.itemParser;
const FileLoader = resources.loader;

describe("Testing Item Parsing", () => {

    it("Should make one item with all types of fields, no template", async () => {
        const csvContent = `item name,template,description,amount,seller,sold\ncat,,a black cat,1,barbra,false`;

        const itemParser = new CSVItemParser([]);
        const canParse = itemParser.canParse(csvContent.split(/\n|\r/)[0].split(/,/));
        expect(canParse).toBeTruthy();

        itemParser.parse(csvContent);

        let firstItem = new BasicItem();
        firstItem.name = "cat";
        firstItem.templateName = "";
        firstItem.description = "a black cat";

        let fieldMap = new Map<Types.ObjectId, ICustomField>();
        firstItem.customFields = [];
        let amountField = new CustomField();
        amountField.id=20;
        amountField.fieldName = "amount";
        amountField.dataType = "number";
        fieldMap.set(amountField.id, amountField);
        firstItem.customFields.push({field: amountField.id, value: "1"});
        let sellerField = new CustomField();
        sellerField.id=21;
        sellerField.fieldName = "seller";
        sellerField.dataType = "string";
        fieldMap.set(sellerField.id, sellerField);
        firstItem.customFields.push({field: sellerField.id, value: "barbra"});
        let soldField = new CustomField();
        soldField.id=22;
        soldField.fieldName = "sold";
        soldField.dataType = "boolean";
        fieldMap.set(soldField.id, soldField);
        firstItem.customFields.push({field: soldField.id, value: "false"});
        
        
        expect(itemParser.itemTree.length == 1);
        let expectedItem = itemParser.itemTree[0];
        expect(expectedItem.name).toBe(firstItem.name);
        expect(expectedItem.templateName).toBe(firstItem.templateName);
        expect(expectedItem.description).toBe(firstItem.description);
        expect(expectedItem.customFields).not.toBeNull();
        expect(expectedItem.customFields!.length).toBe(3);

        for (var i = 0; i < expectedItem.customFields!.length; i++) {
            let expectedField = expectedItem.customFields![i];
            const field = firstItem.customFields[i];
            if (i === 0) {
                expect(field.field).toBe(amountField.id);
            }
            const fieldCustom = fieldMap.get(field.field);
            const expectedFieldCustom = itemParser.customFieldMap.get(expectedField.field);
            expect(expectedFieldCustom!.fieldName).toBe(fieldCustom!.fieldName);
            expect(expectedFieldCustom!.dataType).toBe(fieldCustom!.dataType)
            expect(expectedField.value).toBe(field.value);
        }

    });

    it("Should parse an item with a subitem from a file", async () => {
        const path = "./tests/resource/test-csv-item-1.csv";
        const content = FileLoader.readFile(path);
        const itemParser = new CSVItemParser([]);

        const canParse = itemParser.canParse(content.split(/\n|\r/)[0].split(/,/));
        expect(canParse).toBeTruthy();

        // parse and get results
        itemParser.parse(content);
        const items = itemParser.itemTree;
        const itemMap = itemParser.itemMap;

        // check items
        // -- first item
        const firstItem = itemMap.get('1' as unknown as Types.ObjectId);
        expect(firstItem).not.toBeNull();
        expect(firstItem!.name).toBe('one');
        expect(firstItem!.description).toBe('a number');
        expect(firstItem!.customFields).not.toBeNull();
        expect(firstItem!.customFields![0].value).toBe('1');

        // -- second item
        const secondItem = itemMap.get('3' as unknown as Types.ObjectId);
        expect(secondItem).not.toBeNull();
        expect(secondItem!.name).toBe('two');
        expect(secondItem!.description).toBe('another number');
        expect(secondItem!.customFields).not.toBeNull();
        expect(secondItem!.customFields![0].value).toBe('2');

        // -- third item
        const thirdItem = itemMap.get('5' as unknown as Types.ObjectId);
        expect(thirdItem).not.toBeNull();
        expect(thirdItem!.name).toBe('three');
        expect(thirdItem!.description).toBe('a third number');
        expect(thirdItem!.customFields).not.toBeNull();
        expect(thirdItem!.customFields![0].value).toBe('3');

        // check item relations
        const parentItem = items[0];
        expect(parentItem).toBe(firstItem);
        expect(parentItem.containedItems).not.toBeNull();
        expect(parentItem.containedItems![0]).toStrictEqual(secondItem!._id);
    });
});