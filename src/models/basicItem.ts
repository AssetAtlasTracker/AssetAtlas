import { Schema, model, Document, Types, type CallbackError } from 'mongoose';
import type { ICustomField } from './customField';
import type { ITemplate } from './template';
//import Template from './template';

export interface IBasicItem extends Document { //we can add more stuff here
  _id: Types.ObjectId;//we need this underscore i think
  name: string;
  description: string;
  tags: string[];
  containedItems?: Array<Types.ObjectId>;//for nested items
  parentItem?: Types.ObjectId | null;
  homeItem?: Types.ObjectId | null;
  template?: Types.ObjectId | null;
  image?: Types.ObjectId;
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
  homeItem?: IBasicItem | null;
  template?: ITemplate | null;
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
  image?: {
    _id: Types.ObjectId;
    filename: string;
    contentType: string;
    length: number;
    chunkSize: number;
    uploadDate: Date;
    aliases: string[];
    metadata: Record<string, unknown>;
  };
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
    homeItem: { type: Schema.Types.ObjectId, ref: 'BasicItem', required: false},
    template: {type: Schema.Types.ObjectId, ref: "Template", required: false},
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
    image: { type: Schema.Types.ObjectId, ref: 'uploads.files', required: false },
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

//update parent of the children and contained items with the given item on item delete
BasicItemSchema.pre('findOneAndDelete', async function (next) {
  const itemId = this.getQuery()._id;
  if (!itemId) return next();

  const BasicItem = model<IBasicItem>('BasicItem');

  try {
    const itemToDelete = await BasicItem.findById(itemId).exec();
    if (!itemToDelete) return next();

    const { containedItems, parentItem } = itemToDelete;

    if (containedItems && containedItems.length > 0) {
      await BasicItem.updateMany(
        { _id: { $in: containedItems } },
        { $set: { parentItem: parentItem || null } }
      ).exec();

      if (parentItem) {
        const parent = await BasicItem.findById(parentItem).exec();
        if (parent) {
          parent.containedItems = [
            ...(parent.containedItems || []),
            ...containedItems.filter((nestedId) => !parent.containedItems?.includes(nestedId)),
          ];
          await parent.save();
        }
      }
    }

    if (parentItem) {
      const parent = await BasicItem.findById(parentItem).exec();
      if (parent && parent.containedItems) {
        parent.containedItems = parent.containedItems.filter(
          (childId) => !childId.equals(itemId)
        );
        await parent.save();
      }
    }

    await BasicItem.updateMany(
      { homeItem: itemId },
      { $set: { homeItem: null } }
    ).exec();

    next();
  } catch (err) {
    console.error('Error in pre-delete hook:', err);
    next(err as CallbackError);
  }
});

  const BasicItem = model<IBasicItem>('BasicItem', BasicItemSchema);
  
  export default BasicItem;