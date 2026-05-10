import Registration from '../models/Registration.js';

export const getPayoutsSummary = async (req, res, next) => {
  try {
    const result = await Registration.aggregate([
      { $match: { organizer: req.user.id, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$amountPaid' },
          totalTickets: { $sum: 1 },
        },
      },
    ]);

    const { totalEarned = 0, totalTickets = 0 } = result[0] || {};
    const platformFee = totalEarned * 0.03;
    const netPayout = totalEarned - platformFee;

    res.status(200).json({
      success: true,
      payoutSummary: {
        totalEarned,
        totalTickets,
        platformFee,
        netPayout,
        platformFeePercentage: 3,
      },
    });
  } catch (error) {
    next(error);
  }
};
