import { json, error, fail } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import { requirePermissionLevel } from '$lib/server/auth.js';
import User from '$lib/server/db/models/user.js';

export const PUT: RequestHandler = async (event) => {
  // Require permission level 9 or higher
  const currentUser = requirePermissionLevel(event, 9);
  
  const { userId, permissionLevel } = await event.request.json();

  // Validate inputs
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw error(400, 'Valid user ID is required');
  }

  // Validate permission level (must be 1-10)
  const newPermissionLevel = Number(permissionLevel);
  if (isNaN(newPermissionLevel) || newPermissionLevel < 1 || newPermissionLevel > 10) {
    throw error(400, 'Permission level must be between 1 and 10');
  }

  // Find the target user
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw error(404, 'User not found');
  }

  // Don't allow modifying own permissions
  if (targetUser._id.toString() === currentUser.id) {
    throw error(400, 'Cannot modify your own permission level');
  }

  // Level 9 users cannot modify level 9 or 10 users
  if (currentUser.permissionLevel === 9 && targetUser.permissionLevel >= 9) {
    throw error(403, 'Level 9 cannot modify 9 or 10 users');
  }

  // Level 9 users cannot set permissions to 9 or higher
  if (currentUser.permissionLevel === 9 && newPermissionLevel >= 9) {
    throw error(403, 'Level 9 users can only set permission levels 1-8');
  }

  targetUser.permissionLevel = newPermissionLevel;
  await targetUser.save();

  return json({
    message: 'User permission updated successfully',
    user: {
      id: targetUser._id,
      username: targetUser.username,
      permissionLevel: targetUser.permissionLevel
    }
  });
};