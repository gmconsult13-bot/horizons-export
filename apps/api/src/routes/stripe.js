import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Stripe with secret key from environment
if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('STRIPE_SECRET_KEY is not set in environment variables');
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /stripe/create-checkout
router.post('/create-checkout', async (req, res) => {
  const { amount, productName, successUrl, cancelUrl } = req.body;

  // Validate required fields
  if (amount === undefined || !productName || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing required fields: amount, productName, successUrl, cancelUrl' });
  }

  // Validate amount is a positive number (in cents)
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number in cents' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  logger.info(`Checkout session created: ${session.id}`);
  res.json({ url: session.url });
});

// GET /stripe/session/:sessionId
router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  logger.info(`Retrieved checkout session: ${session.id}`);
  res.json({
    id: session.id,
    status: session.payment_status,
    amountTotal: session.amount_total,
    customerEmail: session.customer_details?.email,
  });
});

export default router;