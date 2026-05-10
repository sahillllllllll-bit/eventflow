import mongoose from 'mongoose';

const formSectionSchema = new mongoose.Schema({
  id: String,
  type: {
    type: String,
    enum: ['text', 'email', 'phone', 'dropdown', 'checkbox', 'radio', 'textarea', 'file', 'google_map', 'divider', 'heading'],
    required: true,
  },
  label: String,
  placeholder: String,
  required: {
    type: Boolean,
    default: false,
  },
  options: [String], // for dropdown/radio/checkbox
  order: Number,
}, { _id: false });

const eventSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
  description: String,
  coverImage: String,
  template: {
    type: String,
    enum: ['minimal', 'bold', 'gradient', 'dark', 'glass'],
    default: 'minimal',
  },
  category: {
    type: String,
    enum: ['fest', 'workshop', 'hackathon', 'competition', 'seminar', 'other'],
    default: 'other',
  },
  date: Date,
  endDate: Date,
  venue: String,
  venueMapLink: String,
  isOnline: {
    type: Boolean,
    default: false,
  },
  meetLink: String,
  isPaid: {
    type: Boolean,
    default: false,
  },
  ticketPrice: {
    type: Number,
    default: 0,
  },
  maxCapacity: Number,
  currentRegistrations: {
    type: Number,
    default: 0,
  },
  formSections: [formSectionSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'cancelled'],
    default: 'draft',
  },
  allowPromoEmails: {
    type: Boolean,
    default: true,
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
