import express from 'express';
import { getRecentsByType, addManualRecent } from '../controllers/recentItemsController.js';

const router = express.Router();

router.get('/:type', getRecentsByType);
router.post('/add', addManualRecent);


export default router;