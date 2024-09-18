import BasicItem, { IBasicItem } from './models/basicItem';

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

    export const getItemById = async (id: number) => {
        return await BasicItem.findOne({id}).populate('containedItems').populate('containedItems').exec();
        //the populate thing puts the actual sub items into the array of the item we are calling
    }

    export const deleteItemById = async (id: number) => {
        return await BasicItem.findOneAndDelete({id}).exec();
    }