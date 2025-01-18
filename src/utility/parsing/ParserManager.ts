// import type {ITemplatePopulated } from "../../models/template.js";
import { CSVTemplateParser } from "./CSVTemplateParser.js";
import { CSVPreProcessor } from "../CSVPreProcessor.js";
import { EntityAdder } from "../EntityAdder.js";
// import { ip } from '../../stores/ipStore.js';
import { CSVItemParserPopulated } from "./CSVItemParserPopulated.js";
import type { Types } from "mongoose";

export class ParserManager {

    async parseFromFiles(data: string[]) {
        const adder = new EntityAdder();
        const templateParser = new CSVTemplateParser();
        let itemData = "";
        for (var i=0; i < data.length; i++) {
            const contents = data[i]
            if (templateParser.canParse(CSVPreProcessor.getColumns(contents))) {
                templateParser.parse(contents);
                let templates = templateParser.templatesToAdd;
                let customFields = templateParser.customFieldMap;
                let idMap = await adder.addCustomFields(customFields);
                templates.map((template) => {template.fields = template.fields.map((id) => {return idMap.get(id)!})});
                await adder.addTemplates(templates);
            } else {
                itemData = contents;
            }
        }

        if (itemData !== "" ) {
            // get existing templates ==> will be populated
            // const responseT = await fetch(new Request(`/controllers/templateController.ts/getTemplates`), {
            //     method: 'GET',
            //     headers: { 'Content-Type': 'application/json' },
            // });
            // if (!responseT.ok) throw new Error('Failed to fetch templates');
            // let templates = []
            // const dataT = await responseT.json();
            // templates = dataT as ITemplatePopulated[];

            const contents = itemData;
            const itemParser = new CSVItemParserPopulated([]);//templates);
            itemParser.parse(contents);
            let customFields = itemParser.customFieldMap;
            let idMap = await adder.addCustomFields(customFields);
            console.log(idMap.size);
            console.log(idMap.keys().next());
            adder.addItems(itemParser.itemTree, itemParser.itemMap, idMap);        
        }
    }
}