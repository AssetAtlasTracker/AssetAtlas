import express from 'express';
import {importFromFile, exportToFolder} from '../controllers/csvController.js';
import { getUpload } from '../config/gridfs.js';
const router = express.Router();

router.all('/import', (req, res, next) => {
     try {
        console.log('Uploading: ', req.body.images);
        const upload = getUpload();
        console.log(upload.array('images'));
        upload.array('images')(req,res,next);
    } catch (err) {
        next(err);
    }
}, importFromFile);
router.post('/export', exportToFolder);

export default router;