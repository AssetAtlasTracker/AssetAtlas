import type { IBasicItem } from "../models/basicItem";
import type { ITemplate } from "../models/template";
import { CSVItemParser } from "./CSVItemParser";
import { CSVTemplateParser } from "./CSVTemplateParser";
import { EntityAdder } from "./EntityAdder";
import { FileLoader } from "./FileLoader";

export class ParserManager {

    parseFromFile(itemPath: string, templatePath?: string) {
        // TODO: checkout FileReader and see if better/built in
        const adder = new EntityAdder();
        let templates : ITemplate[] = [];
        if (templatePath !== undefined && templatePath.length !== 0) {
            const contents = FileLoader.readFile(templatePath);
            const templateParser = new CSVTemplateParser();
            templateParser.parse(contents);
            templates = templateParser.templatesToAdd;
            adder.addTemplates(templates);
        }
        const contents = FileLoader.readFile(itemPath);
        const itemParser = new CSVItemParser(templates);
        itemParser.parse(contents);
        adder.addItems(itemParser.itemTree, itemParser.itemMap);
    }

}