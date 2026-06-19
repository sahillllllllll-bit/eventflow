import express from 'express';
import { getMessages, sendMessage, getChatMembers } from '../controllers/chatController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Attendee routes — no JWT needed (userId param used)
router.get('/:eventId/messages', (req, res, next) => {
  // If organiserAuth flag present, run protect first
  if (req.query.organizerAuth === 'true') return auth(req, res, next);
  next();
}, getMessages);

router.post('/:eventId/messages', (req, res, next) => {
  if (req.body.isOrganiser) return auth(req, res, next);
  next();
}, sendMessage);

router.get('/:eventId/members', getChatMembers);

export default router;