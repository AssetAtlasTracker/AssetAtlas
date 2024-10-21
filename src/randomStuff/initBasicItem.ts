import Template from '../models/template.js';

export const initializeBasicItemTemplate = async () => {
    try {
      const existingTemplate = await Template.findOne({ name: 'BasicItem' }).exec();
  
      if (!existingTemplate) {
        // Define the default fields for BasicItem
        const basicItemFields = [
          { key: 'name', valueType: 'string' },
          { key: 'description', valueType: 'string' },
          { key: 'tags', valueType: 'array' },
          { key: 'containedItems', valueType: 'array' }
        ];
  
        const basicItemTemplate = new Template({
          name: 'BasicItem',
          fields: basicItemFields
        });
  
        await basicItemTemplate.save();
        console.log('BasicItem template initialized successfully');
      } else {
        console.log('BasicItem template already exists');
      }
    } catch (error) {
      console.error('Error initializing BasicItem template:', error);
    }
  };