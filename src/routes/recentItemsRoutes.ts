import express from 'express';
import { addManualRecent, getRecentsByType } from '../controllers/recentItemsController.js';

const router = express.Router();

router.get('/:type', getRecentsByType);
router.post('/add', addManualRecent);

export default router;