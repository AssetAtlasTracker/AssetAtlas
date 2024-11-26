import exp from "constants";
import BasicItem from "../src/models/basicItem";
import CustomField, { ICustomField } from "../src/models/customField";
import {CSVItemParser} from "../src/utility"

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
        firstItem.description = "a black cat"
        
        firstItem.customFields = [];
        let amountField = new CustomField();
        amountField.fieldName = "amount";
        amountField.dataType = "number";
        firstItem.customFields.push({field: amountField, value: "1"});
        let sellerField = new CustomField();
        sellerField.fieldName = "seller";
        sellerField.dataType = "string";
        firstItem.customFields.push({field: sellerField, value: "barbra"});
        let soldField = new CustomField();
        soldField.fieldName = "sold";
        soldField.dataType = "boolean";
        firstItem.customFields.push({field: soldField, value: "false"});
        
        expect(itemParser.itemTree.length == 1);
        let expectedItem = itemParser.itemTree[0];
        expect(expectedItem.name).toBe(firstItem.name);
        expect(expectedItem.templateName).toBe(firstItem.templateName);
        expect(expectedItem.description).toBe(firstItem.description);
        expect(expectedItem.customFields).not.toBeNull();
        expect(expectedItem.customFields!.length).toBe(3);

        for (var i = 0; i < expectedItem.customFields!.length; i++) {
            let expectedField = expectedItem.customFields![i];
            let firstField = firstItem.customFields![i];
            expect(expectedField.field['fieldName']).toBe(firstField.field['fieldName']);
            expect(expectedField.field['dataType']).toBe(firstField.field['dataType']);
            expect(expectedField.value).toBe(firstField.value);
        }

    });
});