import { authenticator } from '@otplib/preset-default';
import { redirect, json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { Login, ServiceType } from '$lib/server/db/models/login';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const username = url.searchParams.get('username');
		const authCode = url.searchParams.get('code');
        
		if (!username || !authCode) {
			return json({ error: 'Username and code are required' }, { status: 400 });
		}
        
		let account = await Login.findOne({ name: username, service_type: ServiceType.AUTHENTICATOR });

		if (!account) {
			return json({ error: 'Account not found' }, { status: 404 });
		}

		const isValid = authenticator.check(authCode, account.login_id);
		
		if (isValid){
			const token = jwt.sign(
				{
					sub_id: account.login_id,
					name: account.name,
					permissionLevel: account.permissionLevel
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);

			cookies.delete('github_oauth_state', { path: '/' });
			cookies.set('auth_token', token, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7
			});

		 return json({
				success: true,
				redirect: '/'
			});
		} else {
			return json({
				success: false,
				error: 'Invalid authentication code'
			});
		}
		
	} catch (error) {

		console.error('Error in GET /api/authenticator/verify:', error);
		return json({ error }, { status: 500 });
		
	}
};