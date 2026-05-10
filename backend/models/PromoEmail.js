import mongoose from 'mongoose';

const promoEmailSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  targetEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    }
  ],
  totalSent: {
    type: Number,
    default: 0,
  },
  openCount: {
    type: Number,
    default: 0,
  },
  sentAt: Date,
  status: {
    type: String,
    enum: ['draft', 'sent', 'failed'],
    default: 'draft',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('PromoEmail', promoEmailSchema);
