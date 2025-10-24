import type { NextFunction, Request, Response } from 'express';
import type { GridFSFile } from "mongodb";
import { getUpload } from '../config/gridfs.js';

export const uploadMultiple = (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Uploading: ', req.body.images);
        const upload = getUpload();
        console.log(upload.array('images'));
        upload.array('images')(req, res, next);
    } catch (err) {
        next(err);
    }

    try {
        console.log("Got", req.files);
        const files = req.files as unknown as GridFSFile[];
        const ids = files.map(file => { return file._id || file.filename });
        console.log("Ids", ids);
        res.status(201).json({ ids });
    } catch (err) {
        console.error('Error uploading images:', req.body.images, ": ", err);
        res.status(500).json({ message: 'Error uploading images' });
    }
}