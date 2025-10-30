import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requirePermissionLevel } from '$lib/server/auth.js';
import User from '$lib/server/db/models/user.js';

export const GET: RequestHandler = async (event) => {
  try {
    requirePermissionLevel(event, 9);

    const users = await User.find().select('-passwordHash');

    return json(
      users.map(user => ({
        id: user._id,
        username: user.username,
        permissionLevel: user.permissionLevel,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    );
  } catch (err) {
    console.error('Error retrieving users:', err);
    return json({
      message: 'Error retrieving users',
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};