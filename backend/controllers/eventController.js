import Event from '../models/Event.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import { generateSlug, generateTicketId } from '../utils/helpers.js';
import { generateQRCode } from '../services/qrService.js';
import { sendTicketConfirmationEmail, sendTeamInviteEmail, sendEventReminderEmail } from '../services/emailService.js';
import crypto from 'crypto';

export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      shortSummary,       // ← new
      description,
      prizesAndGoodies,
      sendTicketEmails,
      paidEmailCredits,
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
      brandColor,
    } = req.body;
 
    const slug = generateSlug(title);
 
    // Validate and parse dates
    const parsedDate    = date    && date.trim()    ? new Date(date)    : null;
    const parsedEndDate = endDate && endDate.trim() ? new Date(endDate) : null;
 
    if (parsedDate    && isNaN(parsedDate.getTime()))    {
      return res.status(400).json({ success: false, message: 'Invalid start date format' });
    }
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid end date format' });
    }
 
    const event = new Event({
      organizer:        req.user.id,
      title,
      shortSummary:     shortSummary?.trim() || undefined,
      slug,
      description:      description || '',
      prizesAndGoodies,
      sendTicketEmails: sendTicketEmails !== undefined ? sendTicketEmails : true,
      paidEmailCredits: paidEmailCredits || 0,
      category,
      date:             parsedDate,
      endDate:          parsedEndDate,
      venue,
      venueMapLink,
      isOnline,
      meetLink,
      isPaid,
      ticketPrice:      isPaid ? ticketPrice : 0,
      maxCapacity,
      template,
      tags,
      formSections,
      brandColor:       brandColor || '#6C47FF',
    });
 
    await event.save();
 
    return res.status(201).json({
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

export const sendReminderToRegistrants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Reminder message is required' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const organizerId = event.organizer?.toString();
    const isCoordinator = event.teamMembers.some(
      (member) => member.userId?.toString() === req.user.id && member.role === 'coordinator'
    );
    if (organizerId !== req.user.id && !isCoordinator) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const registrations = await Registration.find({ event: id, email: { $exists: true } });
    if (!registrations.length) {
      return res.status(200).json({ success: true, message: 'No registered attendees to send reminders to' });
    }

    const results = await Promise.allSettled(
      registrations.map((registration) =>
        sendEventReminderEmail(registration.email, {
          attendeeName: registration.name,
          eventTitle: event.title,
          eventDate: event.date ? new Date(event.date).toLocaleString() : 'soon',
          message,
        })
      )
    );

    const sentCount = results.filter((result) => result.status === 'fulfilled').length;
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    res.status(200).json({
      success: true,
      message: `Reminder sent to ${sentCount} attendee(s). ${failedCount ? `${failedCount} failed.` : ''}`,
      sentCount,
      failedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('organizer', 'name organizerSlug profilePhoto')
      .populate('teamMembers.addedBy', 'name email')
      .populate('teamMembers.userId', 'name email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const organizerId = event.organizer?._id?.toString() || event.organizer?.toString();
    const isOrganizer = organizerId === req.user.id;
    const isCoordinator = event.teamMembers.some(
      (member) => member.userId?.toString() === req.user.id && member.role === 'coordinator'
    );
    const isInvitee = event.teamMembers.some(
      (member) => member.email === req.user.email?.toLowerCase()
    );

    if (!isOrganizer && !isCoordinator && !isInvitee) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

export const inviteTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the organizer can invite team members' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = event.teamMembers.find((member) => member.email === normalizedEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already invited' });
    }

    const inviteToken = crypto.randomBytes(24).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const acceptLink = `${process.env.CLIENT_URL}/accept-invite/${inviteToken}`;

    event.teamMembers.push({
      email: normalizedEmail,
      role,
      addedBy: req.user.id,
      active: false,
      inviteTokenHash,
      inviteTokenCreatedAt: new Date(),
      inviteExpiresAt,
    });

    await event.save();

    try {
      await sendTeamInviteEmail(normalizedEmail, event.title, acceptLink);
    } catch (emailError) {
      console.error('Failed to send team invite email:', emailError);
      return res.status(500).json({ success: false, message: 'Team member invited but email delivery failed. Please retry.' });
    }

    res.status(200).json({
      success: true,
      message: 'Team member invited successfully',
      teamMembers: event.teamMembers,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeamMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the organizer can update team members' });
    }

    const member = event.teamMembers.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    member.role = role;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Team member role updated successfully',
      teamMembers: event.teamMembers,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptTeamInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const event = await Event.findOne({ 'teamMembers.inviteTokenHash': tokenHash });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Team invite not found or expired' });
    }

    const member = event.teamMembers.find((member) => member.inviteTokenHash === tokenHash);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team invite not found' });
    }

    if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Team invite has expired' });
    }

    if (member.email !== user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Please accept this invite using the invited email address' });
    }

    member.active = true;
    member.userId = user._id;
    member.acceptedAt = new Date();
    member.inviteTokenHash = undefined;
    member.inviteExpiresAt = undefined;

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Team invite accepted successfully',
      eventId: event._id,
      teamMember: member,
    });
  } catch (error) {
    next(error);
  }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the organizer can remove team members' });
    }

    const member = event.teamMembers.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    member.remove();
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
      teamMembers: event.teamMembers,
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

export const uploadEventCover = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check authorization
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to upload cover for this event' });
    }

    // Update event with cover image URL
    event.coverImage = req.file.secure_url;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event cover image uploaded successfully',
      coverImage: req.file.secure_url,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadEventMarkdownImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check authorization
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to upload images for this event' });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: req.file.secure_url,
    });
  } catch (error) {
    next(error);
  }
};
