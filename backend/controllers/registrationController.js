import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { generateTicketId } from '../utils/helpers.js';
import { generateQRCode } from '../services/qrService.js';
import { sendTicketConfirmationEmail } from '../services/emailService.js';
import { exportRegistrationsToCSV } from '../services/csvService.js';

export const registerForEvent = async (req, res, next) => {
  try {
    const { eventId, name, email, phone, responses, consentPromoEmails } = req.body;

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
    const qrCode = await generateQRCode(ticketId);

    const registration = new Registration({
      event: eventId,
      organizer: event.organizer,
      ticketId,
      name,
      email,
      phone,
      responses: new Map(Object.entries(responses || {})),
      qrCode,
      consentPromoEmails,
      paymentStatus: event.isPaid ? 'pending' : 'free',
    });

    await registration.save();

    // Update event registration count
    event.currentRegistrations += 1;
    await event.save();

    // Send confirmation email with QR
    await sendTicketConfirmationEmail(email, {
      eventTitle: event.title,
      attendeeName: name,
      ticketId,
    }, qrCode);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration: {
        ticketId,
        email,
        status: event.isPaid ? 'pending_payment' : 'confirmed',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { search, checkedIn, page = 1, limit = 20 } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check ownership
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

    if (checkedIn !== undefined) {
      query.checkedIn = checkedIn === 'true';
    }

    const registrations = await Registration.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ registeredAt: -1 });

    const total = await Registration.countDocuments(query);

    res.status(200).json({
      success: true,
      registrations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const checkInAttendee = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const registration = await Registration.findOne({ ticketId }).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check ownership
    if (registration.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Attendee checked in successfully',
      attendee: {
        name: registration.name,
        email: registration.email,
        checkedIn: true,
        checkedInAt: registration.checkedInAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportRegistrationsCSV = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const registrations = await Registration.find({ event: eventId });

    const filePath = await exportRegistrationsToCSV(registrations, event.title, event.formSections);

    res.download(filePath, `${event.title}-registrations.csv`, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
    });
  } catch (error) {
    next(error);
  }
};
