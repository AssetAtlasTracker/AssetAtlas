import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as arctic from 'arctic';

const github_client_id = process.env.GITHUB_CLIENT_ID || '';
const github_client_secret = process.env.GITHUB_CLIENT_SECRET || '';
const github_redirect_uri = process.env.GITHUB_REDIRECT_URI || '';

export const GET: RequestHandler = async () => {
	if (!github_client_id || !github_client_secret || !github_redirect_uri) {
		throw error(500, 'GitHub OAuth environment variables not set');
	}

	const state = arctic.generateState();
	
	const github = new arctic.GitHub(github_client_id, github_client_secret, github_redirect_uri);
	const scopes = ['user:email', 'repo'];
	const url = github.createAuthorizationURL(state, scopes);

	const headers = new Headers();
	headers.append('Set-Cookie', `github_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

	return json(
		{
			message: 'Login successful',
			url: url.toString()
		},
		{ headers }
	);
};
