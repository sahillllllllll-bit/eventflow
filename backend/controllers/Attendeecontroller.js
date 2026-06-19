import AttendeeUser from '../models/AttendeeUser.js';
import Registration from '../models/Registration.js';
import { sendAttendeeOTPEmail } from '../services/emailService.js';

// ─────────────────────────────────────────────────────────────
//  Helper: generate userId token stored in localStorage
//  Simple base64 of email — stable, reproducible
// ─────────────────────────────────────────────────────────────
const makeUserId = (email) => Buffer.from(email.toLowerCase()).toString('base64');

// ─────────────────────────────────────────────────────────────
//  POST /api/attendee/init
//  Called after successful event registration
//  Creates AttendeeUser if not exists, links event
// ─────────────────────────────────────────────────────────────
export const initAttendee = async (req, res, next) => {
  try {
    const { name, email, phone, eventId } = req.body;
    if (!email || !eventId) {
      return res.status(400).json({ success: false, message: 'email and eventId required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let attendee = await AttendeeUser.findOne({ email: normalizedEmail });

    if (!attendee) {
      // First registration ever — create identity
      attendee = new AttendeeUser({
        name: name?.trim() || 'Attendee',
        email: normalizedEmail,
        phone: phone?.trim() || undefined,
        registeredEvents: [eventId],
      });
      await attendee.save();
    } else {
      // Already exists — just add event if not already in list
      if (!attendee.registeredEvents.map(String).includes(String(eventId))) {
        attendee.registeredEvents.push(eventId);
        await attendee.save();
      }
      // Update name/phone if provided and different
      if (name && attendee.name !== name.trim()) {
        attendee.name = name.trim();
        await attendee.save();
      }
    }

    const userId = makeUserId(normalizedEmail);

    return res.status(200).json({
      success: true,
      userId,
      name: attendee.name,
      email: attendee.email,
      hasPassword: attendee.hasPassword,
      registeredEvents: attendee.registeredEvents,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/attendee/restore
//  Called when localStorage is cleared — user enters email
//  Sends OTP to email for verification
// ─────────────────────────────────────────────────────────────
export const requestRestoreOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'email required' });

    const attendee = await AttendeeUser.findOne({ email: email.trim().toLowerCase() }).select('+otp +otpExpire +otpPurpose');
    if (!attendee) {
      return res.status(404).json({ success: false, message: 'No account found with this email. Please register for an event first.' });
    }

    const otp = attendee.generateOTP('restore');
    await attendee.save();

    await sendAttendeeOTPEmail(attendee.email, attendee.name, otp, 'restore');

    return res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/attendee/restore/verify
//  Verifies OTP and returns userId + profile
// ─────────────────────────────────────────────────────────────
export const verifyRestoreOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'email and otp required' });

    const attendee = await AttendeeUser.findOne({ email: email.trim().toLowerCase() }).select('+otp +otpExpire +otpPurpose');
    if (!attendee) return res.status(404).json({ success: false, message: 'Account not found' });

    if (!attendee.otp || attendee.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (attendee.otpExpire < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    // Clear OTP
    attendee.otp = undefined;
    attendee.otpExpire = undefined;
    attendee.otpPurpose = undefined;
    await attendee.save();

    const userId = makeUserId(attendee.email);

    return res.status(200).json({
      success: true,
      userId,
      name: attendee.name,
      email: attendee.email,
      hasPassword: attendee.hasPassword,
      registeredEvents: attendee.registeredEvents,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/attendee/login
//  For users who have set a password (Tier 3)
// ─────────────────────────────────────────────────────────────
export const attendeeLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'email and password required' });

    const attendee = await AttendeeUser.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!attendee || !attendee.hasPassword) {
      return res.status(400).json({ success: false, message: 'No password set. Use email OTP to restore access.' });
    }

    const match = await attendee.matchPassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password' });

    const userId = makeUserId(attendee.email);

    return res.status(200).json({
      success: true,
      userId,
      name: attendee.name,
      email: attendee.email,
      hasPassword: attendee.hasPassword,
      registeredEvents: attendee.registeredEvents,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/attendee/set-password/request
//  Sends OTP before allowing password set (security)
// ─────────────────────────────────────────────────────────────
export const requestSetPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const attendee = await AttendeeUser.findOne({ email: email?.trim().toLowerCase() }).select('+otp +otpExpire +otpPurpose');
    if (!attendee) return res.status(404).json({ success: false, message: 'Account not found' });

    const otp = attendee.generateOTP('set_password');
    await attendee.save();

    await sendAttendeeOTPEmail(attendee.email, attendee.name, otp, 'set_password');

    return res.status(200).json({ success: true, message: 'OTP sent to your email to verify password setup' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/attendee/set-password
//  Verifies OTP then sets password
// ─────────────────────────────────────────────────────────────
export const setAttendeePassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'email, otp and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const attendee = await AttendeeUser.findOne({ email: email.trim().toLowerCase() }).select('+otp +otpExpire +otpPurpose +password');
    if (!attendee) return res.status(404).json({ success: false, message: 'Account not found' });

    if (!attendee.otp || attendee.otp !== otp || attendee.otpPurpose !== 'set_password') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (attendee.otpExpire < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    attendee.password = password; // pre-save hook hashes it
    attendee.hasPassword = true;
    attendee.otp = undefined;
    attendee.otpExpire = undefined;
    attendee.otpPurpose = undefined;
    await attendee.save();

    return res.status(200).json({ success: true, message: 'Password set successfully. You can now login from any device.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/attendee/profile?userId=xxx
//  Returns attendee profile + registered events
// ─────────────────────────────────────────────────────────────
export const getAttendeeProfile = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const email = Buffer.from(userId, 'base64').toString('utf-8');
    const attendee = await AttendeeUser.findOne({ email }).populate({
      path: 'registeredEvents',
      select: 'title date venue isOnline category brandColor endDate slug',
    });

    if (!attendee) return res.status(404).json({ success: false, message: 'Profile not found' });

    return res.status(200).json({
      success: true,
      profile: {
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        hasPassword: attendee.hasPassword,
        registeredEvents: attendee.registeredEvents,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/attendee/check-member?userId=xxx&eventId=yyy
//  Checks if attendee is registered for a specific event
// ─────────────────────────────────────────────────────────────
export const checkMembership = async (req, res, next) => {
  try {
    const { userId, eventId } = req.query;
    if (!userId || !eventId) return res.status(400).json({ success: false, message: 'userId and eventId required' });

    const email = Buffer.from(userId, 'base64').toString('utf-8');
    const attendee = await AttendeeUser.findOne({ email });

    if (!attendee) return res.status(200).json({ isMember: false });

    const isMember = attendee.registeredEvents.map(String).includes(String(eventId));
    return res.status(200).json({ isMember, name: attendee.name });
  } catch (err) {
    next(err);
  }
};