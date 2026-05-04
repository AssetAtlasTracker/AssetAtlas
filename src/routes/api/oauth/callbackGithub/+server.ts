import { ServiceType } from '$lib/server/db/models/login.js';
import type { RequestHandler } from '@sveltejs/kit';
import { redirect, type Cookies } from '@sveltejs/kit';
import * as arctic from 'arctic';
import { callbackCore, getUser, processCallbackError, validateState } from '../callbackHelper';

const github_client_id = process.env.GITHUB_CLIENT_ID || '';
const github_client_secret = process.env.GITHUB_CLIENT_SECRET || '';
const github_redirect_uri = process.env.GITHUB_REDIRECT_URI || '';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	validateState(url, cookies, code, "github_oauth_state");

	try {
		const github = new arctic.GitHub(github_client_id, github_client_secret, github_redirect_uri);
		const tokens = await github.validateAuthorizationCode(code as string);
		const accessToken = tokens.accessToken();

		const user = await getUser('https://api.github.com/user', accessToken);
		const id = String(user.id);
		const name = user.name || user.login;

		await callbackCore(id, name, ServiceType.GITHUB, cookies, deleteOldCookies);

		throw redirect(302, '/oauth/success');
	} catch (e) {
		processCallbackError(e);
		return new Response('Authentication failed', { status: 400 });
	}
};

const deleteOldCookies = (cookies: Cookies) => {
	cookies.delete('github_oauth_state', { path: '/' });
}
