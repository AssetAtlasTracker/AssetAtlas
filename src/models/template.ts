import { Schema, model, Document, Types, type CallbackError } from 'mongoose';
import BasicItem from './basicItem.js';
import type { ICustomField } from './customField';

export interface ITemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  fields: Types.ObjectId[];
}

export interface ITemplatePopulated extends Document {
  _id: Types.ObjectId;
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

TemplateSchema.pre('findOneAndDelete', async function (next) {
  const templateId = this.getQuery()._id;
  if (!templateId) return next();

  try {
    //update items that use the template being deleted
    await BasicItem.updateMany(
      { template: templateId },
      { $unset: { template: "" } }
    ).exec();

    next();
  } catch (err) {
    console.error('Error in pre-delete hook for template:', err);
    next(err as CallbackError);
  }
});

const Template = model<ITemplate>('Template', TemplateSchema);
export default Template;