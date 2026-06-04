import {
  getOrganizerTransactions,
  getFinancialSummary,
  getSummaryByTransactionType,
  getMonthlyTrends,
  getCompletedWithdrawals,
} from '../services/transactionService.js';
import mongoose from 'mongoose';

/**
 * GET /api/transactions
 */
export const getTransactions = async (req, res, next) => {
  try {
    const organizerId = req.user.id;
    const { page = 1, limit = 20, status, type, types, eventId, startDate, endDate } = req.query;

    const result = await getOrganizerTransactions(organizerId, {
      page:            parseInt(page),
      limit:           parseInt(limit),
      status:          status || null,
      transactionType: types ? types.split(',') : (type || null),
      eventId:         eventId || null,
      startDate:       startDate || null,
      endDate:         endDate || null,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/summary
 * Returns financial summary AND byType breakdown in one call
 * so the frontend doesn't need two round-trips.
 */
export const getTransactionSummary = async (req, res, next) => {
  try {
    const organizerId = new mongoose.Types.ObjectId(req.user.id);

    // Run both aggregations in parallel
    const [summary, byTypeRaw] = await Promise.all([
      getFinancialSummary(organizerId),
      getSummaryByTransactionType(organizerId),
    ]);

    // Reshape byType to match what PayoutsPage expects:
    // [{ _id: 'ticket_purchase', total: 500, count: 3 }, ...]
    const byType = byTypeRaw.map((t) => ({
      _id:   t._id,
      total: t.totalAmount,
      count: t.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        // Fields from getFinancialSummary
        totalIncome:      summary.totalIncoming,
        totalExpenses:    summary.totalOutgoing,
        netBalance:       summary.totalNetAmount,
        totalTransactions: summary.totalTransactions,
        completedAmount:  summary.completedAmount,
        pendingAmount:    summary.pendingAmount,
        failedAmount:     summary.failedAmount,
        totalGatewayFees: summary.totalGatewayFees,
        totalPlatformFees: summary.totalPlatformFees,

        // byType array — this is what PayoutsPage.jsx reads
        byType,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/by-type
 */
export const getByType = async (req, res, next) => {
  try {
    const organizerId = new mongoose.Types.ObjectId(req.user.id);
    const summary = await getSummaryByTransactionType(organizerId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/trends
 */
export const getTrends = async (req, res, next) => {
  try {
    const organizerId = new mongoose.Types.ObjectId(req.user.id);
    const { months = 12 } = req.query;
    const trends = await getMonthlyTrends(organizerId, parseInt(months));

    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/withdrawals
 */
export const getWithdrawals = async (req, res, next) => {
  try {
    const organizerId = new mongoose.Types.ObjectId(req.user.id);
    const withdrawals = await getCompletedWithdrawals(organizerId);

    res.status(200).json({ success: true, data: withdrawals });
  } catch (error) {
    next(error);
  }
};