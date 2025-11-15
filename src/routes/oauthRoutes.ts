import express from 'express';
import {
	getProfile,
	logout,
	loginGoogle,
	callbackGoogle,
	loginGithub,
	callbackGithub,
	updateUserPermission
} from '../controllers/oauthController.js';
import { authenticate, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/loginGoogle', loginGoogle);
router.get('/callback1', callbackGoogle);
router.get('/loginGithub', loginGithub);
router.get('/callback2', callbackGithub);
router.post('/logout', logout);

// Protected routes
router.get('/profile', getProfile);

// Admin-only routes
router.put('/permissions', authenticate, requirePermission(9), updateUserPermission);
//router.get('/users', authenticate, requirePermission(9), getUsers);

export default router;
