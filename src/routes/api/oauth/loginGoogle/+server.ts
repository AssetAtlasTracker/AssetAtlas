import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as arctic from 'arctic';

const google_client_id = process.env.GOOGLE_CLIENT_ID || '';
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET || '';
const google_redirect_uri = process.env.GOOGLE_REDIRECT_URI || '';

export const GET: RequestHandler = async () => {
	if (!google_client_id || !google_client_secret || !google_redirect_uri) {
		throw error(500, 'Google OAuth environment variables not set');
	}

	const state = arctic.generateState();
	const codeVerifier = arctic.generateCodeVerifier();
	
	const google = new arctic.Google(google_client_id, google_client_secret, google_redirect_uri);
	const scopes = ['openid', 'profile'];
	const url = google.createAuthorizationURL(state, codeVerifier, scopes);

	const headers = new Headers();
	headers.append('Set-Cookie', `google_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
	headers.append('Set-Cookie', `google_code_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

	return json(
		{
			message: 'Login successful',
			url: url.toString()
		},
		{ headers }
	);
};
