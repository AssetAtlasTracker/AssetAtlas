import express from 'express';
import {debug, importFromFile} from '../controllers/csvController.js';
const router = express.Router();

router.all('/debug', debug);
router.all('/import', importFromFile);
//router.post('/export', exportToFolder);

export default router;