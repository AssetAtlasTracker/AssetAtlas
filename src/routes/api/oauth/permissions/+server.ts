import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requirePermissionLevel } from '$lib/server/auth.js';
import Login from '$lib/server/db/models/login.js';

export const PUT: RequestHandler = async (event) => {
	// Require permission level 9 or higher
	requirePermissionLevel(event, 9);

	const { userId, permissionLevel } = await event.request.json();

	if (!userId || permissionLevel === undefined) {
		throw error(400, 'userId and permissionLevel are required');
	}

	if (permissionLevel < 1 || permissionLevel > 10) {
		throw error(400, 'Permission level must be between 1 and 10');
	}

	try {
		const login = await Login.findOneAndUpdate(
			{ login_id: userId },
			{ permissionLevel },
			{ new: true }
		);

		if (!login) {
			throw error(404, 'User not found');
		}

		return json({
			message: 'Permission level updated successfully',
			user: {
				login_id: login.login_id,
				permissionLevel: login.permissionLevel
			}
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update permission level');
	}
};
