import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import type { IBasicItemPopulated } from '$lib/server/db/models/basicItem.js';
import { POST as createItemHandler } from '$routes/api/items/+server.js';
import { GET as searchItemsHandler } from '$routes/api/items/search/+server.js';
import { FileExporter } from '$lib/utility/file/FileExporter.js';
import { FileLoader } from '$lib/utility/file/FileLoader.js';
import { CSVFormatterPopulated } from '$lib/utility/formating/CSVFormatterPopulated.js';
import { CSVItemParserPopulated } from '$lib/utility/parsing/CSVItemParserPopulated.js';

function createMockEvent(options: {
	method?: string;
	body?: Record<string, unknown>;
	headers?: Record<string, string>;
	url?: string;
	params?: Record<string, string>;
}): RequestEvent {
	const headers = new Headers(options.headers || {});
	
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
			requestInit = { method: options.method || 'GET', body: formData, headers };
		} else {
			headers.set('content-type', 'application/json');
			requestInit = { method: options.method || 'GET', body: JSON.stringify(options.body), headers };
		}
	} else {
		requestInit = { method: options.method || 'GET', headers };
	}

	const request = new Request(options.url || 'http://localhost', requestInit);

	return {
		request,
		params: options.params || {},
		url: new URL(request.url),
		locals: {},
		cookies: {} as unknown as RequestEvent['cookies'],
		fetch: globalThis.fetch,
		getClientAddress: () => '127.0.0.1',
		platform: undefined,
		route: { id: null },
		isDataRequest: false,
		isSubRequest: false,
		setHeaders: () => {},
		depends: () => {},
		tracing: undefined,
		isRemoteRequest: false
	} as unknown as RequestEvent;
}

let mongoServer: MongoMemoryServer;

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

type testItem = { name: string; description: string; tags?: string[] }

function newTestItem(index: number): testItem {
	return {
		name: 'test item ' + index,
		description: 'sample item number ' + index + ' for testing',
		tags: []
	};
}

describe('Creating, exporting, and importing many items', () => {
	const itemCount = 2000;
	const timeout = 15000;
	const allCreatedItems: IBasicItemPopulated[] = [];
	const allImportedItems: IBasicItemPopulated[] = [];

	it('should create ' + itemCount + ' new items', async () => {
		for (let i = 0; i < itemCount; i++) {
			const itemData = newTestItem(i);

			allCreatedItems.push(itemData as unknown as IBasicItemPopulated);

			const event = createMockEvent({
				method: 'POST',
				url: 'http://localhost/api/items',
				body: itemData
			});

			const response = await createItemHandler(event);
			expect(response.status).toBe(201);
		}
		expect(allCreatedItems.length).toBe(itemCount);
	}, timeout);

	it("should export " + itemCount + " items", async () => {
		const path = "./tests/resource";
		const filename = "test-csv-item-perf";
		const extension = ".csv";
		const formatter = new CSVFormatterPopulated(allCreatedItems, [], allCreatedItems, []);
		const data: string = formatter.formatItems();
		const exporter = new FileExporter();
		await exporter.export(filename, path, data, extension);

		let expectedFileContent: string = `item name,template,description`;
		for (let i = 0; i < itemCount; i++) {
			const currentItem = allCreatedItems[i];
			expectedFileContent = expectedFileContent.concat(`\n${currentItem.name},,${currentItem.description}`);
		}

		const loader = new FileLoader();
		const actualFileContent = await loader.readFile(`${path}/${filename}${extension}`);
		expect(actualFileContent).toBe(expectedFileContent);
	}, timeout);

	it("should import " + itemCount + " items", async () => {
		const filePath = "./tests/resource/test-csv-item-perf.csv";
		const loader = new FileLoader();
		const content = await loader.readFile(filePath);
		const itemParser = new CSVItemParserPopulated([], [], []);

		const canParse = itemParser.canParse(content.split(/\n|\r/)[0].split(/,/));
		expect(canParse).toBeTruthy();

		itemParser.parse(content);

		const items = itemParser.itemTree;
		expect(items.length).toBe(itemCount);

		items.forEach(item => {
			allImportedItems.push(item as unknown as IBasicItemPopulated);
		});
		for (let i = 0; i < itemCount; i++) {
			const createdItem = allCreatedItems[i];
			const importedItem = allImportedItems[i];
			expect(importedItem.name).toBe(createdItem.name);
			expect(importedItem.description).toBe(createdItem.description);
			expect(importedItem.tags).toEqual(createdItem.tags);
		}
	}, timeout);

	it("should search and find one result among " + itemCount + " items", async () => {
		const searchString = "test item " + (itemCount - 1);
		const searchURL = `http://localhost/api/items/search?` +
      `name=${encodeURIComponent(searchString)}&` +
      `sort=${encodeURIComponent("alphabetical")}&` +
      `exact=${encodeURIComponent("true")}`;

		const event = createMockEvent({
			method: 'GET',
			url: searchURL
		});

		const searchResponse = await searchItemsHandler(event);
		expect(searchResponse.status).toBe(200);

		const searchResults = await searchResponse.json() as IBasicItemPopulated[];

		expect(searchResults.length).toBe(1);
		expect(searchResults[0].name).toBe(searchString);
	}, timeout);

	it("should search and find all " + itemCount + " items", async () => {
		const searchString = "item";
		const searchURL = `http://localhost/api/items/search?` +
      `name=${encodeURIComponent(searchString)}&` +
      `sort=${encodeURIComponent("alphabetical")}&` +
      `exact=${encodeURIComponent("false")}`;

		const event = createMockEvent({
			method: 'GET',
			url: searchURL
		});

		const searchResponse = await searchItemsHandler(event);
		expect(searchResponse.status).toBe(200);

		const searchResults = await searchResponse.json() as IBasicItemPopulated[];

		expect(searchResults.length).toBe(itemCount);
	}, timeout);
});
