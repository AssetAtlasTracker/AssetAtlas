import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as arctic from "arctic";
import { Login } from '../models/login.js';

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const google_client_id = process.env.GOOGLE_CLIENT_ID || ""
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET || ""
const google_redirect_uri = process.env.GOOGLE_REDIRECT_URI || ""
const github_client_id = process.env.GITHUB_CLIENT_ID || ""
const github_client_secret = process.env.GITHUB_CLIENT_SECRET || ""
const github_redirect_uri = process.env.GITHUB_REDIRECT_URI || ""

const state = arctic.generateState();//want to store as cookie probably?
const codeVerifier = arctic.generateCodeVerifier();

const google = new arctic.Google(google_client_id, google_client_secret, google_redirect_uri);
const github = new arctic.GitHub(github_client_id, github_client_secret, github_redirect_uri);

export const loginGoogle = async (req: Request, res: Response) => {
	if(!google_client_id || !google_client_secret || !google_redirect_uri) {
		throw new Error("Google OAuth environment variables not set");
	}

	const scopes = ["openid", "profile"];
	const url = google.createAuthorizationURL(state, codeVerifier, scopes);

	res.status(200).json({
		message: 'Login successful',
		url: url
	});
}

export const loginGithub = async (req: Request, res: Response) => {

	if(!github_client_id || !github_client_secret || !github_redirect_uri) {
		throw new Error("GitHub OAuth environment variables not set");
	}

	const scopes = ["user:email", "repo"];
	const url = github.createAuthorizationURL(state, scopes);

	res.status(200).json({
		message: 'Login successful',
		url: url
	});
}

export const callbackGoogle = async (req: Request, res: Response) => {

	const code = req.query.code as string;  
	const returnedState = req.query.state as string;
  
	if (returnedState !== state) {
		throw new Error("Invalid state returned");
  
	}
	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const accessToken = tokens.accessToken();

		const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		const user = await response.json();
		const sub_id = user.sub;
		const name = user.name;

		const existingLogin = await Login.findOne({ login_id: sub_id, is_google: true });

		if (!existingLogin) {
			const loginCount = await Login.countDocuments({});
			const isFirstLogin = loginCount === 0;

			const newLogin = new Login({
				login_id: sub_id,
				is_google: true,
				permissionLevel: isFirstLogin ? 10 : 1
			});
      
			await newLogin.save();

			// Instead of setting the store, generate a JWT token
			const token = jwt.sign(
				{
					sub_id: newLogin.login_id,
					name: name,
					permissionLevel: newLogin.permissionLevel
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);

			// Store it as a cookie or redirect with token
			res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });


		} else {

			const token = jwt.sign(
				{
					sub_id: existingLogin.login_id,
					name: name,
					permissionLevel: existingLogin.permissionLevel
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);

			// Store it as a cookie or redirect with token
			res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });


		}
    

		res.redirect('/'); 

	} catch (e) {
		if (e instanceof arctic.OAuth2RequestError) {
			res.status(400).json({
				message: 'OAuth2 request error',
				error: e.message,
			});
			
		}
		if (e instanceof arctic.ArcticFetchError) {
			res.status(400).json({
				message: 'Arctic Fetch Error',
				error: e.message,
			});
		}
		
	}
}



export const callbackGithub = async (req: Request, res: Response) => {
  
	const code = req.query.code as string;  
	const returnedState = req.query.state as string;
  
	if (returnedState !== state) {
		throw new Error("Invalid state returned");
  
	}
	try {
		const tokens = await github.validateAuthorizationCode(code);
		const accessToken = tokens.accessToken();

		const response = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		const user = await response.json();
		const id = user.id;
		const name = user.name;

		const existingLogin = await Login.findOne({ login_id: id , is_google: false});

		if (!existingLogin) {
			const loginCount = await Login.countDocuments({});
			const isFirstLogin = loginCount === 0;

			const newLogin = new Login({
				login_id: id,
				is_google: false,
				permissionLevel: isFirstLogin ? 10 : 1
			});
      
			await newLogin.save();

			// Instead of setting the store, generate a JWT token
			const token = jwt.sign(
				{
					sub_id: newLogin.login_id,
					name: name,
					permissionLevel: newLogin.permissionLevel
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);

			// Store it as a cookie or redirect with token
			res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });


		} else {

			const token = jwt.sign(
				{
					sub_id: existingLogin.login_id,
					name: name,
					permissionLevel: existingLogin.permissionLevel
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);

			// Store it as a cookie or redirect with token
			res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });


		}
    

		res.redirect('/'); 

	} catch (e) {
		if (e instanceof arctic.OAuth2RequestError) {
			res.status(400).json({
				message: 'OAuth2 request error',
				error: e.message,
			});
			const code = e.code;
			// ...
		}
		if (e instanceof arctic.ArcticFetchError) {
			res.status(400).json({
				message: 'Arctic Fetch Error',
				error: e.message,
			});
		}
		
	}

}

export const getLogins = async (req: Request, res: Response) => {
}

export const getProfile = async (req: Request, res: Response) => {
	try {

		// Get token from cookie
		const token = req.cookies.auth_token; 
    
		if (!token || token === '') {
			return res.status(401).json({ message: 'Not authenticated' });
		}
    
		// Verify and decode the JWT token
		const decoded = jwt.verify(token, JWT_SECRET) as {
			sub_id: string;
			name: string;
			permissionLevel: number;
		};
    
		// Return user data
		res.status(200).json({
			sub_id: decoded.sub_id,
			name: decoded.name,
			permissionLevel: decoded.permissionLevel
		});
    
	} catch (error) {
		res.status(401).json({ message: `Invalid or expired token: "${error}"` });
	}
}

export const logout = async (req: Request, res: Response) => {
	res.clearCookie('auth_token', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production'
	});
    
	res.status(200).json({ message: 'Logged out successfully' });
}

export const updateUserPermission = async (req: Request, res: Response) => {
}
