import express from 'express';
import { createItem, getItemById, deleteItemById, searchItems, getAllContainedById, moveItem, updateItem, getParentChain } from '../controllers/itemController.js';
import { upload } from '../config/gridfs.js';

export async function createRouter() {
    const router = express.Router();
    
    // Wait until upload is defined
    while (!upload) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    router.get('/search', searchItems);
    router.get('/:id', getItemById);
    router.delete('/:id', deleteItemById);
    router.get('/allContained/:parentID', getAllContainedById);
    router.post('/move', moveItem)
    router.patch('/:id', updateItem);
    router.get('/parentChain/:id', getParentChain);
    router.post('/', upload.single('image'), createItem);

    return router;
}