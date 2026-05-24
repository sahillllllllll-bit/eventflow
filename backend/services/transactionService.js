import Transaction, { TRANSACTION_TYPES, TRANSACTION_STATUS } from '../models/Transaction.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

/**
 * Create a transaction record
 */
export const createTransaction = async (transactionData) => {
  try {
    const transaction = new Transaction(transactionData);
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

/**
 * Get transaction by Razorpay Payment ID
 */
export const getTransactionByRazorpayPaymentId = async (paymentId) => {
  return Transaction.findOne({ razorpayPaymentId: paymentId });
};

/**
 * Get organizer's transactions with pagination
 */
export const getOrganizerTransactions = async (organizerId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = -1,
    status = null,
    transactionType = null,
    eventId = null,
    startDate = null,
    endDate = null,
  } = options;

  const skip = (page - 1) * limit;
  const query = { organizer: organizerId };

  // Filters
  if (status) query.status = status;
  if (transactionType) query.transactionType = transactionType;
  if (eventId) query.event = eventId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate('event', 'title slug')
      .populate('registration', 'name email ticketId')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get financial summary for organizer
 */
export const getFinancialSummary = async (organizerId) => {
  const result = await Transaction.aggregate([
    { $match: { organizer: organizerId } },
    {
      $group: {
        _id: null,
        
        // Overall totals
        totalIncoming: {
          $sum: {
            $cond: [
              {
                $in: [
                  '$transactionType',
                  [
                    TRANSACTION_TYPES.TICKET_PURCHASE,
                    TRANSACTION_TYPES.REGISTRATION_PAYMENT,
                  ],
                ],
              },
              '$amount',
              0,
            ],
          },
        },
        totalOutgoing: {
          $sum: {
            $cond: [
              {
                $in: [
                  '$transactionType',
                  [
                    TRANSACTION_TYPES.GATEWAY_FEE,
                    TRANSACTION_TYPES.PLATFORM_FEE,
                    TRANSACTION_TYPES.CERTIFICATE_GENERATION,
                    TRANSACTION_TYPES.REMINDER_EMAIL,
                    TRANSACTION_TYPES.PROMO_EMAIL,
                    TRANSACTION_TYPES.BULK_EMAIL,
                    TRANSACTION_TYPES.WITHDRAWAL_FEE,
                    TRANSACTION_TYPES.OTHER_DEDUCTION,
                  ],
                ],
              },
              '$amount',
              0,
            ],
          },
        },
        
        // Specific fees
        totalGatewayFees: { $sum: '$gatewayFee' },
        totalPlatformFees: { $sum: '$platformFee' },
        
        // Net amount
        totalNetAmount: { $sum: '$netAmount' },
        
        // By status
        completedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', TRANSACTION_STATUS.COMPLETED] }, '$amount', 0],
          },
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', TRANSACTION_STATUS.PENDING] }, '$amount', 0],
          },
        },
        failedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', TRANSACTION_STATUS.FAILED] }, '$amount', 0],
          },
        },
        
        // Transaction counts
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  if (!result.length) {
    return {
      totalIncoming: 0,
      totalOutgoing: 0,
      totalGatewayFees: 0,
      totalPlatformFees: 0,
      totalNetAmount: 0,
      completedAmount: 0,
      pendingAmount: 0,
      failedAmount: 0,
      totalTransactions: 0,
    };
  }

  return result[0];
};

/**
 * Get financial summary by transaction type
 */
export const getSummaryByTransactionType = async (organizerId) => {
  return Transaction.aggregate([
    { $match: { organizer: organizerId, status: TRANSACTION_STATUS.COMPLETED } },
    {
      $group: {
        _id: '$transactionType',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);
};

/**
 * Get monthly financial trends
 */
export const getMonthlyTrends = async (organizerId, months = 12) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return Transaction.aggregate([
    {
      $match: {
        organizer: organizerId,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalIncoming: {
          $sum: {
            $cond: [
              {
                $in: [
                  '$transactionType',
                  [
                    TRANSACTION_TYPES.TICKET_PURCHASE,
                    TRANSACTION_TYPES.REGISTRATION_PAYMENT,
                  ],
                ],
              },
              '$amount',
              0,
            ],
          },
        },
        totalOutgoing: {
          $sum: {
            $cond: [
              {
                $in: [
                  '$transactionType',
                  [
                    TRANSACTION_TYPES.GATEWAY_FEE,
                    TRANSACTION_TYPES.PLATFORM_FEE,
                    TRANSACTION_TYPES.CERTIFICATE_GENERATION,
                    TRANSACTION_TYPES.REMINDER_EMAIL,
                    TRANSACTION_TYPES.PROMO_EMAIL,
                    TRANSACTION_TYPES.BULK_EMAIL,
                    TRANSACTION_TYPES.WITHDRAWAL_FEE,
                    TRANSACTION_TYPES.OTHER_DEDUCTION,
                  ],
                ],
              },
              '$amount',
              0,
            ],
          },
        },
        netAmount: { $sum: '$netAmount' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
  ]);
};

/**
 * Get pending withdrawals
 */
export const getPendingWithdrawals = async (organizerId) => {
  return Transaction.find({
    organizer: organizerId,
    transactionType: TRANSACTION_TYPES.WITHDRAWAL_FEE,
    status: TRANSACTION_STATUS.PENDING,
  }).lean();
};

/**
 * Get completed withdrawals
 */
export const getCompletedWithdrawals = async (organizerId) => {
  return Transaction.find({
    organizer: organizerId,
    transactionType: TRANSACTION_TYPES.WITHDRAWAL_FEE,
    status: TRANSACTION_STATUS.COMPLETED,
  })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (transactionId, status, updates = {}) => {
  return Transaction.findByIdAndUpdate(
    transactionId,
    { status, ...updates },
    { new: true }
  );
};

/**
 * Create refund
 */
export const createRefund = async (transactionId, refundAmount, reason) => {
  return Transaction.findByIdAndUpdate(
    transactionId,
    {
      refundedAmount: refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
      status: TRANSACTION_STATUS.REFUNDED,
    },
    { new: true }
  );
};
