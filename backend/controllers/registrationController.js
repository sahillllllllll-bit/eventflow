import Registration from '../models/Registration.js';
import AttendeeUser from '../models/AttendeeUser.js';
import Event from '../models/Event.js';
import { generateTicketId } from '../utils/helpers.js';
import { generateQRCode } from '../services/qrService.js';
import {
  sendTicketConfirmationEmail
} from '../services/emailService.js';
import { exportRegistrationsToCSV } from '../services/csvService.js';
import { generateTicketHTML } from '../services/ticketGenerator.js';
import { generatePDFFromHTML } from '../services/generateTicketPDF.js';

// ─────────────────────────────────────────────────────────────
//  Helper: normalize phone number
//  Fixes leading zero issue — strips country code prefix zeros
//  Stores digits only, preserving the actual number
// ─────────────────────────────────────────────────────────────
const normalizePhone = (raw) => {
  if (!raw) return undefined;
  // Remove all non-digit characters
  let digits = raw.replace(/\D/g, '');
  // If starts with 91 and is 12 digits → Indian number with country code
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2); // remove 91
  }
  // If starts with 0 and is 11 digits → remove leading 0
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  // Return as-is if 10 digits (standard Indian), else return cleaned
  return digits || undefined;
};

// ─────────────────────────────────────────────────────────────
//  POST /api/registrations
//  Public — no auth required
// ─────────────────────────────────────────────────────────────
export const registerForEvent = async (req, res, next) => {
  try {
    const { eventId, name, email, phone, responses, consentPromoEmails } = req.body;

    if (!eventId) return res.status(400).json({ success: false, message: 'eventId is required' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'name is required' });
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'email is required' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const now = new Date();
    const isRegistrationClosed =
      (event.registrationClosesAt && now > new Date(event.registrationClosesAt)) ||
      (event.endDate && now > new Date(event.endDate));
    if (isRegistrationClosed) {
      return res.status(400).json({ success: false, message: 'Registration for this event has closed' });
    }

    if (event.maxCapacity && event.currentRegistrations >= event.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    // ── Normalize phone ──────────────────────────────────────
    const normalizedPhone = normalizePhone(phone);

    const ticketId = generateTicketId();
    const qrCode = await generateQRCode(ticketId);

    const responsesObj = {};
    if (responses && typeof responses === 'object') {
      for (const [key, value] of Object.entries(responses)) {
        responsesObj[String(key)] = String(value ?? '');
      }
    }

    const fileUploadsObj = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        const fieldId = file.fieldname;
        const url = file.secure_url || file.path || file.url || file.public_id || '';
        const filename = file.original_filename || file.originalname || file.fieldname || 'uploaded-file';
        fileUploadsObj[fieldId] = {
          url,
          filename,
          size: file.bytes || file.size,
          mimeType: file.mimetype || file.resource_type,
          uploadedAt: new Date(),
        };
      });
    }

    const registration = new Registration({
      event: eventId,
      organizer: event.organizer,
      ticketId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: normalizedPhone,   // ← fixed: no leading zero, no extra digits
      responses: responsesObj,
      fileUploads: fileUploadsObj,
      qrCode,
      consentPromoEmails: consentPromoEmails !== false,
      paymentStatus: event.isPaid ? 'pending' : 'free',
    });

    await registration.save();
    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: 1 } });

    // ── Create/update AttendeeUser identity ──────────────────
    // This is what powers chatroom access + profile page
    try {
      const normalizedEmail = email.trim().toLowerCase();
      let attendee = await AttendeeUser.findOne({ email: normalizedEmail });
      if (!attendee) {
        attendee = new AttendeeUser({
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          registeredEvents: [eventId],
        });
      } else {
        if (!attendee.registeredEvents.map(String).includes(String(eventId))) {
          attendee.registeredEvents.push(eventId);
        }
      }
      await attendee.save();
    } catch (attendeeErr) {
      // Non-fatal — registration already saved
      console.error('AttendeeUser sync error (non-fatal):', attendeeErr.message);
    }

    // ── Send ticket email ────────────────────────────────────
    if (event.sendTicketEmails) {
      sendTicketConfirmationEmail(
        email.trim().toLowerCase(),
        {
          eventTitle: event.title,
          attendeeName: name.trim(),
          ticketId,
          eventDate: event.date,
          eventTime: event.date
            ? new Date(event.date).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', hour12: true,
              })
            : '',
          eventLocation: event.isOnline
            ? (event.meetLink || 'Online')
            : (event.venue || 'TBA'),
          eventColor: event.brandColor || '#6C47FF',
          isOnline: event.isOnline || false,
        },
        qrCode,
      ).catch((err) => console.error('⚠️ Ticket email failed (non-fatal):', err.message));
    }

    // ── Derive userId for localStorage ──────────────────────
    const userId = Buffer.from(email.trim().toLowerCase()).toString('base64');

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration: {
        ticketId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        status: event.isPaid ? 'pending_payment' : 'confirmed',
      },
      // returned to frontend to store in localStorage
      attendee: {
        userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        // localStorage expiry = event end date or 4 days, whichever is sooner
        expiresAt: event.endDate
          ? new Date(event.endDate).toISOString()
          : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

// ── All other existing controllers unchanged below ────────────

export const getEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { search, checkedIn, page = 1, limit = 20 } = req.query;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const skip = (page - 1) * limit;
    const query = { event: eventId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } },
      ];
    }
    if (checkedIn !== undefined) query.checkedIn = checkedIn === 'true';

    const [registrations, total] = await Promise.all([
      Registration.find(query).skip(skip).limit(parseInt(limit)).sort({ registeredAt: -1 }),
      Registration.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      registrations,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
};

export const checkInAttendee = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const registration = await Registration.findOne({ ticketId }).populate('event');
    if (!registration) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (registration.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (registration.checkedIn) {
      return res.status(400).json({ success: false, message: 'Attendee already checked in' });
    }
    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    await registration.save();
    return res.status(200).json({
      success: true,
      message: 'Attendee checked in successfully',
      attendee: { name: registration.name, email: registration.email, checkedIn: true, checkedInAt: registration.checkedInAt },
    });
  } catch (error) { next(error); }
};

export const downloadTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const registration = await Registration.findOne({ ticketId }).populate('event');
    if (!registration) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const event = registration.event;
    const eventTime = event.date
      ? new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : '';
    const ticketHTML = generateTicketHTML({
      ticketId: registration.ticketId,
      attendeeName: registration.name,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime,
      eventLocation: event.venue || event.meetLink || 'TBA',
      qrCodeBase64: registration.qrCode,
      phone: registration.phone,
      email: registration.email,
      eventColor: event.brandColor || '#6C47FF',
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.html"`);
    return res.send(ticketHTML);
  } catch (error) { next(error); }
};

export const getTicketDetails = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const registration = await Registration.findOne({ ticketId }).populate('event');
    if (!registration) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const event = registration.event;
    const eventTime = event.date
      ? new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : '';
    return res.status(200).json({
      success: true,
      ticket: {
        ticketId: registration.ticketId,
        attendeeName: registration.name,
        email: registration.email,
        phone: registration.phone,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime,
        eventLocation: event.venue || event.meetLink || 'TBA',
        qrCode: registration.qrCode,
        checkedIn: registration.checkedIn,
        checkedInAt: registration.checkedInAt,
        registeredAt: registration.registeredAt,
      },
    });
  } catch (error) { next(error); }
};

export const exportRegistrationsCSV = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const registrations = await Registration.find({ event: eventId });
    const filePath = await exportRegistrationsToCSV(registrations, event.title, event.formSections);
    res.download(filePath, `${event.title}-registrations.csv`, (err) => {
      if (err) console.error('❌ CSV download error:', err);
    });
  } catch (error) { next(error); }
};

export const downloadTicketPDF = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const registration = await Registration.findOne({ ticketId }).populate('event');
    if (!registration) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const event = registration.event;
    const eventTime = event.date
      ? new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : event.time || '';
    const ticketHTML = generateTicketHTML({
      ticketId: registration.ticketId,
      attendeeName: registration.name,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime,
      eventLocation: event.venue || event.meetLink || 'TBA',
      qrCodeBase64: registration.qrCode,
      phone: registration.phone,
      email: registration.email,
      eventColor: event.brandColor || '#6C47FF',
    });
    const pdfBuffer = await generatePDFFromHTML(ticketHTML);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) { next(error); }
};