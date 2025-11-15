import jwt from 'jsonwebtoken';
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Legacy User model payload (header-based Bearer token)
interface UserJWTPayload {
  id: string;
  username: string;
  permissionLevel: number;
}

interface OAuthJWTPayload {
  sub_id: string;
  name: string;
  permissionLevel: number;
}

type JWTPayload = UserJWTPayload | OAuthJWTPayload;

function isOAuthPayload(payload: JWTPayload): payload is OAuthJWTPayload {
	return 'sub_id' in payload;
}


export function verifyToken(token: string | undefined): JWTPayload | null {
	if (!token) return null;
	
	try {
		return jwt.verify(token, JWT_SECRET) as JWTPayload;
	} catch {
		return null;
	}
}

export function requireAuth(event: RequestEvent): JWTPayload {
	const cookieToken = event.cookies.get('auth_token');
	if (cookieToken) {
		const payload = verifyToken(cookieToken);
		if (payload) {
			return payload;
		}
	}

	const authHeader = event.request.headers.get('authorization');
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const token = authHeader.substring(7);
		const payload = verifyToken(token);
		if (payload) {
			return payload;
		}
	}

	throw error(401, 'Authentication required');
}

export function requireAdmin(event: RequestEvent): JWTPayload {
	return requirePermissionLevel(event, 10);
}

export function requirePermissionLevel(event: RequestEvent, minLevel: number): JWTPayload {
	const user = requireAuth(event);

	if (user.permissionLevel < minLevel) {
		throw error(403, `Permission level ${minLevel} or higher required`);
	}

	return user;
}

export function getUserId(payload: JWTPayload): string {
	return isOAuthPayload(payload) ? payload.sub_id : payload.id;
}

export function getUserName(payload: JWTPayload): string {
	return isOAuthPayload(payload) ? payload.name : payload.username;
}