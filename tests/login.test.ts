/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { RequestEvent, Cookies } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { Login, ServiceType } from '$lib/server/db/models/login.js';
import { GET as loginGoogleHandler } from '$routes/api/oauth/loginGoogle/+server.js';
import { GET as loginGithubHandler } from '$routes/api/oauth/loginGithub/+server.js';
import { GET as callbackGoogleHandler } from '$routes/api/oauth/callbackGoogle/+server.js';
import { GET as callbackGithubHandler } from '$routes/api/oauth/callbackGithub/+server.js';
import { GET as profileHandler } from '$routes/api/oauth/profile/+server.js';
import { POST as logoutHandler } from '$routes/api/oauth/logout/+server.js';
import { POST as authenticatorCheckHandler } from '$routes/api/authenticator/check/+server.js';
import { GET as authenticatorVerifyHandler } from '$routes/api/authenticator/verify/+server.js';
import type { mock } from 'node:test';


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

const {
	mockGenerateSecret,
	mockKeyuri,
	mockCheck
} = vi.hoisted(() => ({
	mockGenerateSecret: vi.fn(() => 'mock-secret-12345'),
	mockKeyuri: vi.fn((user: string, service: string, secret: string) => 
		`otpauth://totp/${service}:${user}?secret=${secret}&issuer=${service}`),
	mockCheck: vi.fn()
}));

const { mockToDataURL } = vi.hoisted(() => ({
	mockToDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,mock-qr-code-data'))
}));

vi.mock('qrcode', () => ({
	default: {
		toDataURL: mockToDataURL
	}
}));

vi.mock('@otplib/preset-default', () => ({
	authenticator: {
		generateSecret: mockGenerateSecret,
		keyuri: mockKeyuri,
		check: mockCheck
	}
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

let mongoServer: MongoMemoryServer;

// Helper to create mock RequestEvent
function createMockEvent(options: {
	method?: string;
	url?: string;
	searchParams?: Record<string, string>;
	cookies?: Record<string, string>;
	headers?: Record<string, string>;
}): RequestEvent {
	const headers = new Headers(options.headers || {});
	const url = new URL(options.url || 'http://localhost');
	
	// Add search params to URL
	if (options.searchParams) {
		Object.entries(options.searchParams).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});
	}

	const request = new Request(url.toString(), {
		method: options.method || 'GET',
		headers
	});

	const cookieStore: Record<string, string> = options.cookies || {};
	const setCookieHeaders: string[] = [];

	const cookies: Cookies = {
		get: (name: string) => cookieStore[name],
		set: (name: string, value: string, opts?: any) => {
			cookieStore[name] = value;
			const cookieParts = [`${name}=${value}`];
			if (opts?.path) cookieParts.push(`Path=${opts.path}`);
			if (opts?.httpOnly) cookieParts.push('HttpOnly');
			if (opts?.secure) cookieParts.push('Secure');
			if (opts?.sameSite) cookieParts.push(`SameSite=${opts.sameSite}`);
			if (opts?.maxAge) cookieParts.push(`Max-Age=${opts.maxAge}`);
			setCookieHeaders.push(cookieParts.join('; '));
		},
		delete: (name: string, opts?: any) => {
			delete cookieStore[name];
			setCookieHeaders.push(`${name}=; Max-Age=0; Path=${opts?.path || '/'}`);
		},
		serialize: (name: string, value: string) => {
			return `${name}=${value}`;
		},
		getAll: () => Object.entries(cookieStore).map(([name, value]) => ({ name, value }))
	};

	const mockEvent: RequestEvent = {
		request,
		params: {},
		url,
		locals: {},
		cookies,
		fetch: global.fetch,
		getClientAddress: () => '127.0.0.1',
		isDataRequest: false,
		isSubRequest: false,
		platform: undefined,
		route: { id: null },
		setHeaders: () => {},
		tracing: {
			fetchStart: () => {}
		} as any,
		isRemoteRequest: false
	};

	// Store setCookieHeaders on the mock for testing
	(mockEvent as any).setCookieHeaders = setCookieHeaders;

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
	vi.restoreAllMocks();
});

beforeEach(async () => {
	await Login.deleteMany({});
	vi.clearAllMocks();
});

describe('OAuth API', () => {
	describe('GET /api/oauth/loginGoogle', () => {
		it('should return Google authorization URL', async () => {
			const mockUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth?client_id=test');
			mockCreateAuthorizationURL.mockReturnValue(mockUrl);

			const event = createMockEvent({
				method: 'GET',
				url: 'http://localhost/api/oauth/loginGoogle'
			});

			const response = await loginGoogleHandler(event);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.url).toBeDefined();
			expect(body.url).toBe(mockUrl.toString());
			expect(mockCreateAuthorizationURL).toHaveBeenCalledWith(
				'mock-state',
				'mock-code-verifier',
				['openid', 'profile']
			);

			// Check Set-Cookie headers from Response
			const setCookieHeader = response.headers.get('set-cookie');
			expect(setCookieHeader).toBeDefined();
			expect(setCookieHeader).toContain('google_oauth_state=mock-state');
			expect(setCookieHeader).toContain('google_code_verifier=mock-code-verifier');
		});
	});

	describe('GET /api/oauth/loginGithub', () => {
		it('should return GitHub authorization URL', async () => {
			const mockUrl = new URL('https://github.com/login/oauth/authorize?client_id=test');
			mockCreateAuthorizationURL.mockReturnValue(mockUrl);

			const event = createMockEvent({
				method: 'GET',
				url: 'http://localhost/api/oauth/loginGithub'
			});

			const response = await loginGithubHandler(event);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.url).toBeDefined();
			expect(body.url).toBe(mockUrl.toString());
			expect(mockCreateAuthorizationURL).toHaveBeenCalledWith(
				'mock-state',
				['user:email', 'repo']
			);

			const setCookieHeader = response.headers.get('set-cookie');
			expect(setCookieHeader).toBeDefined();
			expect(setCookieHeader).toContain('github_oauth_state=mock-state');
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

			const event = createMockEvent({
				method: 'GET',
				url: 'http://localhost/api/oauth/callbackGoogle',
				searchParams: { code: 'mock-code', state: 'mock-state' },
				cookies: { 
					google_oauth_state: 'mock-state',
					google_code_verifier: 'mock-code-verifier'
				}
			});

			try {
				await callbackGoogleHandler(event);
				// Should throw redirect
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.status).toBe(302);
				expect(error.location).toBe('/');
			}

			// Check auth token was set
			const authToken = event.cookies.get('auth_token');
			expect(authToken).toBeDefined();

			const decoded = jwt.verify(authToken!, 'test-jwt-secret') as any;
			expect(decoded.sub_id).toBe('google-user-123');
			expect(decoded.name).toBe('Test User');

			// Verify user was created in database
			const login = await Login.findOne({ login_id: 'google-user-123' });
			expect(login).toBeTruthy();
			expect(login?.service_type).toBe(ServiceType.GOOGLE);
			expect(login?.permissionLevel).toBe(10); // First user gets admin
		});

		it('should handle existing Google user', async () => {
			const existingLogin = new Login({
				login_id: 'google-existing-456',
				service_type: ServiceType.GOOGLE,
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

			const event = createMockEvent({
				method: 'GET',
				url: 'http://localhost/api/oauth/callbackGoogle',
				searchParams: { code: 'mock-code', state: 'mock-state' },
				cookies: {
					google_oauth_state: 'mock-state',
					google_code_verifier: 'mock-code-verifier'
				}
			});

			try {
				await callbackGoogleHandler(event);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.status).toBe(302);
				expect(error.location).toBe('/');
			}

			// Check auth token was set
			const authToken = event.cookies.get('auth_token');
			expect(authToken).toBeDefined();

			const decoded = jwt.verify(authToken!, 'test-jwt-secret') as any;
			expect(decoded.sub_id).toBe('google-existing-456');

			// Verify no duplicate was created
			const logins = await Login.find({ login_id: 'google-existing-456' });
			expect(logins).toHaveLength(1);
		});
	});

	describe('GET /api/oauth/callbackGithub', () => {
		it('should create new user on first GitHub login', async () => {
			const mockAccessToken = 'mock-access-token';
			const mockUser = {
				id: 123456789,
				name: 'Test User',
				login: 'testuser'
			};

			mockValidateAuthorizationCode.mockResolvedValue({
				accessToken: () => mockAccessToken,
			});

			(global.fetch as any).mockResolvedValue({
				json: async () => mockUser,
			});

			const event = createMockEvent({
				method: 'GET',
				url: 'http://localhost/api/oauth/callbackGithub',
				searchParams: { code: 'mock-code', state: 'mock-state' },
				cookies: { github_oauth_state: 'mock-state' }
			});

			try {
				await callbackGithubHandler(event);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.status).toBe(302);
				expect(error.location).toBe('/');
			}

			// Check auth token was set
			const authToken = event.cookies.get('auth_token');
			expect(authToken).toBeDefined();

			const decoded = jwt.verify(authToken!, 'test-jwt-secret') as any;
			expect(decoded.sub_id).toBe('123456789');
			expect(decoded.name).toBe('Test User');

			// Verify user was created in database
			const login = await Login.findOne({ login_id: '123456789' });
			expect(login).toBeTruthy();
			expect(login?.service_type).toBe(ServiceType.GITHUB);
			expect(login?.permissionLevel).toBe(10); // First user gets admin
		});

		it('should handle existing GitHub user', async () => {
			const existingLogin = new Login({
				login_id: '987654321',
				service_type: ServiceType.GITHUB,
				permissionLevel: 1,
			});
			await existingLogin.save();

			const mockAccessToken = 'mock-access-token';
			const mockUser = {
				id: 987654321,
				name: 'Existing User',
				login: 'existinguser'
			};

			mockValidateAuthorizationCode.mockResolvedValue({
				accessToken: () => mockAccessToken,
			});

			(global.fetch as any).mockResolvedValue({
				json: async () => mockUser,
			});

			const event = createMockEvent({
				method: 'GET',
				url: 'http://localhost/api/oauth/callbackGithub',
				searchParams: { code: 'mock-code', state: 'mock-state' },
				cookies: { github_oauth_state: 'mock-state' }
			});

			try {
				await callbackGithubHandler(event);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.status).toBe(302);
				expect(error.location).toBe('/');
			}

			// Check auth token was set
			const authToken = event.cookies.get('auth_token');
			expect(authToken).toBeDefined();

			const decoded = jwt.verify(authToken!, 'test-jwt-secret') as any;
			expect(decoded.sub_id).toBe('987654321');

			// Verify no duplicate was created
			const logins = await Login.find({ login_id: '987654321' });
			expect(logins).toHaveLength(1);
		});
	});

	describe('POST /api/authenticator/check', () => {
		it('should create new authenticator account and return QR code', async () => {
			const username = 'testuser';

			const event = createMockEvent({
				method: 'POST',
				url: 'http://localhost/api/authenticator/check'
			});

			// Mock the request body
			event.request = new Request('http://localhost/api/authenticator/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username })
			});

			const response = await authenticatorCheckHandler(event);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.qrCode).toBe('data:image/png;base64,mock-qr-code-data');
			expect(body.otpCode).toBe('mock-secret-12345');

			// Verify mocks were called correctly
			expect(mockGenerateSecret).toHaveBeenCalled();
			expect(mockKeyuri).toHaveBeenCalledWith(username, 'AssetAtlas', 'mock-secret-12345');
			expect(mockToDataURL).toHaveBeenCalledWith(
				`otpauth://totp/AssetAtlas:${username}?secret=mock-secret-12345&issuer=AssetAtlas`
			);

			// Verify account was created in database
			const login = await Login.findOne({ name: username, service_type: ServiceType.AUTHENTICATOR });
			expect(login).toBeTruthy();
			expect(login?.login_id).toBe('mock-secret-12345');
			expect(login?.service_type).toBe(ServiceType.AUTHENTICATOR);
		});

		it('should see existing authenticator account and only return otpCode', async () => {
			const username = 'testuser_existing';
			const existingLogin = new Login({
				login_id: 'mock-secret-exists',
				name: username,
				service_type: ServiceType.AUTHENTICATOR,
				permissionLevel: 1,
			});
			await existingLogin.save();

			const event = createMockEvent({
				method: 'POST',
				url: 'http://localhost/api/authenticator/check'
			});

			// Mock the request body
			event.request = new Request('http://localhost/api/authenticator/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username })
			});

			const response = await authenticatorCheckHandler(event);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.qrCode).toBeUndefined();
			expect(body.otpCode).toBe('mock-secret-exists');

			// Verify mocks were called correctly
			expect(mockKeyuri).toHaveBeenCalledWith(username, 'AssetAtlas', 'mock-secret-exists');
			expect(mockToDataURL).toHaveBeenCalledWith(
				`otpauth://totp/AssetAtlas:${username}?secret=mock-secret-exists&issuer=AssetAtlas`
			);
		});

		it('should return error for missing username', async () => {
			const event = createMockEvent({
				method: 'POST',
				url: 'http://localhost/api/authenticator/check'
			});

			// Mock the request body
			event.request = new Request('http://localhost/api/authenticator/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: null })
			});

			const response = await authenticatorCheckHandler(event);
			expect(response.status).toBe(400);

			const body = await response.json();
			expect(body.error).toBe('Username is required');

			expect(mockKeyuri).not.toHaveBeenCalled();
			expect(mockToDataURL).not.toHaveBeenCalled();
		});
			
	});

	describe('GET /api/authenticator/verify', () => {

		it('should verify valid OTP code', async () => {
			const username = 'testuser_existing';
			const code = '123456';
			
			const existingLogin = new Login({
				login_id: 'mock-secret-exists',
				name: username,
				service_type: ServiceType.AUTHENTICATOR,
				permissionLevel: 1,
			});
			await existingLogin.save();

			mockCheck.mockReturnValue(true);
			
			const event = createMockEvent({
				method: 'GET',
				url: `http://localhost/api/authenticator/verify?username=${username}&code=${code}`,
				cookies: {}
			});

			const response = await authenticatorVerifyHandler(event);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.redirect).toBe('/');

			const authToken = event.cookies.get('auth_token');
			expect(authToken).toBeDefined();

			expect(mockCheck).toHaveBeenCalledWith(code, 'mock-secret-exists');

		});

		it('should return 400 error for missing username', async () => {
			const code = '123456';
			
			const event = createMockEvent({
				method: 'GET',
				url: `http://localhost/api/authenticator/verify?username=&code=${code}`,
				cookies: {}
			});

			const response = await authenticatorVerifyHandler(event);
			expect(response.status).toBe(400);
			
			const body = await response.json();
			expect(body.error).toBe('Username and code are required');

			expect(mockCheck).not.toHaveBeenCalled();

		});

		it('should return 400 error for missing code', async () => {
			const username = 'user';
			
			const event = createMockEvent({
				method: 'GET',
				url: `http://localhost/api/authenticator/verify?username=${username}&code=`,
				cookies: {}
			});

			const response = await authenticatorVerifyHandler(event);
			expect(response.status).toBe(400);
			
			const body = await response.json();
			expect(body.error).toBe('Username and code are required');

			expect(mockCheck).not.toHaveBeenCalled();

		});

		it('should return 404 error for non-existent account', async () => {
			const username = 'nonexistentuser';
			const code = '123';

			const event = createMockEvent({
				method: 'GET',
				url: `http://localhost/api/authenticator/verify?username=${username}&code=${code}`,
				cookies: {}
			});

			const response = await authenticatorVerifyHandler(event);
			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.error).toBe('Account not found');

			expect(mockCheck).not.toHaveBeenCalled();
		});

		it('should return error for invalid OTP code', async () => {
			const username = 'testuser_existing';
			const code = 'wrongcode';
			const existingLogin = new Login({
				login_id: 'mock-secret-exists',
				name: username,
				service_type: ServiceType.AUTHENTICATOR,
				permissionLevel: 1,
			});
			await existingLogin.save();

			mockCheck.mockReturnValue(false);

			const event = createMockEvent({
				method: 'GET',
				url: `http://localhost/api/authenticator/verify?username=${username}&code=${code}`,
				cookies: {}
			});

			const response = await authenticatorVerifyHandler(event);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.success).toBe(false);

			expect(body.error).toBe('Invalid authentication code');
			expect(mockCheck).toHaveBeenCalledWith(code, 'mock-secret-exists');
		});


	});

	describe('GET /api/oauth/profile', () => {
		it('should return user profile for logged in user', async () => {
			const token = jwt.sign(
				{
					sub_id: 'github-user-456',
					name: 'Test User',
					permissionLevel: 1
				},
				'test-jwt-secret',
				{ expiresIn: '7d' }
			);

			const event = createMockEvent({
				method: 'GET',
				url: 'http://localhost/api/oauth/profile',
				cookies: { auth_token: token }
			});

			const response = await profileHandler(event);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.sub_id).toBe('github-user-456');
			expect(body.name).toBe('Test User');
			expect(body.permissionLevel).toBe(1);
		});

		it('should return 401 for unauthenticated user', async () => {
			const event = createMockEvent({
				method: 'GET',
				url: 'http://localhost/api/oauth/profile'
			});

			try {
				await profileHandler(event);
				expect.fail('Should have thrown 401 error');
			} catch (error: any) {
				expect(error.status).toBe(401);
			}
		});
	});

	describe('POST /api/oauth/logout', () => {
		it('should clear auth cookie', async () => {
			const event = createMockEvent({
				method: 'POST',
				url: 'http://localhost/api/oauth/logout',
				cookies: { auth_token: 'some-token' }
			});

			const response = await logoutHandler(event);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body.message).toBe('Logged out successfully');

			// Verify cookie was deleted from the mock store
			expect(event.cookies.get('auth_token')).toBeUndefined();
		});
	});
});

