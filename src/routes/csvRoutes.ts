import express from 'express';
import {debug} from '../controllers/csvController';
const router = express.Router();

router.all('/debug', debug);
//router.get('/import', importFromFile);
//router.post('/export', exportToFolder);

export default router;