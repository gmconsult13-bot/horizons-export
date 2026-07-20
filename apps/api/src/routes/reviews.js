import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /reviews - Public endpoint to fetch visible and approved reviews
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const page = Math.floor(offset / limit) + 1;

  const result = await pb.collection('guest_reviews').getList(page, limit, {
    filter: 'is_visible=true && is_approved=true',
    sort: '-created_at',
  });

  const reviews = result.items.map((review) => ({
    id: review.id,
    guest_name: review.guest_name,
    hotel_rating: review.hotel_rating,
    cleaning_rating: review.cleaning_rating,
    service_rating: review.service_rating,
    food_rating: review.food_rating,
    price_quality_rating: review.price_quality_rating,
    opinion: review.opinion,
    created_at: review.created_at,
  }));

  logger.info(`Fetched ${reviews.length} visible reviews`);
  res.json({
    reviews,
    total: result.totalItems,
    page: result.page,
    per_page: limit,
  });
});

// GET /reviews/stats - Public endpoint to fetch review statistics
router.get('/stats', async (req, res) => {
  const reviews = await pb.collection('guest_reviews').getFullList({
    filter: 'is_visible=true && is_approved=true',
  });

  if (reviews.length === 0) {
    return res.json({
      stats: {
        avg_hotel_rating: 0,
        avg_cleaning_rating: 0,
        avg_service_rating: 0,
        avg_food_rating: 0,
        avg_price_quality_rating: 0,
        total_reviews: 0,
      },
    });
  }

  const sum = reviews.reduce(
    (acc, review) => ({
      hotel_rating: acc.hotel_rating + review.hotel_rating,
      cleaning_rating: acc.cleaning_rating + review.cleaning_rating,
      service_rating: acc.service_rating + review.service_rating,
      food_rating: acc.food_rating + review.food_rating,
      price_quality_rating: acc.price_quality_rating + review.price_quality_rating,
    }),
    {
      hotel_rating: 0,
      cleaning_rating: 0,
      service_rating: 0,
      food_rating: 0,
      price_quality_rating: 0,
    }
  );

  const count = reviews.length;

  logger.info(`Calculated stats for ${count} reviews`);
  res.json({
    stats: {
      avg_hotel_rating: parseFloat((sum.hotel_rating / count).toFixed(2)),
      avg_cleaning_rating: parseFloat((sum.cleaning_rating / count).toFixed(2)),
      avg_service_rating: parseFloat((sum.service_rating / count).toFixed(2)),
      avg_food_rating: parseFloat((sum.food_rating / count).toFixed(2)),
      avg_price_quality_rating: parseFloat((sum.price_quality_rating / count).toFixed(2)),
      total_reviews: count,
    },
  });
});

// POST /reviews - Submit a new review
router.post('/', async (req, res) => {
  const {
    booking_id,
    guest_name,
    hotel_rating,
    cleaning_rating,
    service_rating,
    food_rating,
    price_quality_rating,
    opinion,
  } = req.body;

  // Validate required fields
  if (
    !booking_id ||
    !guest_name ||
    hotel_rating === undefined ||
    cleaning_rating === undefined ||
    service_rating === undefined ||
    food_rating === undefined ||
    price_quality_rating === undefined ||
    !opinion
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate ratings are numbers between 1-6
  const ratings = [
    { name: 'hotel_rating', value: hotel_rating },
    { name: 'cleaning_rating', value: cleaning_rating },
    { name: 'service_rating', value: service_rating },
    { name: 'food_rating', value: food_rating },
    { name: 'price_quality_rating', value: price_quality_rating },
  ];

  for (const rating of ratings) {
    if (typeof rating.value !== 'number' || rating.value < 1 || rating.value > 6) {
      throw new Error(`${rating.name} must be a number between 1 and 6`);
    }
  }

  // Validate opinion max 500 characters
  if (typeof opinion !== 'string' || opinion.length > 500) {
    throw new Error('Opinion must be a string with maximum 500 characters');
  }

  // Check if review already exists for this booking
  const existingReview = await pb.collection('guest_reviews').getFirstListItem(
    `booking_id = "${booking_id}"`,
    { requestKey: null }
  ).catch(() => null);

  if (existingReview) {
    throw new Error('Review already submitted for this booking');
  }

  // Create review record
  const newReview = await pb.collection('guest_reviews').create({
    booking_id,
    guest_name,
    hotel_rating,
    cleaning_rating,
    service_rating,
    food_rating,
    price_quality_rating,
    opinion,
    is_visible: true,
    is_approved: true,
  });

  logger.info(`Review created for booking ${booking_id}`);
  res.json({
    success: true,
    review: {
      id: newReview.id,
      guest_name: newReview.guest_name,
      hotel_rating: newReview.hotel_rating,
      cleaning_rating: newReview.cleaning_rating,
      service_rating: newReview.service_rating,
      food_rating: newReview.food_rating,
      price_quality_rating: newReview.price_quality_rating,
      opinion: newReview.opinion,
      is_visible: newReview.is_visible,
      is_approved: newReview.is_approved,
      created_at: newReview.created_at,
    },
  });
});

// GET /reviews/admin/all - Admin endpoint to fetch all reviews (no filters)
router.get('/admin/all', authMiddleware, async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const page = Math.floor(offset / limit) + 1;

  const result = await pb.collection('guest_reviews').getList(page, limit, {
    sort: '-created_at',
  });

  const reviews = result.items.map((review) => ({
    id: review.id,
    guest_name: review.guest_name,
    hotel_rating: review.hotel_rating,
    cleaning_rating: review.cleaning_rating,
    service_rating: review.service_rating,
    food_rating: review.food_rating,
    price_quality_rating: review.price_quality_rating,
    opinion: review.opinion,
    is_visible: review.is_visible,
    is_approved: review.is_approved,
    created_at: review.created_at,
  }));

  logger.info(`Admin fetched ${reviews.length} reviews`);
  res.json({
    reviews,
    total: result.totalItems,
  });
});

// PUT /reviews/:reviewId - Admin endpoint to update review visibility/approval
router.put('/:reviewId', authMiddleware, async (req, res) => {
  const { reviewId } = req.params;
  const { is_visible, is_approved } = req.body;

  if (!reviewId) {
    return res.status(400).json({ error: 'Review ID is required' });
  }

  // Build update object with only provided fields
  const updateData = {};
  if (is_visible !== undefined) {
    updateData.is_visible = is_visible;
  }
  if (is_approved !== undefined) {
    updateData.is_approved = is_approved;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'At least one field (is_visible or is_approved) is required' });
  }

  const updatedReview = await pb.collection('guest_reviews').update(reviewId, updateData);

  logger.info(`Review ${reviewId} updated by admin`);
  res.json({
    success: true,
    review: {
      id: updatedReview.id,
      guest_name: updatedReview.guest_name,
      hotel_rating: updatedReview.hotel_rating,
      cleaning_rating: updatedReview.cleaning_rating,
      service_rating: updatedReview.service_rating,
      food_rating: updatedReview.food_rating,
      price_quality_rating: updatedReview.price_quality_rating,
      opinion: updatedReview.opinion,
      is_visible: updatedReview.is_visible,
      is_approved: updatedReview.is_approved,
      created_at: updatedReview.created_at,
    },
  });
});

// DELETE /reviews/:reviewId - Admin endpoint to delete a review
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  const { reviewId } = req.params;

  if (!reviewId) {
    return res.status(400).json({ error: 'Review ID is required' });
  }

  await pb.collection('guest_reviews').delete(reviewId);

  logger.info(`Review ${reviewId} deleted by admin`);
  res.json({ success: true, message: 'Review deleted' });
});

// GET /reviews/validate-token - Validate review submission token
router.get('/validate-token', async (req, res) => {
  const { booking_id, token } = req.query;

  if (!booking_id || !token) {
    return res.status(400).json({ error: 'booking_id and token query parameters are required' });
  }

  // Generate expected token using HMAC-SHA256
  const secret = process.env.REVIEW_TOKEN_SECRET;
  if (!secret) {
    throw new Error('REVIEW_TOKEN_SECRET is not configured');
  }

  const expectedToken = crypto
    .createHmac('sha256', secret)
    .update(booking_id)
    .digest('hex');

  // Secure comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );

  if (!isValid) {
    throw new Error('Invalid or expired token');
  }

  // Fetch booking details
  const booking = await pb.collection('bookings').getOne(booking_id);

  logger.info(`Review token validated for booking ${booking_id}`);
  res.json({
    valid: true,
    booking_id,
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
  });
});

export default router;