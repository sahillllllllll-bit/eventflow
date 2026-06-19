import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

// ─────────────────────────────────────────────────────────────
//  AttendeeUser — lightweight identity for event attendees
//  NOT the organiser User model — separate collection entirely
//
//  Tier 1: just email + name (from registration, no password)
//  Tier 2: email + OTP restore (no password)
//  Tier 3: email + password (optional, user opts in via toggle)
// ─────────────────────────────────────────────────────────────
const attendeeUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },

    // ── Password (optional — user toggles this on) ─────────
    hasPassword: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      select: false,
      default: null,
    },

    // ── Registered events ──────────────────────────────────
    // Array of eventIds this attendee has registered for
    registeredEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],

    // ── OTP for email restore / password setup ─────────────
    otp: {
      type: String,
      select: false,
    },
    otpExpire: {
      type: Date,
      select: false,
    },
    otpPurpose: {
      type: String,
      enum: ['restore', 'set_password', 'verify'],
      select: false,
    },
  },
  { timestamps: true },
);

// Hash password before saving
attendeeUserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcryptjs.genSalt(12);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

attendeeUserSchema.methods.matchPassword = async function (entered) {
  return bcryptjs.compare(entered, this.password);
};

// Generate 6-digit OTP
attendeeUserSchema.methods.generateOTP = function (purpose = 'restore') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpPurpose = purpose;
  return otp;
};

attendeeUserSchema.index({ email: 1 });

export default mongoose.model('AttendeeUser', attendeeUserSchema);