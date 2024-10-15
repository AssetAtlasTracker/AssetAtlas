import mongoose, { Schema, model, Document, Types } from 'mongoose';
//import AutoIncrementFactory = require('mongoose-sequence');
//const AutoIncrement = AutoIncrementFactory(mongoose);

export interface ITemplate extends Document {
  name: string;
  fields: {key: string; valueType: string}[];
}

const TemplateSchema: Schema = new Schema({
  name: {type: String, required: true, unique: true},
  fields: [
    {
      key: {type: String, required: true},
      valueType: {type: String, required: true},
    },
  ],
});

const Template = model<ITemplate>('Template', TemplateSchema);

export default Template;