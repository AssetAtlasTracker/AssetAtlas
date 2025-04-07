import type { Request, Response } from 'express';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import type { AuthRequest } from '../middleware/authMiddleware.js';

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    
    // Check if this is the first user ever registered
    const userCount = await User.countDocuments({});
    const isFirstUser = userCount === 0;
    
    // Create a new user (password will be hashed by the pre-save hook)
    const user = new User({
      username,
      passwordHash: password,
      // First user gets level 10, after default is 1
      permissionLevel: isFirstUser ? 10 : 1
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, permissionLevel: user.permissionLevel }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: isFirstUser ? 
        'Admin user registered successfully' : 
        'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        permissionLevel: user.permissionLevel
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: 'Error registering user', 
      error: err instanceof Error ? err.message : String(err)
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, permissionLevel: user.permissionLevel }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        permissionLevel: user.permissionLevel
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Error during login', 
      error: err instanceof Error ? err.message : String(err)
    });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    // User is attached by auth middleware
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      id: user._id,
      username: user.username,
      permissionLevel: user.permissionLevel
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ 
      message: 'Error retrieving profile', 
      error: err instanceof Error ? err.message : String(err)
    });
  }
};

// Update another user's permission level (requirs perm lvl 10)
export const updateUserPermission = async (req: Request, res: Response) => {
  try {
    const { userId, permissionLevel } = req.body;
    
    // Validate inputs
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }
    
    // Validate permission level (must be 1-10)
    const newPermissionLevel = Number(permissionLevel);
    if (isNaN(newPermissionLevel) || newPermissionLevel < 1 || newPermissionLevel > 10) {
      return res.status(400).json({ message: 'Permission level must be between 1 and 10' });
    }
    
    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow modifying own permissions (we may change later)
    const authReq = req as AuthRequest;
    if (targetUser._id.toString() === authReq.user?.id) {
      return res.status(400).json({ 
        message: 'Cannot modify your own permission level' 
      });
    }
    
    targetUser.permissionLevel = newPermissionLevel;
    await targetUser.save();
    
    res.status(200).json({
      message: 'User permission updated successfully',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        permissionLevel: targetUser.permissionLevel
      }
    });
  } catch (err) {
    console.error('Error updating user permission:', err);
    res.status(500).json({ 
      message: 'Error updating user permission', 
      error: err instanceof Error ? err.message : String(err)
    });
  }
};
