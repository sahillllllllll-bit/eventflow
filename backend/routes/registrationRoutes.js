import express from 'express';
import { z } from 'zod';
import { registerForEvent, getEventRegistrations, checkInAttendee, exportRegistrationsCSV, downloadTicket, getTicketDetails } from '../controllers/registrationController.js';
import { auth } from '../middleware/auth.js';
import { validateSchema } from '../middleware/validate.js';
import { registrationLimiter } from '../middleware/rateLimiter.js';
import { getRegistrationFileUploader } from '../services/cloudinaryService.js';

const router = express.Router();

const registerSchema = z.object({
  eventId: z.string(),
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  responses: z.object({}).optional(),
  consentPromoEmails: z.boolean().optional(),
});

const fileUploader = getRegistrationFileUploader();

// ── Middleware to parse FormData fields that come as strings ──
const parseFormDataFields = (req, res, next) => {
  try {
    // Parse responses JSON string to object
    if (req.body.responses && typeof req.body.responses === 'string') {
      try {
        req.body.responses = JSON.parse(req.body.responses);
      } catch (e) {
        // If JSON parsing fails, treat as empty object
        req.body.responses = {};
      }
    }
    
    // Convert consentPromoEmails string to boolean
    if (req.body.consentPromoEmails !== undefined) {
      const val = req.body.consentPromoEmails;
      if (typeof val === 'string') {
        req.body.consentPromoEmails = val === 'true' || val === '1' || val === 'true';
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

router.post('/', registrationLimiter, fileUploader.array('files', 10), parseFormDataFields, validateSchema(registerSchema), registerForEvent);
router.get('/event/:eventId', auth, getEventRegistrations);
router.post('/checkin/:ticketId', auth, checkInAttendee);
router.get('/export/:eventId', auth, exportRegistrationsCSV);
router.get('/ticket/:ticketId', getTicketDetails);
router.get('/download/:ticketId', downloadTicket);

export default router;
