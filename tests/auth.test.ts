import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { requireAuth, requirePermissionLevel } from '../src/lib/server/auth.js';
import User from '../src/lib/server/db/models/user.js';
import { POST as registerHandler } from '../src/routes/api/auth/register/+server.js';
import { POST as loginHandler } from '../src/routes/api/auth/login/+server.js';
import { GET as profileHandler } from '../src/routes/api/auth/profile/+server.js';
import { PUT as permissionsHandler } from '../src/routes/api/auth/permisisons/+server.js';
import type { RequestEvent } from '@sveltejs/kit';

let mongoServer: MongoMemoryServer;

// Helper function to create a mock RequestEvent for SvelteKit
function createMockEvent(options: {
	method?: string;
	body?: Record<string, unknown>;
	headers?: Record<string, string>;
	url?: string;
}): RequestEvent {
	const headers = new Headers(options.headers || {});
	const request = new Request(options.url || 'http://localhost:3000/api/test', {
		method: options.method || 'GET',
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined
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

// Mock protected route handlers for testing
async function mockProtectedRouteHandler(event: RequestEvent): Promise<Response> {
	try {
		requireAuth(event);
		return new Response(JSON.stringify({ message: 'Access granted to protected route' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		const error = err as { status?: number; body?: { message?: string } };
		return new Response(JSON.stringify({ message: error.body?.message || 'Authentication required' }), {
			status: error.status || 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function mockAdminRouteHandler(event: RequestEvent): Promise<Response> {
	try {
		requirePermissionLevel(event, 10);
		return new Response(JSON.stringify({ message: 'Access granted to admin route' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		const error = err as { status?: number; body?: { message?: string } };
		return new Response(JSON.stringify({ message: error.body?.message || 'Insufficient permissions' }), {
			status: error.status || 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}
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
	await User.deleteMany({});
});

describe('Authentication API', () => {
	it('should register users and assign appropriate permission levels', async () => {
		// First user should get admin privileges (level 10)
		const firstUserData = {
			username: 'adminuser',
			password: 'password123'
		};

		const firstEvent = createMockEvent({
			method: 'POST',
			body: firstUserData,
			url: 'http://localhost:3000/api/auth/register'
		});

		const firstResponse = await registerHandler(firstEvent);
		const firstBody = await firstResponse.json();

		expect(firstResponse.status).toBe(201);
		expect(firstBody).toHaveProperty('token');
		expect(firstBody.user).toHaveProperty('username', 'adminuser');
		expect(firstBody.user).toHaveProperty('permissionLevel', 10);
		expect(firstBody.message).toBe('Admin user registered successfully');

		// Second user should get regular privileges (level 1)
		const secondUserData = {
			username: 'regularuser',
			password: 'password123'
		};

		const secondEvent = createMockEvent({
			method: 'POST',
			body: secondUserData,
			url: 'http://localhost:3000/api/auth/register'
		});

		const secondResponse = await registerHandler(secondEvent);
		const secondBody = await secondResponse.json();

		expect(secondResponse.status).toBe(201);
		expect(secondBody).toHaveProperty('token');
		expect(secondBody.user).toHaveProperty('username', 'regularuser');
		expect(secondBody.user).toHaveProperty('permissionLevel', 1);
		expect(secondBody.message).toBe('User registered successfully');

		// Verify users in database
		const adminUser = await User.findOne({ username: 'adminuser' }).select('username permissionLevel');
		const regularUser = await User.findOne({ username: 'regularuser' }).select('username permissionLevel');

		expect(adminUser).not.toBeNull();
		expect(adminUser?.permissionLevel).toBe(10);

		expect(regularUser).not.toBeNull();
		expect(regularUser?.permissionLevel).toBe(1);
	});

	it('should not register a user with duplicate username', async () => {
		// Register a user first
		const userData = {
			username: 'testuser',
			password: 'password123'
		};

		const firstEvent = createMockEvent({
			method: 'POST',
			body: userData,
			url: 'http://localhost:3000/api/auth/register'
		});

		await registerHandler(firstEvent);

		// Try to register with same username
		const secondEvent = createMockEvent({
			method: 'POST',
			body: userData,
			url: 'http://localhost:3000/api/auth/register'
		});

		const response = await registerHandler(secondEvent);
		const body = await response.json();

		expect(response.status).toBe(409);
		expect(body).toHaveProperty('message', 'Username already exists');
	});

	it('should login a user with correct credentials', async () => {
		// Register a user first
		const userData = {
			username: 'loginuser',
			password: 'password123'
		};

		const registerEvent = createMockEvent({
			method: 'POST',
			body: userData,
			url: 'http://localhost:3000/api/auth/register'
		});

		await registerHandler(registerEvent);

		// Login with correct credentials
		const loginEvent = createMockEvent({
			method: 'POST',
			body: userData,
			url: 'http://localhost:3000/api/auth/login'
		});

		const loginResponse = await loginHandler(loginEvent);
		const loginBody = await loginResponse.json();

		expect(loginResponse.status).toBe(200);
		expect(loginBody).toHaveProperty('token');
		expect(loginBody).toHaveProperty('message', 'Login successful');
	});

	it('should not login with incorrect credentials', async () => {
		// Register user first
		const userData = {
			username: 'loginuser',
			password: 'password123'
		};

		const registerEvent = createMockEvent({
			method: 'POST',
			body: userData,
			url: 'http://localhost:3000/api/auth/register'
		});

		await registerHandler(registerEvent);

		// Try login with wrong password
		const loginData = {
			username: 'loginuser',
			password: 'wrongpassword'
		};

		const loginEvent = createMockEvent({
			method: 'POST',
			body: loginData,
			url: 'http://localhost:3000/api/auth/login'
		});

		const response = await loginHandler(loginEvent);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body).toHaveProperty('message', 'Invalid credentials');
	});

	it('should access protected route with valid token from login', async () => {
		// Register and login to get a token
		const userData = {
			username: 'protecteduser',
			password: 'password123'
		};

		const registerEvent = createMockEvent({
			method: 'POST',
			body: userData,
			url: 'http://localhost:3000/api/auth/register'
		});

		await registerHandler(registerEvent);

		const loginEvent = createMockEvent({
			method: 'POST',
			body: userData,
			url: 'http://localhost:3000/api/auth/login'
		});

		const loginResponse = await loginHandler(loginEvent);
		const loginBody = await loginResponse.json();
		const token = loginBody.token;

		// Use token to access protected route
		const protectedEvent = createMockEvent({
			method: 'GET',
			headers: { 'Authorization': `Bearer ${token}` },
			url: 'http://localhost:3000/api/mock/protected'
		});

		const response = await mockProtectedRouteHandler(protectedEvent);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveProperty('message', 'Access granted to protected route');
	});

	it('should deny access to protected route without token', async () => {
		const protectedEvent = createMockEvent({
			method: 'GET',
			url: 'http://localhost:3000/api/mock/protected'
		});

		const response = await mockProtectedRouteHandler(protectedEvent);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body).toHaveProperty('message', 'Authentication required');
	});

	it('should deny access with invalid token', async () => {
		const protectedEvent = createMockEvent({
			method: 'GET',
			headers: { 'Authorization': 'Bearer invalidtoken' },
			url: 'http://localhost:3000/api/mock/protected'
		});

		const response = await mockProtectedRouteHandler(protectedEvent);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.message).toMatch(/Invalid|expired|required/i);
	});

	it('should deny access to admin route with insufficient permissions', async () => {
		// Register admin user (first user) and regular user (second user)
		const adminUserData = {
			username: 'adminuser',
			password: 'password123'
		};

		const adminRegisterEvent = createMockEvent({
			method: 'POST',
			body: adminUserData,
			url: 'http://localhost:3000/api/auth/register'
		});

		await registerHandler(adminRegisterEvent);

		const regularUserData = {
			username: 'regularuser',
			password: 'password123'
		};

		const regularRegisterEvent = createMockEvent({
			method: 'POST',
			body: regularUserData,
			url: 'http://localhost:3000/api/auth/register'
		});

		await registerHandler(regularRegisterEvent);

		// Login as regular user to get token
		const loginEvent = createMockEvent({
			method: 'POST',
			body: regularUserData,
			url: 'http://localhost:3000/api/auth/login'
		});

		const loginResponse = await loginHandler(loginEvent);
		const loginBody = await loginResponse.json();
		const regularUserToken = loginBody.token;

		// Try to access admin route with regular user token
		const adminEvent = createMockEvent({
			method: 'GET',
			headers: { 'Authorization': `Bearer ${regularUserToken}` },
			url: 'http://localhost:3000/api/mock/admin'
		});

		const response = await mockAdminRouteHandler(adminEvent);
		const body = await response.json();

		expect(response.status).toBe(403);
		expect(body.message).toMatch(/Insufficient permissions|Permission level/i);
	});

	it('should allow access to admin route with sufficient permissions', async () => {
		// Register first user (will automatically get admin level 10)
		const adminUserData = {
			username: 'adminuser',
			password: 'password123'
		};

		const adminRegisterEvent = createMockEvent({
			method: 'POST',
			body: adminUserData,
			url: 'http://localhost:3000/api/auth/register'
		});

		const adminResponse = await registerHandler(adminRegisterEvent);
		const adminBody = await adminResponse.json();
		const adminToken = adminBody.token;

		// Use token to access admin route
		const adminEvent = createMockEvent({
			method: 'GET',
			headers: { 'Authorization': `Bearer ${adminToken}` },
			url: 'http://localhost:3000/api/mock/admin'
		});

		const response = await mockAdminRouteHandler(adminEvent);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveProperty('message', 'Access granted to admin route');
	});

	it('should retrieve user profile with valid token', async () => {
		// Register a user and use the token for authentication
		const userData = {
			username: 'profileuser',
			password: 'password123'
		};

		const registerEvent = createMockEvent({
			method: 'POST',
			body: userData,
			url: 'http://localhost:3000/api/auth/register'
		});

		const registerResponse = await registerHandler(registerEvent);
		const registerBody = await registerResponse.json();
		const token = registerBody.token;

		// Get profile with token
		const profileEvent = createMockEvent({
			method: 'GET',
			headers: { 'Authorization': `Bearer ${token}` },
			url: 'http://localhost:3000/api/auth/profile'
		});

		const response = await profileHandler(profileEvent);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toHaveProperty('username', 'profileuser');
		expect(body).not.toHaveProperty('passwordHash');
	});

	it('should allow admin users to update another user\'s permission level', async () => {
		// Register admin user
		const adminUserData = {
			username: 'adminuser',
			password: 'password123'
		};

		const adminRegisterEvent = createMockEvent({
			method: 'POST',
			body: adminUserData,
			url: 'http://localhost:3000/api/auth/register'
		});

		const adminResponse = await registerHandler(adminRegisterEvent);
		const adminBody = await adminResponse.json();
		const adminToken = adminBody.token;

		// Register regular user
		const regularUserData = {
			username: 'regularuser',
			password: 'password123'
		};

		const regularRegisterEvent = createMockEvent({
			method: 'POST',
			body: regularUserData,
			url: 'http://localhost:3000/api/auth/register'
		});

		const regularUserResponse = await registerHandler(regularRegisterEvent);
		const regularUserBody = await regularUserResponse.json();
		const regularUserId = regularUserBody.user.id;

		// Admin updates regular user's permission level
		const updateEvent = createMockEvent({
			method: 'PUT',
			body: {
				userId: regularUserId,
				permissionLevel: 3
			},
			headers: { 'Authorization': `Bearer ${adminToken}` },
			url: 'http://localhost:3000/api/auth/permissions'
		});

		const updateResponse = await permissionsHandler(updateEvent);
		const updateBody = await updateResponse.json();

		expect(updateResponse.status).toBe(200);
		expect(updateBody).toHaveProperty('message', 'User permission updated successfully');
		expect(updateBody.user).toHaveProperty('permissionLevel', 3);

		// Verify through login
		const loginEvent = createMockEvent({
			method: 'POST',
			body: regularUserData,
			url: 'http://localhost:3000/api/auth/login'
		});

		const loginResponse = await loginHandler(loginEvent);
		const loginBody = await loginResponse.json();

		expect(loginBody.user).toHaveProperty('permissionLevel', 3);
	});

	it('should not allow a user to modify their own permission level', async () => {
		// Register admin user
		const adminUserData = {
			username: 'adminuser',
			password: 'password123'
		};

		const adminRegisterEvent = createMockEvent({
			method: 'POST',
			body: adminUserData,
			url: 'http://localhost:3000/api/auth/register'
		});

		const adminResponse = await registerHandler(adminRegisterEvent);
		const adminBody = await adminResponse.json();
		const adminToken = adminBody.token;
		const adminId = adminBody.user.id;

		// Try to update own permission level
		const updateEvent = createMockEvent({
			method: 'PUT',
			body: {
				userId: adminId,
				permissionLevel: 5
			},
			headers: { 'Authorization': `Bearer ${adminToken}` },
			url: 'http://localhost:3000/api/auth/permissions'
		});

		const updateResponse = await permissionsHandler(updateEvent);
		const updateBody = await updateResponse.json();

		expect(updateResponse.status).toBe(400);
		expect(updateBody).toHaveProperty('message', 'Cannot modify your own permission level');
	});
});
