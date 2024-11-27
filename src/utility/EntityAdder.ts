import type { Types } from "mongoose";
import type { IBasicItem } from "../models/basicItem";
import type { ITemplate } from "../models/template";

export class EntityAdder {
    ip = process.env.IP;

    addEntities(entities: ITemplate[] | IBasicItem[], map?: Map<Types.ObjectId, IBasicItem>) {
        let firstEnt = entities[0];
        if (firstEnt['_id'] == undefined) { // TODO: check to see if undefined works
            // we have a template
            this.addTemplates(entities as ITemplate[]);
        } else {
            // we have an item
            this.addItems(entities as IBasicItem[], map!);
        }
    }

    addItems(items: IBasicItem[], map: Map<Types.ObjectId, IBasicItem>) {
        items.forEach((item) => {
            this.callAddItem(item).then((ret) => {
                const itemJSON = JSON.parse(ret.toString());
                const containedItems = item.containedItems;
                if (containedItems != undefined && containedItems != null && containedItems.length !== 0) {
                    // we have contained Items.
                    const subItemsToAdd = containedItems.map(id => map.get(id)).filter(ele => ele !== undefined); // TODO: while should be impossible, determine if should check for unknown here
                    const parentID = itemJSON['_id'];
                    this.addItemsHelper(subItemsToAdd, map, parentID);
                }
            });
        })
    }

    addItemsHelper(items: IBasicItem[], map: Map<Types.ObjectId, IBasicItem>, parentID: Types.ObjectId) {
        items.forEach((item) => {
            item.parentItem = parentID;
            this.callAddItem(item).then((ret) => {
                const itemJSON = JSON.parse(ret.toString());
                const containedItems = item.containedItems;
                if (containedItems != undefined && containedItems != null && containedItems.length !== 0) {
                    // we have contained Items.
                    const subItemsToAdd = containedItems.map(id => map.get(id)).filter(ele => ele !== undefined); // TODO: while should be impossible, determine if should check for unknown here
                    const parentID = itemJSON['_id'];
                    this.addItemsHelper(subItemsToAdd, map, parentID);
                } else {
                    return;
                }
            });
        })
    }

    addTemplates(templates: ITemplate[]) {
        templates.forEach(async (template) => {
            // add template
            let templateString = JSON.stringify(template);
            try {
                const response = await fetch(`http://${this.ip}/api/templates/createTemplate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(templateString),
                });
                const data = await response.json();
                console.log('Item created:', data);
            } catch (err) {
                console.error('Error creating item:', err);
            }
        });
    }

    async callAddItem(item: IBasicItem): Promise<String> {
        const name = item.name;
        const description = item.description;
        const promise = fetch(`http://${this.ip}/api/items/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, tags: null, containedItems: [] }), // TODO: wait for this to be redone to have parentID
        });
        return await promise.then((res) => {
            const data = res.json();
            console.log('Item created:', data);
            return data;
        })//.catch((err) => {
        //     console.log(err);
        //     return err.toString();
        // });
    }
}