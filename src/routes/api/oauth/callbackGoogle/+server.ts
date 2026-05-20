import { ServiceType } from '$lib/server/db/models/login.js';
import type { RequestHandler } from '@sveltejs/kit';
import { error, redirect, type Cookies } from '@sveltejs/kit';
import * as arctic from 'arctic';
import { callbackCore, getUser, processCallbackError, validateState } from '../callbackHelper';

const google_client_id = process.env.GOOGLE_CLIENT_ID || '';
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET || '';
const google_redirect_uri = process.env.GOOGLE_REDIRECT_URI || '';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	validateState(url, cookies, code, "google_oauth_state");
	
	const googleCodeVerifier = cookies.get('google_code_verifier');
	if (!googleCodeVerifier) {
		throw error(400, 'Code verifier not found');
	}

	try {
		const google = new arctic.Google(google_client_id, google_client_secret, google_redirect_uri);
		const tokens = await google.validateAuthorizationCode(code as string, googleCodeVerifier);
		const accessToken = tokens.accessToken();

		const user = await getUser('https://openidconnect.googleapis.com/v1/userinfo', accessToken);
		const id = user.sub;
		const name = user.name;

		await callbackCore(id, name, ServiceType.GOOGLE, cookies, deleteOldCookies);

		throw redirect(302, '/oauth/success');
	} catch (e) {
		processCallbackError(e);
		return new Response('Authentication failed', { status: 400 });
	}
};

const deleteOldCookies = (cookies: Cookies) => {
	cookies.delete('google_oauth_state', { path: '/' });
	cookies.delete('google_code_verifier', { path: '/' });
}
