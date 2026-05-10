import express from 'express';
import { z } from 'zod';
import { registerForEvent, getEventRegistrations, checkInAttendee, exportRegistrationsCSV } from '../controllers/registrationController.js';
import { auth } from '../middleware/auth.js';
import { validateSchema } from '../middleware/validate.js';
import { registrationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const registerSchema = z.object({
  eventId: z.string(),
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  responses: z.object({}).optional(),
  consentPromoEmails: z.boolean().optional(),
});

router.post('/', registrationLimiter, validateSchema(registerSchema), registerForEvent);
router.get('/event/:eventId', auth, getEventRegistrations);
router.post('/checkin/:ticketId', auth, checkInAttendee);
router.get('/export/:eventId', auth, exportRegistrationsCSV);

export default router;
