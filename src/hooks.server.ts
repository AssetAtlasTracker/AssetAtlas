import { connectDB } from '$lib/server/db/mongo.js';
import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

const dbConnection = connectDB();

function isTrustedOrigin(origin: string | null, host: string): boolean {
	// No origin header means same-origin request (relative fetch calls)
	if (!origin) return true;
  
	try {
		const originUrl = new URL(origin);
		const originHost = originUrl.hostname;
		const requestHost = host.split(':')[0];
    
		if (originHost === host || originHost === requestHost) {
			return true;
		}
    
		if (originHost === 'localhost' || 
        originHost === '127.0.0.1' || 
        originHost === '0.0.0.0') {
			return true;
		}
    
		const ipMatch = originHost.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
		if (ipMatch) {
			const [, a, b] = ipMatch.map(Number);
			// Private IP ranges
			if (a === 10 || 
          (a === 172 && b >= 16 && b <= 31) ||
          (a === 192 && b === 168) ||
          (a === 100 && b >= 64 && b <= 127)) {
				return true;
			}
		}
    
		return false;
	} catch {
		return false;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method)) {
		const origin = event.request.headers.get('origin');
		const host = event.request.headers.get('host') || '';
    
		if (!isTrustedOrigin(origin, host)) {
			throw error(403, 'Cross-site requests are forbidden');
		}
	}
  
	return resolve(event);
};