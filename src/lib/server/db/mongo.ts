import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

export async function connectDB() {
	if (mongoose.connection.readyState === 1) {
		return mongoose.connection;
	}

	if (mongoose.connection.readyState === 2) {
		return new Promise((resolve, reject) => {
			mongoose.connection.once('connected', () => resolve(mongoose.connection));
			mongoose.connection.once('error', reject);
		});
	}

	try {
		const db = await mongoose.connect(MONGODB_URI, {
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
		});
    
		console.log('MongoDB connected:', db.connection.db?.databaseName);
		await import('./models/index.js');
		return db.connection;
	} catch (error) {
		console.error('MongoDB connection error:', error);
		throw error;
	}
}

async function shutdown() {
	try {
		await mongoose.connection.close(false);
		process.exit(0);
	} catch (error) {
		process.exit(1);
	}
}


mongoose.connection.on('connected', () => {
	console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
	console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
	console.log('Mongoose disconnected');
});

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());