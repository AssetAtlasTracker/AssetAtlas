import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import CustomField, { type ICustomField as CustomFieldType } from '$lib/server/db/models/customField.js';
import { RecentItems } from '$lib/server/db/models/recentItems.js';
import Template from '$lib/server/db/models/template.js';
import { POST as createTemplateHandler } from '$routes/api/templates/createTemplate/+server.js';
import { GET as getTemplatesHandler } from '$routes/api/templates/+server.js';
import { GET as getFieldsByNameHandler } from '$routes/api/templates/getFields/[templateName]/+server.js';
import { DELETE as deleteTemplateHandler } from '$routes/api/templates/[id]/+server.js';
import { PUT as editTemplateHandler } from '$routes/api/templates/editTemplate/[id]/+server.js';

let mongoServer: MongoMemoryServer;

function createMockEvent(options: {
	method?: string;
	body?: Record<string, unknown>;
	headers?: Record<string, string>;
	url?: string;
	params?: Record<string, string>;
}): RequestEvent {
	const headers = new Headers(options.headers || {});
	
	let requestInit;
	if (options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
		headers.set('content-type', 'application/json');
		requestInit = { 
			method: options.method, 
			body: JSON.stringify(options.body),
			headers
		};
	} else {
		requestInit = { method: options.method || 'GET', headers };
	}

	const request = new Request(options.url || 'http://localhost', requestInit);

	const mockEvent: RequestEvent = {
		request,
		params: options.params || {},
		url: new URL(options.url || 'http://localhost'),
		locals: {},
		cookies: {},
		fetch: global.fetch,
		getClientAddress: () => '127.0.0.1',
		isDataRequest: false,
		isSubRequest: false,
		platform: undefined,
		route: { id: null },
		setHeaders: () => {}
	};

	return mockEvent;
}

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();

	await mongoose.connect(mongoUri, { dbName: 'test' });
});

afterAll(async () => {
	await mongoose.connection.dropDatabase();
	await mongoose.connection.close();
	await mongoServer.stop();
});

beforeEach(async () => {
	await Template.deleteMany({});
	await RecentItems.deleteMany({});
	await CustomField.deleteMany({});
	await Promise.all([
		RecentItems.create({ type: 'item', recentIds: [], maxItems: 5 }),
		RecentItems.create({ type: 'template', recentIds: [], maxItems: 5 }),
		RecentItems.create({ type: 'customField', recentIds: [], maxItems: 5 })
	]);
});

describe('Template API', () => {
	it('should create a new template with custom fields', async () => {
		const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
		const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

		const templateData = {
			name: 'Test Template',
			fields: [customField1._id, customField2._id],
		};

		const createEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/templates/createTemplate',
			body: templateData
		});
		const response = await createTemplateHandler(createEvent);
		expect(response.status).toBe(201);
		const responseBody = await response.json();
		expect(responseBody.name).toBe(templateData.name);

		const createdTemplate = await Template.findOne({ name: 'Test Template' }).populate<{ fields: CustomFieldType[] }>('fields').exec();
		expect(createdTemplate).not.toBeNull();
		expect(createdTemplate?.fields).toHaveLength(2);
		expect(createdTemplate?.fields[0].fieldName).toBe('field1');
		expect(createdTemplate?.fields[0].dataType).toBe('string');
	});

	it('should fail to create a template when no name is provided', async () => {
		const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
		const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

		const templateData = {
			fields: [customField1._id, customField2._id]
		};

		const createEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/templates/createTemplate',
			body: templateData
		});
		
		try {
			await createTemplateHandler(createEvent);
			expect.fail('Should have thrown an error');
		} catch (err: any) {
			expect(err.status).toBe(400);
			expect(err.body?.message).toBe('Failed to create template: missing name and/or fields');
		}
	});

	it('should fail to create a template when a duplicate template name is used', async () => {
		const templateData = {
			name: 'Test Template'
		};

		const createEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/templates/createTemplate',
			body: templateData
		});
		
		try {
			await createTemplateHandler(createEvent);
			expect.fail('Should have thrown an error');
		} catch (err: any) {
			expect(err.status).toBe(400);
			expect(err.body?.message).toBe('Failed to create template: missing name and/or fields');
		}
	});

	it('should fail to create a template when a duplicate template name is used', async () => {
		const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
		const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

		const templateData1 = {
			name: 'Test Template',
			fields: [customField1._id]
		};

		const templateData2 = {
			name: 'Test Template',
			fields: [customField2._id]
		};

		const createEvent1 = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/templates/createTemplate',
			body: templateData1
		});
		const response = await createTemplateHandler(createEvent1);
		expect(response.status).toBe(201);

		const createEvent2 = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/templates/createTemplate',
			body: templateData2
		});
		
		await expect(async () => {
			await createTemplateHandler(createEvent2);
		}).rejects.toThrow();
	});

	it('should fetch all templates with populated fields', async () => {
		const customField = await CustomField.create({ fieldName: 'field1', dataType: 'string' });

		await Template.create({ name: 'Test Template', fields: [customField._id] });

		const getEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost/api/templates'
		});
		const response = await getTemplatesHandler(getEvent);
		expect(response.status).toBe(200);
		const responseBody = await response.json();
		expect(responseBody.length).toBeGreaterThanOrEqual(1);
		expect(responseBody[0].name).toBe('Test Template');
		expect(responseBody[0].fields[0].fieldName).toBe('field1');
	});

	it('should fetch the fields of a specific template by name', async () => {
		const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
		const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

		const template = await Template.create({
			name: 'Fields Test Template',
			fields: [customField1._id, customField2._id],
		});

		const getEvent = createMockEvent({
			method: 'GET',
			url: `http://localhost/api/templates/getFields/${template.name}`,
			params: { templateName: template.name }
		});
		const response = await getFieldsByNameHandler(getEvent);
		expect(response.status).toBe(200);
		const responseBody = await response.json();
		expect(responseBody.fields).toHaveLength(2);
		expect(responseBody.fields[0].fieldName).toBe('field1');
		expect(responseBody.fields[0].dataType).toBe('string');
		expect(responseBody.fields[1].fieldName).toBe('field2');
		expect(responseBody.fields[1].dataType).toBe('number');
	});

	it('should fail to fetch template with an invalid name', async () => {
		const getEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost/api/templates/getFields/invalidName',
			params: { templateName: 'invalidName' }
		});
		try {
			await getFieldsByNameHandler(getEvent);
			expect.fail('Should have thrown an error');
		} catch (err: any) {
			expect(err.status).toBe(404);
			expect(err.body?.message).toBe('Template not found');
		}
	});

	it('should return all templates if no search query is provided', async () => {
		const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
		const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

		await Template.create({ name: 'Template A', fields: [customField1._id] });
		await Template.create({ name: 'Template B', fields: [customField2._id] });

		const searchEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost/api/templates'
		});
		const response = await getTemplatesHandler(searchEvent);
		expect(response.status).toBe(200);
		const responseBody = await response.json();
		expect(responseBody.length).toBe(2); 
		expect(responseBody[0].name).toBe('Template A');
		expect(responseBody[1].name).toBe('Template B');
	});

	it('should return matching templates for a fuzzy search query', async () => {
		const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
		const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });

		await Template.create({ name: 'Template Alpha', fields: [customField1._id] });
		await Template.create({ name: 'Template Beta', fields: [customField2._id] });

		const searchEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost/api/templates?name=Alph'
		});
		const response = await getTemplatesHandler(searchEvent);
		expect(response.status).toBe(200);
		const responseBody = await response.json();
		expect(responseBody.length).toBe(1);
		expect(responseBody[0].name).toBe('Template Alpha');
	});

	it('should delete a template by ID', async () => {
		const customField = await CustomField.create({ fieldName: 'field1', dataType: 'string' });

		const template = await Template.create({ name: 'Test Template', fields: [customField._id] });

		const deleteEvent = createMockEvent({
			method: 'DELETE',
			url: `http://localhost/api/templates/${template._id}`,
			params: { id: template._id.toString() }
		});
		const response = await deleteTemplateHandler(deleteEvent);
		expect(response.status).toBe(200);
		const responseBody = await response.json();
		expect(responseBody.message).toBe('Template deleted successfully');

		const deletedTemplate = await Template.findById(template._id).exec();
		expect(deletedTemplate).toBeNull();
	});

	it('should edit an existing template', async () => {
		const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
		const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });
		const customField3 = await CustomField.create({ fieldName: 'field3', dataType: 'boolean' });

		const template = await Template.create({ name: 'Original Template', fields: [customField1._id, customField2._id] });

		const updatedTemplateData = {
			name: 'Updated Template',
			fields: [customField2._id, customField3._id],
		};

		const editEvent = createMockEvent({
			method: 'PUT',
			url: `http://localhost/api/templates/editTemplate/${template._id}`,
			body: updatedTemplateData,
			params: { id: template._id.toString() }
		});
		const response = await editTemplateHandler(editEvent);
		expect(response.status).toBe(200);
		const responseBody = await response.json();
		expect(responseBody.name).toBe(updatedTemplateData.name);

		const updatedTemplate = await Template.findById(template._id).populate<{ fields: CustomFieldType[] }>('fields').exec();
		expect(updatedTemplate).not.toBeNull();
		expect(updatedTemplate?.fields).toHaveLength(2);
		expect(updatedTemplate?.fields[0].fieldName).toBe('field2');
		expect(updatedTemplate?.fields[1].fieldName).toBe('field3');
	});
});



