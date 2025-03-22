import express from 'express';
import {importFromFile, exportToFolder} from '../controllers/csvController.js';
import { getUpload } from '../config/gridfs.js';
const router = express.Router();

router.post('/import', (req, res, next) => {
     try {
        const upload = getUpload();
        upload.any()(req,res,next);
    } catch (err) {
        console.error(err);
        next(err);
    }
}, importFromFile);
router.post('/export', exportToFolder);

export default router;