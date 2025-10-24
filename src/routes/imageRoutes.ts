import express from 'express';
import { uploadMultiple } from "../controllers/imageController.js";

const router = express.Router();

router.all('/', uploadMultiple);

export default router;