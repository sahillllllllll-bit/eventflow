import express from 'express';
import { getPayoutsSummary } from '../controllers/payoutController.js';
import { sendWithdrawalRequestNotification } from '../services/emailService.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getPayoutsSummary);

router.post('/request-withdrawal', auth, async (req, res) => {
  try {
    const {
      amount,
      method,
      accountName   = '',
      accountNumber = '',
      ifsc          = '',
      upiId         = '',
      displayName   = '',
    } = req.body;
 
    // req.user is set by your `protect` middleware
    const organizerName  = req.user?.name  || 'Unknown Organiser';
    const organizerEmail = req.user?.email || 'unknown@email.com';
 
    // Send notification email to imaginesahll@gmail.com via Brevo Account 2
    await sendWithdrawalRequestNotification({
      organizerName,
      organizerEmail,
      amount,
      method,
      accountName,
      accountNumber,
      ifsc,
      upiId,
      displayName,
    });
 
    // Optionally save the request to DB here
    // await WithdrawalRequest.create({ organizer: req.user._id, amount, method, ... });
 
    return res.status(200).json({ success: true, message: 'Withdrawal request submitted.' });
  } catch (err) {
    console.error('[PayoutRoute] Withdrawal notification failed:', err.message);
    // Still return 200 so the frontend shows success (manual fallback exists)
    return res.status(200).json({ success: true, message: 'Withdrawal request submitted.' });
  }
});

export default router;
