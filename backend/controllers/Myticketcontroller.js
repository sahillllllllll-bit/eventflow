import Registration from '../models/Registration.js';

// ─────────────────────────────────────────────────────────────
//  GET /api/registrations/my-ticket?eventId=xxx&email=xxx
//  Public — attendee gets their ticket for a specific event
// ─────────────────────────────────────────────────────────────
export const getMyTicket = async (req, res, next) => {
  try {
    const { eventId, email } = req.query;
    if (!eventId || !email) {
      return res.status(400).json({ success: false, message: 'eventId and email required' });
    }

    const reg = await Registration.findOne({
      event: eventId,
      email: email.trim().toLowerCase(),
    }).populate('event', 'title date venue isOnline meetLink slug brandColor');

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const event = reg.event;
    const eventTime = event?.date
      ? new Date(event.date).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: true,
        })
      : '';

    return res.status(200).json({
      success: true,
      ticket: {
        ticketId:     reg.ticketId,
        attendeeName: reg.name,
        email:        reg.email,
        phone:        reg.phone,
        checkedIn:    reg.checkedIn,
        checkedInAt:  reg.checkedInAt,
        registeredAt: reg.registeredAt,
        paymentStatus: reg.paymentStatus,
        eventTitle:   event?.title || '',
        eventDate:    event?.date  || null,
        eventTime,
        eventLocation: event?.isOnline
          ? (event?.meetLink || 'Online')
          : (event?.venue   || 'TBA'),
      },
    });
  } catch (err) {
    next(err);
  }
};