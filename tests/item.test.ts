import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import BasicItem from '$lib/server/db/models/basicItem.js';
import type { ICustomField } from '$lib/server/db/models/customField.js';
import CustomField from '$lib/server/db/models/customField.js';
import { RecentItems } from '$lib/server/db/models/recentItems.js';
import Template from '$lib/server/db/models/template.js';
import { POST as createItemHandler } from '$routes/api/items/+server.js';
import { GET as getItemByIdHandler, PATCH as updateItemHandler, DELETE as deleteItemHandler } from '$routes/api/items/[id]/+server.js';
import { GET as searchItemsHandler } from '$routes/api/items/search/+server.js';
import { POST as moveItemHandler } from '$routes/api/items/move/+server.js';
import { GET as getAllContainedHandler } from '$routes/api/items/allContained/[parentID]/+server.js';
import { GET as getParentChainHandler } from '$routes/api/items/parentChain/[id]/+server.js';
import { GET as getTreeHandler } from '$routes/api/items/tree/[id]/+server.js';
import { POST as createCustomFieldHandler } from '$routes/api/customFields/+server.js';
import { DELETE as deleteTemplateHandler } from '$routes/api/templates/[id]/+server.js';
import { PUT as editTemplateHandler } from '$routes/api/templates/editTemplate/[id]/+server.js';

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
	
	// Convert body to FormData only for /api/items POST/PUT/PATCH requests
	// Other routes (like /api/customFields, /api/templates) use JSON
	const isItemsRoute = options.url?.includes('/api/items');
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

// Clear the database before each test to ensure isolation
beforeEach(async () => {
	await BasicItem.deleteMany({});
	await CustomField.deleteMany({});
	await Template.deleteMany({});
	await RecentItems.deleteMany({});
	await Promise.all([
		RecentItems.create({ type: 'item', recentIds: [], maxItems: 5 }),
		RecentItems.create({ type: 'template', recentIds: [], maxItems: 5 }),
		RecentItems.create({ type: 'customField', recentIds: [], maxItems: 5 })
	]);

});

describe('Item API', () => {
	it('should create a new item', async () => {
		const itemData = {
			name: 'Test Item',
			description: 'A sample item for testing',
			tags: ['tag1', 'tag2']
		};

		const event = createMockEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});

		const response = await createItemHandler(event);
		const body = await response.json();

		expect(response.status).toBe(201);
		expect(body.name).toBe(itemData.name);
		expect(body.tags).toHaveLength(2);

		const createdItem = await BasicItem.findOne({ name: 'Test Item' }).exec();
		expect(createdItem).not.toBeNull();
		expect(createdItem?.name).toBe(itemData.name);
	});

	it('should get an item by ID', async () => {
		const newItem = await BasicItem.create({ name: 'Test Item', description: 'A sample item for testing', tags: ['tag1'] });

		const event = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/items/${newItem._id}`,
			params: { id: newItem._id.toString() }
		});

		const response = await getItemByIdHandler(event);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.name).toBe(newItem.name);
	});

	it('should return 404 if item is not found when trying to get it by its ID', async () => {
		const nonExistentId = new mongoose.Types.ObjectId();
		
		const event = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/items/${nonExistentId}`,
			params: { id: nonExistentId.toString() }
		});

		try {
			await getItemByIdHandler(event);
			expect.fail('Should have thrown an error');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			expect(err.status).toBe(404);
			expect(err.body?.message).toBe('Cannot get: Item not found');
		}
	});

	it('should update an item', async () => {
		const itemData = {
			name: 'Test Item',
			description: 'A sample item for testing',
			tags: ['tag1', 'tag2']
		};

		const createEvent = createMockEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});

		const creationResponse = await createItemHandler(createEvent);
		const createdBody = await creationResponse.json();

		expect(creationResponse.status).toBe(201);
		const itemId = createdBody._id;

		const updatedData = {
			name: 'Updated Test Item',
			description: 'Updated description',
			tags: ['tag3']
		};

		const updateEvent = createMockEvent({
			method: 'PATCH',
			body: updatedData,
			url: `http://localhost:3000/api/items/${itemId}`,
			params: { id: itemId }
		});

		const updateResponse = await updateItemHandler(updateEvent);
		const updateBody = await updateResponse.json();

		expect(updateResponse.status).toBe(200);
		expect(updateBody.name).toBe(updatedData.name);
		expect(updateBody.description).toBe(updatedData.description);
		expect(updateBody.tags).toHaveLength(1);
		expect(updateBody.tags[0]).toBe('tag3');
	});

	it('should update an item with a tag in string format', async () => {
		const itemData = {
			name: 'Test Item',
			description: 'A sample item for testing',
			tags: ['tag1', 'tag2']
		};

		const createEvent = createMockEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});

		const creationResponse = await createItemHandler(createEvent);
		const createdBody = await creationResponse.json();

		expect(creationResponse.status).toBe(201);
		const itemId = createdBody._id;

		const updatedData = {
			name: 'Updated Test Item',
			description: 'Updated description',
			tags: '["tag3"]'
		};

		const updateEvent = createMockEvent({
			method: 'PATCH',
			body: updatedData,
			url: `http://localhost:3000/api/items/${itemId}`,
			params: { id: itemId }
		});

		const updateResponse = await updateItemHandler(updateEvent);
		const updateBody = await updateResponse.json();

		expect(updateResponse.status).toBe(200);
		expect(updateBody.name).toBe(updatedData.name);
		expect(updateBody.description).toBe(updatedData.description);
		expect(updateBody.tags).toHaveLength(1);
		expect(updateBody.tags[0]).toBe('tag3');
	});

	it('should return 404 if item is not found when trying to update it', async () => {
		const nonExistentId = new mongoose.Types.ObjectId();
		
		const event = createMockEvent({
			method: 'PATCH',
			url: `http://localhost:3000/api/items/${nonExistentId}`,
			params: { id: nonExistentId.toString() }
		});

		try {
			await getItemByIdHandler(event);
			expect.fail('Should have thrown an error');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			expect(err.status).toBe(404);
			expect(err.body?.message).toBe('Cannot get: Item not found');
		}
	});

	it('should delete an item by ID', async () => {
		const newItem = await BasicItem.create({ name: 'Test Item', description: 'A sample item for testing', tags: ['tag1'] });

		const event = createMockEvent({
			method: 'DELETE',
			url: `http://localhost:3000/api/items/${newItem._id}`,
			params: { id: newItem._id.toString() }
		});

		const response = await deleteItemHandler(event);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.message).toBe('Item deleted successfully');

		const deletedItem = await BasicItem.findById(newItem._id).exec();
		expect(deletedItem).toBeNull();
	});

	it('should search for items by name', async () => {
		await BasicItem.create({ name: 'Test Item 1', tags: ['tag1'] });
		await BasicItem.create({ name: 'Another Item', tags: ['tag2'] });

		const event = createMockEvent({
			method: 'GET',
			url: 'http://localhost:3000/api/items/search?name=Test'
		});

		const response = await searchItemsHandler(event);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.length).toBeGreaterThanOrEqual(1);
		expect(body[0].name).toContain('Test');
	});

	it('should create an item, set another item as its container, move the item, and verify containedItems update', async () => {
		// Create the first item
		const parentItemData = {
			name: 'Parent Item',
			description: 'A container item',
			tags: ['parent']
		};
		const parentEvent = createMockEvent({
			method: 'POST',
			body: parentItemData,
			url: 'http://localhost:3000/api/items'
		});

		const parentResponse = await createItemHandler(parentEvent);
		const parentItem = await parentResponse.json();

		expect(parentResponse.status).toBe(201);

		//Create the second item and set the first item as its container
		const childItemData = {
			name: 'Child Item',
			description: 'An item to be contained',
			tags: ['child'],
			parentItem: parentItem._id
		};
		const childEvent = createMockEvent({
			method: 'POST',
			body: childItemData,
			url: 'http://localhost:3000/api/items'
		});

		const childResponse = await createItemHandler(childEvent);
		const childItem = await childResponse.json();

		expect(childResponse.status).toBe(201);

		//Verify the first item contains the second item
		const updatedParent = await BasicItem.findById(parentItem._id).exec();
		expect(updatedParent?.containedItems?.map(String)).toContain(childItem._id);

		//Create a third item to move the second item into
		const newParentItemData = {
			name: 'New Parent Item',
			description: 'A new container item',
			tags: ['newParent']
		};
		const newParentEvent = createMockEvent({
			method: 'POST',
			body: newParentItemData,
			url: 'http://localhost:3000/api/items'
		});

		const newParentResponse = await createItemHandler(newParentEvent);
		const newParentItem = await newParentResponse.json();

		expect(newParentResponse.status).toBe(201);

		//Move the second item into the third item
		const moveEvent = createMockEvent({
			method: 'POST',
			body: {
				itemId: childItem._id,
				newParentId: newParentItem._id
			},
			url: 'http://localhost:3000/api/items/move'
		}) as RequestEvent;

		// @ts-expect-error - Route type mismatch is expected for mock events
		const moveResponse = await moveItemHandler(moveEvent);
		const moveBody = await moveResponse.json();

		expect(moveResponse.status).toBe(200);
		expect(moveBody.message).toBe('Item moved successfully');

		//Verify the first item no longer contains the second item
		const oldParentAfterMove = await BasicItem.findById(parentItem._id).exec();
		expect(oldParentAfterMove?.containedItems?.map(String)).not.toContain(childItem._id);

		//Verify the new parent now contains the second item
		const newParentAfterMove = await BasicItem.findById(newParentItem._id).exec();
		expect(newParentAfterMove?.containedItems?.map(String)).toContain(childItem._id);

		//Verify child item can still be fetched
		const fetchEvent = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/items/${childItem._id}`,
			params: { id: childItem._id }
		});
		await getItemByIdHandler(fetchEvent);
	});

	it('should get all contained items by parent ID', async () => {
		//Create the parent item
		const parentItemData = {
			name: 'Parent Item',
			description: 'A container item',
			tags: ['parent']
		};
		const parentEvent = createMockEvent({
			method: 'POST',
			body: parentItemData,
			url: 'http://localhost:3000/api/items'
		});

		const parentResponse = await createItemHandler(parentEvent);
		const parentItem = await parentResponse.json();

		expect(parentResponse.status).toBe(201);

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
		const child1Event = createMockEvent({
			method: 'POST',
			body: childItemData1,
			url: 'http://localhost:3000/api/items'
		});
		await createItemHandler(child1Event);
		
		const child2Event = createMockEvent({
			method: 'POST',
			body: childItemData2,
			url: 'http://localhost:3000/api/items'
		});
		await createItemHandler(child2Event);

		// Get all contained items for the parent
		const getAllEvent = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/items/allContained/${parentItem._id}`,
			params: { parentID: parentItem._id }
		});
		const response = await getAllContainedHandler(getAllEvent);
		const body = await response.json();
		
		if (response.status !== 200) {
			console.error('Error response:', body, 'parentID:', parentItem._id.toString());
		}
		expect(response.status).toBe(200);
		expect(body.containedItems).toHaveLength(2);
		expect(body.containedItems.map((item: { name: unknown; }) => item.name)).toEqual(
			expect.arrayContaining(['Child Item 1', 'Child Item 2'])
		);
	});

	it('should move nested items to the parent container and remove deleted item from its parents contained items on deletion', async () => {
		// Create the top-level parent item
		const topLevelParentData = {
			name: 'Top-Level Parent',
			description: 'The top-level container',
			tags: ['topLevel']
		};
		const topParentEvent = createMockEvent({
			method: 'POST',
			body: topLevelParentData,
			url: 'http://localhost:3000/api/items'
		});
		const topLevelParentResponse = await createItemHandler(topParentEvent);
		const topLevelParent = await topLevelParentResponse.json();

		expect(topLevelParentResponse.status).toBe(201);

		// Create a middle-level item contained by the top-level parent
		const middleItemData = {
			name: 'Middle Item',
			description: 'A middle-level container',
			tags: ['middle'],
			parentItem: topLevelParent._id
		};
		const middleEvent = createMockEvent({
			method: 'POST',
			body: middleItemData,
			url: 'http://localhost:3000/api/items'
		});
		const middleItemResponse = await createItemHandler(middleEvent);
		const middleItem = await middleItemResponse.json();

		expect(middleItemResponse.status).toBe(201);

		const nestedItemData = {
			name: 'Nested Item',
			description: 'A deeply nested item',
			tags: ['nested'],
			parentItem: middleItem._id
		};
		const nestedEvent = createMockEvent({
			method: 'POST',
			body: nestedItemData,
			url: 'http://localhost:3000/api/items'
		});
		const nestedItemResponse = await createItemHandler(nestedEvent);
		const nestedItem = await nestedItemResponse.json();

		expect(nestedItemResponse.status).toBe(201);

		const deleteEvent = createMockEvent({
			method: 'DELETE',
			url: `http://localhost:3000/api/items/${middleItem._id}`,
			params: { id: middleItem._id }
		});
		const deleteResponse = await deleteItemHandler(deleteEvent);
		const deleteBody = await deleteResponse.json();

		expect(deleteResponse.status).toBe(200);
		expect(deleteBody.message).toBe('Item deleted successfully');

		const updatedNestedItem = await BasicItem.findById(nestedItem._id).exec();
		expect(updatedNestedItem).not.toBeNull();
		expect(updatedNestedItem?.parentItem?.toString()).toBe(topLevelParent._id.toString());

		const updatedTopLevelParent = await BasicItem.findById(topLevelParent._id).exec();
		expect(updatedTopLevelParent?.containedItems?.map(String)).not.toContain(middleItem._id);

		expect(updatedTopLevelParent?.containedItems?.map(String)).toContain(nestedItem._id);

		const deleteTopEvent = createMockEvent({
			method: 'DELETE',
			url: `http://localhost:3000/api/items/${topLevelParent._id}`,
			params: { id: topLevelParent._id }
		});
		const deleteTopLevelResponse = await deleteItemHandler(deleteTopEvent);
		const deleteTopBody = await deleteTopLevelResponse.json();

		expect(deleteTopLevelResponse.status).toBe(200);
		expect(deleteTopBody.message).toBe('Item deleted successfully');

		const updatedNestedItemAfterTopLevelDelete = await BasicItem.findById(nestedItem._id).exec();
		expect(updatedNestedItemAfterTopLevelDelete).not.toBeNull();
		expect(updatedNestedItemAfterTopLevelDelete?.parentItem).toBeNull();
	});

	it('should fetch the parent chain of an item', async () => {
		const topLevelParentData = {
			name: 'Top-Level Parent',
		};
		const topEvent = createMockEvent({
			method: 'POST',
			body: topLevelParentData,
			url: 'http://localhost:3000/api/items'
		});
		const topLevelParentResponse = await createItemHandler(topEvent);
		const topLevelParent = await topLevelParentResponse.json();

		expect(topLevelParentResponse.status).toBe(201);

		const middleItemData = {
			name: 'Middle Item',
			parentItem: topLevelParent._id
		};
		const middleEvent = createMockEvent({
			method: 'POST',
			body: middleItemData,
			url: 'http://localhost:3000/api/items'
		});
		const middleItemResponse = await createItemHandler(middleEvent);
		const middleItem = await middleItemResponse.json();

		expect(middleItemResponse.status).toBe(201);

		const nestedItemData = {
			name: 'Nested Item',
			parentItem: middleItem._id
		};
		const nestedEvent = createMockEvent({
			method: 'POST',
			body: nestedItemData,
			url: 'http://localhost:3000/api/items'
		});
		const nestedItemResponse = await createItemHandler(nestedEvent);
		const nestedItem = await nestedItemResponse.json();

		expect(nestedItemResponse.status).toBe(201);

		const chainEvent = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/items/parentChain/${nestedItem._id}`,
			params: { id: nestedItem._id }
		});
		const response = await getParentChainHandler(chainEvent);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveLength(3);
		expect(body[2].name).toBe('Nested Item');
		expect(body[1].name).toBe('Middle Item');
		expect(body[0].name).toBe('Top-Level Parent');
	});

	it('should return 404 when an invalid item id is provided when fetching parent chain', async () => {
		const nonExistentId = new mongoose.Types.ObjectId();
		const chainEvent = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/items/parentChain/${nonExistentId}`,
			params: { id: nonExistentId.toString() }
		});

		try {
			await getParentChainHandler(chainEvent);
			expect.fail('Should have thrown an error');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			expect(err.status).toBe(404);
			expect(err.body?.message).toBe('Item not found');
		}
	});

	it('should delete an item and unset its home item field in other items', async () => {
		const homeItemData = {
			name: 'Home Item',
			description: 'An item set as a home for others',
		};
		const homeEvent = createMockEvent({
			method: 'POST',
			body: homeItemData,
			url: 'http://localhost:3000/api/items'
		});
		const homeItemResponse = await createItemHandler(homeEvent);
		const homeItem = await homeItemResponse.json();

		expect(homeItemResponse.status).toBe(201);

		const itemWithHomeData = {
			name: 'Item with Home',
			description: 'An item with a home reference',
			homeItem: homeItem._id
		};
		const itemWithHomeEvent = createMockEvent({
			method: 'POST',
			body: itemWithHomeData,
			url: 'http://localhost:3000/api/items'
		});
		const itemWithHomeResponse = await createItemHandler(itemWithHomeEvent);
		const itemWithHome = await itemWithHomeResponse.json();

		expect(itemWithHomeResponse.status).toBe(201);

		const deleteEvent = createMockEvent({
			method: 'DELETE',
			url: `http://localhost:3000/api/items/${homeItem._id}`,
			params: { id: homeItem._id }
		});
		const deleteResponse = await deleteItemHandler(deleteEvent);
		const deleteBody = await deleteResponse.json();

		expect(deleteResponse.status).toBe(200);
		expect(deleteBody.message).toBe('Item deleted successfully');

		const updatedItemWithHome = await BasicItem.findById(itemWithHome._id).exec();
		expect(updatedItemWithHome).not.toBeNull();
		expect(updatedItemWithHome?.homeItem).toBeNull();
	});
});

describe('Item and Custom Field API', () => {
	it('should create custom fields, add them to an item, and verify', async () => {
		// Create custom fields
		const customFieldData1 = { fieldName: 'Warranty', dataType: 'string' };
		const cf1Event = createMockEvent({
			method: 'POST',
			body: customFieldData1,
			url: 'http://localhost:3000/api/customFields'
		});
		const customFieldResponse1 = await createCustomFieldHandler(cf1Event);
		const customField1 = await customFieldResponse1.json();

		expect(customFieldResponse1.status).toBe(201);

		const customFieldData2 = { fieldName: 'Price', dataType: 'number' };
		const cf2Event = createMockEvent({
			method: 'POST',
			body: customFieldData2,
			url: 'http://localhost:3000/api/customFields'
		});
		const customFieldResponse2 = await createCustomFieldHandler(cf2Event);
		const customField2 = await customFieldResponse2.json();

		expect(customFieldResponse2.status).toBe(201);

		// Create an item and add custom fields
		const itemData = {
			name: 'Test Item with Custom Fields',
			description: 'An item with custom fields',
			tags: ['tag1'],
			customFields: [
				{ field: customField1._id, value: '2 years' },
				{ field: customField2._id, value: 100.0 }
			]
		};
		const itemEvent = createMockEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});
		const itemResponse = await createItemHandler(itemEvent);
		const createdItem = await itemResponse.json();

		expect(itemResponse.status).toBe(201);

		// Verify that the custom fields were saved in the item
		const fetchedItem = await BasicItem.findById(createdItem._id)
			.populate<{ customFields: { field: ICustomField; value: unknown }[] }>('customFields.field')
			.exec();
		expect(fetchedItem).not.toBeNull();
		expect(fetchedItem?.customFields).toHaveLength(2);

		// Access field names and values
		const fieldNames = fetchedItem?.customFields?.map((cf: { field: ICustomField; value: unknown }) => (cf.field as ICustomField).fieldName);
		expect(fieldNames).toEqual(expect.arrayContaining(['Warranty', 'Price']));

		const fieldValues = fetchedItem?.customFields?.map((cf: { field: ICustomField; value: unknown }) => cf.value);
		expect(fieldValues).toEqual(expect.arrayContaining(['2 years', 100.0]));
	});

	it('should create an item, add a custom field, and update the custom field', async () => {
		const customFieldData = { fieldName: 'Warranty', dataType: 'string' };
		const cfEvent = createMockEvent({
			method: 'POST',
			body: customFieldData,
			url: 'http://localhost:3000/api/customFields'
		});
		const customFieldResponse = await createCustomFieldHandler(cfEvent);
		const customField = await customFieldResponse.json();

		expect(customFieldResponse.status).toBe(201);

		const itemData = {
			name: 'Test Item with Custom Field',
			description: 'An item to test custom fields',
			tags: ['tag1'],
			customFields: [
				{ field: customField._id, value: '1 year' }
			]
		};
		const createEvent = createMockEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});
		const createResponse = await createItemHandler(createEvent);
		const createdItem = await createResponse.json();

		expect(createResponse.status).toBe(201);

		const updatedCustomFields = [
			{ field: customField._id, value: '2 years' }
		];
		const updateEvent = createMockEvent({
			method: 'PATCH',
			body: { customFields: updatedCustomFields },
			url: `http://localhost:3000/api/items/${createdItem._id}`,
			params: { id: createdItem._id }
		});
		const updateResponse = await updateItemHandler(updateEvent);
		const updateBody = await updateResponse.json();

		expect(updateResponse.status).toBe(200);
		expect(updateBody.customFields[0].value).toBe('2 years');

		const updatedItem = await BasicItem.findById(createdItem._id).exec();
		expect(updatedItem?.customFields).toHaveLength(1);
		expect(updatedItem?.customFields![0].value).toBe('2 years');
	});

	it('should update an item with a custom field in string format', async () => {
		const customFieldData = { fieldName: 'custom field', dataType: 'string' };
		const cfEvent = createMockEvent({
			method: 'POST',
			body: customFieldData,
			url: 'http://localhost:3000/api/customFields'
		});
		const customFieldResponse = await createCustomFieldHandler(cfEvent);
		const customField = await customFieldResponse.json();

		expect(customFieldResponse.status).toBe(201);

		const itemData = {
			name: 'Test Item',
			description: 'A sample item for testing',
			tags: ['tag1', 'tag2'],
			customFields: [
				{ field: customField._id, value: 'custom field value' }
			]
		};

		const creationEvent = createMockEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});
		const creationResponse = await createItemHandler(creationEvent);
		const creationBody = await creationResponse.json();

		expect(creationResponse.status).toBe(201);
		const itemId = creationBody._id;
		expect(creationBody.customFields).toHaveLength(1);
		expect(creationBody.customFields[0].value).toBe('custom field value');

		const updatedData = {
			name: 'Updated Test Item',
			description: 'Updated description',
			tags: ['tag1', 'tag2'],
			customFields: `[{ "field": "${customField._id}", "value": "updated custom field value" }]`
		};

		const updateEvent = createMockEvent({
			method: 'PATCH',
			body: updatedData,
			url: `http://localhost:3000/api/items/${itemId}`,
			params: { id: itemId }
		});
		const updateResponse = await updateItemHandler(updateEvent);
		const updateBody = await updateResponse.json();

		expect(updateResponse.status).toBe(200);
		expect(updateBody.customFields).toHaveLength(1);
		expect(updateBody.customFields[0].value).toBe('updated custom field value');
	});
});

describe('Item and Template API', () => {
	it('should delete a used template and ensure the item has it removed', async () => {
		const customField = await CustomField.create({ fieldName: 'field1', dataType: 'string' });

		const template = await Template.create({ name: 'Testy', fields: [customField._id] });

		const itemData = {
			name: 'Test Item',
			description: 'An item using a template',
			template: template._id,
		};
		const itemEvent = createMockEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});
		const itemResponse = await createItemHandler(itemEvent);
		const createdItem = await itemResponse.json();

		expect(itemResponse.status).toBe(201);

		const deleteEvent = createMockEvent({
			method: 'DELETE',
			url: `http://localhost:3000/api/templates/${template._id}`,
			params: { id: template._id.toString() }
		});
		const deleteResponse = await deleteTemplateHandler(deleteEvent);
		const deleteBody = await deleteResponse.json();

		expect(deleteResponse.status).toBe(200);
		expect(deleteBody.message).toBe('Template deleted successfully');

		const updatedItem = await BasicItem.findById(createdItem._id).exec();
		expect(updatedItem).not.toBeNull();
		expect(updatedItem?.template).toBeUndefined();
	});

	it('should edit a template and update items with new custom fields', async () => {
		const customField1 = await CustomField.create({ fieldName: 'field1', dataType: 'string' });
		const customField2 = await CustomField.create({ fieldName: 'field2', dataType: 'number' });
		const customField3 = await CustomField.create({ fieldName: 'field3', dataType: 'boolean' });

		const template = await Template.create({ name: 'Original Template', fields: [customField1._id, customField2._id] });

		const itemData = {
			name: 'Test Item',
			description: 'An item using a template',
			template: template._id,
			customFields: [
				{ field: customField1._id, value: 'value1' },
				{ field: customField2._id, value: 123 }
			]
		};
		const itemEvent = createMockEvent({
			method: 'POST',
			body: itemData,
			url: 'http://localhost:3000/api/items'
		});
		const itemResponse = await createItemHandler(itemEvent);
		const createdItem = await itemResponse.json();

		expect(itemResponse.status).toBe(201);

		//Update the Template
		const updatedTemplateData = {
			name: 'Updated Template',
			fields: [customField2._id, customField3._id],
		};
		const updateTemplateEvent = createMockEvent({
			method: 'PUT',
			body: updatedTemplateData,
			url: `http://localhost:3000/api/templates/editTemplate/${template._id}`,
			params: { id: template._id.toString() }
		});
		const response = await editTemplateHandler(updateTemplateEvent);
		const responseBody = await response.json();

		expect(response.status).toBe(200);
		expect(responseBody.name).toBe(updatedTemplateData.name);

		//Verify that the item has the new custom field added
		const updatedItem = await BasicItem.findById(createdItem._id).populate('customFields.field').exec();
		expect(updatedItem).not.toBeNull();
		expect(updatedItem?.customFields).toHaveLength(3);
		expect(updatedItem?.customFields?.find((cf: { field: ICustomField; value: unknown }) => (cf.field as unknown as ICustomField).fieldName === 'field3')?.value).toBe("");
	});
});

describe('Item Tree API', () => {
	it('should fetch root level items with hasChildren flag', async () => {
		const rootItem = await BasicItem.create({
			name: 'Root Item'
		});

		await BasicItem.create({
			name: 'Child Item',
			parentItem: rootItem._id
		});

		await BasicItem.create({
			name: 'Empty Root'
		});

		const treeEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost:3000/api/items/tree'
		}) as RequestEvent; // Type cast to avoid route mismatch
		const response = await getTreeHandler(treeEvent);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveLength(2);

		const rootWithChild = body.find((item: { name: string; }) => item.name === 'Root Item');
		const rootWithoutChild = body.find((item: { name: string; }) => item.name === 'Empty Root');

		expect(rootWithChild.hasChildren).toBe(true);
		expect(rootWithoutChild.hasChildren).toBe(false);
		expect(rootWithChild.children).toHaveLength(1);
		expect(rootWithChild.children[0].name).toBe('Child Item');
	});

	it('should fetch subtree for specific item', async () => {
		const parentItem = await BasicItem.create({
			name: 'Parent'
		});

		const childItem = await BasicItem.create({
			name: 'Child',
			parentItem: parentItem._id
		});

		await BasicItem.create({
			name: 'Grandchild',
			parentItem: childItem._id
		});

		const subtreeEvent = createMockEvent({
			method: 'GET',
			url: `http://localhost:3000/api/items/tree/${childItem._id}`,
			params: { id: childItem._id.toString() }
		});
		const response = await getTreeHandler(subtreeEvent);
		const body = await response.json();

		expect(response.status).toBe(200);

		expect(body.name).toBe('Child');
		expect(body.hasChildren).toBe(true);
		expect(body.children).toHaveLength(1);
		expect(body.children[0].name).toBe('Grandchild');
		expect(body.children[0].hasChildren).toBe(false);
	});
});