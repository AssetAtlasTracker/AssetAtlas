import BasicItem from '$lib/server/db/models/basicItem.js';
import CustomField from '$lib/server/db/models/customField.js';
import { RecentItems } from '$lib/server/db/models/recentItems.js';
import Template from '$lib/server/db/models/template.js';
import type { RequestEvent } from '@sveltejs/kit';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as uploadImagesHandler } from '$routes/api/images/+server.js';

let uploadCounter = 0;
vi.mock('$lib/utility/imageUpload', () => ({
	uploadImage: vi.fn(async (file: File) => {
		const id = `${Date.now()}-${uploadCounter++}-${file.name}`;
		return id;
	})
}));

let mongoServer: MongoMemoryServer;

function createMockEvent(options: {
	method?: string;
	formData?: FormData;
	headers?: Record<string, string>;
	url?: string;
}): RequestEvent {
	const headers = new Headers(options.headers || {});
	
	const request = new Request(options.url || 'http://localhost:3000/api/test', {
		method: options.method || 'POST',
		headers,
		body: options.formData
	});

	return {
		request,
		params: {},
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

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Images API', () => {
	it('Should upload images', async () => {
		const formData = new FormData();
		const file1 = new File([Buffer.from('fake-image-data')], 'fake-image.jpg', { type: 'image/jpeg' });
		const file2 = new File([Buffer.from('fake-image-data')], 'fake-image2.jpg', { type: 'image/jpeg' });
		
		formData.append('images', file1);
		formData.append('images', file2);

		const event = createMockEvent({
			method: 'POST',
			formData,
			url: 'http://localhost:3000/api/images'
		});

		const uploadResponse = await uploadImagesHandler(event);
		const body = await uploadResponse.json();

		expect(uploadResponse.status).toBe(201);
		expect(body.ids).toHaveLength(2);
		expect(body.ids[0]).toMatch(/^\d+-\d+-fake-image\.jpg$/);
		expect(body.ids[1]).toMatch(/^\d+-\d+-fake-image2\.jpg$/);
	});

	it('Should fail to upload images when no images are provided', async () => {
		const formData = new FormData();

		const event = createMockEvent({
			method: 'POST',
			formData,
			url: 'http://localhost:3000/api/images'
		});

		try {
			await uploadImagesHandler(event);
			expect.fail('Should have thrown an error');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			expect(err.status).toBe(400);
			expect(err.body?.message).toBe('No files provided');
		}
	});
});