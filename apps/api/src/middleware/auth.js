import logger from '../utils/logger.js';

/**
 * Simple auth middleware that extracts user ID from Authorization header
 * Expected format: Authorization: Bearer {userId}
 */
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const userId = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (!userId) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  req.user = { id: userId };
  next();
};