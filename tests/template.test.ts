import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import templateRouter from '../src/routes/templateRoutes.js';
import Template from '../src/models/template.js';

let app: express.Application;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, { dbName: 'test' });

  app = express();
  app.use(express.json());
  app.use('/api/templates', templateRouter);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Clear the database before each test to ensure isolation
beforeEach(async () => {
  await Template.deleteMany({});
});

describe('Template API', () => {
  it('should create a new template', async () => {
    const templateData = {
      name: 'Test Template',
      fields: [{ key: 'field1', valueType: 'string' }],
    };

    const response = await request(app).post('/api/templates/createTemplate').send(templateData);
    expect(response.status).toBe(201);
    expect(response.body.name).toBe(templateData.name);
    expect(response.body.fields).toHaveLength(1);
    expect(response.body.fields[0].key).toBe('field1');

    // Verify that the template is actually in the database
    const createdTemplate = await Template.findOne({ name: 'Test Template' }).exec();
    expect(createdTemplate).not.toBeNull();
    expect(createdTemplate?.name).toBe(templateData.name);
    expect(createdTemplate?.fields).toHaveLength(1);
    expect(createdTemplate?.fields[0].key).toBe('field1');
  });

  it('should fetch all templates', async () => {
    // Create a template directly in the DB for testing the GET endpoint
    await Template.create({ name: 'Test Template', fields: [{ key: 'field1', valueType: 'string' }] });

    const response = await request(app).get('/api/templates/getTemplates');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0].name).toBe('Test Template');

    //console.log('Fetched templates:', JSON.stringify(response.body, null, 2));
  });

  it('should fetch the fields of a specific template by name', async () => {
    const template = await Template.create({
      name: 'Fields Test Template',
      fields: [
        { key: 'field1', valueType: 'string' },
        { key: 'field2', valueType: 'number' },
      ],
    });
  
    const response = await request(app).get(`/api/templates/getFields/${template.name}`);
    expect(response.status).toBe(200);
    expect(response.body.fields).toHaveLength(2);
    expect(response.body.fields[0].key).toBe('field1');
    expect(response.body.fields[0].valueType).toBe('string');
    expect(response.body.fields[1].key).toBe('field2');
    expect(response.body.fields[1].valueType).toBe('number');
  
    //console.log('Fetched fields:', JSON.stringify(response.body.fields, null, 2));
  });
});




