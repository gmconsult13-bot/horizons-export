import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /admin-password-reset/request
router.post('/request', async (req, res) => {
  const { email } = req.body;

  // Validate email provided
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Validate email format using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // Query users collection by email
  const user = await pb.collection('users').getFirstListItem(`email = "${email}"`);

  // Check if user is admin (check both is_admin boolean and role field)
  const isAdmin = user.is_admin === true || user.role === 'admin';
  if (!isAdmin) {
    const err = new Error('User is not an admin');
    err.statusCode = 403;
    throw err;
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Update user record with token and expiration
  // PocketBase hook will automatically send the email when token is set
  await pb.collection('users').update(user.id, {
    password_reset_token: token,
    password_reset_expires_at: expirationTime,
  });

  logger.info(`Password reset requested for admin: ${email}`);
  res.json({ success: true, message: 'Password reset email sent' });
});

// POST /admin-password-reset/verify-token
router.post('/verify-token', async (req, res) => {
  const { token } = req.body;

  // Validate token provided
  if (!token) {
    return res.status(400).json({ error: 'Token is required.' });
  }

  // Query users collection by password_reset_token
  const user = await pb.collection('users').getFirstListItem(`password_reset_token = "${token}"`);

  // Check if token has expired
  const expiresAt = new Date(user.password_reset_expires_at);
  const now = new Date();

  if (now > expiresAt) {
    const err = new Error('Token has expired');
    err.statusCode = 410;
    throw err;
  }

  logger.info(`Token verified for admin: ${user.email}`);
  res.json({ valid: true, email: user.email });
});

// POST /admin-password-reset/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  // Validate both token and password provided
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required.' });
  }

  // Query users collection by password_reset_token
  const user = await pb.collection('users').getFirstListItem(`password_reset_token = "${token}"`);

  // Check if token has expired
  const expiresAt = new Date(user.password_reset_expires_at);
  const now = new Date();

  if (now > expiresAt) {
    const err = new Error('Token has expired');
    err.statusCode = 410;
    throw err;
  }

  // Validate password strength
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters and contain uppercase, lowercase, and number' });
  }

  // Update user password
  await pb.collection('users').update(user.id, {
    password: password,
    password_reset_token: '',
    password_reset_expires_at: null,
  });

  logger.info(`Password reset successful for admin: ${user.email}`);
  res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
});

export default router;