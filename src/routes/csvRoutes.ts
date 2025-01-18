import express from 'express';
import {importFromFile} from '../controllers/csvController.js';
const router = express.Router();


router.all('/import', importFromFile);
//router.post('/export', exportToFolder);

export default router;