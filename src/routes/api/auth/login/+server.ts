import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import User from '$lib/server/db/models/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

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

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, username: user.username, permissionLevel: user.permissionLevel },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      username: user.username,
      permissionLevel: user.permissionLevel
    }
  }, { status: 200 });
};