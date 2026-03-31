import type { Document } from "mongoose";
import mongoose, { Types } from "mongoose";
import { addToRecents, removeFromRecents } from './recentItems.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { Schema, model, models } = mongoose;

export interface ICustomField extends Document {
  fieldName: string;
  dataType: string;
  createdAt: Date;
}

const CustomFieldSchema = new Schema<ICustomField>({
	fieldName: { type: String, required: true },
	dataType: { 
		type: String, 
		required: true,
		enum: ['string', 'number', 'boolean', 'date', 'item'] 
	},
	createdAt: { type: Date, default: Date.now },
});

CustomFieldSchema.post('save', async function() {
	await addToRecents('customField', this._id as Types.ObjectId);
});

CustomFieldSchema.pre('findOneAndDelete', async function () {
	const fieldId = this.getQuery()._id;
	if (!fieldId) return;

	try {
		await removeFromRecents('customField', fieldId);
	} catch (err) {
		console.error('Error in pre-delete hook:', err);
		throw err;
	}
});

const CustomField = mongoose.models.CustomField || model<ICustomField>('CustomField', CustomFieldSchema);
export default CustomField
