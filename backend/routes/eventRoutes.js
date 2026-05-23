import express from 'express';
import { z } from 'zod';
import {
  createEvent,
  getMyEvents,
  getEventBySlug,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  getEventAnalytics,
  sendReminderToRegistrants,
  inviteTeamMember,
  acceptTeamInvite,
  updateTeamMember,
  removeTeamMember,
  uploadEventCover,
  uploadEventMarkdownImage,
} from '../controllers/eventController.js';
import { auth } from '../middleware/auth.js';
import { validateSchema } from '../middleware/validate.js';
import { getEventCoverUploader } from '../services/cloudinaryService.js';

const router = express.Router();

const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  prizesAndGoodies: z.string().optional(),
  sendTicketEmails: z.boolean().optional(),
  paidEmailCredits: z.number().optional(),
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

const teamMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['coordinator', 'member']).optional(),
});

const updateTeamMemberSchema = z.object({
  role: z.enum(['coordinator', 'member']),
});

router.post('/', auth, validateSchema(createEventSchema), createEvent);
router.get('/my', auth, getMyEvents);
router.post('/upload-image', auth, getEventCoverUploader().single('image'), uploadEventMarkdownImage);
router.get('/id/:id', auth, getEventById);
router.get('/:slug', getEventBySlug);
router.put('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);
router.post('/:id/publish', auth, publishEvent);
router.post('/:id/upload-cover', auth, getEventCoverUploader().single('coverImage'), uploadEventCover);
router.post('/:id/upload-markdown-image', auth, getEventCoverUploader().single('image'), uploadEventMarkdownImage);
router.post('/:id/reminder', auth, validateSchema(z.object({ message: z.string().min(1, 'Message is required') })), sendReminderToRegistrants);
router.post('/:id/team', auth, validateSchema(teamMemberSchema), inviteTeamMember);
router.post('/team/accept/:token', auth, acceptTeamInvite);
router.patch('/:id/team/:memberId', auth, validateSchema(updateTeamMemberSchema), updateTeamMember);
router.delete('/:id/team/:memberId', auth, removeTeamMember);
router.get('/:id/analytics', auth, getEventAnalytics);

export default router;
