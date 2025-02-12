import express from 'express';
import {uploadMultiple} from "../controllers/imageController.js";
import { getUpload } from '../config/gridfs.js';

const router = express.Router();

router.post('/', (req, res, next) => {
    try {
        const upload = getUpload();
        
        upload.array('images')(req,res,next);
    } catch (err) {
        next(err);
    }
}, uploadMultiple);

export default router;