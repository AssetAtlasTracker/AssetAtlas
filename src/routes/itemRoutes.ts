import express from 'express';
import { createItem, getItemById, deleteItemById, searchItems, getAllContainedById, moveItem, updateItem, getParentChain } from '../controllers/itemController.js';

const router = express.Router();

router.get('/search', searchItems);
router.get('/:id', getItemById);
router.get('/parentChain/:id', getParentChain);
router.get('/allContained/:parentID', getAllContainedById);
router.post('/', createItem);
router.post('/move', moveItem)
router.patch('/:id', updateItem);
router.delete('/:id', deleteItemById);

export default router;