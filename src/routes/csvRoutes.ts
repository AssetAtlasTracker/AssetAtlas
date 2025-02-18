import express from 'express';
import {importFromFile, exportToFolder} from '../controllers/csvController.js';
import { getUpload } from '../config/gridfs.js';
const router = express.Router();

router.post('/import', (req, res, next) => {
     try {
        console.log(req.body)
        const upload = getUpload();
        upload.array('images')(req,res,next);
    } catch (err) {
        console.error(err);
        next(err);
    }
}, importFromFile);
router.post('/export', exportToFolder);

export default router;