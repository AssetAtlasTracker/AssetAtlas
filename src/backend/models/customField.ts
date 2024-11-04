import { Schema, model, Document, Types } from "mongoose";

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

const CustomField = model<ICustomField>("CustomField", CustomFieldSchema);
export default CustomField