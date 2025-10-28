import mongoose from 'mongoose';
import type { GridFSBucket } from 'mongodb';

let bucket: GridFSBucket | null = null;
let bucketReady: Promise<GridFSBucket>;
let resolveReady: (value: GridFSBucket) => void;

// Create a promise that resolves when GridFS is ready
bucketReady = new Promise((resolve) => {
  resolveReady = resolve;
});

export function initGridFS() {
  if (bucket) return bucket;
  
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection not established');
  }

  bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });

  console.log('GridFS bucket initialized');
  resolveReady(bucket);
  return bucket;
}

export function getGridFSBucket(): GridFSBucket {
  if (!bucket) {
    throw new Error('GridFS bucket not initialized. Call initGridFS first.');
  }
  return bucket;
}

export { bucketReady };

export async function uploadToGridFS(file: File): Promise<string> {
  await bucketReady; // Wait for GridFS to be ready
  const bucket = getGridFSBucket();
  
  return new Promise(async (resolve, reject) => {
    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Create upload stream
      const uploadStream = bucket.openUploadStream(file.name, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date()
        }
      });

      // Write buffer to stream
      uploadStream.end(buffer);

      uploadStream.on('finish', () => {
        console.log('File uploaded to GridFS:', uploadStream.id);
        resolve(uploadStream.id.toString());
      });

      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}