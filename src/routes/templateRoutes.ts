import express from 'express';
import {createTemplate, getTemplates} from '../controllers/templateController.js';

const router = express.Router();

router.post('/createTemplate', createTemplate);
router.get('/getTemplates', getTemplates);

export default router;