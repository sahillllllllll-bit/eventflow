import User from '../models/User.js';
import { generateToken, generateOrganizerSlug, generateResetToken } from '../utils/helpers.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import crypto from 'crypto';

// ─── Sanitization helpers ────────────────────────────────────────────────────

/**
 * Strip HTML tags, null bytes, and trim whitespace.
 * MongoDB is not vulnerable to classic SQL injection, but we still sanitize
 * to prevent stored-XSS and NoSQL operator injection ($where, $gt, etc.).
 */
const sanitizeField = (value, maxLength = 255) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\0/g, '')                        // strip null bytes
    .replace(/<[^>]*>/g, '')                   // strip HTML tags
    .replace(/[${}()]/g, '')                   // strip NoSQL injection operators
    .trim()
    .slice(0, maxLength);
};

/** Validate and normalize email */
const sanitizeEmail = (value) => {
  if (typeof value !== 'string') return '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = value.trim().toLowerCase().slice(0, 254);
  return emailRegex.test(trimmed) ? trimmed : null;
};

/** Validate phone: allow digits, +, -, spaces, parentheses only */
const sanitizePhone = (value) => {
  if (!value) return '';
  if (typeof value !== 'string') return '';
  return value.replace(/[^0-9+\-\s()]/g, '').trim().slice(0, 20);
};

// ─── Controllers ─────────────────────────────────────────────────────────────

export const register = async (req, res, next) => {
  try {
    const { name, email, password, college, phone } = req.body;

    // ── Sanitize inputs ──
    const cleanName    = sanitizeField(name, 100);
    const cleanEmail   = sanitizeEmail(email);
    const cleanCollege = sanitizeField(college, 150);
    const cleanPhone   = sanitizePhone(phone);

    // ── Validate required fields ──
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, message: 'Valid name is required (min 2 characters)' });
    }
    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }
    if (!cleanCollege || cleanCollege.length < 2) {
      return res.status(400).json({ success: false, message: 'Valid college name is required (min 2 characters)' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be under 128 characters' });
    }

    // ── Check for existing user ──
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // ── Create user ──
    const organizerSlug = generateOrganizerSlug(cleanName);
    const user = new User({
      name:    cleanName,
      email:   cleanEmail,
      password,           // raw — Mongoose pre-save hook will hash it
      college: cleanCollege,
      phone:   cleanPhone,
      organizerSlug,
    });

    await user.save();

    // ── Generate email verification token ──
    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    await user.save();

    // ── Send verification email ──
    const verifyLink = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    await sendVerificationEmail(cleanEmail, verifyLink);

    // ── Generate JWT and respond ──
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email to verify.',
      token,
      user: {
        id:      user._id,
        name:    user.name,
        email:   user.email,
        college: user.college,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = sanitizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id:            user._id,
        name:          user.name,
        email:         user.email,
        college:       user.college,
        organizerSlug: user.organizerSlug,
        isVerified:    user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id:                    user._id,
        name:                  user.name,
        email:                 user.email,
        college:               user.college,
        organizerSlug:         user.organizerSlug,
        isVerified:            user.isVerified,
        profilePhoto:          user.profilePhoto,
        totalEventsCreated:    user.totalEventsCreated,
        totalAttendeesReached: user.totalAttendeesReached,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const cleanEmail = sanitizeEmail(req.body.email);

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Return same message to prevent user enumeration
      return res.status(200).json({ success: true, message: 'Password reset link sent to your email' });
    }

    const { token, hashedToken } = generateResetToken();
    user.resetPasswordToken  = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendPasswordResetEmail(cleanEmail, resetLink);

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be under 128 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ emailVerifyToken: hashedToken });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.isVerified       = true;
    user.emailVerifyToken = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId         = req.user._id;
    const profilePhotoUrl = req.file.secure_url;

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: profilePhotoUrl },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');

    return res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};