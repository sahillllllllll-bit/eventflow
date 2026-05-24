import {
  getOrganizerTransactions,
  getFinancialSummary,
  getSummaryByTransactionType,
  getMonthlyTrends,
  getCompletedWithdrawals,
} from '../services/transactionService.js';

/**
 * GET /api/transactions
 * Get organizer's transactions with pagination and filters
 */
export const getTransactions = async (req, res, next) => {
  try {
    const organizerId = req.user.id;
    const { page = 1, limit = 20, status, type, types, eventId, startDate, endDate } = req.query;

    const result = await getOrganizerTransactions(organizerId, {
      page:            parseInt(page),
      limit:           parseInt(limit),
      status:          status || null,
      // Support both single `type` and comma-separated `types`
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
 * Get financial summary for organizer
 */
export const getTransactionSummary = async (req, res, next) => {
  try {
    const organizerId = req.user.id;
    const summary = await getFinancialSummary(organizerId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/by-type
 * Get financial summary breakdown by transaction type
 */
export const getByType = async (req, res, next) => {
  try {
    const organizerId = req.user.id;
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
 * Get monthly financial trends
 */
export const getTrends = async (req, res, next) => {
  try {
    const organizerId = req.user.id;
    const { months = 12 } = req.query;
    const trends = await getMonthlyTrends(organizerId, parseInt(months));

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/transactions/withdrawals
 * Get withdrawal history
 */
export const getWithdrawals = async (req, res, next) => {
  try {
    const organizerId = req.user.id;
    const withdrawals = await getCompletedWithdrawals(organizerId);

    res.status(200).json({
      success: true,
      data: withdrawals,
    });
  } catch (error) {
    next(error);
  }
};

