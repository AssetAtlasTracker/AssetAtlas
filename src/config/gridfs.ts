import mongoose from 'mongoose';
import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';

// Define schema for uploads.files
const UploadsFilesSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  length: { type: Number, required: true },
  chunkSize: { type: Number, required: true },
  uploadDate: { type: Date, required: true },
  aliases: { type: [String], default: [] },
  metadata: { type: mongoose.Schema.Types.Mixed }
});

// Register the uploads.files model
mongoose.model('uploads.files', UploadsFilesSchema);

let uploadInstance: multer.Multer | null = null;
export let gfs: mongoose.mongo.GridFSBucket;

export const gridFsReady = new Promise<void>((resolve, reject) => {
  // Wait for mongoose connection to be ready
  if (mongoose.connection.readyState === 1) {
    initializeGridFS(resolve, reject);
  } else {
    mongoose.connection.once('connected', () => {
      initializeGridFS(resolve, reject);
    });
  }
});

function initializeGridFS(resolve: () => void, reject: (err: Error) => void) {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not available');
    }

    // Create GridFSBucket first
    gfs = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads'
    });

    // Then create storage with the URL instead of db instance
    const storage = new GridFsStorage({
      url: process.env.MONGO_URI || 'mongodb://mongo:27017/assetatlas_db',
      file: (req, file) => {
        const filename = `${Date.now()}_${file.originalname}`;
        return {
          filename,
          bucketName: 'uploads'
        };
      }
    });

    storage.on('connection', (db) => {
      console.log('GridFsStorage connected to:', db.databaseName);
      uploadInstance = multer({ storage });
      resolve();
    });

    storage.on('error', (error) => {
      console.error('GridFS Storage error:', error);
      reject(error);
    });

  } catch (error) {
    console.error('Error initializing GridFS:', error);
    reject(error instanceof Error ? error : new Error(String(error)));
  }
}

export function getUpload() {
  if (!uploadInstance) {
    throw new Error("GridFS is not ready yet. Did you await gridFsReady?");
  }
  return uploadInstance;
}