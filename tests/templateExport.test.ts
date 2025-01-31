import Template, { ITemplatePopulated } from "../src/models/template";
import CustomField from "../src/models/customField";
import {describe, it, expect} from "vitest";
import { CSVFormatterPopulated } from "../src/utility/formating/CSVFormatterPopulated";

describe("Testing Template Formatting", () => {

    it("Should format one template", async () => {
        let firstTemplate = new Template() as unknown as ITemplatePopulated;
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

        firstTemplate.fields.push(nameField);
        firstTemplate.fields.push(amountField);
        firstTemplate.fields.push(edibleField);

        const csvContent = `template name\nfirst,name,amount,edible\n,string,number,boolean`;
        const formatter = new CSVFormatterPopulated([], [firstTemplate], []);
        const str = formatter.formatTemplates();
        expect(str).toBe(csvContent);
    });

});
