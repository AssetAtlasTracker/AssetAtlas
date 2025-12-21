import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requirePermissionLevel } from '$lib/server/auth.js';
import { Login } from '$lib/server/db/models/login.js';

export const PUT: RequestHandler = async (event) => {
	// Require permission level 9 or higher
	const currentLogin = requirePermissionLevel(event, 9);


	const { userId, permissionLevel } = await event.request.json();

	if (!userId || permissionLevel === undefined) {
		throw error(400, 'userId and permissionLevel are required');
	}

	if (permissionLevel < 1 || permissionLevel > 10) {
		throw error(400, 'Permission level must be between 1 and 10');
	}

	try {
		const targetLogin = await Login.findOne({ login_id: userId });
		if (!targetLogin) {
			throw error(404, 'User not found');
		}

		if('sub_id' in currentLogin && targetLogin.login_id === currentLogin.sub_id) {
			throw error(400, 'Cannot modify your own permission level');
		}

		// Level 9 users cannot modify level 9 or 10 users
		if (currentLogin.permissionLevel === 9 && targetLogin.permissionLevel >= 9) {
			throw error(403, 'Level 9 cannot modify 9 or 10 users');
		}

		// Level 9 users cannot set permissions to 9 or higher
		if (currentLogin.permissionLevel === 9 && permissionLevel >= 9) {
			throw error(403, 'Level 9 users can only set permission levels 1-8');
		}

		targetLogin.permissionLevel = permissionLevel;
		await targetLogin.save();

		return json({
			message: 'Permission level updated successfully',
			user: {
				login_id: targetLogin.login_id,
				permissionLevel: targetLogin.permissionLevel
			}
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update permission level');
	}
};
