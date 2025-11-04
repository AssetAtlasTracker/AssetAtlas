import { connectDB } from '$lib/server/db/mongo.js';
import { bucketReady } from '$lib/server/db/gridfs.js';
import type { Handle } from '@sveltejs/kit';

await connectDB();
await bucketReady;
console.log('MongoDB and GridFS ready');

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};