import express from 'express';
import {uploadMultiple} from "../controllers/imageController.js";
import { getUpload } from '../config/gridfs.js';

const router = express.Router();

router.all('/', (req, res, next) => {
    try {
        console.log('Uploading: ', req.body.images);
        const upload = getUpload();
        console.log(upload.array('images'));
        upload.array('images')(req,res,next);
    } catch (err) {
        next(err);
    }
}, uploadMultiple);

export default router;