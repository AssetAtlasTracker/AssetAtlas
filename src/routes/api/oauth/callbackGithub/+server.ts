import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import * as arctic from 'arctic';
import { Login } from '$lib/server/db/models/login.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const github_client_id = process.env.GITHUB_CLIENT_ID || '';
const github_client_secret = process.env.GITHUB_CLIENT_SECRET || '';
const github_redirect_uri = process.env.GITHUB_REDIRECT_URI || '';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const returnedState = url.searchParams.get('state');
	const storedState = cookies.get('github_oauth_state');

	if (!code || !returnedState || !storedState || returnedState !== storedState) {
		throw error(400, 'Invalid state returned');
	}

	try {
		const github = new arctic.GitHub(github_client_id, github_client_secret, github_redirect_uri);
		const tokens = await github.validateAuthorizationCode(code);
		const accessToken = tokens.accessToken();

		const response = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		const user = await response.json();
		const id = String(user.id);
		const name = user.name || user.login;

		let existingLogin = await Login.findOne({ login_id: id, service_type: 'github' });

		if (!existingLogin) {
			const loginCount = await Login.countDocuments({});
			const isFirstLogin = loginCount === 0;

			const newLogin = new Login({
				login_id: id,
				service_type: 'github',
				name: name,
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

		cookies.delete('github_oauth_state', { path: '/' });
		cookies.set('auth_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(302, '/');
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
