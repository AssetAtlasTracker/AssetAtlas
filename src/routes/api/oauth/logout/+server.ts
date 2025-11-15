import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('auth_token', {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production'
	});

	return json({ message: 'Logged out successfully' });
};
