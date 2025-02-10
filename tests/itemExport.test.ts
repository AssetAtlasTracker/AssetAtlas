import { Types } from "mongoose";
import BasicItem, { IBasicItemPopulated } from "../src/models/basicItem";
import CustomField, { ICustomField } from "../src/models/customField";
import { CSVFormatterPopulated } from "../src/utility/formating/CSVFormatterPopulated";
import {describe, it, expect, beforeAll, afterAll, beforeEach} from "vitest";
import { FileExporter } from "../src/utility/file/FileExporter";
import { FileLoader } from "../src/utility/file/FileLoader";
import {ParserManager} from "../src/utility/parsing/ParserManager";
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import itemRouter from '../src/routes/itemRoutes.js';
import customFieldRouter from '../src/routes/customFieldRoutes.js';
import TemplateRouter from '../src/routes/templateRoutes.js';
import Template, { ITemplatePopulated } from '../src/models/template.js';
import { RecentItems } from '../src/models/recentItems.js';

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


describe("Testing Item Exporting", () => {

    it("Should format one item with all types of data", async () => {
        const csvContent = `item name,template,description,amount,seller,sold\ncat,,a black cat,1,barbra,false`;

        let firstItem = new BasicItem();
        firstItem.id = 1;
        firstItem.name = "cat";
        firstItem.template = undefined;
        firstItem.description = "a black cat"
        
        let fieldMap = new Map<Types.ObjectId, ICustomField>();
        firstItem.customFields = [];
        let amountField = new CustomField();
        amountField.id = 20;
        amountField.fieldName = "amount";
        amountField.dataType = "number";
        fieldMap.set(amountField.id, amountField);
        firstItem.customFields.push({field: amountField.id, value: "1"});
        let sellerField = new CustomField();
        sellerField.id = 21;
        sellerField.fieldName = "seller";
        sellerField.dataType = "string";
        fieldMap.set(sellerField.id, sellerField);
        firstItem.customFields.push({field: sellerField.id, value: "barbra"});
        let soldField = new CustomField();
        soldField.id = 22;
        soldField.fieldName = "sold";
        soldField.dataType = "boolean";
        fieldMap.set(soldField.id, soldField);
        firstItem.customFields.push({field: soldField.id, value: "false"});

        const item = firstItem as unknown as IBasicItemPopulated;

        let itemMap = new Map<Types.ObjectId,IBasicItemPopulated>();
        itemMap.set(item._id, item);
        
        const formatter = new CSVFormatterPopulated([item], [], [item]);
    
    });

    it("Should format an item with a subitem and export the content", async () => {
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
        
        const formatter = new CSVFormatterPopulated([firstItem, second], [], [firstItem]);
        const result : string = formatter.formatItems();

        const csvContent : string = `item name,template,description\ndog,,a german shepherd\n>\ncollar,,a blue collar with a dog tag\n<`;
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
        await parser.parseFromFiles([itemData, templateData]);


        const responseT = await request(app).get('/api/templates/getTemplates').send();
        if (!responseT.ok) throw new Error('Failed to fetch templates');
        let templates : ITemplatePopulated[] = [];
        const dataT = await responseT.body;
        templates = dataT as ITemplatePopulated[];
  
        const responseI = await request(app).get(`/api/items/search?name=${encodeURIComponent("")}&sort=alphabetical&exact=false`);
        if (!responseI.ok) throw new Error('Failed to fetch items');
        let items : IBasicItemPopulated[] = [];
        const dataI = await responseI.body;
        items = dataI as IBasicItemPopulated[];
        console.log("Fetched Items for Export:", items);
        const itemRoot = items.filter(item => {return item.parentItem == null});
  
        const formatter = new CSVFormatterPopulated(items, templates, itemRoot);
        const tempContent = formatter.formatTemplates();
        const itemContent = formatter.formatItems();

        const csvContent = `item name,template,description,expiration date,weight,source,expired\nkitchen,,a place to cook food\n>\nfridge,,a place to put food\n>\nmaybe an apple,produce,a green sour thing,Jan 19th,20oz,tree?,true\n<\n<`;
        expect(itemContent).toEqual(csvContent);
        expect(itemContent).toBe(csvContent);
        expect(itemContent.length == csvContent.length);
        console.log(itemContent);

        const exporter = new FileExporter();
        await exporter.export(itemFile, path, itemContent.toString(), extension);

        const result2 = await loader.readFile(`${path}/${itemFile}${extension}`);
        expect(result2).toBe(csvContent);
    });

});