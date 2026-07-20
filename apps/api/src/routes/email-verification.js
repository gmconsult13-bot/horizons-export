import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /email-verification/verify-email
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;

  // Validate required fields
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  // Query PocketBase for guest with matching token
  const record = await pb.collection('guests').getFirstListItem(`verification_token = "${token}"`);

  // Check if token has expired
  if (record.token_expires_at) {
    const tokenExpiresAt = new Date(record.token_expires_at);
    const now = new Date();

    if (now > tokenExpiresAt) {
      throw new Error('Verification token has expired. Please request a new one.');
    }
  }

  // Update guest record: set email_verified = true, clear token fields
  await pb.collection('guests').update(record.id, {
    email_verified: true,
    verification_token: '',
    token_expires_at: null,
  });

  logger.info(`Email verified for guest ${record.id}`);
  res.json({ success: true, message: 'Email verified successfully' });
});

// POST /email-verification/resend-verification-email
router.post('/resend-verification-email', async (req, res) => {
  const { email } = req.body;

  // Validate required fields
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Query PocketBase for guest with matching email
  const record = await pb.collection('guests').getFirstListItem(`email = "${email}"`);

  // Check if email is already verified
  if (record.email_verified) {
    throw new Error('Email is already verified');
  }

  // Generate new verification token using crypto
  const newToken = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Update guest record with new token and expiration
  await pb.collection('guests').update(record.id, {
    verification_token: newToken,
    token_expires_at: expiresAt.toISOString(),
  });

  // Send verification email
  const verificationLink = `https://rayaboutique.eu/verify-email?token=${newToken}`;
  const emailBody = `
    <p>Hello ${record.first_name || 'Guest'},</p>
    <p>Thank you for registering with Raya Boutique. Please verify your email address by clicking the link below:</p>
    <p><a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
    <p>Or copy and paste this link in your browser:</p>
    <p>${verificationLink}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not register for this account, please ignore this email.</p>
    <p>Best regards,<br>Raya Boutique Team</p>
  `;

  await pb.sendEmail({
    to: email,
    subject: 'Verify Your Email - Raya Boutique',
    html: emailBody,
  });

  logger.info(`Verification email resent for guest ${record.id}`);
  res.json({ success: true, message: 'Verification email sent' });
});

export default router;