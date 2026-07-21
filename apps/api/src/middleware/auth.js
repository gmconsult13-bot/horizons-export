import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';

const POCKETBASE_URL =
  process.env.POCKETBASE_URL?.trim() ||
  process.env.PB_URL?.trim() ||
  'http://127.0.0.1:8090';

/**
 * Validates a PocketBase user token.
 *
 * This middleware works for both normal guests and administrators.
 */
export const authMiddleware = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header',
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      error: 'Missing authentication token',
    });
  }

  try {
    /*
     * Use a separate client for each request.
     * This prevents user authentication from replacing the API
     * superuser authentication stored by pocketbaseClient.js.
     */
    const authClient = new PocketBase(POCKETBASE_URL);
    authClient.autoCancellation(false);
    authClient.authStore.save(token);

    const authData = await authClient
      .collection('users')
      .authRefresh();

    const user = authData.record;

    if (!user) {
      return res.status(401).json({
        error: 'Authenticated user was not found',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_admin: user.is_admin,
      verified: user.verified,
    };

    req.authToken = authData.token;

    return next();
  } catch (error) {
    logger.warn(
      `Authentication failed: ${
        error?.response?.message ||
        error?.message ||
        'Invalid token'
      }`,
    );

    return res.status(401).json({
      error: 'Invalid or expired authentication token',
    });
  }
};

/**
 * Must be used after authMiddleware.
 */
export const requireAdmin = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  const isAdmin =
    user.is_admin === true ||
    user.role === 'admin';

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Administrator access required',
    });
  }

  return next();
};