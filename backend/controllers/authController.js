import User from '../models/User.js';
import { generateToken, generateOrganizerSlug, generateResetToken } from '../utils/helpers.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import crypto from 'crypto';

// ─── Sanitization helpers ─────────────────────────────────────────────────────

const sanitizeField = (value, maxLength = 255) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[${}()]/g, '')
    .trim()
    .slice(0, maxLength);
};

const sanitizeEmail = (value) => {
  if (typeof value !== 'string') return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = value.trim().toLowerCase().slice(0, 254);
  return emailRegex.test(trimmed) ? trimmed : null;
};

const sanitizePhone = (value) => {
  if (!value) return '';
  if (typeof value !== 'string') return '';
  return value.replace(/[^0-9+\-\s()]/g, '').trim().slice(0, 20);
};

// ─── Controllers ──────────────────────────────────────────────────────────────

export const register = async (req, res, next) => {
  try {
    const { name, email, password, college, phone } = req.body;

    // ── Step 1: Sanitize all inputs ──────────────────────────────
    const cleanName    = sanitizeField(name, 100);
    const cleanEmail   = sanitizeEmail(email);
    const cleanCollege = sanitizeField(college, 150);
    const cleanPhone   = sanitizePhone(phone);

    // ── Step 2: Validate EVERYTHING before any DB write ──────────
    // Name
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required (minimum 2 characters)',
      });
    }

    // Email
    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required',
      });
    }

    // College
    if (!cleanCollege || cleanCollege.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'College name is required (minimum 2 characters)',
      });
    }

    // Password — must validate before any save
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }
    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password must be under 128 characters',
      });
    }

    // ── Step 3: Check for existing user ──────────────────────────
    // Only hit the DB after all input validation passes
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // ── Step 4: Create and save user ─────────────────────────────
    const organizerSlug = generateOrganizerSlug(cleanName);
    const user = new User({
      name:    cleanName,
      email:   cleanEmail,
      password,
      college: cleanCollege,
      phone:   cleanPhone,
      organizerSlug,
    });

    await user.save();

    // ── Step 5: Generate verification token ──────────────────────
    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = crypto
      .createHash('sha256')
      .update(verifyToken)
      .digest('hex');
    await user.save();

    // ── Step 6: Send verification email ──────────────────────────
    // If email sending fails, the account still exists and the user
    // can request a resend — do NOT delete the user over this.
    try {
      const verifyLink = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
      await sendVerificationEmail(cleanEmail, verifyLink);
    } catch (emailErr) {
      console.error('Verification email failed to send:', emailErr.message);
      // Continue — account is created, email can be resent later
    }

    // ── Step 7: Return token ──────────────────────────────────────
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
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
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
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required',
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    // Same response whether user exists or not — prevents user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email',
      });
    }

    const { token, hashedToken } = generateResetToken();
    user.resetPasswordToken  = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 3600000);
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
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }
    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password must be under 128 characters',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
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
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    user.isVerified       = true;
    user.emailVerifyToken = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId          = req.user._id;
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