import express from 'express';
import {
  getProfile,
  getUsers,
  login,
  register,
  updateUserPermission
} from '../controllers/authController.js';
import { authenticate, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);

// Admin-only routes
router.put('/permissions', authenticate, requirePermission(9), updateUserPermission);
router.get('/users', authenticate, requirePermission(9), getUsers);

export default router;
