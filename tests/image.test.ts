import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import request from 'supertest';
import { vi } from 'vitest';
import BasicItem from '../src/models/basicItem.js';
import CustomField from '../src/models/customField.js';
import { RecentItems } from '../src/models/recentItems.js';
import Template from '../src/models/template.js';

vi.mock('../src/config/gridfs.js', () => {
	const mockUpload = {
		array: vi.fn().mockImplementation((fieldName) => {
			return (req: Request, res: Response, next: NextFunction) => {
				req.files = [
					{
						fieldname: fieldName,
						originalname: 'fake-image.jpg',
						encoding: '7bit',
						mimetype: 'image/jpeg',
						size: 100,
						destination: '',
						filename: 'fake-image.jpg',
						path: '',
						buffer: Buffer.from('fake-image-data'),
						stream: Readable.from(Buffer.from('fake-image-data'))
					},
					{
						fieldname: fieldName,
						originalname: 'fake-image2.jpg',
						encoding: '7bit',
						mimetype: 'image/jpeg',
						size: 100,
						destination: '',
						filename: 'fake-image2.jpg',
						path: '',
						buffer: Buffer.from('fake-image-data'),
						stream: Readable.from(Buffer.from('fake-image-data'))
					}
				];
				next();
			};
		})
	};

	return {
		gridFsReady: Promise.resolve(),
		getUpload: vi.fn().mockReturnValue(mockUpload),
		gfs: {}
	};
});

import imageRouter from '../src/routes/imageRoutes.js';

let app: express.Application;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();

	await mongoose.connect(mongoUri, { dbName: 'test' });

	app = express();
	app.use(express.json());
	app.use('/api/image', imageRouter);
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
		const uploadResponse = await request(app)
			.post('/api/image')
			.attach('images', Buffer.from('fake-image-data'), 'fake-image.jpg')
			.attach('images', Buffer.from('fake-image-data'), 'fake-image2.jpg');

		expect(uploadResponse.status).toBe(201);
		expect(uploadResponse.body.ids).toEqual(["fake-image.jpg", "fake-image2.jpg"]);
	});

	it('Should fail to upload images when no images are provided', async () => {
		const uploadResponse = await request(app).post('/api/image');
		expect(uploadResponse.status).toBe(500);
	});
});