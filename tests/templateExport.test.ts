import {test} from "../src/utility"
import Template from "../src/models/template";

const resources = test();
const CSVFormatter = resources.formatter;


describe("Testing Template Formatting", () => {

    it("Should format one template", async () => {
        let firstTemplate = new Template();
        firstTemplate.name = "first";
        firstTemplate.fields.push({key: "name", valueType: "string"});
        firstTemplate.fields.push({key: "amount", valueType: "number"});
        firstTemplate.fields.push({key: "edible", valueType: "boolean"});


        const csvContent = `template name\nfirst,name,amount,edible\n,string,number,boolean`;
        const formatter = new CSVFormatter();
        const str = formatter.formatTemplates([firstTemplate]);
        expect(str === csvContent);
    });

});
