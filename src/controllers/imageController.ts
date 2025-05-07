import type { GridFSFile } from "mongodb";
import type { Request, Response, NextFunction } from 'express';

export const uploadMultiple = (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Got", req.files);
        const files = req.files as unknown as GridFSFile[];
        const ids = files.map(file => {return file._id || file.filename});
        console.log("Ids", ids);
        res.status(201).json({ids});
    } catch (err) {
        console.error('Error uploading images:', req.body.images);
        res.status(500).json({message: 'Error uploading images'});
    }
}