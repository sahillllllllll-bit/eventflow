import mongoose from 'mongoose';

const certificateTemplateSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  templateName: {
    type: String,
    required: true,
  },
  // Design settings
  backgroundColor: { type: String, default: '#ffffff' },
  backgroundGradient: { type: String, default: null }, // ← NEW: CSS gradient string
  accentColor: { type: String, default: '#3B82F6' },
  logo: { type: String, default: null },
  logoWidth: { type: Number, default: 100 },
  logoHeight: { type: Number, default: 100 },
  heading: { type: String, default: 'Certificate of Completion' },
  headingFontSize: { type: Number, default: 48 },
  headingColor: { type: String, default: '#000000' },
  subHeading: { type: String, default: 'This is to certify that' },
  subHeadingFontSize: { type: Number, default: 24 },
  recipientNameFontSize: { type: Number, default: 36 },
  recipientNameColor: { type: String, default: '#3B82F6' },
  descriptionText: { type: String, default: 'Has successfully completed the event' },
  descriptionFontSize: { type: Number, default: 20 },
  descriptionColor: { type: String, default: '#000000' },
  footerText: { type: String, default: 'Issued on {date}' },
  footerFontSize: { type: Number, default: 14 },
  footerColor: { type: String, default: '#666666' },
  organizerName: { type: String, default: '' },
  organizerSignature: { type: String, default: null },
  templateDesign: {
    type: String,
    enum: ['portrait', 'landscape'],
    default: 'landscape',
  },
  borderStyle: {
    type: String,
    // ← Added 'thick', 'double', 'shadow' to match new editor options
    enum: ['none', 'simple', 'elegant', 'modern', 'thick', 'double', 'shadow'],
    default: 'elegant',
  },
  borderColor: { type: String, default: '#3B82F6' },
  borderWidth: { type: Number, default: 8 }, // ← NEW: explicit border width

  // Canvas elements from the visual editor
  customElements: { type: Array, default: [] },

  // Full design config snapshot from the editor store
  designConfig: {
    backgroundColor: String,
    backgroundGradient: String, // ← NEW
    borderStyle: String,
    borderColor: String,
    borderWidth: Number,
    width: Number,
    height: Number,
    padding: Number,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt on save
certificateTemplateSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const certificateIssuedSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CertificateTemplate',
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true,
  },
  recipientName: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  uniqueCode: { type: String, unique: true, sparse: true },
  certificatePDF: { type: String, default: null },
  issuedAt: { type: Date, default: Date.now },
  emailSentAt: { type: Date, default: null },
  emailStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
  downloadCount: { type: Number, default: 0 },
  lastDownloadedAt: { type: Date, default: null },
  certificateData: { type: mongoose.Schema.Types.Mixed, default: null },
});

const certificatePricingSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  certificatesSentThisMonth: { type: Number, default: 0 },
  freeCertificatesRemaining: { type: Number, default: 20 },
  monthlyResetDate: { type: Date, default: Date.now },
  totalPaid: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CertificateTemplate = mongoose.model('CertificateTemplate', certificateTemplateSchema);
const CertificateIssued = mongoose.model('CertificateIssued', certificateIssuedSchema);
const CertificatePricing = mongoose.model('CertificatePricing', certificatePricingSchema);

export { CertificateTemplate, CertificateIssued, CertificatePricing };