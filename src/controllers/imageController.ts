import type { GridFSFile } from "mongodb";
import type { Request, Response, NextFunction } from 'express';


// export const uploadImage = (req: Request, res: Response, next : NextFunction) => {
//     try {
//         const upload = getUpload();
//         upload.single('image')(req,res,next);
//         res.status(201).json({uploaded: req.file});
//     } catch (err) {
//         console.error('Error uploading image:', req.body.image);
//         res.status(500).json({message: 'Error uploading image'});
//     }
// }

export const uploadMultiple = (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = req.files as unknown as GridFSFile[];
        const ids = files.map(file => {return file._id || file.filename});
        res.status(201).json({ids});
    } catch (err) {
        console.error('Error uploading images:', req.body.images);
        res.status(500).json({message: 'Error uploading images'});
    }
}