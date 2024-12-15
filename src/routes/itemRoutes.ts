import express from 'express';
import { createItem, getItemById, deleteItemById, searchItems, getAllContainedById, moveItem, updateItem } from '../controllers/itemController.js';

const router = express.Router();

router.get('/search', searchItems);
router.post('/', createItem);
router.get('/:id', getItemById);
router.delete('/:id', deleteItemById);
router.get('/allContained/:parentID', getAllContainedById);
router.post('/move', moveItem)
router.patch('/:id', updateItem);

export default router;