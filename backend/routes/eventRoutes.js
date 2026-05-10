import express from 'express';
import { z } from 'zod';
import { createEvent, getMyEvents, getEventBySlug, updateEvent, deleteEvent, publishEvent, getEventAnalytics } from '../controllers/eventController.js';
import { auth } from '../middleware/auth.js';
import { validateSchema } from '../middleware/validate.js';

const router = express.Router();

const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.enum(['fest', 'workshop', 'hackathon', 'competition', 'seminar', 'other']).optional(),
  date: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  venue: z.string().optional(),
  venueMapLink: z.string().optional(),
  isOnline: z.boolean().optional(),
  meetLink: z.string().optional(),
  isPaid: z.boolean().optional(),
  ticketPrice: z.number().optional(),
  maxCapacity: z.number().optional(),
  template: z.enum(['minimal', 'bold', 'gradient', 'dark', 'glass']).optional(),
  tags: z.array(z.string()).optional(),
  formSections: z.array(z.any()).optional(),
});

router.post('/', auth, validateSchema(createEventSchema), createEvent);
router.get('/my', auth, getMyEvents);
router.get('/:slug', getEventBySlug);
router.put('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);
router.post('/:id/publish', auth, publishEvent);
router.get('/:id/analytics', auth, getEventAnalytics);

export default router;
