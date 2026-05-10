import PromoEmail from '../models/PromoEmail.js';
import Registration from '../models/Registration.js';
import { sendPromoEmail } from '../services/emailService.js';

export const sendPromoEmailToAttendees = async (req, res, next) => {
  try {
    const { targetEventIds, subject, body, consentOnly = true } = req.body;

    // Get all registrations from target events with consent
    const query = {
      event: { $in: targetEventIds },
    };

    if (consentOnly) {
      query.consentPromoEmails = true;
    }

    const registrations = await Registration.find(query).distinct('email');

    if (registrations.length === 0) {
      return res.status(400).json({ success: false, message: 'No eligible recipients found' });
    }

    // Create promo email record
    const promoEmail = new PromoEmail({
      organizer: req.user.id,
      subject,
      body,
      targetEvents: targetEventIds,
      totalSent: registrations.length,
      sentAt: new Date(),
      status: 'sent',
    });

    await promoEmail.save();

    // Send emails (in background ideally, but for MVP send synchronously)
    let successCount = 0;
    for (const email of registrations) {
      try {
        await sendPromoEmail(email, { subject, body });
        successCount++;
      } catch (error) {
        console.error(`Failed to send promo email to ${email}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Promo email sent to ${successCount} recipients`,
      promoEmail,
    });
  } catch (error) {
    next(error);
  }
};

export const getPromoEmailHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const emails = await PromoEmail.find({ organizer: req.user.id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ sentAt: -1 });

    const total = await PromoEmail.countDocuments({ organizer: req.user.id });

    res.status(200).json({
      success: true,
      emails,
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
