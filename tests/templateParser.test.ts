import {test} from "../src/utility"
import CustomField, { ICustomField } from "../src/models/customField";

const resources = test();
const CSVTemplateParser = resources.templateParser;

import Template from "../src/models/template";
import { Types } from "mongoose";


describe("Testing Template Parsing", () => {

    it("Should make one template with all types of fields", async () => {
        const csvContent = `template name\nfirst,name,amount,edible\n,string,number,boolean`;

        const templateParser = new CSVTemplateParser();
        const canParse = templateParser.canParse(csvContent.split(/\n|\r/)[0].split(/,/));
        expect(canParse).toBeTruthy();
        templateParser.parse(csvContent);

        let firstTemplate = new Template();
        firstTemplate.id = 1;
        firstTemplate.name = "first";
        let nameField = new CustomField();
        nameField.id = 2;
        nameField.fieldName = "name";
        nameField.dataType = "string";
        let amountField = new CustomField();
        amountField.id = 3;
        amountField.fieldName = "amount";
        amountField.dataType = "number";
        let edibleField = new CustomField();
        edibleField.id = 4;
        edibleField.fieldName = "edible";
        edibleField.dataType = "boolean";

        firstTemplate.fields.push(nameField.id);
        firstTemplate.fields.push(amountField.id);
        firstTemplate.fields.push(edibleField.id);

        let fieldMap = new Map<Types.ObjectId, ICustomField>();
        fieldMap.set(nameField.id, nameField);
        fieldMap.set(amountField.id, amountField);
        fieldMap.set(edibleField.id, edibleField);

        const templateToTest = templateParser.templatesToAdd[0];
        const fieldsToTest = templateParser.customFieldMap;
        expect(templateToTest.name).toBe(firstTemplate.name);
        for (var i = 0; i < templateToTest.fields.length; i++) {
            const fieldId = firstTemplate.fields[i];
            const field = fieldMap.get(fieldId.toHexString() as unknown as Types.ObjectId);
            expect(field).not.toBe(undefined);
            const testId = templateToTest.fields[i];
            const testField = fieldsToTest.get(testId.toHexString() as unknown as Types.ObjectId);
            expect(testField).not.toBe(undefined);
            expect(field!.fieldName).toBe(testField!.fieldName);
            expect(field!.dataType).toBe(testField!.dataType);
        }
    });
});