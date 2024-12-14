import type { ITemplate } from "../../models/template";
import { CSVItemParser } from "./CSVItemParser";
import { CSVTemplateParser } from "./CSVTemplateParser";
//import { EntityAdder } from "../EntityAdder";
import { FileLoader } from "../file/FileLoader";

export class ParserManager {
    existingTemplates : ITemplate[] = [];

    constructor(existingTemplates: ITemplate[]) {
        this.existingTemplates = existingTemplates;
    }

    parseFromFile(itemPath: string, templatePath?: string) {
        // TODO: connect adder once done
        //const adder = new EntityAdder();
        if (templatePath !== undefined && templatePath.length !== 0) {
            const contents = FileLoader.readFile(templatePath);
            const templateParser = new CSVTemplateParser();
            templateParser.parse(contents);
            let templates = templateParser.templatesToAdd;
            this.existingTemplates.concat(templates);
            //adder.addTemplates(templates);
        }
        const contents = FileLoader.readFile(itemPath);
        const itemParser = new CSVItemParser(this.existingTemplates);
        itemParser.parse(contents);
        //adder.addItems(itemParser.itemTree, itemParser.itemMap);
    }

}