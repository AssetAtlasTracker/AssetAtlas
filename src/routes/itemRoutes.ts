import express from 'express';
import { createItem, getItemById, deleteItemById, searchItems } from '../controllers/itemController.js';

const router = express.Router();

router.get('/search', searchItems);
router.post('/', createItem);
router.get('/:id', getItemById);
router.delete('/:id', deleteItemById);

export default router;