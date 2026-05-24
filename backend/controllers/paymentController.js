// backend/controllers/paymentController.js
import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpayService.js';
import { createTransaction } from '../services/transactionService.js';
import { TRANSACTION_TYPES, TRANSACTION_STATUS } from '../models/Transaction.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

// ─────────────────────────────────────────────────────────────
// POST /api/payments/create-order
// Body: { type, eventId?, amount?, count? }
//
// type values:
//   "registration"   → ticket price + ₹1 platform fee
//   "email_credits"  → ₹0.20 × count  (create/edit event)
//   "certificates"   → ₹0.60 × count
// ─────────────────────────────────────────────────────────────
export const createOrder = async (req, res, next) => {
  try {
    const { type, eventId, amount, count } = req.body;

    let amountInRupees = 0;
    let receipt        = '';
    let notes          = { type };

    if (type === 'registration') {
      if (!eventId) return res.status(400).json({ success: false, message: 'eventId required' });
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      if (!event.isPaid) return res.status(400).json({ success: false, message: 'Event is free' });

      // ticket price + ₹1 platform fee
      amountInRupees = event.ticketPrice;
      // Max 40 chars: "reg_" (4) + last 8 of eventId (8) + "_" (1) + 10-digit epoch (10) = 23 ✓
      receipt        = `reg_${eventId.toString().slice(-8)}_${Math.floor(Date.now() / 1000)}`;
      notes          = { type, eventId: eventId.toString(), eventTitle: event.title };

    } else if (type === 'email_credits') {
      if (!count || count <= 0)
        return res.status(400).json({ success: false, message: 'count required' });

      // ₹0.20 per credit
      amountInRupees = parseFloat((count * 0.20).toFixed(2));
      // "eml_" (4) + 10-digit epoch (10) = 14 ✓
      receipt        = `eml_${Math.floor(Date.now() / 1000)}`;
      notes          = { type, count: String(count) };

    } else if (type === 'certificates') {
      if (!count || count <= 0)
        return res.status(400).json({ success: false, message: 'count required' });

      // ₹0.60 per certificate
      amountInRupees = parseFloat((count * 0.60).toFixed(2));
      // "crt_" (4) + last 8 of eventId (8) + "_" (1) + 10-digit epoch (10) = 23 ✓
      const eid      = eventId ? eventId.toString().slice(-8) : 'na';
      receipt        = `crt_${eid}_${Math.floor(Date.now() / 1000)}`;
      notes          = { type, count: String(count), eventId: eventId?.toString() || '' };

    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }

    // Razorpay minimum is ₹1
    if (amountInRupees < 1) amountInRupees = 1;

    const order = await createRazorpayOrder(amountInRupees, receipt, notes);

    return res.status(201).json({
      success:  true,
      order,
      amount:   amountInRupees,
      key:      process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// ─────────────────────────────────────────────────────────────
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const organizerId = req.user?.id;

    const valid = verifyPaymentSignature({
      orderId:   razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!valid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Log transaction for analytics and financial tracking
    try {
      // Get the original order to determine transaction type
      // For now, we'll create a generic transaction record
      // More detailed logic can be added based on order notes
      if (organizerId) {
        // Create a transaction record for organizer earnings
        // This will be enhanced based on the payment type
        await createTransaction({
          organizer: organizerId,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          transactionType: TRANSACTION_TYPES.TICKET_PURCHASE,
          amount: 0, // Will be updated based on actual order data
          description: 'Payment verified',
          status: TRANSACTION_STATUS.COMPLETED,
        });
      }
    } catch (txError) {
      // Don't fail payment verification if transaction logging fails
      console.error('Error logging transaction:', txError);
    }

    return res.status(200).json({
      success:   true,
      message:   'Payment verified',
      paymentId: razorpay_payment_id,
      orderId:   razorpay_order_id,
    });
  } catch (error) {
    next(error);
  }
};