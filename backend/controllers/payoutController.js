import Registration from '../models/Registration.js';
import { getFinancialSummary } from '../services/transactionService.js';

export const getPayoutsSummary = async (req, res, next) => {
  try {
    const organizerId = req.user.id;

    // Try to get data from Transaction model first (for new transactions)
    let transactionSummary = null;
    try {
      transactionSummary = await getFinancialSummary(organizerId);
    } catch (error) {
      console.log('Transaction summary fetch failed (expected if no transactions yet):', error.message);
    }

    // Get data from Registration model for backward compatibility
    const registrationResult = await Registration.aggregate([
      { $match: { organizer: organizerId, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$amountPaid' },
          totalTickets: { $sum: 1 },
        },
      },
    ]);

    const { totalEarned = 0, totalTickets = 0 } = registrationResult[0] || {};
    
    // Use transaction data if available, fall back to registration data
    const finalEarned = transactionSummary?.totalIncoming || totalEarned;
    const finalGatewayFees = transactionSummary?.totalGatewayFees || 0;
    const finalPlatformFees = transactionSummary?.totalPlatformFees || (finalEarned * 0.03);
    const finalNetPayout = finalEarned - finalGatewayFees - finalPlatformFees;

    res.status(200).json({
      success: true,
      payoutSummary: {
        totalEarned: finalEarned,
        totalTickets: totalTickets,
        gatewayFees: finalGatewayFees,
        platformFees: finalPlatformFees,
        netPayout: finalNetPayout,
        platformFeePercentage: 3,
        // Additional financial data from transactions
        ...(transactionSummary && {
          pendingAmount: transactionSummary.pendingAmount || 0,
          completedAmount: transactionSummary.completedAmount || 0,
          totalTransactions: transactionSummary.totalTransactions || 0,
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};
