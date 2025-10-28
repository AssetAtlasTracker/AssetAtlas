import mongoose from 'mongoose';
import { initGridFS } from './gridfs.js';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected:', db.connection.db?.databaseName);
    initGridFS();
    await import('./models/index.js');
    return db.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
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
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});