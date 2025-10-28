import { connectDB } from '$lib/server/db/mongo.js';
import { bucketReady } from '$lib/server/db/gridfs.js';

let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) return;
  
  console.log('Initializing database connection...');
  await connectDB();
  
  await bucketReady;
  console.log('GridFS initialized');
  
  dbInitialized = true;
  console.log('Database initialization complete');
}

export async function handle({ event, resolve }) {
  if (!dbInitialized) {
    await initializeDatabase();
  }
  
  return resolve(event);
}