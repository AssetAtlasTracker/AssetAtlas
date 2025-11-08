import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';
import { requirePermissionLevel } from '$lib/server/auth.js';
import User from '$lib/server/db/models/user.js';

export const PUT: RequestHandler = async (event) => {
  try {
    // Require permission level 9 or higher
    const currentUser = requirePermissionLevel(event, 9);
    
    const { userId, permissionLevel } = await event.request.json();

    // Validate inputs
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return json({ message: 'Valid user ID is required' }, { status: 400 });
    }

    // Validate permission level (must be 1-10)
    const newPermissionLevel = Number(permissionLevel);
    if (isNaN(newPermissionLevel) || newPermissionLevel < 1 || newPermissionLevel > 10) {
      return json({ message: 'Permission level must be between 1 and 10' }, { status: 400 });
    }

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return json({ message: 'User not found' }, { status: 404 });
    }

    // Don't allow modifying own permissions
    if (targetUser._id.toString() === currentUser.id) {
      return json({
        message: 'Cannot modify your own permission level'
      }, { status: 400 });
    }

    // Level 9 users cannot modify level 9 or 10 users
    if (currentUser.permissionLevel === 9 && targetUser.permissionLevel >= 9) {
      return json({
        message: 'Level 9 cannot modify 9 or 10 users'
      }, { status: 403 });
    }

    // Level 9 users cannot set permissions to 9 or higher
    if (currentUser.permissionLevel === 9 && newPermissionLevel >= 9) {
      return json({
        message: 'Level 9 users can only set permission levels 1-8'
      }, { status: 403 });
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
  } catch (err) {
    console.error('Error updating user permission:', err);
    return json({
      message: 'Error updating user permission',
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};