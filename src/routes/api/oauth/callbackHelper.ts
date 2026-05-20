import { Login, ServiceType } from '$lib/server/db/models/login.js';
import { error, type Cookies } from '@sveltejs/kit';
import * as arctic from 'arctic';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRATION_STR = '7d';
const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;

export function validateState(url: URL, cookies: Cookies, code: string | null, storedStateKey: string) {
	const returnedState = url.searchParams.get('state');
	const storedState = cookies.get(storedStateKey);

	const valid = code && returnedState && storedState && returnedState === storedState;
	if (!valid) {
		throw error(400, 'Invalid state returned');
	}
}

export async function getUser(url: string, accessToken: string){
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	const user = await response.json();
	return user;
}

export async function callbackCore(id: string, name: string, serviceType: ServiceType, cookies: Cookies, deleteOldCookies: (cookies: Cookies) => void) {
	let existingLogin = await Login.findOne({ login_id: id, service_type: serviceType});
	if (!existingLogin) {
		existingLogin = await getNewLogin(id, name, serviceType);
	}

	const token = getToken(existingLogin, name);
	deleteOldCookies(cookies);
	setNewCookies(cookies, token);
}

async function getNewLogin(id: string, name: string, serviceType: ServiceType,) {
	const loginCount = await Login.countDocuments({});
	const isFirstLogin = loginCount === 0;
	
	const newLogin = new Login({
		login_id: id,
		name: name,
		service_type: serviceType,
		permissionLevel: isFirstLogin ? 10 : 1
	});
	
	await newLogin.save();
	return newLogin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getToken(existingLogin: any, name: string) {
	return jwt.sign(
		{
			sub_id: existingLogin.login_id,
			name: name,
			permissionLevel: existingLogin.permissionLevel
		},
		JWT_SECRET,
		{ expiresIn: TOKEN_EXPIRATION_STR }
	);
}

function setNewCookies(cookies: Cookies, token: string){
	cookies.set('auth_token', token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: TOKEN_EXPIRATION_SECONDS
	});
}

export function processCallbackError(callbackError: unknown) {
	if (callbackError instanceof arctic.OAuth2RequestError) {
		throw error(400, `OAuth2 request error: ${callbackError.message}`);
	}
	if (callbackError instanceof arctic.ArcticFetchError) {
		throw error(400, `Arctic Fetch Error: ${callbackError.message}`);
	}
	throw callbackError;
}
