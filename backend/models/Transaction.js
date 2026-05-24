import mongoose from 'mongoose';

// Transaction type constants
export const TRANSACTION_TYPES = {
  // Incoming
  TICKET_PURCHASE: 'ticket_purchase',
  REGISTRATION_PAYMENT: 'registration_payment',
  
  // Outgoing
  GATEWAY_FEE: 'gateway_fee',
  PLATFORM_FEE: 'platform_fee',
  CERTIFICATE_GENERATION: 'certificate_generation',
  REMINDER_EMAIL: 'reminder_email',
  PROMO_EMAIL: 'promo_email',
  BULK_EMAIL: 'bulk_email',
  WITHDRAWAL_FEE: 'withdrawal_fee',
  OTHER_DEDUCTION: 'other_deduction',
};

// Transaction status constants
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

const transactionSchema = new mongoose.Schema(
  {
    // Who (organizer)
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'organizer is required'],
      index: true,
    },

    // What (event, attendee)
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      sparse: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      sparse: true,
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },

    // Type and amounts
    transactionType: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: [true, 'transactionType is required'],
      index: true,
    },

    // Financial data
    amount: {
      type: Number,
      required: [true, 'amount is required'],
      min: 0,
    },
    
    // Breakdown
    gatewayFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Net amount received
    netAmount: {
      type: Number,
      default: function() {
        return this.amount - this.gatewayFee - this.platformFee;
      },
      min: 0,
    },

    // Payment details
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'bank_transfer', 'manual', 'platform_credit', 'other'],
      default: 'razorpay',
    },

    // Razorpay integration
    razorpayPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
      index: true,
    },

    // Human-readable description
    description: {
      type: String,
      required: true,
    },

    // Event/attendee details snapshot (for display when refs are deleted)
    snapshot: {
      eventTitle: String,
      eventDate: Date,
      attendeeName: String,
      attendeeEmail: String,
      ticketId: String,
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Refund info if applicable
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundReason: String,
    refundedAt: Date,

    // Notes
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for optimal querying
transactionSchema.index({ organizer: 1, createdAt: -1 });
transactionSchema.index({ organizer: 1, transactionType: 1 });
transactionSchema.index({ organizer: 1, status: 1 });
transactionSchema.index({ event: 1, organizer: 1 });
transactionSchema.index({ razorpayPaymentId: 1 });

export default mongoose.model('Transaction', transactionSchema);
