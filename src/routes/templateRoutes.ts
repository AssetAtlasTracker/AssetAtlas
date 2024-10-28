import express from 'express';
import {createTemplate, getTemplates, getFields} from '../controllers/templateController.js';

const router = express.Router();

router.post('/createTemplate', createTemplate);
router.get('/getTemplates', getTemplates);
router.get('/getFields/:templateName', getFields);

export default router;