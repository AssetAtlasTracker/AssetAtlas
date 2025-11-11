import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { RecentItems } from '$lib/server/db/models/recentItems.js';
import { POST as createItemHandler } from '$routes/api/items/+server.js';
import { DELETE as deleteItemHandler } from '$routes/api/items/[id]/+server.js';
import { POST as createTemplateHandler } from '$routes/api/templates/createTemplate/+server.js';
import { POST as createCustomFieldHandler } from '$routes/api/customFields/+server.js';
import { GET as getRecentsByTypeHandler } from '$routes/api/recentItems/[type]/+server.js';
import { POST as addManualRecentHandler } from '$routes/api/recentItems/add/+server.js';

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
	
	// Convert body to FormData for /api/items routes, use JSON for others
	const isItemsRoute = options.url?.includes('/api/items');
	let requestInit: RequestInit;
	if (options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
		if (isItemsRoute) {
			const formData = new FormData();
			for (const [key, value] of Object.entries(options.body)) {
				if (value !== undefined && value !== null) {
					if (typeof value === 'object' && !Array.isArray(value)) {
						formData.append(key, JSON.stringify(value));
					} else if (Array.isArray(value)) {
						formData.append(key, JSON.stringify(value));
					} else {
						formData.append(key, String(value));
					}
				}
			}
			requestInit = { method: options.method, body: formData, headers };
		} else {
			headers.set('content-type', 'application/json');
			requestInit = { 
				method: options.method, 
				body: JSON.stringify(options.body),
				headers
			};
		}
	} else {
		requestInit = { method: options.method || 'GET', headers };
	}

	const request = new Request(options.url || 'http://localhost', requestInit);

	const mockEvent: RequestEvent = {
		request,
		params: options.params || {},
		url: new URL(options.url || 'http://localhost'),
		locals: {},
		cookies: {} as any,
		fetch: global.fetch,
		getClientAddress: () => '127.0.0.1',
		isDataRequest: false,
		isSubRequest: false,
		platform: undefined,
		route: { id: null },
		setHeaders: () => {},
		depends: () => {}
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
	await mongoose.connection.collection('recents').deleteMany({});
	await mongoose.connection.collection('items').deleteMany({});
	await mongoose.connection.collection('templates').deleteMany({});
	await mongoose.connection.collection('customfields').deleteMany({});
});

describe('Recent Items Controller', () => {
	it('should get recent items by type', async () => {
		const item = { name: 'Test Item', description: 'Test Description' };
		const createEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/items',
			body: item
		});
		const response = await createItemHandler(createEvent);
		expect(response.status).toBe(201);
		const createdItem = await response.json();

		const recentsEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost/api/recentItems/item',
			params: { type: 'item' }
		});
		const recentsResponse = await getRecentsByTypeHandler(recentsEvent);
		expect(recentsResponse.status).toBe(200);
		const recentsBody = await recentsResponse.json();
		expect(recentsBody.length).toBe(1);
		expect(recentsBody[0]._id.toString()).toBe(createdItem._id);
	});

	it('should return no items when none have been created', async () => {
		const recentsEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost/api/recentItems/item',
			params: { type: 'item' }
		});
		const recentsResponse = await getRecentsByTypeHandler(recentsEvent);
		expect(recentsResponse.status).toBe(200);
		const recentsBody = await recentsResponse.json();
		expect(recentsBody.length).toBe(0);
	});

	it('should fail to get recent items when given an invalid type', async () => {
		const recentsEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost/api/recentItems/invalidType',
			params: { type: 'invalidType' }
		});
		const recentsResponse = await getRecentsByTypeHandler(recentsEvent);
		expect(recentsResponse.status).toBe(400);
		const recentsBody = await recentsResponse.json();
		expect(recentsBody.message).toBe('Invalid type parameter: invalidType');
	});

	it('should manually add a recent item', async () => {
		const item = { name: 'Test Item', description: 'Test Description' };
		const createEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/items',
			body: item
		});
		const creationResponse = await createItemHandler(createEvent);
		expect(creationResponse.status).toBe(201);
		const createdItem = await creationResponse.json();

		const itemId = createdItem._id;
		const itemInfo = { type: 'item', itemId: itemId };
		const addEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/recentItems/add',
			body: itemInfo
		});
		const recentsAddResponse = await addManualRecentHandler(addEvent);
		expect(recentsAddResponse.status).toBe(200);
		const recents = await RecentItems.findOne({ type: 'item' }).populate('recentIds');
		expect(recents?.recentIds[0]._id.toString()).toBe(itemId);
	});

	it('should fail to manually add a recent item with invalid type', async () => {
		const itemInfo = { type: 'invalidType', itemId: '0' };
		const addEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/recentItems/add',
			body: itemInfo
		});
		const recentsAddResponse = await addManualRecentHandler(addEvent);
		expect(recentsAddResponse.status).toBe(400);
		const recentsBody = await recentsAddResponse.json();
		expect(recentsBody.message).toBe('Invalid type parameter: invalidType');
	});
});

describe('Recent Items Integration', () => {
	it('should add items to recents when created', async () => {
		const itemData = { name: 'Test Item', description: 'Test Description' };
		const createEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/items',
			body: itemData
		});
		const response = await createItemHandler(createEvent);
		expect(response.status).toBe(201);
		const createdItem = await response.json();

		const recents = await RecentItems.findOne({ type: 'item' }).populate('recentIds');
		expect(recents?.recentIds[0]._id.toString()).toBe(createdItem._id);
	});

	it('should remove items from recents when deleted', async () => {
		const itemData = { name: 'Test Item', description: 'Test Description' };
		const createEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/items',
			body: itemData
		});
		const createResponse = await createItemHandler(createEvent);
		expect(createResponse.status).toBe(201);
		const createdItem = await createResponse.json();

		const deleteEvent = createMockEvent({
			method: 'DELETE',
			url: `http://localhost/api/items/${createdItem._id}`,
			params: { id: createdItem._id }
		});
		await deleteItemHandler(deleteEvent);

		const recents = await RecentItems.findOne({ type: 'item' });
		expect(recents?.recentIds).not.toContain(createdItem._id);
	});

	it('should maintain max 5 items in recents', async () => {
		for (let i = 0; i < 6; i++) {
			const itemData = { name: `Test Item ${i}`, description: 'Test Description' };
			const createEvent = createMockEvent({
				method: 'POST',
				url: 'http://localhost/api/items',
				body: itemData
			});
			await createItemHandler(createEvent);
		}

		const recents = await RecentItems.findOne({ type: 'item' });
		expect(recents?.recentIds.length).toBe(5);
	});

	it('should add templates to recents when created', async () => {
		const templateData = {
			name: 'Test Template',
			fields: []
		};
		const createEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/templates/createTemplate',
			body: templateData
		});
		const response = await createTemplateHandler(createEvent);
		expect(response.status).toBe(201);
		const createdTemplate = await response.json();

		const recents = await RecentItems.findOne({ type: 'template' }).populate('recentIds');
		expect(recents?.recentIds[0]._id.toString()).toBe(createdTemplate._id);
	});

	it('should add custom fields to recents when created', async () => {
		const fieldData = { fieldName: 'Test Field', dataType: 'string' };
		const createEvent = createMockEvent({
			method: 'POST',
			url: 'http://localhost/api/customFields',
			body: fieldData
		});
		const response = await createCustomFieldHandler(createEvent);
		expect(response.status).toBe(201);
		const createdField = await response.json();

		const recents = await RecentItems.findOne({ type: 'customField' }).populate('recentIds');
		expect(recents?.recentIds[0]._id.toString()).toBe(createdField._id);
	});
});