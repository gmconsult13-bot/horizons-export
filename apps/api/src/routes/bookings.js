import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /bookings/cleanup
router.get('/cleanup', async (req, res) => {
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

// DELETE /bookings/:bookingId
router.delete('/:bookingId', authMiddleware, async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  // Validate required fields
  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  // Find booking by ID
  const booking = await pb.collection('bookings').getOne(bookingId);

  // Verify booking belongs to authenticated user
  if (booking.guest_id !== userId) {
    throw new Error('Unauthorized');
  }

  // Parse check-in date and verify it's in the future
  const checkInDate = new Date(booking.check_in_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    throw new Error('Cannot cancel completed bookings');
  }

  // Delete booking
  await pb.collection('bookings').delete(bookingId);

  logger.info(`Booking ${bookingId} cancelled by guest ${userId}`);
  res.json({ success: true, message: 'Booking cancelled successfully' });
});

export default router;