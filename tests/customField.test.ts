import type { ICustomField } from '$lib/server/db/models/customField.js';
import { RecentItems } from '$lib/server/db/models/recentItems.js';
import { POST as createCustomFieldHandler } from '$routes/api/customFields/+server.js';
import { GET as getCustomFieldByIdHandler } from '$routes/api/customFields/[id]/+server.js';
import { GET as checkItemIdHandler } from '$routes/api/customFields/checkItemId/+server.js';
import { GET as checkItemNameHandler } from '$routes/api/customFields/checkItemName/+server.js';
import { GET as searchCustomFieldsHandler } from '$routes/api/customFields/search/+server.js';
import { POST as createItemHandler } from '$routes/api/items/+server.js';
import type { RequestEvent } from '@sveltejs/kit';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let mongoServer: MongoMemoryServer;

// Helper function to create a mock RequestEvent for SvelteKit
function createMockEvent(options: {
	method?: string;
	body?: string | Record<string, unknown>;
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

//for item-type custom field tests
function createMockItemEvent(options: {
	method?: string;
	body?: Record<string, unknown>;
	headers?: Record<string, string>;
	url?: string;
	params?: Record<string, string>;
}): RequestEvent {
	const headers = new Headers(options.headers || {});
	
	// Convert body to FormData only for /api/items POST/PUT/PATCH requests
	// Other routes (like /api/customFields, /api/templates, /api/items/move) use JSON
	const isItemsRoute = options.url?.includes('/api/items') && !options.url?.includes('/api/items/move');
	let requestInit;
	if (options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
		if (isItemsRoute) {
			const formData = new FormData();
			for (const [key, value] of Object.entries(options.body)) {
				if (value !== undefined && value !== null) {
					if (typeof value === 'object' && !Array.isArray(value)) {
						formData.append(key, value.toString());
					} else if (Array.isArray(value)) {
						formData.append(key, JSON.stringify(value));
					} else {
						formData.append(key, String(value));
					}
				}
			}
			requestInit = {
				method: options.method || 'GET',
				headers,
				body: formData
			};
		} else {
			// Use JSON for non-items routes
			headers.set('Content-Type', 'application/json');
			requestInit = {
				method: options.method || 'GET',
				headers,
				body: JSON.stringify(options.body)
			};
		}
	} else {
		requestInit = {
			method: options.method || 'GET',
			headers,
			body: options.body ? JSON.stringify(options.body) : undefined
		};
	}
	
	const request = new Request(options.url || 'http://localhost:3000/api/test', requestInit);

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

		try {
			await getCustomFieldByIdHandler(event);
			expect.fail('Should have thrown an error');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			expect(err.status).toBe(400);
			expect(err.body?.message).toBe('Invalid ID format');
		}
	});

	it('should return a 404 error for a non-existent ID', async () => {
		const nonExistentId = new mongoose.Types.ObjectId().toString();

		const event = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/customFields/${nonExistentId}`,
			params: { id: nonExistentId }
		});

		try {
			await getCustomFieldByIdHandler(event);
			expect.fail('Should have thrown an error');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			expect(err.status).toBe(404);
			expect(err.body?.message).toBe('Custom field not found');
		}
	});

	it('should find an item based on name and return its ID', async () => {
		
		const itemData = {
			name: 'Test Item',
			description: 'A sample item for testing',
			tags: ['tag1', 'tag2']
		};

		const createEvent = createMockItemEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});

		const creationResponse = await createItemHandler(createEvent);
		const createdBody = await creationResponse.json();

		expect(creationResponse.status).toBe(201);
		const itemId = createdBody._id;


		const checkNameEvent = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/customFields/checkItemName?itemName=${encodeURIComponent(itemData.name)}`
		});

		const checkNameResponse = await checkItemNameHandler(checkNameEvent);
		const checkNameBody = await checkNameResponse.json();
		expect(checkNameResponse.status).toBe(200);
		expect(checkNameBody.id).toBe(itemId);

	});

	it('should find an item based on ID and return its name', async () => {
		
		const itemData = {
			name: 'Test Item',
			description: 'A sample item for testing',
			tags: ['tag1', 'tag2']
		};

		const createEvent = createMockItemEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});

		const creationResponse = await createItemHandler(createEvent);
		const createdBody = await creationResponse.json();

		expect(creationResponse.status).toBe(201);
		const itemId = createdBody._id;


		const checkNameEvent = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/customFields/checkItemId?itemID=${encodeURIComponent(itemId)}`
		});

		const checkNameResponse = await checkItemIdHandler(checkNameEvent);
		const checkNameBody = await checkNameResponse.json();
		expect(checkNameResponse.status).toBe(200);
		expect(checkNameBody.name).toBe(itemData.name);

	});

});