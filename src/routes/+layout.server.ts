import { verifyToken } from '$lib/server/auth.js';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ cookies, request }) => {
	const cookieToken = cookies.get('auth_token');
	const authHeader = request.headers.get('authorization');
	const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
	const payload = verifyToken(cookieToken ?? bearerToken);

	if (!payload) {
		return { user: null };
	}

	if ('sub_id' in payload) {
		return {
			user: {
				name: payload.name,
				sub_id: payload.sub_id,
				permissionLevel: payload.permissionLevel
			}
		};
	}

	return {
		user: {
			name: payload.username,
			sub_id: payload.id,
			permissionLevel: payload.permissionLevel
		}
	};
};
