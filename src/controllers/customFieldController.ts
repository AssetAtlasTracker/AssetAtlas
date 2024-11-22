import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import CustomField from '../models/customField.js';
import Fuse from 'fuse.js';

export const addCustomField = async (req: Request, res: Response) => {
    try {
      const { fieldName, dataType } = req.body;
  
      if (!fieldName || !dataType) {
        return res.status(400).json({ message: 'Field name and data type are required.' });
      }
  
      // Check if the field already exists
      const existingField = await CustomField.findOne({ fieldName }).exec();
      if (existingField) {
        return res.status(409).json({ message: 'Custom field with this name already exists.' });
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