import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /password-reset/request
router.post('/request', async (req, res) => {
  const { email } = req.body;

  // Validate required fields
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  logger.info(`Password reset requested for email: ${email}`);

  // Find guest by email - will throw if not found
  const guest = await pb.collection('guests').getFirstListItem(`email = "${email}"`);

  // Generate 64-character hex token (32 bytes)
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration: 24 hours from now
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiresAtDateOnly = expiresAt.toISOString().split('T')[0];

  logger.info(`Generated password reset token for guest ${guest.id}: ${token.substring(0, 10)}...`);

  // Update guest record with token and expiration
  // PocketBase hook 'guest-password-reset-email' will automatically send the email
  await pb.collection('guests').update(guest.id, {
    password_reset_token: token,
    password_reset_expires_at: expiresAtDateOnly,
  });

  logger.info(`Password reset email triggered for guest ${guest.id} (${email})`);
  res.status(200).json({ 
    success: true, 
    message: 'Password reset email sent',
  });
});

// POST /password-reset/verify-token
router.post('/verify-token', async (req, res) => {
  const { token } = req.body;

  // Validate required fields
  if (!token) {
    throw new Error('Token is required');
  }

  logger.info(`Verifying password reset token: ${token.substring(0, 10)}...`);

  // Find guest with matching token - will throw if not found
  const guest = await pb.collection('guests').getFirstListItem(`password_reset_token = "${token}"`);

  // Check if token has expired
  const now = new Date().toISOString().split('T')[0];
  const expiresAt = guest.password_reset_expires_at;

  if (expiresAt < now) {
    logger.warn(`Token verification failed: token expired for guest ${guest.id}`);
    const err = new Error('Token expired');
    err.statusCode = 410;
    throw err;
  }

  logger.info(`Password reset token verified for guest ${guest.id} (${guest.email})`);
  res.status(200).json({ valid: true, email: guest.email });
});

// POST /password-reset/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  // Validate required fields
  if (!token || !password) {
    throw new Error('Token and password are required');
  }

  // Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }

  logger.info(`Attempting password reset with token: ${token.substring(0, 10)}...`);

  // Find guest with matching token - will throw if not found
  const guest = await pb.collection('guests').getFirstListItem(`password_reset_token = "${token}"`);

  // Check if token has expired
  const now = new Date().toISOString().split('T')[0];
  const expiresAt = guest.password_reset_expires_at;

  if (expiresAt < now) {
    logger.warn(`Password reset failed: token expired for guest ${guest.id}`);
    const err = new Error('Token expired');
    err.statusCode = 410;
    throw err;
  }

  logger.info(`Attempting password reset for guest: ${guest.email}`);

  // Update guest password and clear reset fields
  await pb.collection('guests').update(guest.id, {
    password: password,
    password_reset_token: '',
    password_reset_expires_at: null,
  });

  logger.info(`Password reset successful for guest: ${guest.email}`);
  res.status(200).json({ success: true, message: 'Password reset successfully' });
});

// POST /password-reset/resend
router.post('/resend', async (req, res) => {
  const { email } = req.body;

  // Validate required fields
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  logger.info(`Password reset resend requested for email: ${email}`);

  // Find guest by email - will throw if not found
  const guest = await pb.collection('guests').getFirstListItem(`email = "${email}"`);

  // Generate new token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration: 24 hours from now
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiresAtDateOnly = expiresAt.toISOString().split('T')[0];

  logger.info(`Generated new password reset token for guest ${guest.id}: ${token.substring(0, 10)}...`);

  // Update guest record with new token and expiration
  // PocketBase hook 'guest-password-reset-email' will automatically send the email
  await pb.collection('guests').update(guest.id, {
    password_reset_token: token,
    password_reset_expires_at: expiresAtDateOnly,
  });

  logger.info(`Password reset email resent for guest ${guest.id} (${email})`);
  res.status(200).json({ 
    success: true, 
    message: 'Password reset email sent',
  });
});

export default router;