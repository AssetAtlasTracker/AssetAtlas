import express from 'express';
import { getRecentsByType } from '../controllers/recentItemsController.js';

const router = express.Router();

router.get('/:type', getRecentsByType);

export default router;