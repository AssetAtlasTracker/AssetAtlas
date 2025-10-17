import type { Request, Response } from 'express';
import type { GridFSFile } from "mongodb";

export const uploadMultiple = (req: Request, res: Response) => {
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