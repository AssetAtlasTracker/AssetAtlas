import { Schema, model, Document, Types, type CallbackError } from "mongoose";
import { addToRecents, removeFromRecents } from './recentItems.js';

export interface ICustomField extends Document {
  fieldName: string;
  dataType: string; // You could define data types as needed, like 'string', 'number', etc.
  createdAt: Date;
}

const CustomFieldSchema = new Schema<ICustomField>({
  fieldName: { type: String, unique: true, required: true },
  dataType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

CustomFieldSchema.post('save', async function() {
  await addToRecents('customField', this._id as Types.ObjectId);
});

CustomFieldSchema.pre('findOneAndDelete', async function (next) {
  const fieldId = this.getQuery()._id;
  if (!fieldId) return next();

  try {
    await removeFromRecents('customField', fieldId);
    next();
  } catch (err) {
    console.error('Error in pre-delete hook:', err);
    next(err as CallbackError);
  }
});

const CustomField = model<ICustomField>('CustomField', CustomFieldSchema);
export default CustomField