import mongoose from 'mongoose';
import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import { Db } from 'mongodb';

export interface GridFsBucket {
    bucketName: string;
}

export let gfs: mongoose.mongo.GridFSBucket;
export let upload: multer.Multer;

export function initGridFs(db: Db) {
    console.log('initGridFs called with db:', db.databaseName);
    
    // Create GridFSBucket first
    gfs = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'uploads'
    });
    console.log('GridFSBucket created');

    // Create storage with URL instead of db instance
    const storage = new GridFsStorage({
        url: 'mongodb://mongo:27017/assetatlas_db',
        options: {
            useUnifiedTopology: true
        },
        file: (req, file) => {
            console.log('Processing file:', {
                originalname: file.originalname,
                mimetype: file.mimetype,
                encoding: file.encoding
            });
            const filename = `${Date.now()}_${file.originalname}`;
            return {
                filename: filename,
                bucketName: 'uploads',
                metadata: {
                    originalname: file.originalname,
                    mimetype: file.mimetype
                }
            };
        }
    });

    // More detailed error handling
    storage.on('connectionFailed', (err) => {
        console.error('GridFS Connection failed:', err);
        throw new Error(`GridFS Connection failed: ${err.message}`);
    });

    storage.on('connection', (db) => {
        console.log('GridFsStorage connected successfully:', {
            database: db?.databaseName,
            collections: Object.keys(db?.collections || {})
        });
    });

    // Create upload middleware with error handling
    upload = multer({ 
        storage,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        }
    });
    console.log('Multer middleware created with proper storage configuration');
}