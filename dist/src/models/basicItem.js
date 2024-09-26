import mongoose, { Schema, model, Document, Types } from 'mongoose';
const BasicItemSchema = new Schema({
    //id: { type: Number, unique: true }, //we dont need this because mongodb default _id works
    name: { type: String, required: true },
    description: { type: String, required: false },
    // createdAt: { type: Date, required: true },
    // updatedAt: { type: Date, required: true }, 
    tags: { type: [String] },
    containedItems: [{ type: Schema.Types.ObjectId, ref: 'BasicItem' }]
    //it shouldnt be a problem that ObjectId is not our already existing id feild
}, { timestamps: true, //this should mean we dont need to state createdAt and updatedAt feilds
    strict: true
});
const BasicItem = model('BasicItem', BasicItemSchema);
export default BasicItem;
//# sourceMappingURL=basicItem.js.map