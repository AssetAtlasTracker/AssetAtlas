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
});