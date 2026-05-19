import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────
//  Registration model
//
//  NOTE: `name` and `email` are NOT marked `required: true` here
//  because validation is done explicitly in the controller before
//  calling .save(). This avoids confusing Mongoose ValidationError
//  messages and gives you full control over error responses.
// ─────────────────────────────────────────────────────────────
const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'event is required'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'organizer is required'],
    },
    ticketId: {
      type: String,
      unique: true,
      required: [true, 'ticketId is required'],
      trim: true,
    },

    // ── Attendee info ──────────────────────────────────────
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },

    // ── Custom form responses ──────────────────────────────
    // Stored as a Map<string, string>: { fieldId → answer }
    responses: {
      type: Map,
      of: String,
      default: () => new Map(),
    },

    // ── File uploads (Cloudinary URLs) ─────────────────────
    // Stored as a Map<fieldId, { url, filename, size }>
    fileUploads: {
      type: Map,
      of: new mongoose.Schema({
        url: String,
        filename: String,
        size: Number,
        mimeType: String,
        uploadedAt: { type: Date, default: Date.now },
      }, { _id: false }),
      default: () => new Map(),
    },

    // ── Payment ───────────────────────────────────────────
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'free'],
      default: 'free',
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── QR Code ───────────────────────────────────────────
    qrCode: String, // base64 data-URI or URL

    // ── Check-in ──────────────────────────────────────────
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: Date,

    // ── Consent ───────────────────────────────────────────
    consentPromoEmails: {
      type: Boolean,
      default: true,
    },

    // ── Legacy explicit timestamp (kept for backward compat) ─
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // also adds createdAt / updatedAt
  },
);

// Index for fast ticket lookups
registrationSchema.index({ ticketId: 1 });
registrationSchema.index({ event: 1, email: 1 });

export default mongoose.model('Registration', registrationSchema);