import 'dotenv/config';
import express from 'express';
import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';
import { createAuthenticatedSuperuserClient } from '../utils/pocketbaseClient.js';
import {
  authMiddleware,
  requireAdmin,
} from '../middleware/auth.js';

const router = express.Router();

const POCKETBASE_URL =
  process.env.POCKETBASE_URL?.trim() ||
  process.env.PB_URL?.trim() ||
  'http://127.0.0.1:8090';

const BOOKING_ADMIN_EMAIL =
  process.env.BOOKING_ADMIN_EMAIL?.trim().toLowerCase();
const BOOKING_ADMIN_PASSWORD = process.env.BOOKING_ADMIN_PASSWORD;

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

    /*
     * A deployment can start while PocketBase is still becoming available,
     * leaving the production administrator with its previous password. When
     * the submitted credentials exactly match the protected Hostinger
     * configuration, repair that single account and retry the login.
     */
    if (
      email === BOOKING_ADMIN_EMAIL &&
      password === BOOKING_ADMIN_PASSWORD
    ) {
      try {
        const adminClient = await createAuthenticatedSuperuserClient();
        const escapedEmail = email
          .replaceAll('\\', '\\\\')
          .replaceAll('"', '\\"');

        let adminUser = null;

        try {
          adminUser = await adminClient
            .collection('users')
            .getFirstListItem(`email = "${escapedEmail}"`);
        } catch (findError) {
          if (findError?.status !== 404) throw findError;
        }

        const adminData = {
          email,
          password,
          passwordConfirm: password,
          is_admin: true,
          name: 'Raya Boutique Admin',
          role: 'admin',
          verified: true,
        };

        if (adminUser) {
          await adminClient.collection('users').update(adminUser.id, adminData);
        } else {
          await adminClient.collection('users').create(adminData);
        }

        const recoveredAuth = await loginClient
          .collection('users')
          .authWithPassword(email, password);

        logger.info(
          `Production administrator recovered and logged in: ${recoveredAuth.record.id}`,
        );

        return res.json({
          success: true,
          token: recoveredAuth.token,
          user: publicUser(recoveredAuth.record),
        });
      } catch (recoveryError) {
        logger.error(
          `Production administrator recovery failed: ${
            recoveryError?.response?.message ||
            recoveryError?.message ||
            'Unknown error'
          }`,
        );
      }
    }

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
