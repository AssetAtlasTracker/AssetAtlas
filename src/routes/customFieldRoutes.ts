import express from 'express';
import { addCustomField, getCustomFieldById, searchCustomFields } from '../controllers/customFieldController.js';

const router = express.Router();

router.get('/search', searchCustomFields);
router.get('/:id', getCustomFieldById);
router.post('/', addCustomField);

export default router;