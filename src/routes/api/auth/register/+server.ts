import User from '$lib/server/db/models/user.js';
import { loginCore } from '$lib/utility/loginHelper';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const { username, password } = await request.json();

	// Check if user already exists
	const existingUser = await User.findOne({ username });
	if (existingUser) {
		throw error(409, 'Username already exists');
	}

	// Check if this is the first user ever registered
	const userCount = await User.countDocuments({});
	const isFirstUser = userCount === 0;

	// Create a new user (password will be hashed by the pre-save hook)
	const user = new User({
		username,
		passwordHash: password,
		// First user gets level 10, afterwards default is 1
		permissionLevel: isFirstUser ? 10 : 1
	});

	await user.save();

	const userIdentifier = isFirstUser ? 'Admin user' : 'User';
	const successMessage = userIdentifier + " registered successfully";

	return loginCore(user, successMessage, 201);
};
