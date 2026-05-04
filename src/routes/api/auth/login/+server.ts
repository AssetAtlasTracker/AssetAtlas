import User from '$lib/server/db/models/user.js';
import { loginCore } from '$lib/utility/loginHelper';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const { username, password } = await request.json();

	// Find user by username
	const user = await User.findOne({ username });
	if (!user) {
		throw error(401, 'Invalid credentials');
	}

	// Verify password
	const isPasswordValid = await user.comparePassword(password);
	if (!isPasswordValid) {
		throw error(401, 'Invalid credentials');
	}

	return loginCore(user, 'Login successful', 200);
};
