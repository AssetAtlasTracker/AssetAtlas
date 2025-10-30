import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { authenticate, requirePermission } from '../src/middleware/authMiddleware.js';
import User from '../src/models/user.js';
import authRouter from '../src/routes/authRoutes.js';

let app: express.Application;
let mongoServer: MongoMemoryServer;

//Mock a protected route for testing authentication
const mockProtectedRoute = express.Router();

mockProtectedRoute.get('/protected', authenticate, (req, res) => {
	res.status(200).json({ message: 'Access granted to protected route' });
});

mockProtectedRoute.get('/admin', authenticate, requirePermission(10), (req, res) => {
	res.status(200).json({ message: 'Access granted to admin route' });
});

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	const mongoUri = mongoServer.getUri();

	await mongoose.connect(mongoUri, { dbName: 'test' });

	app = express();
	app.use(express.json());
	app.use('/api/auth', authRouter);
	app.use('/api/mock', mockProtectedRoute); //mock routes for testing auth
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

		const firstResponse = await request(app)
			.post('/api/auth/register')
			.send(firstUserData);

		expect(firstResponse.status).toBe(201);
		expect(firstResponse.body).toHaveProperty('token');
		expect(firstResponse.body.user).toHaveProperty('username', 'adminuser');
		expect(firstResponse.body.user).toHaveProperty('permissionLevel', 10);
		expect(firstResponse.body.message).toBe('Admin user registered successfully');

		// Second user should get regular privileges (level 1)
		const secondUserData = {
			username: 'regularuser',
			password: 'password123'
		};

		const secondResponse = await request(app)
			.post('/api/auth/register')
			.send(secondUserData);

		expect(secondResponse.status).toBe(201);
		expect(secondResponse.body).toHaveProperty('token');
		expect(secondResponse.body.user).toHaveProperty('username', 'regularuser');
		expect(secondResponse.body.user).toHaveProperty('permissionLevel', 1);
		expect(secondResponse.body.message).toBe('User registered successfully');

		// Verify users in database (only check username and permission level)
		const adminUser = await User.findOne({ username: 'adminuser' }).select('username permissionLevel');
		const regularUser = await User.findOne({ username: 'regularuser' }).select('username permissionLevel');

		expect(adminUser).not.toBeNull();
		expect(adminUser?.permissionLevel).toBe(10);

		expect(regularUser).not.toBeNull();
		expect(regularUser?.permissionLevel).toBe(1);
	});

	it('should not register a user with duplicate username', async () => {
		// Register a user first via API
		const userData = {
			username: 'testuser',
			password: 'password123'
		};

		await request(app)
			.post('/api/auth/register')
			.send(userData);

		// Try to register with same username
		const response = await request(app)
			.post('/api/auth/register')
			.send(userData);

		expect(response.status).toBe(409);
		expect(response.body).toHaveProperty('message', 'Username already exists');
	});

	it('should login a user with correct credentials', async () => {
		// Register a user first
		const userData = {
			username: 'loginuser',
			password: 'password123'
		};

		await request(app)
			.post('/api/auth/register')
			.send(userData);

		// Login with correct credentials
		const loginResponse = await request(app)
			.post('/api/auth/login')
			.send(userData);

		expect(loginResponse.status).toBe(200);
		expect(loginResponse.body).toHaveProperty('token');
		expect(loginResponse.body).toHaveProperty('message', 'Login successful');
	});

	it('should not login with incorrect credentials', async () => {
		// Register user first
		const userData = {
			username: 'loginuser',
			password: 'password123'
		};

		await request(app)
			.post('/api/auth/register')
			.send(userData);

		// Try login with wrong password
		const loginData = {
			username: 'loginuser',
			password: 'wrongpassword'
		};

		const response = await request(app)
			.post('/api/auth/login')
			.send(loginData);

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty('message', 'Invalid credentials');
	});

	it('should access protected route with valid token from login', async () => {
		// Register and login to get a token
		const userData = {
			username: 'protecteduser',
			password: 'password123'
		};

		await request(app)
			.post('/api/auth/register')
			.send(userData);

		const loginResponse = await request(app)
			.post('/api/auth/login')
			.send(userData);

		const token = loginResponse.body.token;

		// Use token to access protected route
		const response = await request(app)
			.get('/api/mock/protected')
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('message', 'Access granted to protected route');
	});

	it('should deny access to protected route without token', async () => {
		const response = await request(app).get('/api/mock/protected');

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty('message', 'Authentication required');
	});

	it('should deny access with invalid token', async () => {
		const response = await request(app)
			.get('/api/mock/protected')
			.set('Authorization', 'Bearer invalidtoken');

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty('message', 'Invalid token');
	});

	it('should deny access to admin route with insufficient permissions', async () => {
		// Register admin user (first user) and regular user (second user)
		const adminUserData = {
			username: 'adminuser',
			password: 'password123'
		};

		await request(app)
			.post('/api/auth/register')
			.send(adminUserData);

		const regularUserData = {
			username: 'regularuser',
			password: 'password123'
		};

		await request(app)
			.post('/api/auth/register')
			.send(regularUserData);

		// Login as regular user to get token
		const loginResponse = await request(app)
			.post('/api/auth/login')
			.send(regularUserData);

		const regularUserToken = loginResponse.body.token;

		// Try to access admin route with regular user token
		const response = await request(app)
			.get('/api/mock/admin')
			.set('Authorization', `Bearer ${regularUserToken}`);

		expect(response.status).toBe(403);
		expect(response.body).toHaveProperty('message', 'Insufficient permissions');
	});

	it('should allow access to admin route with sufficient permissions', async () => {
		// Register first user (will automatically get admin level 10)
		const adminUserData = {
			username: 'adminuser',
			password: 'password123'
		};

		const adminResponse = await request(app)
			.post('/api/auth/register')
			.send(adminUserData);

		const adminToken = adminResponse.body.token;

		// Use token to access admin route
		const response = await request(app)
			.get('/api/mock/admin')
			.set('Authorization', `Bearer ${adminToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('message', 'Access granted to admin route');
	});

	it('should retrieve user profile with valid token', async () => {
		// Register a user and use the token for authentication
		const userData = {
			username: 'profileuser',
			password: 'password123'
		};

		const registerResponse = await request(app)
			.post('/api/auth/register')
			.send(userData);

		const token = registerResponse.body.token;

		// Get profile with token
		const response = await request(app)
			.get('/api/auth/profile')
			.set('Authorization', `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('username', 'profileuser');
		expect(response.body).not.toHaveProperty('passwordHash');
	});

	it('should allow admin users to update another user\'s permission level', async () => {
		// Register admin user
		const adminUserData = {
			username: 'adminuser',
			password: 'password123'
		};

		const adminResponse = await request(app)
			.post('/api/auth/register')
			.send(adminUserData);

		const adminToken = adminResponse.body.token;

		// Register regular user
		const regularUserData = {
			username: 'regularuser',
			password: 'password123'
		};

		const regularUserResponse = await request(app)
			.post('/api/auth/register')
			.send(regularUserData);

		const regularUserId = regularUserResponse.body.user.id;

		// Admin updates regular user's permission level
		const updateResponse = await request(app)
			.put('/api/auth/permissions')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				userId: regularUserId,
				permissionLevel: 3
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body).toHaveProperty('message', 'User permission updated successfully');
		expect(updateResponse.body.user).toHaveProperty('permissionLevel', 3);

		// Verify through login
		const loginResponse = await request(app)
			.post('/api/auth/login')
			.send(regularUserData);

		expect(loginResponse.body.user).toHaveProperty('permissionLevel', 3);
	});

	it('should not allow a user to modify their own permission level', async () => {
		// Register admin user
		const adminUserData = {
			username: 'adminuser',
			password: 'password123'
		};

		const adminResponse = await request(app)
			.post('/api/auth/register')
			.send(adminUserData);

		const adminToken = adminResponse.body.token;
		const adminId = adminResponse.body.user.id;

		// Try to update own permission level
		const updateResponse = await request(app)
			.put('/api/auth/permissions')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				userId: adminId,
				permissionLevel: 5
			});

		expect(updateResponse.status).toBe(400);
		expect(updateResponse.body).toHaveProperty('message', 'Cannot modify your own permission level');
	});
});
