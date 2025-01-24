import express from 'express';
import {
  createItem,
  getItemById,
  deleteItemById,
  searchItems,
  getAllContainedById,
  moveItem,
  updateItem,
  getParentChain,
  getItemTree
} from '../controllers/itemController.js';
import BasicItem from '../models/basicItem.js';
import { getUpload, gfs } from '../config/gridfs.js';

const router = express.Router();

router.get('/search', searchItems);
router.get('/tree/:id?', getItemTree); //do not move this below get item.
router.get('/:id', getItemById);
router.delete('/:id', deleteItemById);
router.get('/allContained/:parentID', getAllContainedById);
router.post('/move', moveItem);
router.patch('/:id', updateItem);
router.get('/parentChain/:id', getParentChain);

// Add image serving route
router.get('/:id/image', async (req, res) => {
  try {
    const item = await BasicItem.findById(req.params.id).select('image').lean();
    if (!item?.image) {
      return res.status(404).send('No image found');
    }

    const files = await gfs.find({ _id: item.image }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send('No image found');
    }

    const file = files[0];
    
    // Set the proper content type
    res.set('Content-Type', file.contentType);
    
    // Create download stream
    const downloadStream = gfs.openDownloadStream(file._id);
    
    // Pipe the file to the response
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Error getting image');
  }
});

// Modified create item route to handle both with and without image
router.post('/', (req, res, next) => {
  // Check if request contains multipart form data
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    try {
      const upload = getUpload();
      upload.single('image')(req, res, next);
    } catch (err) {
      next(err);
    }
  } else {
    // No image upload, proceed directly to createItem
    next();
  }
}, createItem);

export default router;