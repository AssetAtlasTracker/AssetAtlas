import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth.js';
import { Login } from '$lib/server/db/models/login.js';

export const GET: RequestHandler = async (event) => {
	try {
		// Require permission level 9 or higher (works with both auth types)
		if(getPermissionLevel(event) < 9){
			return json({
				message: 'Insufficient permissions to access user list'
			}, { status: 403 });
		}

		// Get Login accounts (OAuth)
		const logins = await Login.find();

		return json({
			oauthUsers: logins.map(login => ({
				id: login.login_id,
				name: login.name,
				serviceType: login.service_type,
				permissionLevel: login.permissionLevel,
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

function getPermissionLevel(event: any) : number {
	const user = requireAuth(event);
	if ('permissionLevel' in user) {
		return user.permissionLevel;
	}
	return 0;
}

