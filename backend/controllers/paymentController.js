// backend/controllers/paymentController.js
import Razorpay from 'razorpay';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpayService.js';
import { createTransaction } from '../services/transactionService.js';
import { TRANSACTION_TYPES, TRANSACTION_STATUS } from '../models/Transaction.js';
import Event from '../models/Event.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────
// POST /api/payments/create-order
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

      amountInRupees = event.ticketPrice;
      receipt        = `reg_${eventId.toString().slice(-8)}_${Math.floor(Date.now() / 1000)}`;
      notes          = { type, eventId: eventId.toString(), eventTitle: event.title };

    } else if (type === 'email_credits') {
      if (!count || count <= 0)
        return res.status(400).json({ success: false, message: 'count required' });

      amountInRupees = parseFloat((count * 0.20).toFixed(2));
      receipt        = `eml_${Math.floor(Date.now() / 1000)}`;
      notes          = { type, count: String(count) };

    } else if (type === 'certificates') {
      if (!count || count <= 0)
        return res.status(400).json({ success: false, message: 'count required' });

      amountInRupees = parseFloat((count * 0.60).toFixed(2));
      const eid      = eventId ? eventId.toString().slice(-8) : 'na';
      receipt        = `crt_${eid}_${Math.floor(Date.now() / 1000)}`;
      notes          = { type, count: String(count), eventId: eventId?.toString() || '' };

    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }

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
// ─────────────────────────────────────────────────────────────
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const organizerId = req.user?.id;

    // 1. Verify signature
    const valid = verifyPaymentSignature({
      orderId:   razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!valid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // 2. Fetch the actual order from Razorpay to get amount + notes
    let orderDetails = null;
    try {
      orderDetails = await razorpay.orders.fetch(razorpay_order_id);
    } catch (fetchErr) {
      console.error('Could not fetch Razorpay order details:', fetchErr);
    }

    // 3. Parse amount (Razorpay stores in paise → divide by 100)
    const amountInRupees = orderDetails
      ? parseFloat((orderDetails.amount / 100).toFixed(2))
      : 0;

    // 4. Parse notes to determine transaction type
    const notes = orderDetails?.notes || {};
    const paymentType = notes.type || 'registration';
    const count = notes.count ? parseInt(notes.count) : null;
    const eventId = notes.eventId || null;
    const eventTitle = notes.eventTitle || '';

    // 5. Map payment type → transaction type + description
    let transactionType;
    let description;
    let isExpense = false;

    switch (paymentType) {
      case 'registration':
        transactionType = TRANSACTION_TYPES.TICKET_PURCHASE;
        description     = `Ticket purchase${eventTitle ? ` — ${eventTitle}` : ''}`;
        isExpense       = false; // income for organizer
        break;

      case 'email_credits':
        transactionType = TRANSACTION_TYPES.REMINDER_EMAIL;
        description     = `Email credits purchased${count ? ` (${count} credits)` : ''}`;
        isExpense       = true; // expense — organizer paid for emails
        break;

      case 'certificates':
        transactionType = TRANSACTION_TYPES.CERTIFICATE_GENERATION;
        description     = `Certificate generation${count ? ` (${count} certificates)` : ''}`;
        isExpense       = true; // expense
        break;

      default:
        transactionType = TRANSACTION_TYPES.TICKET_PURCHASE;
        description     = 'Payment verified';
        isExpense       = false;
    }

    // 6. Create transaction record
    if (organizerId) {
      try {
        await createTransaction({
          organizer:        organizerId,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId:   razorpay_order_id,
          transactionType,
          amount:           amountInRupees,
          description,
          status:           TRANSACTION_STATUS.COMPLETED,
          ...(eventId && { event: eventId }),
          snapshot: {
            eventTitle,
          },
          metadata: {
            paymentType,
            count,
            isExpense,
          },
        });
      } catch (txError) {
        console.error('Error logging transaction:', txError);
      }
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