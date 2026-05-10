import express from 'express';
import { getPayoutsSummary } from '../controllers/payoutController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getPayoutsSummary);

export default router;
