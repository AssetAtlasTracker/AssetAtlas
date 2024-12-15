import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import templateRouter from '../src/routes/templateRoutes.js';
import Template from '../src/models/template.js';
import CustomField from '../src/models/customField.js';

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
  await CustomField.deleteMany({});
});

describe('Template API', () => {
  it('should create a new template with custom fields', async () => {
    // Create CustomField documents
    const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
    const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

    const templateData = {
      name: 'Test Template',
      fields: [customField1._id, customField2._id], // Referencing CustomField ObjectIds
    };

    const response = await request(app).post('/api/templates/').send(templateData);
    expect(response.status).toBe(201);
    expect(response.body.name).toBe(templateData.name);

    // Verify that the fields are populated correctly
    const createdTemplate = await Template.findOne({ name: 'Test Template' }).populate('fields').exec();
    expect(createdTemplate).not.toBeNull();
    expect(createdTemplate?.fields).toHaveLength(2);
    expect(createdTemplate?.fields[0].fieldName).toBe('field1');
    expect(createdTemplate?.fields[0].dataType).toBe('string');
  });

  it('should fetch all templates with populated fields', async () => {
    // Create CustomField documents
    const customField = await CustomField.create({ fieldName: 'field1', dataType: 'string' });

    // Create a Template document
    await Template.create({ name: 'Test Template', fields: [customField._id] });

    const response = await request(app).get('/api/templates/getTemplates');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0].name).toBe('Test Template');
    expect(response.body[0].fields[0].fieldName).toBe('field1'); // Populated field check
  });

  it('should fetch the fields of a specific template by name', async () => {
    // Create CustomField documents
    const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
    const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

    // Create a Template document
    const template = await Template.create({
      name: 'Fields Test Template',
      fields: [customField1._id, customField2._id],
    });

    const response = await request(app).get(`/api/templates/getFields/${template.name}`);
    expect(response.status).toBe(200);
    expect(response.body.fields).toHaveLength(2);
    expect(response.body.fields[0].fieldName).toBe('field1');
    expect(response.body.fields[0].dataType).toBe('string');
    expect(response.body.fields[1].fieldName).toBe('field2');
    expect(response.body.fields[1].dataType).toBe('number');
  });

  it('should return all templates if no search query is provided', async () => {
    // Create CustomField documents
    const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
    const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

    // Create Template documents
    await Template.create({ name: 'Template A', fields: [customField1._id] });
    await Template.create({ name: 'Template B', fields: [customField2._id] });

    const response = await request(app).get('/api/templates/searchTemplates');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2); // Two templates in the database
    expect(response.body[0].name).toBe('Template A');
    expect(response.body[1].name).toBe('Template B');
  });

  it('should return matching templates for a fuzzy search query', async () => {
    // Create CustomField documents
    const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
    const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

    // Create Template documents
    await Template.create({ name: 'Template Alpha', fields: [customField1._id] });
    await Template.create({ name: 'Template Beta', fields: [customField2._id] });

    const response = await request(app).get('/api/templates/searchTemplates?name=Alph');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1); // Only one template matches "Alph"
    expect(response.body[0].name).toBe('Template Alpha');
  });
});



