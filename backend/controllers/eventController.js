import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { generateSlug, generateTicketId } from '../utils/helpers.js';
import { generateQRCode } from '../services/qrService.js';
import { sendTicketConfirmationEmail } from '../services/emailService.js';

export const createEvent = async (req, res, next) => {
  try {
    const { title, description, category, date, endDate, venue, venueMapLink, isOnline, meetLink, isPaid, ticketPrice, maxCapacity, template, tags, formSections } = req.body;

    const slug = generateSlug(title);
    
    const event = new Event({
      organizer: req.user.id,
      title,
      slug,
      description,
      category,
      date,
      endDate,
      venue,
      venueMapLink,
      isOnline,
      meetLink,
      isPaid,
      ticketPrice,
      maxCapacity,
      template,
      tags,
      formSections,
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyEvents = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { organizer: req.user.id };
    if (status) query.status = status;

    const events = await Event.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      events,
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

export const getEventBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const event = await Event.findOne({ slug, status: 'published' }).populate('organizer', 'name organizerSlug profilePhoto');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    Object.assign(event, updates);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    event.status = 'cancelled';
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const publishEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Validate required fields
    if (!event.title || !event.date) {
      return res.status(400).json({ success: false, message: 'Event title and date are required' });
    }

    event.status = 'published';
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event published successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check ownership
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const totalRegistrations = await Registration.countDocuments({ event: id });
    const checkedInCount = await Registration.countDocuments({ event: id, checkedIn: true });
    const paidRegistrations = await Registration.countDocuments({ event: id, paymentStatus: 'paid' });
    
    const paidRevenue = await Registration.aggregate([
      { $match: { event: event._id, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalRegistrations,
        checkedInCount,
        checkInRate: totalRegistrations > 0 ? ((checkedInCount / totalRegistrations) * 100).toFixed(2) : 0,
        paidRegistrations,
        totalRevenue: paidRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
