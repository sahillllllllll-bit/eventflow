import express from 'express';
import {
  getTransactions,
  getTransactionSummary,
  getByType,
  getTrends,
  getWithdrawals,
} from '../controllers/transactionController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get transactions with filters and pagination
router.get('/', getTransactions);

// Get financial summary
router.get('/summary', getTransactionSummary);

// Get summary by transaction type
router.get('/by-type', getByType);

// Get monthly trends
router.get('/trends', getTrends);

// Get withdrawal history
router.get('/withdrawals', getWithdrawals);

export default router;
