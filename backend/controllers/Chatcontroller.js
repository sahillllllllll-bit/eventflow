import ChatMessage from '../models/ChatMessage.js';
import AttendeeUser from '../models/Attendeeuser.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { auth } from '../middleware/auth.js';
import { sendOrganizerAnnouncementEmail } from '../services/emailService.js';

// ── Helpers ───────────────────────────────────────────────────
const emailFromUserId = (userId) => {
  try { return Buffer.from(userId, 'base64').toString('utf-8'); } catch { return null; }
};

const isAttendeeMember = async (email, eventId) => {
  const attendee = await AttendeeUser.findOne({ email });
  if (!attendee) return false;
  return attendee.registeredEvents.map(String).includes(String(eventId));
};

// ─────────────────────────────────────────────────────────────
//  GET /api/chat/:eventId/messages
//  Attendee: pass ?userId=xxx
//  Organiser: pass ?organizerAuth=true (uses JWT via protect middleware)
//  Both can read — but organiser is verified by JWT, attendee by userId
// ─────────────────────────────────────────────────────────────
export const getMessages = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { userId, organizerAuth } = req.query;

    if (organizerAuth === 'true') {
      // Organiser — verified by protect middleware already called on route
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      const isOwner = event.organizer.toString() === req.user.id;
      const isTeam = event.teamMembers?.some(m => m.userId?.toString() === req.user.id && m.active);
      if (!isOwner && !isTeam) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    } else {
      // Attendee
      if (!userId) return res.status(401).json({ success: false, message: 'userId required' });
      const email = emailFromUserId(userId);
      if (!email || !(await isAttendeeMember(email, eventId))) {
        return res.status(403).json({ success: false, message: 'You must be registered for this event to access the chatroom.' });
      }
    }

    const messages = await ChatMessage.find({ event: eventId })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return res.status(200).json({ success: true, messages });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/chat/:eventId/messages
//  Attendee send: { userId, text }
//  Organiser send: { text, isOrganiser: true } — JWT required
// ─────────────────────────────────────────────────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { userId, text, isOrganiser } = req.body;

    if (!text?.trim()) return res.status(400).json({ success: false, message: 'text required' });

    let senderName, senderEmail, isAnnouncement = false;

    if (isOrganiser) {
      // ── Organiser path — JWT must be present (protect middleware) ──
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

      const isOwner = event.organizer.toString() === req.user.id;
      const isTeam  = event.teamMembers?.some(m => m.userId?.toString() === req.user.id && m.active);
      if (!isOwner && !isTeam) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      senderName    = `${req.user.name} (Organiser)`;
      senderEmail   = req.user.email;
      isAnnouncement = true;

      // ── Send email to all registered attendees (fire-and-forget) ──
      Registration.find({ event: eventId }, { email: 1, consentPromoEmails: 1 }).lean()
        .then((regs) => {
          const emails = regs
            .filter(r => r.consentPromoEmails !== false)
            .map(r => r.email)
            .filter(Boolean);
          if (emails.length > 0) {
            sendOrganizerAnnouncementEmail(emails, event.title, text.trim(), req.user.name)
              .catch(err => console.error('[Chat] Announcement email error:', err.message));
          }
        });

    } else {
      // ── Attendee path ──
      if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
      const email = emailFromUserId(userId);
      if (!email) return res.status(401).json({ success: false, message: 'Invalid userId' });

      const attendee = await AttendeeUser.findOne({ email });
      if (!attendee || !attendee.registeredEvents.map(String).includes(String(eventId))) {
        return res.status(403).json({ success: false, message: 'Not registered for this event' });
      }

      senderName  = attendee.name;
      senderEmail = email;
    }

    const message = await ChatMessage.create({
      event:         eventId,
      senderEmail,
      senderName,
      text:          text.trim(),
      isAnnouncement,
      isOrganiser:   !!isOrganiser,
    });

    if (global.io) {
      global.io.to(`event_${eventId}`).emit('new_message', message);
    }

    return res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/chat/:eventId/members
// ─────────────────────────────────────────────────────────────
export const getChatMembers = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { userId, organizerAuth } = req.query;

    if (organizerAuth !== 'true') {
      if (!userId) return res.status(401).json({ success: false, message: 'userId required' });
      const email = emailFromUserId(userId);
      if (!email || !(await isAttendeeMember(email, eventId))) {
        return res.status(403).json({ success: false, message: 'Not a member' });
      }
    }

    const members = await AttendeeUser.find(
      { registeredEvents: eventId },
      { name: 1, email: 1 },
    ).lean();

    return res.status(200).json({
      success: true,
      count: members.length,
      members: members.map(m => ({ name: m.name, email: m.email })),
    });
  } catch (err) { next(err); }
};