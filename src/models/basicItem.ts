import { Schema, model, Document, Types } from 'mongoose';
import type { ICustomField } from './customField';
//import Template from './template';

export interface IBasicItem extends Document { //we can add more stuff here
  _id: Types.ObjectId;//we need this underscore i think
  name: string;
  description: string;
  tags: string[];
  containedItems?: Array<Types.ObjectId>;//for nested items
  parentItem?: Types.ObjectId | null;
  templateName?: string;
  customFields?: {
    field: Types.ObjectId;
    value: unknown;
  }[];
  itemHistory: {
    location: Types.ObjectId | null;
    timestamp: Date;
  }[];
}

export interface IBasicItemPopulated {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  tags: string[];
  containedItems?: Array<IBasicItem>;
  parentItem?: IBasicItem | null;
  templateName?: string;
  customFields?: Array<{
    field: ICustomField;
    value: unknown;
  }>;
  itemHistory?: Array<{
    location: IBasicItem;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

  const BasicItemSchema: Schema = new Schema({
    //id: { type: Number, unique: true }, //we dont need this because mongodb default _id works
    name: { type: String, required: true },
    description: { type: String, required: false },
    // createdAt: { type: Date, required: true },
    // updatedAt: { type: Date, required: true }, 
    tags: { type: [String] },
    containedItems: [{ type: Schema.Types.ObjectId, ref: 'BasicItem'}],
    parentItem: { type: Schema.Types.ObjectId, ref: 'BasicItem', required: false},
    templateName: {type: String, required: false},
    customFields: [
      {
        field: {type: Schema.Types.ObjectId, ref: "CustomField", required: true },
        value: Schema.Types.Mixed,
      },
    ],
    itemHistory: [
      {
        location: {type: Schema.Types.ObjectId, ref: 'BasicItem', required: false},
        timestamp: {type: Date, required: true},
      },
    ],
    //it shouldnt be a problem that ObjectId is not our already existing id feild
  }, 
    {   
      timestamps: true, //this should mean we dont need to state createdAt and updatedAt feilds
      strict: false,
  }
);

//handles item update stuff and keeping parent containers in check
BasicItemSchema.pre('save', async function (next) {
  const item = this as unknown as IBasicItem;

  const BasicItem = model<IBasicItem>('BasicItem');

  // Handle new items or items with modified parentItem
  if (item.isNew || item.isModified('parentItem')) {
    // For existing items, remove from the old parent's containedItems
    if (!item.isNew) {
      const previousItem = await BasicItem.findById(item._id);
      if (previousItem && previousItem.parentItem) {
        const oldParent = await BasicItem.findById(previousItem.parentItem);
        if (oldParent) {
          oldParent.containedItems = oldParent.containedItems?.filter(
            (containedId) => !containedId.equals(item._id)
          ) || [];
          await oldParent.save();
        }
      }
    }

    if (item.parentItem) {
      const newParent = await BasicItem.findById(item.parentItem);
      if (newParent) {
        if (!newParent.containedItems?.includes(item._id)) {
          newParent.containedItems = [...(newParent.containedItems || []), item._id];
          await newParent.save();
        }
      }
    }

    item.itemHistory = item.itemHistory || [];
    item.itemHistory.push({
      location: item.parentItem || null,
      timestamp: new Date(),
    });
  }

  next();
});

  const BasicItem = model<IBasicItem>('BasicItem', BasicItemSchema);
  
  export default BasicItem;