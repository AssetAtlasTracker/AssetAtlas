import type { Request, Response } from 'express';

import Template from '../models/template.js';

export const createTemplate = async (req: Request, res: Response) => {
    const { name, fields } = req.body;

    if (!name || !fields) {
      return res.status(400).json({ message: 'must have a name and feild' });
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
      const templates = await Template.find().exec();
      res.status(200).json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates', error });
    }
  };

  export const getFields = async (req: Request, res: Response) => {
    try {
      const { templateName } = req.params;
  
      // Find the template by its name
      const template = await Template.findOne({ name: templateName }).exec();
  
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
  
      // Return the custom fields of the found template
      res.status(200).json({ fields: template.fields });
    } catch (err) {
      console.error('Error retrieving template fields:', err);
      res.status(500).json({ message: 'Error retrieving template fields', error: err });
    }
  };