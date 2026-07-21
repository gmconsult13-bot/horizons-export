import 'dotenv/config';
import express from 'express';
import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';
import {
  authMiddleware,
  requireAdmin,
} from '../middleware/auth.js';

const router = express.Router();

const POCKETBASE_URL =
  process.env.POCKETBASE_URL?.trim() ||
  process.env.PB_URL?.trim() ||
  'http://127.0.0.1:8090';

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  is_admin: user.is_admin,
  verified: user.verified,
});

// POST /admin-auth/login
router.post('/login', async (req, res) => {
  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

  const password =
    typeof req.body?.password === 'string'
      ? req.body.password
      : '';

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
    });
  }

  /*
   * Never use the shared API superuser client for user login.
   * An isolated client prevents the login from overwriting the
   * API's PocketBase superuser session.
   */
  const loginClient = new PocketBase(POCKETBASE_URL);
  loginClient.autoCancellation(false);

  try {
    const authData = await loginClient
      .collection('users')
      .authWithPassword(email, password);

    const user = authData.record;

    const isAdmin =
      user?.is_admin === true ||
      user?.role === 'admin';

    if (!isAdmin) {
      loginClient.authStore.clear();

      logger.warn(
        `Non-admin user attempted admin login: ${email}`,
      );

      return res.status(403).json({
        error: 'Administrator access required',
      });
    }

    logger.info(
      `Admin user logged in successfully: ${user.id}`,
    );

    return res.json({
      success: true,
      token: authData.token,
      user: publicUser(user),
    });
  } catch (error) {
    loginClient.authStore.clear();

    logger.warn(
      `Admin login failed for ${email}: ${
        error?.response?.message ||
        error?.message ||
        'Invalid credentials'
      }`,
    );

    /*
     * Do not reveal whether the email or password was incorrect.
     */
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }
});

// POST /admin-auth/logout
router.post(
  '/logout',
  authMiddleware,
  requireAdmin,
  (req, res) => {
    logger.info(`Admin user ${req.user.id} logged out`);

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  },
);

// GET /admin-auth/verify
router.get(
  '/verify',
  authMiddleware,
  requireAdmin,
  (req, res) => {
    logger.info(
      `Token verified for admin user ${req.user.id}`,
    );

    return res.json({
      valid: true,
      token: req.authToken,
      user: req.user,
    });
  },
);

// GET /admin-auth/me
router.get(
  '/me',
  authMiddleware,
  requireAdmin,
  (req, res) => {
    return res.json({
      user: req.user,
    });
  },
);

export default router;