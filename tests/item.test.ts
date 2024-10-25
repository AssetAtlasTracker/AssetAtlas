import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import itemRouter from '../src/routes/itemRoutes.js';
import BasicItem from '../src/models/basicItem.js';

let app: express.Application;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, { dbName: 'test' });

  app = express();
  app.use(express.json());
  app.use('/api/items', itemRouter);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Clear the database before each test to ensure isolation
beforeEach(async () => {
  await BasicItem.deleteMany({});
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
    console.log('Search results:', response.body);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0].name).toContain('Test');
  });

//   it('should create an item, set another item as its container, move the item, and verify containedItems update', async () => {
//     // Create the first item
//     const parentItemData = {
//       name: 'Parent Item',
//       description: 'A container item',
//       tags: ['parent']
//     };
//     const parentResponse = await request(app).post('/api/items').send(parentItemData);
//     expect(parentResponse.status).toBe(201);
//     const parentItem = parentResponse.body;

//     // Create the second item and set the first item as its container
//     const childItemData = {
//       name: 'Child Item',
//       description: 'An item to be contained',
//       tags: ['child'],
//       parentItem: parentItem._id
//     };
//     const childResponse = await request(app).post('/api/items').send(childItemData);
//     expect(childResponse.status).toBe(201);
//     const childItem = childResponse.body;

//     // Verify the first item contains the second item
//     const updatedParent = await BasicItem.findById(parentItem._id).exec();
//     expect(updatedParent?.containedItems.map(String)).toContain(childItem._id);

//     // Create a third item to move the second item into
//     const newParentItemData = {
//       name: 'New Parent Item',
//       description: 'A new container item',
//       tags: ['newParent']
//     };
//     const newParentResponse = await request(app).post('/api/items').send(newParentItemData);
//     expect(newParentResponse.status).toBe(201);
//     const newParentItem = newParentResponse.body;

//     // Move the second item into the third item
//     const moveResponse = await request(app).post('/api/items/move').send({
//       itemId: childItem._id,
//       newParentId: newParentItem._id
//     });
//     expect(moveResponse.status).toBe(200);
//     expect(moveResponse.body.message).toBe('Item moved successfully');

//     // Verify the first item no longer contains the second item
//     const oldParentAfterMove = await BasicItem.findById(parentItem._id).exec();
//     expect(oldParentAfterMove?.containedItems.map(String)).not.toContain(childItem._id);

//     // Verify the new parent now contains the second item
//     const newParentAfterMove = await BasicItem.findById(newParentItem._id).exec();
//     expect(newParentAfterMove?.containedItems.map(String)).toContain(childItem._id);
//   });

it('should get all contained items by parent ID', async () => {
    // Create the parent item
    const parentItemData = {
      name: 'Parent Item',
      description: 'A container item',
      tags: ['parent']
    };
    const parentResponse = await request(app).post('/api/items').send(parentItemData);
    expect(parentResponse.status).toBe(201);
    const parentItem = parentResponse.body;
  
    // Create child items
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
    await request(app).post('/api/items').send(childItemData1);
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

});