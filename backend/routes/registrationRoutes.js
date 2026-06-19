import express from 'express';
import { z } from 'zod';
import {
  registerForEvent, getEventRegistrations, checkInAttendee,
  exportRegistrationsCSV, downloadTicket, getTicketDetails, downloadTicketPDF,
} from '../controllers/registrationController.js';
import { getMyTicket } from '../controllers/MyTicketcontroller.js';  // ← NEW
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
  responses: z.record(z.any()).optional(),
  consentPromoEmails: z.boolean().optional(),
});

const fileUploader = getRegistrationFileUploader();

const parseFormDataFields = (req, res, next) => {
  try {
    if (req.body.responses && typeof req.body.responses === 'string') {
      try { req.body.responses = JSON.parse(req.body.responses); }
      catch { req.body.responses = {}; }
    }
    if (req.body.consentPromoEmails !== undefined) {
      const val = req.body.consentPromoEmails;
      if (typeof val === 'string') {
        req.body.consentPromoEmails = val === 'true' || val === '1';
      }
    }
    next();
  } catch (error) { next(error); }
};

// ── Existing routes — unchanged ───────────────────────────────
router.post('/', registrationLimiter, fileUploader.any(), parseFormDataFields, validateSchema(registerSchema), registerForEvent);
router.get('/event/:eventId', auth, getEventRegistrations);
router.post('/checkin/:ticketId', auth, checkInAttendee);
router.get('/export/:eventId', auth, exportRegistrationsCSV);
router.get('/ticket/:ticketId', getTicketDetails);
router.get('/download/:ticketId', downloadTicket);
router.get('/ticket/:ticketId/download-pdf', downloadTicketPDF);

// ── NEW: attendee gets their own ticket for an event ──────────
router.get('/my-ticket', getMyTicket);   // ?eventId=xxx&email=xxx  (public)

export default router;