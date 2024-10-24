import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import mongooseQueries from '../mongooseQueries.js';
import BasicItem from '../models/basicItem.js';

export const createItem = async (req: Request, res: Response) => {
  try {
    console.log('Received request:', req.body);
    const newItem = new BasicItem(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error details:', err);
    res.status(500).json({ message: 'Error creating item', error: err });
  }
};

export const getItemById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Not a valid MongoDB ID" });
  }

  try {
    const item = await mongooseQueries.getItemById(id);
    if (item) {
      res.status(200).json(item);
    } else {
      res.status(404).json({ message: 'Cannot get: Item not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching item', error: err });
  }
};

export const deleteItemById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Not a valid MongoDB ID" });
  }

  try {
    const item = await mongooseQueries.deleteItemById(id);
    if (item) {
      return res.status(200).json({ message: 'Item deleted successfully', item });
    } else {
      res.status(404).json({ message: 'Cannot delete: Item not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting item', error: err });
  }
};

export const searchItems = async (req: Request, res: Response) => {
  //const { name } = req.query;
  const name = req.query.name as string;
  const query = name ? { name: { $regex: name, $options: 'i' } } : {};

  try {
    const items = await BasicItem.find(query).exec();
    res.status(200).json(items);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
};

export const getAllContainedById = async (req: Request, res: Response) => {
  try {
    const { parentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ message: 'Not a valid MongoDB ID' });
    }

    const parentItem = await BasicItem.findById(parentId).populate('containedItems').exec();

    if (!parentItem) {
      return res.status(404).json({ message: 'Parent item not found' });
    }

    return res.status(200).json({ containedItems: parentItem.containedItems });
  } catch (error) {
    console.error('Error fetching contained items:', error);
    return res.status(500).json({ message: 'An error occurred while fetching contained items' });
  }
};

export const moveItem = async (req: Request, res: Response) => {
  try {
    const { itemId, newParentId } = req.body;

    if (!itemId || !newParentId) {
      return res.status(400).json({ error: 'itemId and newParentId are required' });
    }

    const item = await BasicItem.findById(itemId).exec();

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newParent = await BasicItem.findById(newParentId).exec();

    if (!newParent) {
      return res.status(404).json({ error: 'New parent item not found' });
    }

    item.parentItem = newParentId;

    //pre-save will handle the history and parent containers
    await item.save();

    return res.status(200).json({ message: 'Item moved successfully' });
  } catch (error) {
    console.error('Error moving item:', error);
    return res.status(500).json({ error: 'An error occurred while moving the item' });
  }
};

