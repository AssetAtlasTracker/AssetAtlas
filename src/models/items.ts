import mongoose, { Schema, Document } from 'mongoose';
import AutoIncrementFactory = require('mongoose-sequence');

const AutoIncrement = AutoIncrementFactory(mongoose);

export interface IBasicItem extends Document {
    ID: number;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
  }

  const BasicItemSchema: Schema = new Schema({
    ID: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    tags: { type: [String] }
  }, 
    {   timestamps: true,
        strict: true
  });

  BasicItemSchema.plugin(AutoIncrement, { inc_field: 'ID' });
  
  export default mongoose.model<IBasicItem>('BasicItem', BasicItemSchema);