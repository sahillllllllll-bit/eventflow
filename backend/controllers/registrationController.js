import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { generateTicketId } from '../utils/helpers.js';
import { generateQRCode } from '../services/qrService.js';
import { sendTicketConfirmationEmail } from '../services/emailService.js';
import { exportRegistrationsToCSV } from '../services/csvService.js';
import { generateTicketHTML } from '../services/ticketGenerator.js';

// ─────────────────────────────────────────────────────────────
//  POST /api/registrations
//  Public — no auth required
// ─────────────────────────────────────────────────────────────
export const registerForEvent = async (req, res, next) => {
  try {
    const { eventId, name, email, phone, responses, consentPromoEmails } = req.body;

    // ── Validate required fields early so the error is clear ──
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'eventId is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'email is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check capacity
    if (event.maxCapacity && event.currentRegistrations >= event.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    // Generate ticket ID and QR code
    const ticketId = generateTicketId();
    const qrCode   = await generateQRCode(ticketId);

    // ── Build responses object ──────────────────────────────
    // responses from client is a plain object { fieldId: value }
    const responsesObj = {};
    if (responses && typeof responses === 'object') {
      for (const [key, value] of Object.entries(responses)) {
        responsesObj[String(key)] = String(value ?? '');
      }
    }

    // ── Handle file uploads from Cloudinary ──────────────────
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
      event:        eventId,
      organizer:    event.organizer,
      ticketId,
      name:         name.trim(),
      email:        email.trim().toLowerCase(),
      phone:        phone ? phone.trim() : undefined,
      responses:    responsesObj,
      fileUploads:  fileUploadsObj,
      qrCode,
      consentPromoEmails: consentPromoEmails !== false, // default true
      paymentStatus:      event.isPaid ? 'pending' : 'free',
    });

    await registration.save();

    // Increment event counter
    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: 1 } });

    // ── Send ticket email (only if organiser enabled it) ─────
    if (event.sendTicketEmails) {
      // Fire-and-forget — registration never fails because of email
      sendTicketConfirmationEmail(
        email.trim().toLowerCase(),
        {
          eventTitle:    event.title,
          attendeeName:  name.trim(),
          ticketId,
          eventDate:     event.date,
          eventTime:     event.time, // may be undefined — email handles it
          eventLocation: event.venue || event.meetLink || 'TBA',
          eventColor:    event.brandColor || '#6C47FF',
        },
        qrCode,
      ).catch((emailError) => {
        // Log but don't block the success response
        console.error('⚠️  Ticket email failed (non-fatal):', emailError.message);
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration: {
        ticketId,
        name:  name.trim(),
        email: email.trim().toLowerCase(),
        status: event.isPaid ? 'pending_payment' : 'confirmed',
      },
    });
  } catch (error) {
    // Surface Mongoose validation errors clearly
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/events/:eventId/registrations
//  Protected — organiser only
// ─────────────────────────────────────────────────────────────
export const getEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { search, checkedIn, page = 1, limit = 20 } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const skip  = (page - 1) * limit;
    const query = { event: eventId };

    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } },
      ];
    }

    if (checkedIn !== undefined) {
      query.checkedIn = checkedIn === 'true';
    }

    const [registrations, total] = await Promise.all([
      Registration.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ registeredAt: -1 }),
      Registration.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      registrations,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/registrations/checkin/:ticketId
//  Protected — organiser only
// ─────────────────────────────────────────────────────────────
export const checkInAttendee = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const registration = await Registration.findOne({ ticketId }).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (registration.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (registration.checkedIn) {
      return res.status(400).json({ success: false, message: 'Attendee already checked in' });
    }

    registration.checkedIn   = true;
    registration.checkedInAt = new Date();
    await registration.save();

    return res.status(200).json({
      success: true,
      message: 'Attendee checked in successfully',
      attendee: {
        name:        registration.name,
        email:       registration.email,
        checkedIn:   true,
        checkedInAt: registration.checkedInAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/registrations/ticket/:ticketId/download
//  Public — anyone with ticketId can download
// ─────────────────────────────────────────────────────────────
export const downloadTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const registration = await Registration.findOne({ ticketId }).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const event = registration.event;

    let eventTime = '';
    if (event.date) {
      eventTime = new Date(event.date).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    }

    const ticketHTML = generateTicketHTML({
      ticketId:       registration.ticketId,
      attendeeName:   registration.name,
      eventTitle:     event.title,
      eventDate:      event.date,
      eventTime,
      eventLocation:  event.venue || event.meetLink || 'TBA',
      qrCodeBase64:   registration.qrCode,
      phone:          registration.phone,
      email:          registration.email,
      eventColor:     event.brandColor || '#6C47FF',
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.html"`);
    return res.send(ticketHTML);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/registrations/ticket/:ticketId
//  Public
// ─────────────────────────────────────────────────────────────
export const getTicketDetails = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const registration = await Registration.findOne({ ticketId }).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const event = registration.event;

    let eventTime = '';
    if (event.date) {
      eventTime = new Date(event.date).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    }

    return res.status(200).json({
      success: true,
      ticket: {
        ticketId:      registration.ticketId,
        attendeeName:  registration.name,
        email:         registration.email,
        phone:         registration.phone,
        eventTitle:    event.title,
        eventDate:     event.date,
        eventTime,
        eventLocation: event.venue || event.meetLink || 'TBA',
        qrCode:        registration.qrCode,
        checkedIn:     registration.checkedIn,
        checkedInAt:   registration.checkedInAt,
        registeredAt:  registration.registeredAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/events/:eventId/registrations/export
//  Protected — organiser only
// ─────────────────────────────────────────────────────────────
export const exportRegistrationsCSV = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const registrations = await Registration.find({ event: eventId });
    const filePath      = await exportRegistrationsToCSV(registrations, event.title, event.formSections);

    res.download(filePath, `${event.title}-registrations.csv`, (err) => {
      if (err) console.error('❌ CSV download error:', err);
    });
  } catch (error) {
    next(error);
  }
};