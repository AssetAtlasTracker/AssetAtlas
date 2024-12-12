import { Schema, model, Document, Types } from 'mongoose';
import type { ICustomField } from './customField';

export interface ITemplate extends Document {
  name: string;
  fields: Types.ObjectId[];
}

export interface ITemplatePopulated extends Document {
  name: string;
  fields: ICustomField[];
}

const TemplateSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    fields: [{ type: Schema.Types.ObjectId, ref: 'CustomField', required: true }],
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Template = model<ITemplate>('Template', TemplateSchema);
export default Template;