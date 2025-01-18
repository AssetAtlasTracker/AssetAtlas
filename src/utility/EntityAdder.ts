import { Types, type ObjectId } from "mongoose";
import type { IBasicItem } from "../models/basicItem.js";
import type { ITemplate } from "../models/template.js";
import type { ICustomField } from "../models/customField.js";
import CustomField from "../models/customField.js";
import BasicItem from "../models/basicItem.js";

export class EntityAdder {
    customFidMap = new Map<Types.ObjectId, Types.ObjectId>();

    async addCustomFields(fieldMap: Map<Types.ObjectId, ICustomField>) : Promise<Map<Types.ObjectId, Types.ObjectId>> {
        let idMap = new Map<Types.ObjectId, Types.ObjectId>();
        let keysIter = fieldMap.keys()
        for (var i = 0; i < fieldMap.size; i++) {
            const key = keysIter.next().value!;
            const value = fieldMap.get(key)!;
            const fieldName = value.fieldName;
            const dataType = value.dataType;

            const existingField = await CustomField.findOne({ fieldName }).exec();
            if (!existingField) {
                const newField = new CustomField({
                    fieldName,
                    dataType,
                    createdAt: new Date(),
                });
                await newField.save();
                //await until(() => {return newField.id.done});
                console.log(newField.id.done);
                const newId = await newField.id as Types.ObjectId;
                console.log("Adding New: " + key + ", " + newId);
                idMap.set(key, newId);
            } else {
                //await until(() => {return existingField.id.done});
                console.log(existingField.id.done);
                const newId = await existingField.id as Types.ObjectId;
                console.log("Adding Existing: " + key + ", " + newId);
                idMap.set(key, newId);
            }
        }
        this.customFidMap = idMap;
        return idMap;
    }

    addItems(items: IBasicItem[], map: Map<Types.ObjectId, IBasicItem>, customFIdMap: Map<Types.ObjectId, Types.ObjectId>) {
        this.customFidMap = customFIdMap;
        items.forEach((item) => {
            const containedItems = item.containedItems;
            console.log("H0" + containedItems);
            this.callAddItem(item).then((newId) => {
                console.log("H1" + containedItems);
                if (containedItems != undefined && containedItems != null && containedItems.length !== 0) {
                    console.log("H2");
                    // we have contained Items.
                    console.log(Array.from(map.keys()));
                    console.log(Array.from(map.values()));
                    const subItemsToAdd = containedItems.map(id => map.get(id.toHexString() as unknown as Types.ObjectId)!); // TODO: while should be impossible, determine if should check for unknown here
                    console.log("K" + subItemsToAdd);
                    console.log("K" + map.get(containedItems[0]));
                    console.log("H3");
                    this.addItemsHelper(subItemsToAdd, map, newId);
                    console.log("HEnd");
                }
            });
        });
    }

    addItemsHelper(items: IBasicItem[], map: Map<Types.ObjectId, IBasicItem>, parentID: Types.ObjectId) {
        console.log("H4");
        items.forEach((item) => {
            console.log("H5");
            item.parentItem = parentID as unknown as Types.ObjectId;
            console.log("H6");
            const containedItems = item.containedItems;
            console.log("H7");
            this.callAddItem(item).then((newId) => {
                console.log("H8");
                console.log(containedItems);
                console.log(newId);
                if (containedItems != undefined && containedItems != null && containedItems.length !== 0) {
                    console.log("H9");
                    // we have contained Items
                    const subItemsToAdd = containedItems.map(id => map.get(id)!); // TODO: while should be impossible, determine if should check for unknown here
                    console.log("H10");
                    const parentID = newId;
                    console.log("H11");
                    this.addItemsHelper(subItemsToAdd, map, parentID);
                    console.log("H12");
                } else {
                    return;
                }
            });
        });
    }

    async addTemplates(templates: ITemplate[]) {
        for (var i = 0; i < templates.length; i++) {
            try {
                const template = templates[i];
                await template.save();
                console.log("Created Template: " + template);
            } catch (err) {
                console.error('Error creating template:', err);
            }
        }
    }

    async callAddItem(item: IBasicItem): Promise<Types.ObjectId> {
        console.log("HInCall");
        const savedContainedItems = item.containedItems;
        item.containedItems = undefined;

        console.log("1: Custom Fields Ids: " + item.customFields?.map(ele => {return ele.field}));
        console.log("Keys: " + Array.from(this.customFidMap.keys()));
        console.log("Values: " + Array.from(this.customFidMap.values()));
        const correctIds = item.customFields?.map(ele => {return this.customFidMap.get(ele.field)});
        console.log("2: Correct Ids: " + correctIds);
        item.customFields = item.customFields?.map(field => {return {field: this.customFidMap.get(field.field.toHexString() as unknown as Types.ObjectId)!, value: field.value}});

        console.log(item);
        const newItem = new BasicItem(item);
        await newItem.save();
        const id = (await newItem.id) as Types.ObjectId;
        console.log("Created Item with ID: " + id);
        item.containedItems = savedContainedItems;
        return id;
    }
}