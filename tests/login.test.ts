/* eslint-disable @typescript-eslint/no-explicit-any */
import * as setCookie from 'set-cookie-parser';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { vi } from 'vitest';
import Login from '../src/models/login.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';


vi.hoisted(() => {
	process.env.JWT_SECRET = 'test-jwt-secret';
	process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
	process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
	process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/oauth/callbackGoogle';
	process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
	process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
	process.env.GITHUB_REDIRECT_URI = 'http://localhost:3000/api/oauth/callbackGithub';
});



const {
	mockCreateAuthorizationURL,
	mockValidateAuthorizationCode,
	mockGenerateState,
	mockGenerateCodeVerifier
} = vi.hoisted(() => ({
	mockCreateAuthorizationURL: vi.fn(),
	mockValidateAuthorizationCode: vi.fn(),
	mockGenerateState: vi.fn(() => 'mock-state'),
	mockGenerateCodeVerifier: vi.fn(() => 'mock-code-verifier')
}));

vi.mock('arctic', () => ({
	Google: vi.fn().mockImplementation(() => ({
		createAuthorizationURL: mockCreateAuthorizationURL,
		validateAuthorizationCode: mockValidateAuthorizationCode,
	})),
	GitHub: vi.fn().mockImplementation(() => ({
		createAuthorizationURL: mockCreateAuthorizationURL,
		validateAuthorizationCode: mockValidateAuthorizationCode,
	})),
	generateState: mockGenerateState,
	generateCodeVerifier: mockGenerateCodeVerifier,
	OAuth2RequestError: class OAuth2RequestError extends Error {
		constructor(public code: string, message: string) {
			super(message);
		}
	},
	ArcticFetchError: class ArcticFetchError extends Error {
		constructor(public cause: unknown) {
			super('Fetch error');
		}
	},
}));

// Mock fetch for API calls
global.fetch = vi.fn();

let app: express.Application;
let mongoServer: MongoMemoryServer;

//Mock a protected route for testing authentication
const mockProtectedRoute = express.Router();

import oauthRouter from '../src/routes/oauthRoutes.js';

beforeAll(async () => {
	vi.stubEnv('JWT_SECRET', 'test-jwt-secret');
	vi.stubEnv('GOOGLE_CLIENT_ID', 'test-google-client-id');
	vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-google-client-secret');
	vi.stubEnv('GOOGLE_REDIRECT_URI', 'http://localhost:3000/api/oauth/callbackGoogle');
	vi.stubEnv('GITHUB_CLIENT_ID', 'test-github-client-id');
	vi.stubEnv('GITHUB_CLIENT_SECRET', 'test-github-client-secret');
	vi.stubEnv('GITHUB_REDIRECT_URI', 'http://localhost:3000/api/oauth/callbackGithub');

	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();

	await mongoose.connect(mongoUri, { dbName: 'test' });

	app = express();
	app.use(express.json());
    app.use(cookieParser());
	app.use('/api/oauth', oauthRouter);
	app.use('/api/mock', mockProtectedRoute); //mock routes for testing auth
});

afterAll(async () => {
	await mongoose.connection.dropDatabase();
	await mongoose.connection.close();
	await mongoServer.stop();
});

beforeEach(() => {
	mongoose.connection.dropCollection("logins");// Clear all logins between tests
	vi.clearAllMocks();
});

describe('OAuth Controller', () => {
	describe('GET /api/oauth/loginGoogle', () => {
		it('should return Google authorization URL', async () => {
			const mockUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth?client_id=test');
			mockCreateAuthorizationURL.mockReturnValue(mockUrl);

			const response = await request(app)
				.get('/api/oauth/loginGoogle');

			expect(response.status).toBe(200);
			expect(response.body.url).toBeDefined();
			expect(response.body.url).toBe(mockUrl.toString());
			expect(mockCreateAuthorizationURL).toHaveBeenCalledWith(
				'mock-state',
				'mock-code-verifier',
				['openid', 'profile']
			);
		});
	});


	describe('GET /api/oauth/loginGithub', () => {
		it('should return GitHub authorization URL', async () => {
			const mockUrl = new URL('https://github.com/login/oauth/authorize?client_id=test');
			mockCreateAuthorizationURL.mockReturnValue(mockUrl);

			const response = await request(app)
				.get('/api/oauth/loginGithub');

			expect(response.status).toBe(200);
			expect(response.body.url).toBeDefined();
			expect(response.body.url).toBe(mockUrl.toString());
			expect(mockCreateAuthorizationURL).toHaveBeenCalledWith(
				'mock-state',
				['user:email', 'repo']
			);
		});
	});


	describe('GET /api/oauth/callbackGoogle', () => {
		it('should create new user on first Google login', async () => {
			const mockAccessToken = 'mock-access-token';
			const mockUser = {
				sub: 'google-user-123',
				name: 'Test User',
			};

			mockValidateAuthorizationCode.mockResolvedValue({
				accessToken: () => mockAccessToken,
			});

			(global.fetch as any).mockResolvedValue({
				json: async () => mockUser,
			});

			const response = await request(app)
				.get('/api/oauth/callbackGoogle')
				.query({ code: 'mock-code', state: 'mock-state' });

			expect(response.status).toBe(302); // Redirect
			expect(response.headers.location).toBe('/');
			expect(response.headers['set-cookie']).toBeDefined();

			// Get the cookie header and scan
			const setCookieHeader = response.headers['set-cookie'];
			scanCookiesForValue(setCookieHeader, 'google-user-123');

			const login = await Login.findOne({ login_id: 'google-user-123' });
			expect(login).toBeTruthy();
			expect(login?.is_google).toBe(true);
			expect(login?.permissionLevel).toBe(10); // First user gets admin
		});

		it('should handle existing Google user', async () => {
			const existingLogin = new Login({
				login_id: 'google-existing-456',
				is_google: true,
				permissionLevel: 1,
			});
			await existingLogin.save();

			const mockAccessToken = 'mock-access-token';
			const mockUser = {
				sub: 'google-existing-456',
				name: 'Existing User',
			};

			mockValidateAuthorizationCode.mockResolvedValue({
				accessToken: () => mockAccessToken,
			});

			(global.fetch as any).mockResolvedValue({
				json: async () => mockUser,
			});

			const response = await request(app)
				.get('/api/oauth/callbackGoogle')
				.query({ code: 'mock-code', state: 'mock-state' });

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe('/');

			// Get the cookie header and scan
			const setCookieHeader = response.headers['set-cookie'];
			scanCookiesForValue(setCookieHeader, 'google-existing-456');

			const logins = await Login.find({ login_id: 'google-existing-456' });
			expect(logins).toHaveLength(1); // Should not create duplicate
		});

	});

	describe('GET /api/oauth/callbackGithub', () => {
		it('should create new user on first GitHub login', async () => {
			const mockAccessToken = 'mock-access-token';
			const mockUser = {
				id: 'github-user-123',
				name: 'Test User',
			};

			mockValidateAuthorizationCode.mockResolvedValue({
				accessToken: () => mockAccessToken,
			});

			(global.fetch as any).mockResolvedValue({
				json: async () => mockUser,
			});

			const response = await request(app)
				.get('/api/oauth/callbackGithub')
				.query({ code: 'mock-code', state: 'mock-state' });

			expect(response.status).toBe(302); // Redirect
			expect(response.headers.location).toBe('/');
			expect(response.headers['set-cookie']).toBeDefined();

			// Get the cookie header and scan
			const setCookieHeader = response.headers['set-cookie'];
			scanCookiesForValue(setCookieHeader, 'github-user-123');

			const login = await Login.findOne({ login_id: 'github-user-123' });
			expect(login).toBeTruthy();
			expect(login?.is_google).toBe(false);
			expect(login?.permissionLevel).toBe(10); // First user gets admin
                 
		});

		it('should handle existing Github user', async () => {
			const existingLogin = new Login({
				login_id: 'github-existing-456',
				is_google: false,
				permissionLevel: 1,
			});
			await existingLogin.save();

			const mockAccessToken = 'mock-access-token';
			const mockUser = {
				id: 'github-existing-456',
				name: 'Existing User',
			};

			mockValidateAuthorizationCode.mockResolvedValue({
				accessToken: () => mockAccessToken,
			});

			(global.fetch as any).mockResolvedValue({
				json: async () => mockUser,
			});

			const response = await request(app)
				.get('/api/oauth/callbackGithub')
				.query({ code: 'mock-code', state: 'mock-state' });

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe('/');

			// Get the cookie header and scan
			const setCookieHeader = response.headers['set-cookie'];
			scanCookiesForValue(setCookieHeader, 'github-existing-456');

			const logins = await Login.find({ login_id: 'github-existing-456' });
			expect(logins).toHaveLength(1); // Should not create duplicate
		});
	});


	describe('GET /api/oauth/profile', () => {
		it('should return user profile for logged in user', async () => {

			const token = jwt.sign(
				{
					sub_id: 'github-existing-456',
				    name: 'Existing User',
					permissionLevel: 1
				},
				'test-jwt-secret',
				{ expiresIn: '7d' }
			);
            
			const response = await request(app)
				.get('/api/oauth/profile')
				.set('Cookie', `auth_token=${token}`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				sub_id: 'github-existing-456',
				name: 'Existing User',
				permissionLevel: 1,
			});
		});

		it('should return 401 for unauthenticated user', async () => {
			const response = await request(app)
				.get('/api/oauth/profile');

			expect(response.status).toBe(401);
		});
	});


});
function scanCookiesForValue(setCookieHeader: string, searchValue: string) {
	
	expect(setCookieHeader).toBeDefined();
    
	const combinedCookieHeader = Array.isArray(setCookieHeader) ? setCookieHeader.join(', ') : setCookieHeader;

	const cookies = setCookie.parse(combinedCookieHeader, {
		decodeValues: true // Decodes cookie values (e.g., URL-encoded characters)
	});

	const jwtCookie = cookies.find(cookie => cookie.name === 'auth_token');
	expect(jwtCookie).toBeDefined();
	expect(jwtCookie?.value).toBeDefined();
	const decoded = jwt.verify(jwtCookie!.value, process.env.JWT_SECRET!);
	expect((decoded as any).sub_id).toBe(searchValue);
	
}

