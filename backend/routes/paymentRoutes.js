// backend/routes/paymentRoutes.js
import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { auth } from '../middleware/auth.js'; // your existing auth middleware

const router = express.Router();

// Both routes require authenticated user
router.post('/create-order', auth, createOrder);
router.post('/verify',       auth, verifyPayment);

export default router;