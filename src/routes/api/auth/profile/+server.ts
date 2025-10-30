import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth.js';
import User from '$lib/server/db/models/user.js';

export const GET: RequestHandler = async (event) => {
  try {
    // Require authentication
    const authUser = requireAuth(event);
    const userId = authUser.id;

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return json({ message: 'User not found' }, { status: 404 });
    }

    return json({
      id: user._id,
      username: user.username,
      permissionLevel: user.permissionLevel
    });
  } catch (err) {
    console.error('Profile error:', err);
    return json({
      message: 'Error retrieving profile',
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};