import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// --- Configuration ---------------------------------------------------------
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim();
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY?.trim() || 'eur').toLowerCase();
const SITE_URL = process.env.SITE_URL?.trim() || 'https://rayaboutique.eu';

// Initialize Stripe lazily so a missing key produces a clear error per request
// instead of crashing the whole API at boot.
let stripe = null;
function getStripe() {
  if (!STRIPE_SECRET_KEY) {
    logger.error('STRIPE_SECRET_KEY is not set in environment variables');
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  if (!stripe) {
    stripe = new Stripe(STRIPE_SECRET_KEY);
  }
  return stripe;
}

/** Mark a booking as paid (idempotent). Returns the updated booking. */
async function markBookingPaid(booking, { sessionId, paymentIntentId }) {
  const update = {};
  if (booking.payment_status !== 'completed') {
    update.payment_status = 'completed';
  }
  if (sessionId && !booking.stripe_session_id) {
    update.stripe_session_id = sessionId;
  }
  if (paymentIntentId && !booking.paymentId) {
    update.paymentId = paymentIntentId;
  }

  if (Object.keys(update).length > 0) {
    await pb.collection('bookings').update(booking.id, update);
    logger.info(`Booking ${booking.id} marked as paid (session ${sessionId})`);
    return { ...booking, ...update };
  }
  return booking;
}

// --- POST /stripe/create-checkout -------------------------------------------
// Starts a Stripe Checkout session for an existing booking.
// The amount is taken from the booking record server-side — the client can
// never influence the price. Body: { bookingId }.
router.post('/create-checkout', async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    const booking = await pb.collection('bookings').getOne(bookingId);
    const amount = Number(booking.final_price);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Booking has no valid amount' });
    }
    if (booking.payment_status === 'completed') {
      return res.status(400).json({ error: 'Booking is already paid' });
    }

    const stripeClient = getStripe();

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CURRENCY,
            product_data: {
              name: `${booking.room_type} — ${booking.check_in_date?.slice(0, 10)} to ${booking.check_out_date?.slice(0, 10)}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // The guest lands back on the payment page, which verifies the session
      // via GET /stripe/session/:id and shows the confirmation.
      success_url: `${SITE_URL}/payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/booking/checkout?payment=cancelled`,
      customer_email: booking.guest_email || undefined,
      metadata: { bookingId: booking.id },
    });

    // Persist the session id so the webhook / verification can find the booking.
    await pb.collection('bookings').update(booking.id, {
      stripe_session_id: session.id,
    });

    logger.info(`Checkout session created: ${session.id} for booking ${booking.id}`);
    res.json({ url: session.url });
  } catch (error) {
    logger.error(
      `Checkout creation failed: ${error?.message || 'unknown error'}`,
    );
    res.status(500).json({ error: 'Unable to start payment' });
  }
});

// --- GET /stripe/session/:sessionId -----------------------------------------
// Verifies a completed payment from the success page. Also marks the booking
// as paid as a safety net in case the webhook has not been configured.
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const stripeClient = getStripe();
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    // Safety net: if the session is paid but the booking is still pending
    // (e.g. webhook not yet configured), complete it here.
    if (session.payment_status === 'paid' && session.metadata?.bookingId) {
      try {
        const booking = await pb
          .collection('bookings')
          .getOne(session.metadata.bookingId);
        await markBookingPaid(booking, {
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
        });
      } catch (err) {
        logger.error(
          `Failed to mark booking paid during session verification: ${err?.message}`,
        );
      }
    }

    logger.info(`Retrieved checkout session: ${session.id}`);
    res.json({
      id: session.id,
      // Stripe reports "paid" for completed Checkout Sessions.
      status: session.payment_status,
      amountTotal: session.amount_total,
      customerEmail: session.customer_details?.email,
      bookingId: session.metadata?.bookingId,
    });
  } catch (error) {
    logger.error(
      `Session retrieval failed: ${error?.message || 'unknown error'}`,
    );
    res.status(500).json({ error: 'Unable to verify payment' });
  }
});

// --- POST /stripe/webhook ----------------------------------------------------
// Stripe webhook endpoint for checkout.session.completed events.
// Configure in the Stripe dashboard with STRIPE_WEBHOOK_SECRET set in the
// environment. The raw request body (req.rawBody, captured in main.js) is
// required for signature verification.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!STRIPE_WEBHOOK_SECRET) {
    logger.warn('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook is not configured' });
  }

  let event;
  try {
    const stripeClient = getStripe();
    event = stripeClient.webhooks.constructEvent(
      req.rawBody || req.body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    logger.error(`Webhook signature verification failed: ${error?.message}`);
    return res.status(400).send(`Webhook Error: ${error?.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      logger.warn(`Webhook: session ${session.id} has no bookingId metadata`);
      return res.json({ received: true });
    }

    if (session.payment_status === 'paid') {
      try {
        const booking = await pb.collection('bookings').getOne(bookingId);
        await markBookingPaid(booking, {
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
        });
      } catch (error) {
        logger.error(`Webhook: failed to update booking ${bookingId}: ${error?.message}`);
        // 500 makes Stripe retry the event.
        return res.status(500).json({ error: 'Failed to update booking' });
      }
    }
  }

  res.json({ received: true });
});

export default router;
