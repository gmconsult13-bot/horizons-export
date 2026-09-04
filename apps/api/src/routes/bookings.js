import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { authMiddleware, guestAuthMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// GET /bookings/cleanup — admin only. Deletes stale pending bookings
// older than 24 hours that were never paid.
router.get('/cleanup', authMiddleware, requireAdmin, async (req, res) => {
  // Calculate timestamp for 24 hours ago
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Query bookings where:
  // 1. created_at is more than 24 hours ago
  // 2. check_in_date is in the future
  const bookings = await pb.collection('bookings').getFullList({
    filter: `created_at < "${twentyFourHoursAgo}" && check_in_date > "${now}"`,
  });

  let deletedCount = 0;

  // Delete each matching booking
  for (const booking of bookings) {
    await pb.collection('bookings').delete(booking.id);
    deletedCount++;
  }

  logger.info(`Cleanup completed: ${deletedCount} unfinished bookings older than 24 hours deleted`);

  res.json({
    success: true,
    deleted_count: deletedCount,
    message: 'Unfinished bookings older than 24 hours have been deleted',
  });
});

// POST /bookings/send-confirmation
router.post('/send-confirmation', async (req, res) => {
  const {
    bookingId,
    guestEmail,
    guestName,
    roomType,
    checkInDate,
    checkOutDate,
    numAdults,
    numChildren,
    mealPlan,
    cancellationPolicy,
    finalPrice,
  } = req.body;

  // Validate required fields
  if (
    !bookingId ||
    !guestEmail ||
    !guestName ||
    !roomType ||
    !checkInDate ||
    !checkOutDate ||
    finalPrice === undefined
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate BOOKING_ADMIN_EMAIL is configured
  const bookingAdminEmail = process.env.BOOKING_ADMIN_EMAIL;
  if (!bookingAdminEmail) {
    throw new Error('BOOKING_ADMIN_EMAIL environment variable is not configured');
  }

  // Format dates for display
  const checkInFormatted = new Date(checkInDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const checkOutFormatted = new Date(checkOutDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build email content
  const emailSubject = `Booking Confirmation - Raya Boutique (${bookingId})`;
  const emailBody = `
Dear ${guestName},

Thank you for booking with Raya Boutique! Here are your booking details:

--- BOOKING DETAILS ---
Booking ID: ${bookingId}
Room Type: ${roomType}
Check-in: ${checkInFormatted}
Check-out: ${checkOutFormatted}
Guests: ${numAdults} Adult(s)${numChildren ? `, ${numChildren} Child(ren)` : ''}
Meal Plan: ${mealPlan || 'Not specified'}

--- PRICING ---
Total Price: €${finalPrice.toFixed(2)}

--- CANCELLATION POLICY ---
${cancellationPolicy || 'Standard cancellation policy applies.'}

If you have any questions or need to make changes to your booking, please contact us at ${bookingAdminEmail}.

We look forward to welcoming you!

Best regards,
Raya Boutique Team
  `;

  // Send email via PocketBase mailer
  await pb.sendEmail({
    to: guestEmail,
    subject: emailSubject,
    html: emailBody.replace(/\n/g, '<br>'),
  });

  // Also send to booking admin email
  await pb.sendEmail({
    to: bookingAdminEmail,
    subject: `New Booking Confirmation - ${bookingId}`,
    html: `
      <p>New booking received:</p>
      <p><strong>Guest:</strong> ${guestName}</p>
      <p><strong>Email:</strong> ${guestEmail}</p>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Room Type:</strong> ${roomType}</p>
      <p><strong>Check-in:</strong> ${checkInFormatted}</p>
      <p><strong>Check-out:</strong> ${checkOutFormatted}</p>
      <p><strong>Total Price:</strong> €${finalPrice.toFixed(2)}</p>
    `.replace(/\n/g, ''),
  });

  logger.info(`Booking confirmation email sent for booking ${bookingId}`);
  res.json({ success: true, message: 'Email sent' });
});

// DELETE /bookings/:bookingId — guest self-cancellation with refund handling
//
// Refund rules:
//  - cancellation_policy "flexible"      -> cancel allowed, full automatic Stripe refund
//  - cancellation_policy "non_refundable" -> cannot be cancelled online (contact the hotel)
//
// The booking record is NOT deleted: it is marked booking_status="cancelled"
// so the guest keeps their history and can still access/print their invoice.
router.delete('/:bookingId', guestAuthMiddleware, async (req, res) => {
  const { bookingId } = req.params;
  const guestId = req.user.id;

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  const booking = await pb.collection('bookings').getOne(bookingId);

  // Verify the booking belongs to the authenticated guest
  if (booking.guest_id !== guestId) {
    return res.status(403).json({ error: 'You can only cancel your own bookings' });
  }

  // Already cancelled
  if (booking.booking_status === 'cancelled') {
    return res.status(409).json({ error: 'This booking is already cancelled' });
  }

  // Check-in must still be in the future
  const checkInDate = new Date(booking.check_in_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    return res.status(400).json({ error: 'Past or completed bookings cannot be cancelled' });
  }

  // Non-refundable bookings cannot be self-cancelled
  if (booking.cancellation_policy === 'non_refundable') {
    return res.status(403).json({
      error:
        'This booking was made under non-refundable conditions and cannot be cancelled online. Please contact info@rayaboutique.eu for assistance.',
    });
  }

  // --- Refundable booking: cancel + refund ---
  let refundStatus = 'none';
  let refundAmount = 0;

  if (booking.payment_status === 'completed' && booking.paymentId) {
    if (!stripe) {
      logger.error(`STRIPE_SECRET_KEY missing; cannot refund booking ${bookingId}`);
      return res.status(500).json({
        error: 'Refund cannot be processed right now. Please contact info@rayaboutique.eu.',
      });
    }

    try {
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentId,
      });
      refundStatus = 'full';
      refundAmount = Number(booking.final_price || 0);
      logger.info(
        `Stripe refund ${refund.id} issued for booking ${bookingId}: EUR ${refundAmount.toFixed(2)}`,
      );
    } catch (refundError) {
      logger.error(`Stripe refund failed for booking ${bookingId}: ${refundError?.message || refundError}`);
      return res.status(502).json({
        error: 'The refund could not be processed automatically. Our team has been notified — please contact info@rayaboutique.eu.',
      });
    }
  }

  await pb.collection('bookings').update(bookingId, {
    booking_status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: 'guest_self_cancellation',
    refund_status: refundStatus,
    refund_amount: refundAmount,
  });

  logger.info(
    `Booking ${bookingId} cancelled by guest ${guestId} (refund: ${refundStatus}, EUR ${refundAmount.toFixed(2)})`,
  );

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    refund_status: refundStatus,
    refund_amount: refundAmount,
    currency: 'EUR',
  });
});

export default router;