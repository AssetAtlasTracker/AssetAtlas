import {test} from "../src/utility"
import Template, { ITemplate } from "../src/models/template";
import { Types } from "mongoose";
import CustomField, { ICustomField } from "../src/models/customField";
import { IBasicItem } from "../src/models/basicItem";

const resources = test();
const CSVFormatter = resources.formatter;


describe("Testing Template Formatting", () => {

    it("Should format one template", async () => {
        let firstTemplate = new Template();
        firstTemplate.name = "first";
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

        let templateMap = new Map<Types.ObjectId, ITemplate>();
        templateMap.set(firstTemplate.id, firstTemplate);


        const csvContent = `template name\nfirst,name,amount,edible\n,string,number,boolean`;
        const formatter = new CSVFormatter(fieldMap, new Map<Types.ObjectId, IBasicItem>(), templateMap);
        const str = formatter.formatTemplates([firstTemplate]);
        expect(str === csvContent);
    });

});
