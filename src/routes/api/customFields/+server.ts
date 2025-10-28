import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import CustomField from '$lib/server/db/models/customField.js';
import Template from '$lib/server/db/models/template.js';
import type { ICustomField } from '$lib/server/db/models/customField.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { fieldName, dataType, templateId } = await request.json();

    if (!fieldName || !dataType) {
      return json({ 
        message: 'Field name and data type are required.' 
      }, { status: 400 });
    }

    // Validate data type
    const validTypes = ['string', 'number', 'boolean', 'date'];
    if (!validTypes.includes(dataType)) {
      return json({
        message: `Invalid data type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 });
    }

    // Check if the field already exists
    const templateFields = await Template.findById(templateId)
      .populate<{ fields: ICustomField[] }>('fields')
      .exec();
    
    console.log(templateFields);
    
    if (templateFields?.fields.some((field) => field.fieldName === fieldName)) {
      return json({ 
        message: 'Field with this name already exists in the template.' 
      }, { status: 409 });
    }

    const newField = new CustomField({
      fieldName,
      dataType,
      createdAt: new Date(),
    });

    await newField.save();
    
    return json(newField, { status: 201 });
  } catch (err) {
    console.error('Error adding custom field:', err);
    return json({ 
      message: 'Error creating custom field', 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};