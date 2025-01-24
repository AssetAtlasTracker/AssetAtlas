import type { Request, Response, Express } from 'express';
import mongoose from 'mongoose';
import BasicItem from '../models/basicItem.js';
import type { IBasicItemPopulated } from '../models/basicItem.js';
import Fuse from 'fuse.js';

// Add interface for GridFS file
interface GridFSFile extends Express.Multer.File {
  id?: string;
  _id?: string;
  filename: string;
  metadata?: {
    originalname: string;
    mimetype: string;
  };
}

import '../config/gridfs.js';

export const createItem = async (req: Request, res: Response) => {
  try {
    // Parse JSON strings first
    if (typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }
    if (typeof req.body.customFields === 'string') {
      const parsedFields = JSON.parse(req.body.customFields);
      req.body.customFields = Array.isArray(parsedFields) ? parsedFields : [];
    }

    const itemData = { ...req.body };

    // Handle file with proper typing
    if (req.file) {
      const gridFSFile = req.file as GridFSFile;
      console.log('File received:', {
        fieldname: gridFSFile.fieldname,
        filename: gridFSFile.filename,
        id: gridFSFile.id,
        _id: gridFSFile._id
      });
      
      // Use ID from either property, fallback to filename
      itemData.image = gridFSFile.id || gridFSFile._id || gridFSFile.filename;
    }

    console.log('Creating item with data:', itemData);
    const newItem = new BasicItem(itemData);
    const savedItem = await newItem.save();
    
    res.status(201).json(savedItem);
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ 
      message: 'Error creating item', 
      error: err instanceof Error ? err.message : String(err)
    });
  }
};

export const getItemById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Not a valid MongoDB ID" });
  }

  try {
    console.log('Fetching item:', id);
    const item = await BasicItem.findById(id)
      .populate('template')
      .populate('parentItem')
      .populate('homeItem')
      .populate('containedItems')
      .populate('customFields.field')
      .populate('itemHistory.location')
      .populate({
        path: 'image',
        model: 'uploads.files'
      })
      .exec();
    
    console.log('Found item:', JSON.stringify(item, null, 2));
    if (item) {
      res.status(200).json(item);
    } else {
      res.status(404).json({ message: 'Cannot get: Item not found' });
    }
  } catch (err) {
    console.error('Error in getItemById:', err);
    res.status(500).json({ message: 'Error fetching item', error: err });
  }
};

export const deleteItemById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Not a valid MongoDB ID' });
  }

  try {
    const item = await BasicItem.findOneAndDelete({ _id: id });
    if (item) {
      return res.status(200).json({ message: 'Item deleted successfully', item });
    } else {
      res.status(404).json({ message: 'Cannot delete: Item not found' });
    }
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: 'Error deleting item', error: err });
  }
};

function sortItems(items: IBasicItemPopulated[], sortOption: string): IBasicItemPopulated[] {
  return [...items].sort((a, b) => {
    switch (sortOption) {
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'firstAdded':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'lastAdded':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

export const searchItems = async (req: Request, res: Response) => {
  const { name, sort = 'alphabetical', exact } = req.query;

  try {
    const items = await BasicItem.find({})
      .populate('parentItem', 'name')
      .populate('containedItems', 'name')
      .lean<IBasicItemPopulated[]>()
      .exec();

    // If no query, return all items directly
    if (!name || typeof name !== 'string' || name.trim() === '') {
      const sortedItems = sortItems(items, sort as string);
      return res.status(200).json(sortedItems);
    }

    const fuse = new Fuse(items, {
      keys: ['name'],
      threshold: exact === 'true' ? 0 : 0.3,
      findAllMatches: exact !== 'true',
      location: 0,
      distance: exact === 'true' ? 0 : 100
    });

    const fuzzyResults = fuse.search(name);
    let resultItems = fuzzyResults.map(r => r.item);

    if (resultItems.length === 0) {
      // Fallback to all if no match
      resultItems = items; 
    }

    const sortedItems = sortItems(resultItems, sort as string);
    res.status(200).json(sortedItems);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
};

export const getAllContainedById = async (req: Request, res: Response) => {
  try {
    const { parentID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(parentID)) {
      return res.status(400).json({ message: 'Not a valid MongoDB ID' });
    }

    const parentItem = await BasicItem.findById(parentID).populate('containedItems').exec();

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

export const updateItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Not a valid MongoDB ID' });
  }

  try {
    const item = await BasicItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    //Apply updates and save (pre-save hook will handle history)
    Object.assign(item, updates);
    const savedItem = await item.save();
    
    res.status(200).json(savedItem);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ message: 'Error updating item', error: err });
  }
};

//this method does not populate fields. keeping it like that for now because i want to. 
//if something you wrote is using this and not working how you expect it that is probably why
export const getParentChain = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const chain = [];
    let currentItem = await BasicItem.findById(id).exec();
    if (!currentItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    while (currentItem) {
      chain.unshift(currentItem);
      currentItem = currentItem.parentItem
        ? await BasicItem.findById(currentItem.parentItem).exec()
        : null;
    }
    res.status(200).json(chain);
  } catch (error) {
    console.error('Error fetching parent chain:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getItemTree = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    interface TreeItem {
      _id: mongoose.Types.ObjectId;
      name: string;
      description?: string;
      children: TreeItem[];
      hasChildren: boolean;
    }

    const getItemChildren = async (parentId: mongoose.Types.ObjectId | null): Promise<TreeItem[]> => {
      const query = parentId ? { parentItem: parentId } : { parentItem: null };
      const items = await BasicItem.find(query)
        .select('name description _id')
        .lean();

      return Promise.all(items.map(async (item) => {
        const childCount = await BasicItem.countDocuments({ parentItem: item._id });
        return {
          ...item,
          children: [],
          hasChildren: childCount > 0
        };
      }));
    };

    //If no ID or empty string return root items
    if (!id || id.trim() === '') {
      const tree = await getItemChildren(null);
      return res.json(tree);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const root = await BasicItem.findById(id).select('name description _id').lean();
    if (!root) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const children = await getItemChildren(root._id);
    const childCount = await BasicItem.countDocuments({ parentItem: root._id });
    return res.json({ ...root, children, hasChildren: childCount > 0 });

  } catch (err) {
    res.status(500).json({ message: 'Error generating tree', error: err });
  }
};