import mongoose, { Types, Schema } from 'mongoose';
import type { Document, CallbackError } from 'mongoose';
const { model } = mongoose;
import BasicItem from './basicItem.js';
import type { ICustomField } from './customField.js';
import { addToRecents, removeFromRecents } from './recentItems.js';

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
		await removeFromRecents('template', templateId);
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

TemplateSchema.post('save', async function() {
	await addToRecents('template', this._id as Types.ObjectId);
});

const Template = mongoose.models.Template || model<ITemplate>('Template', TemplateSchema);
export default Template;