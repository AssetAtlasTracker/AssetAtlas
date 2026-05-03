import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRATION = '24h';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loginCore(user: any, successMessage: string, successCode: number){
	const token = jwt.sign(
		{ id: user._id, username: user.username, permissionLevel: user.permissionLevel },
		JWT_SECRET,
		{ expiresIn: TOKEN_EXPIRATION }
	);

	return json({
		message: successMessage,
		token,
		user: {
			id: user._id,
			username: user.username,
			permissionLevel: user.permissionLevel
		}
	}, { status: successCode });
}
