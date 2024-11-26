import {CSVTemplateParser} from "../src/utility"
import Template, { ITemplate } from "../src/models/template";


describe("Testing Template Parsing", () => {

    it("Should make one template with all types of fields", async () => {
        const csvContent = `template name\nfirst,name,amount,edible\n,string,number,boolean`;

        const templateParser = new CSVTemplateParser();
        const canParse = templateParser.canParse(csvContent.split(/\n|\r/)[0].split(/,/));
        expect(canParse).toBeTruthy();
        templateParser.parse(csvContent);

        let firstTemplate = new Template();
        firstTemplate.name = "first";
        firstTemplate.fields.push({key: "name", valueType: "string"});
        firstTemplate.fields.push({key: "amount", valueType: "number"});
        firstTemplate.fields.push({key: "edible", valueType: "boolean"});


        const templateToTest = templateParser.templatesToAdd[0];
        expect(templateToTest.name).toBe(firstTemplate.name);
        for (var i = 0; i < templateToTest.fields.length; i++) {
            expect(templateToTest.fields[i].key).toBe(firstTemplate.fields[i].key);
            expect(templateToTest.fields[i].valueType).toBe(firstTemplate.fields[i].valueType);
        }
    });
});