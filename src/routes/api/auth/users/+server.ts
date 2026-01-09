import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requirePermissionLevel } from '$lib/server/auth.js';
import User from '$lib/server/db/models/user.js';
import { Login } from '$lib/server/db/models/login.js';

export const GET: RequestHandler = async (event) => {
	try {
		// Require permission level 9 or higher (works with both auth types)
		requirePermissionLevel(event, 9);

		// Get both User accounts (legacy) and Login accounts (OAuth)
		const users = await User.find().select('-passwordHash');
		const logins = await Login.find();

		return json({
			users: users.map(user => ({
				id: user._id,
				username: user.username,
				permissionLevel: user.permissionLevel,
				type: 'legacy',
				createdAt: user.createdAt,
				updatedAt: user.updatedAt
			})),
			oauthUsers: logins.map(login => ({
				id: login.login_id,
				name: login.login_id,
				serviceType: login.service_type,
				permissionLevel: login.permissionLevel,
				type: 'oauth',
				createdAt: login.createdAt,
				updatedAt: login.updatedAt
			}))
		});
	} catch (err) {
		console.error('Error retrieving users:', err);
		return json({
			message: 'Error retrieving users',
			error: err instanceof Error ? err.message : String(err)
		}, { status: 500 });
	}
};