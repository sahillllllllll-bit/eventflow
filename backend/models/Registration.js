import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ticketId: {
    type: String,
    unique: true,
    required: true,
  },
  responses: {
    type: Map,
    of: String,
  },
  name: String,
  email: String,
  phone: String,
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
  },
  qrCode: String, // base64 or URL
  checkedIn: {
    type: Boolean,
    default: false,
  },
  checkedInAt: Date,
  consentPromoEmails: {
    type: Boolean,
    default: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Registration', registrationSchema);
