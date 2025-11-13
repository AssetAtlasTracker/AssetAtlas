import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import User from '$lib/server/db/models/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

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
    // First user gets level 10, after default is 1
    permissionLevel: isFirstUser ? 10 : 1
  });

  await user.save();

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, username: user.username, permissionLevel: user.permissionLevel },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return json({
    message: isFirstUser ?
      'Admin user registered successfully' :
      'User registered successfully',
    token,
    user: {
      id: user._id,
      username: user.username,
      permissionLevel: user.permissionLevel
    }
  }, { status: 201 });
};