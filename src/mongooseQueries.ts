import BasicItem from './models/basicItem.js';
import type {IBasicItem} from './models/basicItem.js';
import CustomField from './models/customField.js';

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
            .exec();
      
          console.log('Item fetched successfully:', item); // Check the output
          return item;
        } catch (error) {
          console.error('Error in mongooseQueries.getItemById:', error); // Log the error
          throw error; // Re-throw the error so the controller catches it
        }
      };
    
    export const deleteItemById = async (id: string) => {
        return await BasicItem.findByIdAndDelete(id);
    }

    export const searchItemsByName = async (searchTerm: string) => {
        return await BasicItem.find({
          name: { $regex: searchTerm, $options: 'i' }//case-insensitive
        }).populate('containedItems').exec();
      };

    export default {
        createItem,
        getItemById,
        deleteItemById,
        searchItemsByName,
    }