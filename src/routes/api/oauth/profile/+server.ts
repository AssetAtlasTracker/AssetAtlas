import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth.js';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);

	// Return OAuth-style response for compatibility
	if ('sub_id' in user) {
		return json({
			sub_id: user.sub_id,
			name: user.name,
			permissionLevel: user.permissionLevel
		});
	}

	// Legacy User model response
	return json({
		id: user.id,
		username: user.username,
		permissionLevel: user.permissionLevel
	});
};
