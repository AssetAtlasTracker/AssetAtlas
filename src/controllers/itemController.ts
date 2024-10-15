import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import mongooseQueries from '../mongooseQueries.js';
import BasicItem from '../models/basicItem.js';

export const createItem = async (req: Request, res: Response) => {
  const { name, description, tags } = req.body;
  try {
    console.log('Received request:', req.body);
    const newItem = await mongooseQueries.createItem(name, description, tags);
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