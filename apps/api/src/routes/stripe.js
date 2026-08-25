import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';

import logger from '../utils/logger.js';
import { createAuthenticatedSuperuserClient } from '../utils/pocketbaseClient.js';

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('STRIPE_SECRET_KEY is not set in environment variables');
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || 'https://rayaboutique.eu').replace(/\/$/, '');

function toStripeAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Booking has an invalid final price');
  }
  return Math.round(amount * 100);
}

// POST /stripe/create-checkout
// The client sends only the booking id. Price and guest details are always
// loaded from PocketBase so the browser cannot alter the amount charged.
router.post('/create-checkout', async (req, res) => {
  try {
    const bookingId = String(req.body?.bookingId || '').trim();

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const pb = await createAuthenticatedSuperuserClient();
    const booking = await pb.collection('bookings').getOne(bookingId, {
      requestKey: null,
    });

    if (booking.payment_status === 'completed') {
      return res.status(409).json({
        error: 'This booking is already paid',
        sessionId: booking.stripe_session_id || null,
      });
    }

    const amount = toStripeAmount(booking.final_price);
    const productName = `Raya Boutique - ${booking.room_type || 'Hotel stay'}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: booking.guest_email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description:
                booking.check_in_date && booking.check_out_date
                  ? `${booking.check_in_date} - ${booking.check_out_date}`
                  : undefined,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
      },
      success_url: `${publicBaseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicBaseUrl}/payment?bookingId=${encodeURIComponent(booking.id)}`,
    });

    await pb.collection('bookings').update(
      booking.id,
      {
        stripe_session_id: session.id,
        payment_status: 'pending',
      },
      { requestKey: null },
    );

    logger.info(`Checkout session created for booking ${booking.id}: ${session.id}`);
    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    logger.error(`Stripe checkout creation failed: ${error?.message || error}`);
    return res.status(error?.status === 404 ? 404 : 500).json({
      error: error?.status === 404 ? 'Booking not found' : 'Unable to start payment',
    });
  }
});

// GET /stripe/session/:sessionId
// This acts as a return-page reconciliation step. A webhook can later be added
// for fully asynchronous reconciliation, but returning from Stripe is enough
// to make the current booking flow deterministic.
router.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionId = String(req.params.sessionId || '').trim();
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const bookingId = session.metadata?.bookingId;
    let booking = null;

    if (bookingId) {
      const pb = await createAuthenticatedSuperuserClient();
      booking = await pb.collection('bookings').getOne(bookingId, {
        requestKey: null,
      });

      if (session.payment_status === 'paid' && booking.payment_status !== 'completed') {
        booking = await pb.collection('bookings').update(
          booking.id,
          {
            payment_status: 'completed',
            stripe_session_id: session.id,
            paymentId: session.payment_intent || '',
          },
          { requestKey: null },
        );
      }
    }

    logger.info(`Retrieved checkout session: ${session.id}`);
    return res.json({
      id: session.id,
      status: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || session.customer_email || booking?.guest_email || null,
      bookingId: booking?.id || bookingId || null,
      bookingStatus: booking?.payment_status || null,
    });
  } catch (error) {
    logger.error(`Stripe session verification failed: ${error?.message || error}`);
    return res.status(500).json({ error: 'Unable to verify payment' });
  }
});

export default router;
