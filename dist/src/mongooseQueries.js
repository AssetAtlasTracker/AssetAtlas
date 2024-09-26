import BasicItem from './models/basicItem';
import mongoose from 'mongoose';
export const createItem = async (name, description, tags, containedItems) => {
    const newItem = new BasicItem({
        name,
        description,
        tags,
        containedItems: containedItems === null || containedItems === void 0 ? void 0 : containedItems.map(item => item._id)
    });
    return await newItem.save();
};
export const getItemById = async (id) => {
    return await BasicItem.findById(id)
        .populate('containedItems') // Populate referenced items
        .exec();
};
export const deleteItemById = async (id) => {
    return await BasicItem.findByIdAndDelete(id);
};
//# sourceMappingURL=mongooseQueries.js.map