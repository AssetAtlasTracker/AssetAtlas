import type { Request, Response } from 'express';
import Fuse from 'fuse.js';
import Template from '../models/template.js';
import CustomField from '../models/customField.js';
import mongoose from 'mongoose';

export const createTemplate = async (req: Request, res: Response) => {
  const { name, fields } = req.body;

  if (!name || !fields) {
    return res.status(400).json({ message: 'must have a name and fields' });
  }

  try {
    const newTemplate = new Template({ name, fields });
    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Failed to create template', error });
  }
};

export const getTemplates = async (req: Request, res: Response) => {
  try {
    // Fetch all templates and populate the fields
    const templates = await Template.find().populate('fields').exec();
    res.status(200).json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates', error });
  }
};

export const getFields = async (req: Request, res: Response) => {
  try {
    const { templateName } = req.params;

    // Find the template by its name and populate fields
    const template = await Template.findOne({ name: templateName }).populate('fields').exec();

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(200).json({ fields: template.fields });
  } catch (err) {
    console.error('Error retrieving template fields:', err);
    res.status(500).json({ message: 'Error retrieving template fields', error: err });
  }
};

export const searchTemplates = async (req: Request, res: Response) => {
  const templateName = req.query.name as string;

  try {
    const templates = await Template.find().populate('fields').exec();

    if (templateName) {
      const fuse = new Fuse(templates, {
        keys: ['name'], //Field to search in
        threshold: 0.3, //How fuzzy the search is
      });

      const fuzzyResults = fuse.search(templateName);
      const resultTemplates = fuzzyResults.map(result => result.item);

      res.status(200).json(resultTemplates);
    } else {
      res.status(200).json(templates);
    }
  } catch (error) {
    console.error('Error during template search:', error);
    res.status(500).json({ error: 'Failed to search templates' });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid template ID' });
  }

  try {
    const template = await Template.findById(id).populate('fields').exec();
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(200).json(template);
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    res.status(500).json({ message: 'Failed to fetch template', error });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid template ID' });
  }

  try {
    const template = await Template.findByIdAndDelete(id).exec();
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Failed to delete template', error });
  }
};