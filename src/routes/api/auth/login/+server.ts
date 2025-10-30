import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import User from '$lib/server/db/models/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, password } = await request.json();

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return json({ message: 'Invalid credentials' }, { status: 401 });
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
  } catch (err) {
    console.error('Login error:', err);
    return json({
      message: 'Error during login',
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
};