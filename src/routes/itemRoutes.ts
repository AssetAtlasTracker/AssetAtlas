import express from 'express';
import {
	createItem,
	deleteItemById,
	getAllContainedById,
	getImage,
	getItemById,
	getItemTree,
	getParentChain,
	moveItem,
	searchItems,
	updateItem
} from '../controllers/itemController.js';

const router = express.Router();

router.get('/search', searchItems);

router.get('/tree/:id?', getItemTree); //do not move this below get item.

router.get('/:id', getItemById);
router.delete('/:id', deleteItemById);
router.get('/allContained/:parentID', getAllContainedById);

router.post('/move', moveItem);
router.patch('/:id', updateItem);

router.get('/parentChain/:id', getParentChain);

router.get('/:id/image', getImage);

router.post('/', createItem);

export default router;