import jwt from 'jsonwebtoken';
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

interface JWTPayload {
  id: string;
  username: string;
  permissionLevel: number;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (err) {
    return null;
  }
}

export function requireAuth(event: RequestEvent): JWTPayload {
  const authHeader = event.request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw error(401, 'Authentication required');
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  const payload = verifyToken(token);

  if (!payload) {
    throw error(401, 'Invalid or expired token');
  }

  return payload;
}

export function requireAdmin(event: RequestEvent): JWTPayload {
  const user = requireAuth(event);

  if (user.permissionLevel < 10) {
    throw error(403, 'Admin access required');
  }

  return user;
}

export function requirePermissionLevel(event: RequestEvent, minLevel: number): JWTPayload {
  const user = requireAuth(event);

  if (user.permissionLevel < minLevel) {
    throw error(403, `Permission level ${minLevel} or higher required`);
  }

  return user;
}