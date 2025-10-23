import type { Request, Response } from 'express';
import Fuse from 'fuse.js';
import mongoose from 'mongoose';
import type { ICustomField } from '../models/customField.js';
import CustomField from '../models/customField.js';
import Template from '../models/template.js';

export const addCustomField = async (req: Request, res: Response) => {
  try {
    const { fieldName, dataType, templateId } = req.body;

    if (!fieldName || !dataType) {
      return res.status(400).json({ message: 'Field name and data type are required.' });
    }

    // Validate data type
    const validTypes = ['string', 'number', 'boolean', 'date'];
    if (!validTypes.includes(dataType)) {
      return res.status(400).json({
        message: `Invalid data type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Check if the field already exists
    const templateFields = await Template.findById(templateId).populate<{ fields: ICustomField[] }>('fields').exec();
    console.log(templateFields);
    if (templateFields?.fields.some((field) => field.fieldName === fieldName)) {
      return res.status(409).json({ message: 'Field with this name already exists in the template.' });
    }

    const newField = new CustomField({
      fieldName,
      dataType,
      createdAt: new Date(),
    });

    await newField.save();
    res.status(201).json(newField);
  } catch (err) {
    console.error('Error adding custom field:', err);
    res.status(500).json({ message: 'Error creating custom field', error: err });
  }
};

export const searchCustomFields = async (req: Request, res: Response) => {
  const fieldName = req.query.fieldName as string;

  try {
    const customFields = await CustomField.find({}).exec();

    if (fieldName) {
      const fuse = new Fuse(customFields, {
        keys: ['fieldName'],
        threshold: 0.3,
      });

      const fuzzyResults = fuse.search(fieldName);
      const resultFields = fuzzyResults.map(result => result.item);

      res.status(200).json(resultFields);
    } else {
      res.status(200).json(customFields);
    }
  } catch (error) {
    console.error('Error during custom field search:', error);
    res.status(500).json({ error: 'Failed to search custom fields' });
  }
};

export const getCustomFieldById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const field = await CustomField.findById(id).exec();
    if (!field) {
      return res.status(404).json({ message: 'Custom field not found' });
    }

    res.status(200).json(field);
  } catch (error) {
    console.error('Error fetching custom field by id:', error);
    res.status(500).json({ message: 'Failed to fetch custom field', error });
  }
};