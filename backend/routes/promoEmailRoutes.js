import express from 'express';
import { z } from 'zod';
import { sendPromoEmailToAttendees, getPromoEmailHistory } from '../controllers/promoEmailController.js';
import { auth } from '../middleware/auth.js';
import { validateSchema } from '../middleware/validate.js';

const router = express.Router();

const promoEmailSchema = z.object({
  targetEventIds: z.array(z.string()),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  body: z.string().min(10, 'Body must be at least 10 characters'),
  consentOnly: z.boolean().optional(),
});

router.post('/send', auth, validateSchema(promoEmailSchema), sendPromoEmailToAttendees);
router.get('/history', auth, getPromoEmailHistory);

export default router;
