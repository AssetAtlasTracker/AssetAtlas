import BasicItem from './models/basicItem.js';
import type { IBasicItem, IBasicItemPopulated } from './models/basicItem.js';

//import mongoose from 'mongoose';

export const createItem = async (name: string, description: string,
  tags: string[], containedItems?: IBasicItem[]) => {
  const newItem = new BasicItem({
    name,
    description,
    tags,
    containedItems: containedItems?.map(item => item._id)
  });

  return await newItem.save();
}

export const getItemById = async (id: string) => {
  try {
    console.log('Fetching item with ID:', id);

    const item = await BasicItem.findById(id)
      .populate('containedItems') // Populate referenced items
      .populate('customFields.field')
      .populate('parentItem')
      .populate('itemHistory.location')
      .exec();

    console.log('Item fetched successfully:', item); // Check the output
    return item as unknown as IBasicItemPopulated;
  } catch (error) {
    console.error('Error in mongooseQueries.getItemById:', error); // Log the error
    throw error; // Re-throw the error so the controller catches it
  }
};

export const deleteItemById = async (id: string) => {
  return await BasicItem.findByIdAndDelete(id);
}

export const searchItemsByName = async (searchTerm: string): Promise<IBasicItemPopulated[]> => {
  const items = await BasicItem.find({
    name: { $regex: searchTerm, $options: 'i' }, // Case-insensitive search
  })
    .populate('parentItem')
    .populate('containedItems')
    .lean<IBasicItemPopulated[]>()
    .exec();

  return items;
};

export default {
  createItem,
  getItemById,
  deleteItemById,
  searchItemsByName,
}