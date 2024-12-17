import type {ITemplatePopulated } from "../../models/template";
import { CSVItemParser } from "./CSVItemParser";
import { CSVTemplateParser } from "./CSVTemplateParser";
import { FileLoader } from "../file/FileLoader";
import { CSVPreProcessor } from "../CSVPreProcessor";
import { EntityAdder } from "../EntityAdder";
import { ip } from '../../stores/ipStore';
import { CSVItemParserPopulated } from "./CSVItemParserPopulated";

export class ParserManager {

    async parseFromFiles(paths: string[]) {
        const adder = new EntityAdder();
        // NOTE: assuming we have 2 paths at most
        const templateParser = new CSVTemplateParser();
        let itemPath = "";
        for (var path in paths) {
            const contents = FileLoader.readFile(path);
            if (templateParser.canParse(CSVPreProcessor.getColumns(contents))) {
                templateParser.parse(contents);
                let templates = templateParser.templatesToAdd;
                let customFields = templateParser.customFieldMap;
                let idMap = EntityAdder.addCustomFields(customFields);
                templates.map((template) => {template.fields = template.fields.map((id) => {return idMap.get(id)!})});
                EntityAdder.addTemplates(templates);
            } else {
                itemPath = path;
            }
        }

        if (itemPath !== "" ) {
            // get existing templates ==> will be populated
            const responseT = await fetch(`http://${ip}/api/templates/getTemplates`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!responseT.ok) throw new Error('Failed to fetch templates');
            let templates = []
            const dataT = await responseT.json();
            templates = dataT as ITemplatePopulated[];

            const contents = FileLoader.readFile(itemPath);
            const itemParser = new CSVItemParserPopulated(templates);
            itemParser.parse(contents);
            let itemTree = itemParser.itemTree;
            let itemMap = itemParser.itemMap;
            let customFields = itemParser.customFieldMap;
            let idMap = EntityAdder.addCustomFields(customFields);
            adder.addItems(itemParser.itemTree, itemParser.itemMap, idMap);        
        }
    }
}