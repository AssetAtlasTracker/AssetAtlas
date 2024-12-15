import express from 'express';
import {createTemplate, getTemplates, getFields, searchTemplates, getTemplateById} from '../controllers/templateController.js';

const router = express.Router();

router.get('/getTemplates', getTemplates);
router.get('/getFields/:templateName', getFields);
router.get('/searchTemplates', searchTemplates);
router.get('/:id', getTemplateById);
router.post('/', createTemplate);

export default router;