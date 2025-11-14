import mongoose, { Schema, model, models, Document, Types, type CallbackError } from "mongoose";
import { addToRecents, removeFromRecents } from './recentItems.js';

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
		enum: ['string', 'number', 'boolean', 'date'] 
	},
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

const CustomField = mongoose.models.CustomField || model<ICustomField>('CustomField', CustomFieldSchema);
export default CustomField