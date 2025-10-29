import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import request from 'supertest';
import BasicItem, { type IBasicItemPopulated } from '../src/models/basicItem.js';
import customFieldRouter from '../src/routes/customFieldRoutes.js';
import itemRouter from '../src/routes/itemRoutes.js';
import TemplateRouter from '../src/routes/templateRoutes.js';
import { FileExporter } from '../src/utility/file/FileExporter.js';
import { FileLoader } from '../src/utility/file/FileLoader.js';
import { CSVFormatterPopulated } from '../src/utility/formating/CSVFormatterPopulated.js';
import { CSVItemParserPopulated } from '../src/utility/parsing/CSVItemParserPopulated.js';

let app: express.Application;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();

	await mongoose.connect(mongoUri, { dbName: 'test' });

	app = express();
	app.use(express.json());
	app.use('/api/items', itemRouter);
	app.use('/api/customFields', customFieldRouter);
	app.use('/api/templates', TemplateRouter);
});

afterAll(async () => {
	await mongoose.connection.dropDatabase();
	await mongoose.connection.close();
	await mongoServer.stop();
});

type testItem = { name: string; description: string; tags?: string[] }

function appendItemToArray(itemData: testItem, array: IBasicItemPopulated[]): IBasicItemPopulated[] {
	const item = new BasicItem();
	item._id = new Types.ObjectId();
	item.name = itemData.name;
	item.template = undefined;
	item.description = itemData.description;
	array.push(itemData as unknown as IBasicItemPopulated);
	return array;
}

function newTestItem(index: number): testItem {
	return {
		name: 'test item ' + index,
		description: 'sample item number ' + index + ' for testing',
		tags: []
	};
}

describe('Creating, exporting, and importing many items', () => {
	let itemCount = 2000;
	let timeout = 15000;
	let allCreatedItems: IBasicItemPopulated[] = [];
	let allImportedItems: IBasicItemPopulated[] = [];

	it('should create ' + itemCount + ' new items', async () => {
		for (let i = 0; i < itemCount; i++) {
			const itemData = newTestItem(i);

			allCreatedItems = appendItemToArray(itemData, allCreatedItems);

			const response = await request(app).post('/api/items').send(itemData);
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
		const searchURL = `/api/items/search?` +
      `name=${encodeURIComponent(searchString)}&` +
      `sort=${encodeURIComponent("alphabetical")}&` +
      `exact=${encodeURIComponent("true")}`

		const searchResponse = await request(app).get(searchURL).set('Content-Type', 'application/json');

		expect(searchResponse.status).toBe(200);

		const searchResults = await searchResponse.body as IBasicItemPopulated[];

		expect(searchResults.length).toBe(1);
		expect(searchResults[0].name).toBe(searchString);
	}, timeout);

	it("should search and find all " + itemCount + " items", async () => {
		const searchString = "item";
		const searchURL = `/api/items/search?` +
      `name=${encodeURIComponent(searchString)}&` +
      `sort=${encodeURIComponent("alphabetical")}&` +
      `exact=${encodeURIComponent("false")}`

		const searchResponse = await request(app).get(searchURL).set('Content-Type', 'application/json');

		expect(searchResponse.status).toBe(200);

		const searchResults = await searchResponse.body as IBasicItemPopulated[];

		expect(searchResults.length).toBe(itemCount);
	}, timeout);
});
