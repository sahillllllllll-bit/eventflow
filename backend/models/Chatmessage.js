import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    senderEmail: { type: String, required: true, lowercase: true },
    senderName:  { type: String, required: true },
    text:        { type: String, required: true, trim: true, maxlength: 1000 },
    // true = sent by organiser, shown as announcement banner
    isAnnouncement: { type: Boolean, default: false },
    // differentiates organiser from attendee for UI styling
    isOrganiser: { type: Boolean, default: false },
  },
  { timestamps: true },
);

chatMessageSchema.index({ event: 1, createdAt: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);