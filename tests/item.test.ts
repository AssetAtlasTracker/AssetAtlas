import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import itemRouter from '../src/routes/itemRoutes.js';
import BasicItem from '../src/models/basicItem.js';
import customFieldRouter from '../src/routes/customFieldRoutes.js';
import CustomField from '../src/models/customField.js';
import TemplateRouter from '../src/routes/templateRoutes.js';
import Template from '../src/models/template.js';
import type { ICustomField } from '../src/models/customField.js';

let app: express.Application;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, { dbName: 'test' });

  app = express();
  app.use(express.json());
  app.use('/api/items', itemRouter);
  app.use('/api/customFields', customFieldRouter);
  app.use('/api/templates', TemplateRouter);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Clear the database before each test to ensure isolation
beforeEach(async () => {
  await BasicItem.deleteMany({});
  await CustomField.deleteMany({});
});

describe('Item API', () => {
  it('should create a new item', async () => {
    const itemData = {
      name: 'Test Item',
      description: 'A sample item for testing',
      tags: ['tag1', 'tag2']
    };

    const response = await request(app).post('/api/items').send(itemData);
    expect(response.status).toBe(201);
    expect(response.body.name).toBe(itemData.name);
    expect(response.body.tags).toHaveLength(2);

    const createdItem = await BasicItem.findOne({ name: 'Test Item' }).exec();
    expect(createdItem).not.toBeNull();
    expect(createdItem?.name).toBe(itemData.name);
  });

  it('should get an item by ID', async () => {
    const newItem = await BasicItem.create({ name: 'Test Item', description: 'A sample item for testing', tags: ['tag1'] });

    const response = await request(app).get(`/api/items/${newItem._id}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe(newItem.name);
  });

  it('should return 404 if item is not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/api/items/${nonExistentId}`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Cannot get: Item not found');
  });

  it('should delete an item by ID', async () => {
    const newItem = await BasicItem.create({ name: 'Test Item', description: 'A sample item for testing', tags: ['tag1'] });

    const response = await request(app).delete(`/api/items/${newItem._id}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Item deleted successfully');

    const deletedItem = await BasicItem.findById(newItem._id).exec();
    expect(deletedItem).toBeNull();
  });

  it('should search for items by name', async () => {
    await BasicItem.create({ name: 'Test Item 1', tags: ['tag1'] });
    await BasicItem.create({ name: 'Another Item', tags: ['tag2'] });

    const response = await request(app).get('/api/items/search?name=Test');
    expect(response.status).toBe(200);
    //console.log('Search results:', response.body);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0].name).toContain('Test');
  });

  it('should create an item, set another item as its container, move the item, and verify containedItems update', async () => {
    // Create the first item
    const parentItemData = {
      name: 'Parent Item',
      description: 'A container item',
      tags: ['parent']
    };
    const parentResponse = await request(app).post('/api/items').send(parentItemData);
    expect(parentResponse.status).toBe(201);
    const parentItem = parentResponse.body;

    //Create the second item and set the first item as its container
    const childItemData = {
      name: 'Child Item',
      description: 'An item to be contained',
      tags: ['child'],
      parentItem: parentItem._id
    };
    const childResponse = await request(app).post('/api/items').send(childItemData);
    expect(childResponse.status).toBe(201);
    const childItem = childResponse.body;

    //Verify the first item contains the second item
    const updatedParent = await BasicItem.findById(parentItem._id).exec();
    expect(updatedParent?.containedItems?.map(String)).toContain(childItem._id);

    //Create a third item to move the second item into
    const newParentItemData = {
      name: 'New Parent Item',
      description: 'A new container item',
      tags: ['newParent']
    };
    const newParentResponse = await request(app).post('/api/items').send(newParentItemData);
    expect(newParentResponse.status).toBe(201);
    const newParentItem = newParentResponse.body;

    //Move the second item into the third item
    const moveResponse = await request(app).post('/api/items/move').send({
      itemId: childItem._id,
      newParentId: newParentItem._id
    });
    expect(moveResponse.status).toBe(200);
    expect(moveResponse.body.message).toBe('Item moved successfully');

    //Verify the first item no longer contains the second item
    const oldParentAfterMove = await BasicItem.findById(parentItem._id).exec();
    expect(oldParentAfterMove?.containedItems?.map(String)).not.toContain(childItem._id);

    //Verify the new parent now contains the second item
    const newParentAfterMove = await BasicItem.findById(newParentItem._id).exec();
    expect(newParentAfterMove?.containedItems?.map(String)).toContain(childItem._id);

    //const response = 
    await request(app).get(`/api/items/${childItem._id}`);
  });

it('should get all contained items by parent ID', async () => {
    //Create the parent item
    const parentItemData = {
      name: 'Parent Item',
      description: 'A container item',
      tags: ['parent']
    };
    const parentResponse = await request(app).post('/api/items').send(parentItemData);
    expect(parentResponse.status).toBe(201);
    const parentItem = parentResponse.body;
  
    const childItemData1 = {
      name: 'Child Item 1',
      description: 'First child item',
      tags: ['child'],
      parentItem: parentItem._id
    };
    const childItemData2 = {
      name: 'Child Item 2',
      description: 'Second child item',
      tags: ['child'],
      parentItem: parentItem._id
    };
    //const childResponse1 = 
    await request(app).post('/api/items').send(childItemData1);
    //const childResponse2 = 
    await request(app).post('/api/items').send(childItemData2);
  
    // Get all contained items for the parent
    const response = await request(app).get(`/api/items/allContained/${parentItem._id}`);
    if (response.status !== 200) {
      console.error('Error response:', response.body, 'parentID:', parentItem._id.toString());
    }
    expect(response.status).toBe(200);
    expect(response.body.containedItems).toHaveLength(2);
    expect(response.body.containedItems.map(item => item.name)).toEqual(
      expect.arrayContaining(['Child Item 1', 'Child Item 2'])
    );
  });

  it('should move nested items to the parent container and remove deleted item from its parents contained items on deletion', async () => {
    // Create the top-level parent item
    const topLevelParentData = {
      name: 'Top-Level Parent',
      description: 'The top-level container',
      tags: ['topLevel']
    };
    const topLevelParentResponse = await request(app).post('/api/items').send(topLevelParentData);
    expect(topLevelParentResponse.status).toBe(201);
    const topLevelParent = topLevelParentResponse.body;
  
    // Create a middle-level item contained by the top-level parent
    const middleItemData = {
      name: 'Middle Item',
      description: 'A middle-level container',
      tags: ['middle'],
      parentItem: topLevelParent._id
    };
    const middleItemResponse = await request(app).post('/api/items').send(middleItemData);
    expect(middleItemResponse.status).toBe(201);
    const middleItem = middleItemResponse.body;
  
    const nestedItemData = {
      name: 'Nested Item',
      description: 'A deeply nested item',
      tags: ['nested'],
      parentItem: middleItem._id
    };
    const nestedItemResponse = await request(app).post('/api/items').send(nestedItemData);
    expect(nestedItemResponse.status).toBe(201);
    const nestedItem = nestedItemResponse.body;
  
    const deleteResponse = await request(app).delete(`/api/items/${middleItem._id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe('Item deleted successfully');
  
    const updatedNestedItem = await BasicItem.findById(nestedItem._id).exec();
    expect(updatedNestedItem).not.toBeNull();
    expect(updatedNestedItem?.parentItem?.toString()).toBe(topLevelParent._id.toString());
  
    const updatedTopLevelParent = await BasicItem.findById(topLevelParent._id).exec();
    expect(updatedTopLevelParent?.containedItems?.map(String)).not.toContain(middleItem._id);
  
    expect(updatedTopLevelParent?.containedItems?.map(String)).toContain(nestedItem._id);
  
    const deleteTopLevelResponse = await request(app).delete(`/api/items/${topLevelParent._id}`);
    expect(deleteTopLevelResponse.status).toBe(200);
    expect(deleteTopLevelResponse.body.message).toBe('Item deleted successfully');
  
    const updatedNestedItemAfterTopLevelDelete = await BasicItem.findById(nestedItem._id).exec();
    expect(updatedNestedItemAfterTopLevelDelete).not.toBeNull();
    expect(updatedNestedItemAfterTopLevelDelete?.parentItem).toBeNull();
  });
  
  it('should fetch the parent chain of an item', async () => {
    const topLevelParentData = {
      name: 'Top-Level Parent',
    };
    const topLevelParentResponse = await request(app).post('/api/items').send(topLevelParentData);
    expect(topLevelParentResponse.status).toBe(201);
    const topLevelParent = topLevelParentResponse.body;
  
    const middleItemData = {
      name: 'Middle Item',
      parentItem: topLevelParent._id
    };
    const middleItemResponse = await request(app).post('/api/items').send(middleItemData);
    expect(middleItemResponse.status).toBe(201);
    const middleItem = middleItemResponse.body;
  
    const nestedItemData = {
      name: 'Nested Item',
      parentItem: middleItem._id
    };
    const nestedItemResponse = await request(app).post('/api/items').send(nestedItemData);
    expect(nestedItemResponse.status).toBe(201);
    const nestedItem = nestedItemResponse.body;
  
    const response = await request(app).get(`/api/items/parentChain/${nestedItem._id}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body[2].name).toBe('Nested Item');
    expect(response.body[1].name).toBe('Middle Item');
    expect(response.body[0].name).toBe('Top-Level Parent');
  });

  it('should delete an item and unset its home item field in other items', async () => {
    const homeItemData = {
      name: 'Home Item',
      description: 'An item set as a home for others',
    };
    const homeItemResponse = await request(app).post('/api/items').send(homeItemData);
    expect(homeItemResponse.status).toBe(201);
    const homeItem = homeItemResponse.body;
  
    const itemWithHomeData = {
      name: 'Item with Home',
      description: 'An item with a home reference',
      homeItem: homeItem._id
    };
    const itemWithHomeResponse = await request(app).post('/api/items').send(itemWithHomeData);
    expect(itemWithHomeResponse.status).toBe(201);
    const itemWithHome = itemWithHomeResponse.body;
  
    const deleteResponse = await request(app).delete(`/api/items/${homeItem._id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe('Item deleted successfully');
  
    const updatedItemWithHome = await BasicItem.findById(itemWithHome._id).exec();
    expect(updatedItemWithHome).not.toBeNull();
    expect(updatedItemWithHome?.homeItem).toBeNull();
  });

});

describe('Item and Custom Field API', () => {
  it('should create custom fields, add them to an item, and verify', async () => {
    // Create custom fields
    const customFieldData1 = { fieldName: 'Warranty', dataType: 'string' };
    const customFieldResponse1 = await request(app).post('/api/customFields').send(customFieldData1);
    expect(customFieldResponse1.status).toBe(201);
    const customField1 = customFieldResponse1.body;

    const customFieldData2 = { fieldName: 'Price', dataType: 'number' };
    const customFieldResponse2 = await request(app).post('/api/customFields').send(customFieldData2);
    expect(customFieldResponse2.status).toBe(201);
    const customField2 = customFieldResponse2.body;

    // Create an item and add custom fields
    const itemData = {
      name: 'Test Item with Custom Fields',
      description: 'An item with custom fields',
      tags: ['tag1'],
      customFields: [
        { field: customField1._id, value: '2 years' },
        { field: customField2._id, value: 100.0 }
      ]
    };
    const itemResponse = await request(app).post('/api/items').send(itemData);
    expect(itemResponse.status).toBe(201);
    const createdItem = itemResponse.body;

    // Verify that the custom fields were saved in the item
    const fetchedItem = await BasicItem.findById(createdItem._id)
      .populate<{ customFields: { field: ICustomField; value: unknown }[] }>('customFields.field')
      .exec();
    expect(fetchedItem).not.toBeNull();
    expect(fetchedItem?.customFields).toHaveLength(2);

    // Access field names and values
    const fieldNames = fetchedItem?.customFields?.map(cf => (cf.field as ICustomField).fieldName);
    expect(fieldNames).toEqual(expect.arrayContaining(['Warranty', 'Price']));

    const fieldValues = fetchedItem?.customFields?.map(cf => cf.value);
    expect(fieldValues).toEqual(expect.arrayContaining(['2 years', 100.0]));
  });

  it('should create an item, add a custom field, and update the custom field', async () => {
    const customFieldData = { fieldName: 'Warranty', dataType: 'string' };
    const customFieldResponse = await request(app).post('/api/customFields').send(customFieldData);
    expect(customFieldResponse.status).toBe(201);
    const customField = customFieldResponse.body;
  
    const itemData = {
      name: 'Test Item with Custom Field',
      description: 'An item to test custom fields',
      tags: ['tag1'],
      customFields: [
        { field: customField._id, value: '1 year' }
      ]
    };
    const createResponse = await request(app).post('/api/items').send(itemData);
    expect(createResponse.status).toBe(201);
    const createdItem = createResponse.body;
  
    const updatedCustomFields = [
      { field: customField._id, value: '2 years' }
    ];
    const updateResponse = await request(app)
      .patch(`/api/items/${createdItem._id}`)
      .send({ customFields: updatedCustomFields });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.customFields[0].value).toBe('2 years');
  
    const updatedItem = await BasicItem.findById(createdItem._id).exec();
    expect(updatedItem?.customFields).toHaveLength(1);
    expect(updatedItem?.customFields![0].value).toBe('2 years');
  });
});

describe('Item and Template API', () => {
  it('should delete a used template and ensure the item has it removed', async () => {
    const customField = await CustomField.create({ fieldName: 'field1', dataType: 'string' });

    const template = await Template.create({ name: 'Testy', fields: [customField._id] });

    const itemData = {
      name: 'Test Item',
      description: 'An item using a template',
      template: template._id,
    };
    const itemResponse = await request(app).post('/api/items').send(itemData);
    expect(itemResponse.status).toBe(201);
    const createdItem = itemResponse.body;

    const deleteResponse = await request(app).delete(`/api/templates/${template._id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe('Template deleted successfully');

    const updatedItem = await BasicItem.findById(createdItem._id).exec();
    expect(updatedItem).not.toBeNull();
    expect(updatedItem?.template).toBeUndefined();
  });

  it('should edit a template and update items with new custom fields', async () => {
    const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
    const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });
    const customField3 = await CustomField.create({ fieldName: 'field3', dataType: 'boolean' });

    const template = await Template.create({ name: 'Original Template', fields: [customField1._id, customField2._id] });

    const itemData = {
      name: 'Test Item',
      description: 'An item using a template',
      template: template._id,
      customFields: [
        { field: customField1._id, value: 'value1' },
        { field: customField2._id, value: 123 }
      ]
    };
    const itemResponse = await request(app).post('/api/items').send(itemData);
    expect(itemResponse.status).toBe(201);
    const createdItem = itemResponse.body;

    //Update the Template
    const updatedTemplateData = {
      name: 'Updated Template',
      fields: [customField2._id, customField3._id],
    };
    const response = await request(app).put(`/api/templates/editTemplate/${template._id}`).send(updatedTemplateData);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe(updatedTemplateData.name);

    //Verify that the item has the new custom field added
    const updatedItem = await BasicItem.findById(createdItem._id).populate('customFields.field').exec();
    expect(updatedItem).not.toBeNull();
    expect(updatedItem?.customFields).toHaveLength(3);
    expect(updatedItem?.customFields?.find(cf => (cf.field as unknown as ICustomField).fieldName === 'field3')?.value) == "";
  });
});

