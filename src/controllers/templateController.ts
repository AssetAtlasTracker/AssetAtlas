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