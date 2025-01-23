import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import itemRouter from '../src/routes/itemRoutes.js';
import templateRouter from '../src/routes/templateRoutes.js';
import customFieldRouter from '../src/routes/customFieldRoutes.js';
import { RecentItems } from '../src/models/recentItems.js';

let app: express.Application;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { dbName: 'test' });

  app = express();
  app.use(express.json());
  app.use('/api/items', itemRouter);
  app.use('/api/templates', templateRouter);
  app.use('/api/customFields', customFieldRouter);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.collection('recents').deleteMany({});
  await mongoose.connection.collection('items').deleteMany({});
  await mongoose.connection.collection('templates').deleteMany({});
  await mongoose.connection.collection('customfields').deleteMany({});
  
  // Initialize RecentItems documents
  await Promise.all([
    RecentItems.create({ type: 'item', recentIds: [], maxItems: 5 }),
    RecentItems.create({ type: 'template', recentIds: [], maxItems: 5 }),
    RecentItems.create({ type: 'customField', recentIds: [], maxItems: 5 })
  ]);
});

describe('Recent Items Integration', () => {
  it('should add items to recents when created', async () => {
    const itemData = { name: 'Test Item', description: 'Test Description' };
    const response = await request(app).post('/api/items').send(itemData);
    expect(response.status).toBe(201);

    const recents = await RecentItems.findOne({ type: 'item' }).populate('recentIds');
    expect(recents?.recentIds[0]._id.toString()).toBe(response.body._id);
  });

  it('should remove items from recents when deleted', async () => {
    const itemData = { name: 'Test Item', description: 'Test Description' };
    const createResponse = await request(app).post('/api/items').send(itemData);
    expect(createResponse.status).toBe(201);

    await request(app).delete(`/api/items/${createResponse.body._id}`);

    const recents = await RecentItems.findOne({ type: 'item' });
    expect(recents?.recentIds).not.toContain(createResponse.body._id);
  });

  it('should maintain max 5 items in recents', async () => {
    for (let i = 0; i < 6; i++) {
      const itemData = { name: `Test Item ${i}`, description: 'Test Description' };
      await request(app).post('/api/items').send(itemData);
    }

    const recents = await RecentItems.findOne({ type: 'item' });
    expect(recents?.recentIds.length).toBe(5);
  });

  it('should add templates to recents when created', async () => {
    const templateData = { 
      name: 'Test Template',
      fields : []
    };
    const response = await request(app).post('/api/templates/createTemplate').send(templateData);
    expect(response.status).toBe(201);
  
    const recents = await RecentItems.findOne({ type: 'template' }).populate('recentIds');
    expect(recents?.recentIds[0]._id.toString()).toBe(response.body._id);
  });

  it('should add custom fields to recents when created', async () => {
    const fieldData = { fieldName: 'Test Field', dataType: 'string' };
    const response = await request(app).post('/api/customFields').send(fieldData);
    expect(response.status).toBe(201);

    const recents = await RecentItems.findOne({ type: 'customField' }).populate('recentIds');
    expect(recents?.recentIds[0]._id.toString()).toBe(response.body._id);
  });
});