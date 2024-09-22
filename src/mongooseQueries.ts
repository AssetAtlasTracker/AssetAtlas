import BasicItem, { IBasicItem } from './models/basicItem';
import mongoose from 'mongoose';

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
        return await BasicItem.findById(id)
        .populate('containedItems') // Populate referenced items
        .exec();
    }

    export const deleteItemById = async (id: string) => {
        return await BasicItem.findByIdAndDelete(id);
    }