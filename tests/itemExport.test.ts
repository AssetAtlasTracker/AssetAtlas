import BasicItem, { type IBasicItemPopulated } from "$lib/server/db/models/basicItem.js";
import CustomField, { type ICustomField } from "$lib/server/db/models/customField.js";
import { RecentItems } from '$lib/server/db/models/recentItems.js';
import Template, { type ITemplatePopulated } from '$lib/server/db/models/template.js';
import { FileExporter } from "$lib/utility/file/FileExporter.js";
import { FileLoader } from "$lib/utility/file/FileLoader.js";
import { CSVFormatterPopulated } from "$lib/utility/formating/CSVFormatterPopulated.js";
import { ParserManager } from "$lib/utility/parsing/ParserManager.js";
import { GET as searchItemsHandler } from '$routes/api/items/search/+server.js';
import { GET as getTemplatesHandler } from '$routes/api/templates/+server.js';
import type { RequestEvent } from '@sveltejs/kit';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import { describe, expect, it } from "vitest";

let mongoServer: MongoMemoryServer;

// Helper function to create a mock RequestEvent for SvelteKit
function createMockEvent(options: {
	method?: string;
	url?: string;
	params?: Record<string, string>;
}): RequestEvent {
	const headers = new Headers();
	const request = new Request(options.url || 'http://localhost:3000/api/test', {
		method: options.method || 'GET',
		headers
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


describe("Testing Item Exporting", () => {

	it("Should format one item with all types of data", async () => {
		const firstItem = new BasicItem();
		firstItem.id = 1;
		firstItem.name = "cat";
		firstItem.template = undefined;
		firstItem.description = "a black cat"

		const fieldMap = new Map<Types.ObjectId, ICustomField>();
		firstItem.customFields = [];
		const amountField = new CustomField();
		amountField.id = 20;
		amountField.fieldName = "amount";
		amountField.dataType = "number";
		fieldMap.set(amountField.id, amountField);
		firstItem.customFields.push({ field: amountField.id, value: "1" });
		const sellerField = new CustomField();
		sellerField.id = 21;
		sellerField.fieldName = "seller";
		sellerField.dataType = "string";
		fieldMap.set(sellerField.id, sellerField);
		firstItem.customFields.push({ field: sellerField.id, value: "barbra" });
		const soldField = new CustomField();
		soldField.id = 22;
		soldField.fieldName = "sold";
		soldField.dataType = "boolean";
		fieldMap.set(soldField.id, soldField);
		firstItem.customFields.push({ field: soldField.id, value: "false" });

		const item = firstItem as unknown as IBasicItemPopulated;

		const itemMap = new Map<Types.ObjectId, IBasicItemPopulated>();
		itemMap.set(item._id, item);
	});

	it("Should format an item with a subitem and export the content", async () => {
		mongoServer = await MongoMemoryServer.create();
		const mongoUri = mongoServer.getUri();

		await mongoose.connect(mongoUri, { dbName: 'test' });

		await BasicItem.deleteMany({});
		await CustomField.deleteMany({});
		await Template.deleteMany({});
		await RecentItems.deleteMany({});
		await Promise.all([
			RecentItems.create({ type: 'item', recentIds: [], maxItems: 5 }),
			RecentItems.create({ type: 'template', recentIds: [], maxItems: 5 }),
			RecentItems.create({ type: 'customField', recentIds: [], maxItems: 5 })
		]);


		const path = "./tests/resource";
		const filename = "test-csv-item-2";
		const extension = ".csv";
		const loader = new FileLoader();

		const firstItem = new BasicItem() as unknown as IBasicItemPopulated;
		firstItem._id = new Types.ObjectId();
		firstItem.name = "dog";
		firstItem.template = undefined;
		firstItem.description = "a german shepherd";


		const secondItem = new BasicItem();
		secondItem._id = new Types.ObjectId();
		secondItem.name = "collar";
		secondItem.template = undefined;
		secondItem.description = "a blue collar with a dog tag";

		firstItem.containedItems = [secondItem];
		secondItem.parentItem = firstItem._id;

		const second = secondItem as unknown as IBasicItemPopulated;

		const formatter = new CSVFormatterPopulated([firstItem, second], [], [firstItem], []);
		const result: string = formatter.formatItems();

		const csvContent: string = `item name,template,description\ndog,,a german shepherd\n>\ncollar,,a blue collar with a dog tag\n<`;
		expect(result === csvContent).toBeTruthy();
		expect(result.length == csvContent.length);
		console.log(result);

		const exporter = new FileExporter();
		await exporter.export(filename, path, result, extension);

		const result2 = await loader.readFile(`${path}/${filename}${extension}`);
		expect(result2).toBe(csvContent);
	});

	it("Should format an item parsed from a file and export the content", async () => {
		const path = "./tests/resource";
		const itemFile = "test-csv-item-3";
		const templateFile = "test-csv-template-1";
		const extension = ".csv";

		const loader = new FileLoader();
		const itemData = await loader.readFile(`${path}/${itemFile}${extension}`);
		const templateData = await loader.readFile(`${path}/${templateFile}${extension}`);

		const parser = new ParserManager();
		parser.parseFromFiles([itemData, templateData], [], []).then(async () => {
			const templatesEvent = createMockEvent({
				method: 'GET',
				url: 'http://localhost:3000/api/templates'
			});
			const responseT = await getTemplatesHandler(templatesEvent);
			const dataT = await responseT.json();
			const templates: ITemplatePopulated[] = dataT as ITemplatePopulated[];

			const searchEvent = createMockEvent({
				method: 'GET',
				url: `http://localhost:3000/api/items/search?name=${encodeURIComponent("")}&sort=alphabetical&exact=false`
			});
			const responseI = await searchItemsHandler(searchEvent);
			const dataI = await responseI.json();
			const items: IBasicItemPopulated[] = dataI as IBasicItemPopulated[];
			console.log("Fetched Items for Export:", items);
			const itemRoot = items.filter(item => { return item.parentItem == null });

			const formatter = new CSVFormatterPopulated(items, templates, itemRoot, []);
			const itemContent = formatter.formatItems();

			const csvContent = `item name,template,description,expiration date,weight,source,expired\nkitchen,,a place to cook food\n>\nfridge,,a place to put food\n>\nmaybe an apple,produce,a green sour thing,Jan 19th,20oz,tree?,true\n<\n<`;
			expect(itemContent).toEqual(csvContent);
			console.log(itemContent);

			const exporter = new FileExporter();
			await exporter.export(itemFile, path, itemContent.toString(), extension);

			//expect(result2).toBe(csvContent);

			await mongoose.connection.dropDatabase();
			await mongoose.connection.close();
			await mongoServer.stop();
		});
	});

});