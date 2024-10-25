import express from 'express';
import { createItem, getItemById, deleteItemById, searchItems, getAllContainedById, moveItem } from '../controllers/itemController.js';

const router = express.Router();

router.get('/search', searchItems);
router.post('/', createItem);
router.get('/:id', getItemById);
router.delete('/:id', deleteItemById);
router.get('/allContained/:parentId', getAllContainedById);
router.post('/move', moveItem)

export default router;