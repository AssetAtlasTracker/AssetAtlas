import express from 'express';
import { createTemplate, deleteTemplate, editTemplate, getFields, getTemplateById, getTemplates, searchTemplates } from '../controllers/templateController.js';

const router = express.Router();

router.post('/createTemplate', createTemplate);
router.get('/getTemplates', getTemplates);
router.get('/getFields/:templateName', getFields);
router.get('/searchTemplates', searchTemplates);
router.get('/:id', getTemplateById);
router.delete('/:id', deleteTemplate);
router.put('/editTemplate/:id', editTemplate);

export default router;