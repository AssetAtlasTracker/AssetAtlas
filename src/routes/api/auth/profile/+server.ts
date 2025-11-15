import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requireAuth, getUserId } from '$lib/server/auth.js';
import User from '$lib/server/db/models/user.js';
import Login from '$lib/server/db/models/login.js';

export const GET: RequestHandler = async (event) => {
	// Require authentication (supports both OAuth and legacy User)
	const authUser = requireAuth(event);

	// Check if OAuth (Login model)
	if ('sub_id' in authUser) {
		const login = await Login.findOne({ login_id: authUser.sub_id });
		if (!login) {
			throw error(404, 'User not found');
		}

		return json({
			sub_id: login.login_id,
			name: authUser.name,
			is_google: login.is_google,
			permissionLevel: login.permissionLevel,
			createdAt: login.createdAt,
			updatedAt: login.updatedAt
		});
	}

	// Legacy User model
	const user = await User.findById(authUser.id).select('-passwordHash');
	if (!user) {
		throw error(404, 'User not found');
	}

	return json({
		id: user._id,
		username: user.username,
		permissionLevel: user.permissionLevel,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt
	});
};