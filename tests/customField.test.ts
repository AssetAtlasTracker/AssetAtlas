import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import customFieldRouter from '../src/routes/customFieldRoutes.js';
import type { ICustomField } from '../src/models/customField.js';

let app: express.Application;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, { dbName: 'test' });

  app = express();
  app.use(express.json());
  app.use('/api/customFields', customFieldRouter);
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

beforeEach(async () => {
  await mongoose.connection.collection('customfields').deleteMany({});
});

describe('CustomField API', () => {
  it('should create a new custom field', async () => {
    const customFieldData = {
      fieldName: 'Warranty',
      dataType: 'string'
    };

    const response = await request(app).post('/api/customFields').send(customFieldData);
    expect(response.status).toBe(201);
    expect(response.body.fieldName).toBe(customFieldData.fieldName);
    expect(response.body.dataType).toBe(customFieldData.dataType);
  });

  it('should create multiple custom fields and search among (us lol) them', async () => {
    // Create multiple custom fields
    const customFields = [
      { fieldName: 'Warranty', dataType: 'string' },
      { fieldName: 'Price', dataType: 'number' },
      { fieldName: 'Color', dataType: 'string' },
      { fieldName: 'Material', dataType: 'string' }
    ];

    for (const field of customFields) {
      const response = await request(app).post('/api/customFields').send(field);
      expect(response.status).toBe(201);
    }

    const searchResponse = await request(app).get('/api/customFields/search?fieldName=Price');
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.length).toBe(1);
    expect(searchResponse.body[0].fieldName).toBe('Price');

    const emptySearchResponse = await request(app).get('/api/customFields/search');
    expect(emptySearchResponse.status).toBe(200);
    expect(emptySearchResponse.body.length).toBe(customFields.length);

    const fieldNames = emptySearchResponse.body.map((field: ICustomField) => field.fieldName);
    expect(fieldNames).toEqual(expect.arrayContaining(['Warranty', 'Price', 'Color', 'Material']));
  });
});

