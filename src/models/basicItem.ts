import mongoose, { Schema, model, Document, Types } from 'mongoose';
//import AutoIncrementFactory = require('mongoose-sequence');
//const AutoIncrement = AutoIncrementFactory(mongoose);

export interface IBasicItem extends Document { //we can add more stuff here
    _id: Types.ObjectId;//we need this underscore i think
    name: string;
    description: string;
    // createdAt: Date;
    // updatedAt: Date;
    tags: string[];
    containedItems?: Types.ObjectId[];//for nested items
  }

  const BasicItemSchema: Schema = new Schema({
    //id: { type: Number, unique: true }, //we dont need this because mongodb default _id works
    name: { type: String, required: true },
    description: { type: String, required: false },
    // createdAt: { type: Date, required: true },
    // updatedAt: { type: Date, required: true }, 
    tags: { type: [String] },
    containedItems: [{ type: Schema.Types.ObjectId, ref: 'BasicItem' }]
    //it shouldnt be a problem that ObjectId is not our already existing id feild
  }, 
    {   timestamps: true, //this should mean we dont need to state createdAt and updatedAt feilds
        strict: true
  });

  const BasicItem = model<IBasicItem>('BasicItem', BasicItemSchema);
  
  export default BasicItem;