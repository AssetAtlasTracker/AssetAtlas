import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth.js';
import User from '$lib/server/db/models/user.js';

export const GET: RequestHandler = async (event) => {
	// Require authentication
	const authUser = requireAuth(event);
	const userId = authUser.id;

	const user = await User.findById(userId).select('-passwordHash');
	if (!user) {
		throw error(404, 'User not found');
	}

	return json({
		id: user._id,
		username: user.username,
		permissionLevel: user.permissionLevel
	});
};