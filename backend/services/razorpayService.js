// backend/services/razorpayService.js
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order.
 * @param {number} amountInRupees  - e.g. 500 for ₹500
 * @param {string} receipt         - unique receipt string
 * @param {object} notes           - key-value metadata
 */
export const createRazorpayOrder = async (amountInRupees, receipt, notes = {}) => {
  const order = await razorpay.orders.create({
    amount:   Math.round(amountInRupees * 100), // paise
    currency: 'INR',
    receipt,
    notes,
  });
  return order;
};

/**
 * Verify Razorpay payment signature (client-side verification).
 * Called after the checkout modal closes successfully.
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const body      = `${orderId}|${paymentId}`;
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
};

/**
 * Verify Razorpay webhook signature.
 * Use this in your webhook route with the raw request body.
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
};

export default razorpay;