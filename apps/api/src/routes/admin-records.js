import { Router } from 'express';

import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { createAuthenticatedSuperuserClient } from '../utils/pocketbaseClient.js';

const router = Router();

const allowedCollections = new Set([
  'rooms',
  'seasons',
  'prices',
  'children_surcharges',
  'dining',
  'gallery',
  'guest_deals',
  'room_availability_rules',
  'bookings',
  'guest_reviews',
]);

router.use(authMiddleware, requireAdmin);

function assertAllowedCollection(req, res, next) {
  if (!allowedCollections.has(req.params.collection)) {
    return res.status(403).json({ error: 'This collection cannot be managed here' });
  }
  return next();
}

function createPayload(body = {}) {
  const fileEntries = Object.entries(body).filter(
    ([, value]) => value?.__adminFile === true,
  );

  if (!fileEntries.length) return body;

  const payload = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value?.__adminFile === true) {
      const buffer = Buffer.from(value.base64, 'base64');
      payload.append(
        key,
        new Blob([buffer], { type: value.type || 'application/octet-stream' }),
        value.name || 'upload',
      );
    } else {
      payload.append(key, value);
    }
  }
  return payload;
}

function sendPocketBaseError(res, error) {
  const status = Number(error?.status) || 500;
  const details = error?.response?.data || null;
  const message =
    error?.response?.message ||
    error?.message ||
    'The database rejected the change';

  return res.status(status).json({
    success: false,
    error: message,
    details,
  });
}

router.post('/:collection', assertAllowedCollection, async (req, res) => {
  try {
    const client = await createAuthenticatedSuperuserClient();
    const record = await client
      .collection(req.params.collection)
      .create(createPayload(req.body));
    return res.status(201).json({ success: true, record });
  } catch (error) {
    return sendPocketBaseError(res, error);
  }
});

router.put('/:collection/:recordId', assertAllowedCollection, async (req, res) => {
  try {
    const client = await createAuthenticatedSuperuserClient();
    await client
      .collection(req.params.collection)
      .update(req.params.recordId, createPayload(req.body));

    const record = await client
      .collection(req.params.collection)
      .getOne(req.params.recordId, { requestKey: null });

    return res.json({ success: true, record });
  } catch (error) {
    return sendPocketBaseError(res, error);
  }
});

router.delete('/:collection/:recordId', assertAllowedCollection, async (req, res) => {
  try {
    const client = await createAuthenticatedSuperuserClient();
    await client.collection(req.params.collection).delete(req.params.recordId);
    return res.json({ success: true });
  } catch (error) {
    return sendPocketBaseError(res, error);
  }
});

export default router;
