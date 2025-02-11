import { Types } from "mongoose";
import type { IBasicItem } from "../models/basicItem.js";
import type { ITemplate } from "../models/template.js";
import type { ICustomField } from "../models/customField.js";
import CustomField from "../models/customField.js";
import BasicItem from "../models/basicItem.js";

export class EntityAdder {
    customFidMap = new Map<Types.ObjectId, Types.ObjectId>();

    async addCustomFields(fieldMap: Map<Types.ObjectId, ICustomField>) : Promise<Map<Types.ObjectId, Types.ObjectId>> {
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
                const newId = await newField.id as Types.ObjectId;
                this.customFidMap.set(key, newId);
            } else {
                const newId = await existingField.id as Types.ObjectId;
                this.customFidMap.set(key, newId);
            }
        }
        return this.customFidMap;
    }

    async addItems(items: IBasicItem[], map: Map<Types.ObjectId, IBasicItem>) {
        for (var i = 0; i < items.length; i++) {
            const item = items[i];
            const containedItems = item.containedItems;
            const newId = await this.callAddItem(item);
            if (containedItems != undefined && containedItems != null && containedItems.length !== 0) {
                // we have contained Items.
                const subItemsToAdd = containedItems.map(id => map.get(id.toHexString() as unknown as Types.ObjectId)!); // TODO: while should be impossible, determine if should check for unknown here
                if (subItemsToAdd.length > 0) {
                    await this.addItemsHelper(subItemsToAdd, map, newId);
                }
            }
        }
    }

    async addItemsHelper(items: IBasicItem[], map: Map<Types.ObjectId, IBasicItem>, parentID: Types.ObjectId) {
        for (var i = 0; i < items.length; i++) {
            const item = items[i];
            item.parentItem = parentID;
            const containedItems = item.containedItems;
            const newId = await this.callAddItem(item);
            if (containedItems != undefined && containedItems != null && containedItems.length !== 0) {
                // we have contained Items
                const subItemsToAdd = containedItems.map(id => map.get(id.toHexString() as unknown as Types.ObjectId)!); // TODO: while should be impossible, determine if should check for unknown here
                if (subItemsToAdd.length > 0) {
                    this.addItemsHelper(subItemsToAdd, map, newId);
                }
            }
        }
    }

    async addTemplates(templates: ITemplate[]) {
        for (var i = 0; i < templates.length; i++) {
            try {
                const template = templates[i];
                template.fields = template.fields?.map(field => this.customFidMap.get(field.toHexString() as unknown as Types.ObjectId)!);
                await template.save();
                console.log("Created Template: " + template);
            } catch (err) {
                throw Error('Error creating template:' + err);
            }
        }
    }

    async callAddItem(item: IBasicItem): Promise<Types.ObjectId> {
        const savedContained = item.containedItems;
        item.containedItems = undefined;
        item.customFields = item.customFields?.map(field => {return {field: this.customFidMap.get(field.field.toHexString() as unknown as Types.ObjectId)!, value: field.value}});
        const newItem = new BasicItem(item);
        await newItem.save();
        const id = (await newItem.id) as Types.ObjectId;
        item.containedItems = savedContained;
        console.log("Created Item with ID: " + id);
        return id;
    }
}