import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import * as arctic from 'arctic';
import { Login, ServiceType } from '$lib/server/db/models/login.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const google_client_id = process.env.GOOGLE_CLIENT_ID || '';
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET || '';
const google_redirect_uri = process.env.GOOGLE_REDIRECT_URI || '';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const returnedState = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');
	const codeVerifier = cookies.get('google_code_verifier');

	if (!code || !returnedState || !storedState || returnedState !== storedState) {
		throw error(400, 'Invalid state returned');
	}

	if (!codeVerifier) {
		throw error(400, 'Code verifier not found');
	}

	try {
		const google = new arctic.Google(google_client_id, google_client_secret, google_redirect_uri);
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const accessToken = tokens.accessToken();

		const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		const user = await response.json();
		const sub_id = user.sub;
		const name = user.name;

		let existingLogin = await Login.findOne({ login_id: sub_id, service_type: ServiceType.GOOGLE });

		if (!existingLogin) {
			const loginCount = await Login.countDocuments({});
			const isFirstLogin = loginCount === 0;

			const newLogin = new Login({
				login_id: sub_id,
				name: name,
				service_type: ServiceType.GOOGLE,
				permissionLevel: isFirstLogin ? 10 : 1
			});

			await newLogin.save();
			existingLogin = newLogin;
		}

		const token = jwt.sign(
			{
				sub_id: existingLogin.login_id,
				name: name,
				permissionLevel: existingLogin.permissionLevel
			},
			JWT_SECRET,
			{ expiresIn: '7d' }
		);

		cookies.delete('google_oauth_state', { path: '/' });
		cookies.delete('google_code_verifier', { path: '/' });
		cookies.set('auth_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(302, '/oauth/success');
	} catch (e) {
		if (e instanceof arctic.OAuth2RequestError) {
			throw error(400, `OAuth2 request error: ${e.message}`);
		}
		if (e instanceof arctic.ArcticFetchError) {
			throw error(400, `Arctic Fetch Error: ${e.message}`);
		}
		throw e;
	}
};
