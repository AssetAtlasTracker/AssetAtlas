import express from 'express';
import { addCustomField, searchCustomFields } from '../controllers/customFieldController.js';

const router = express.Router();

router.get('/search', searchCustomFields);
router.post('/', addCustomField);

export default router;