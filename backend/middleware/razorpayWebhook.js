// backend/middleware/razorpayWebhook.js
// Add this BEFORE express.json() for the webhook route so raw body is preserved.
//
// Usage in app.js / server.js:
//   import { rawBodyMiddleware } from './middleware/razorpayWebhook.js';
//   app.post('/api/payments/webhook', rawBodyMiddleware, webhookHandler);

import { verifyWebhookSignature } from '../services/razorpayService.js';

export const rawBodyMiddleware = (req, res, next) => {
  let rawBody = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => { rawBody += chunk; });
  req.on('end', () => {
    req.rawBody = rawBody;
    try {
      req.body = JSON.parse(rawBody);
    } catch {
      req.body = {};
    }
    next();
  });
};

export const webhookHandler = (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const valid     = verifyWebhookSignature(req.rawBody, signature);

  if (!valid) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const { event, payload } = req.body;

  // Handle relevant events — extend as needed
  if (event === 'payment.captured') {
    const payment = payload?.payment?.entity;
    console.log('✅ Payment captured:', payment?.id, '₹', payment?.amount / 100);
    // You can update DB records here if needed
  }

  return res.status(200).json({ success: true });
};