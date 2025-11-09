import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import type { ICustomField } from '../src/lib/server/db/models/customField.js';
import { RecentItems } from '../src/lib/server/db/models/recentItems.js';
import { POST as createCustomFieldHandler } from '../src/routes/api/customFields/+server.js';
import { GET as searchCustomFieldsHandler } from '../src/routes/api/customFields/search/+server.js';
import { GET as getCustomFieldByIdHandler } from '../src/routes/api/customFields/[id]/+server.js';

let mongoServer: MongoMemoryServer;

// Helper function to create a mock RequestEvent for SvelteKit
function createMockEvent(options: {
	method?: string;
	body?: Record<string, unknown>;
	headers?: Record<string, string>;
	url?: string;
	params?: Record<string, string>;
}): RequestEvent {
	const headers = new Headers(options.headers || {});
	const request = new Request(options.url || 'http://localhost:3000/api/test', {
		method: options.method || 'GET',
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined
	});

	return {
		request,
		params: options.params || {},
		url: new URL(options.url || 'http://localhost:3000/api/test'),
		locals: {},
		cookies: {
			get: () => undefined,
			set: () => {},
			delete: () => {},
			getAll: () => [],
			serialize: () => ''
		},
		fetch: global.fetch,
		getClientAddress: () => '127.0.0.1',
		platform: undefined,
		route: { id: null },
		setHeaders: () => {},
		isDataRequest: false,
		isSubRequest: false,
		tracing: {} as never,
		isRemoteRequest: false
	} as RequestEvent;
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
	await mongoose.connection.collection('customfields').deleteMany({});
	await mongoose.connection.collection('recents').deleteMany({});
	await Promise.all([
		RecentItems.create({ type: 'item', recentIds: [], maxItems: 5 }),
		RecentItems.create({ type: 'template', recentIds: [], maxItems: 5 }),
		RecentItems.create({ type: 'customField', recentIds: [], maxItems: 5 })
	]);
});

describe('CustomField API', () => {
	it('should create a new custom field', async () => {
		const customFieldData = {
			fieldName: 'Warranty',
			dataType: 'string'
		};

		const event = createMockEvent({
			method: 'POST',
			body: customFieldData,
			url: 'http://localhost:3000/api/customFields'
		});

		const response = await createCustomFieldHandler(event);
		const body = await response.json();

		expect(response.status).toBe(201);
		expect(body.fieldName).toBe(customFieldData.fieldName);
		expect(body.dataType).toBe(customFieldData.dataType);
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
			const event = createMockEvent({
				method: 'POST',
				body: field,
				url: 'http://localhost:3000/api/customFields'
			});

			const response = await createCustomFieldHandler(event);
			expect(response.status).toBe(201);
		}

		const searchEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost:3000/api/customFields/search?fieldName=Price'
		});

		const searchResponse = await searchCustomFieldsHandler(searchEvent);
		const searchBody = await searchResponse.json();

		expect(searchResponse.status).toBe(200);
		expect(searchBody.length).toBe(1);
		expect(searchBody[0].fieldName).toBe('Price');

		const emptySearchEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost:3000/api/customFields/search'
		});

		const emptySearchResponse = await searchCustomFieldsHandler(emptySearchEvent);
		const emptySearchBody = await emptySearchResponse.json();

		expect(emptySearchResponse.status).toBe(200);
		expect(emptySearchBody.length).toBe(customFields.length);

		const fieldNames = emptySearchBody.map((field: ICustomField) => field.fieldName);
		expect(fieldNames).toEqual(expect.arrayContaining(['Warranty', 'Price', 'Color', 'Material']));
	});

	it('should fetch a custom field by ID', async () => {
		// Create a custom field to fetch later
		const customFieldData = {
			fieldName: 'Warranty',
			dataType: 'string',
		};

		const createEvent = createMockEvent({
			method: 'POST',
			body: customFieldData,
			url: 'http://localhost:3000/api/customFields'
		});

		const createResponse = await createCustomFieldHandler(createEvent);
		const createdField = await createResponse.json();

		expect(createResponse.status).toBe(201);

		// Fetch the custom field by ID
		const fetchEvent = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/customFields/${createdField._id}`,
			params: { id: createdField._id }
		});

		const fetchResponse = await getCustomFieldByIdHandler(fetchEvent);
		const fetchBody = await fetchResponse.json();

		expect(fetchResponse.status).toBe(200);
		expect(fetchBody.fieldName).toBe(customFieldData.fieldName);
		expect(fetchBody.dataType).toBe(customFieldData.dataType);
	});

	it('should return a 400 error for an invalid ID format', async () => {
		const invalidId = 'invalid-id-format';

		const event = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/customFields/${invalidId}`,
			params: { id: invalidId }
		});

		const response = await getCustomFieldByIdHandler(event);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.message).toBe('Invalid ID format');
	});

	it('should return a 404 error for a non-existent ID', async () => {
		const nonExistentId = new mongoose.Types.ObjectId().toString();

		const event = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/customFields/${nonExistentId}`,
			params: { id: nonExistentId }
		});

		const response = await getCustomFieldByIdHandler(event);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.message).toBe('Custom field not found');
	});

});