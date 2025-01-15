import { Schema, model, Document, Types } from 'mongoose';

export interface IRecentItems extends Document {
  type: 'item' | 'template' | 'customField';
  recentIds: Types.ObjectId[];
  maxItems: number;
}

const RecentItemsSchema = new Schema({
    type: { 
      type: String, 
      required: true, 
      enum: ['item', 'template', 'customField'],
    },
    recentIds: [{
      type: Schema.Types.ObjectId,
      ref: function(this: { type: 'item' | 'template' | 'customField' }) {
        switch(this.type) {
          case 'item': return 'BasicItem';
          case 'template': return 'Template';
          case 'customField': return 'CustomField';
        }
      }
    }],
    maxItems: { type: Number, default: 5 }
  }, { collection: 'recents' });

export const addToRecents = async (type: 'item' | 'template' | 'customField', id: Types.ObjectId) => {
  try {
    let recents = await RecentItems.findOne({ type });
    if (!recents) {
      recents = await RecentItems.create({ type, recentIds: [], maxItems: 5 });
    }

    recents.recentIds = [
      id,
      ...recents.recentIds.filter((existingId: Types.ObjectId) => !existingId.equals(id))
    ].slice(0, recents.maxItems);

    await recents.save();
    return recents;
  } catch (err) {
    console.error(`Failed to add recent ${type} with ID ${id}:`, err);
    // Don't throw, just log
  }
};

export const removeFromRecents = async (type: 'item' | 'template' | 'customField', id: Types.ObjectId) => {
  try {
    const recents = await RecentItems.findOne({ type });
    if (recents) {
      recents.recentIds = recents.recentIds.filter(
        (existingId: Types.ObjectId) => !existingId.equals(id)
      );
      await recents.save();
    }
  } catch (err) {
    console.error('Failed to remove from recents:', err);
  }
};

export const RecentItems = model<IRecentItems>('RecentItems', RecentItemsSchema);