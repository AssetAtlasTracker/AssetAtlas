import express from 'express';
import { exportToFolder, importFromFile } from '../controllers/csvController.js';
const router = express.Router();

router.post('/import', importFromFile);
router.post('/export', exportToFolder);

export default router;