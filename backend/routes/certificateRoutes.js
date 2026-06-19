import express from 'express';
import {
  getOrganizerEvents,
  getEventRegistrationsHandler,
  createTemplate,
  updateTemplate,
  getTemplate,
  checkPricing,
  generatePreview,
  generateCertificates,
  getIssuedCertificatesHandler,
  downloadCertificatePDF,
  sendCertificatesEmail,
  getPricingInfo,
  getOrganizerTemplates,
  deleteTemplate,
  uploadCertificateLogo,
  uploadCertificateSignature,
  getAllIssuedByOrganizer,
  getCertificatesByEmail,
} from '../controllers/certificateController.js';

import { auth as protect } from '../middleware/auth.js';
import { getCertificateLogoUploader, getCertificateSignatureUploader } from '../services/cloudinaryService.js';

const router = express.Router();

// ── PUBLIC route (no JWT — attendee profile page) ────────────
router.get('/attendee/mine', getCertificatesByEmail);

// ── All routes below require organiser JWT ───────────────────
router.use(protect);

// Events
router.get('/organizer/events',             getOrganizerEvents);
router.get('/event/:eventId/registrations', getEventRegistrationsHandler);

// Templates
router.post('/template/create',             createTemplate);
router.get('/template/:templateId',         getTemplate);
router.put('/template/:templateId',         updateTemplate);
router.delete('/template/:templateId',      deleteTemplate);
router.post('/template/:templateId/upload-logo',
  getCertificateLogoUploader().single('logo'), uploadCertificateLogo);
router.post('/template/:templateId/upload-signature',
  getCertificateSignatureUploader().single('signature'), uploadCertificateSignature);
router.get('/organizer/templates',          getOrganizerTemplates);

// Certificate generation
router.post('/preview',                     generatePreview);
router.post('/check-pricing',               checkPricing);
router.post('/generate',                    generateCertificates);
router.get('/issued/:templateId',           getIssuedCertificatesHandler);

// Download + email
router.get('/download/:certificateId',      downloadCertificatePDF);
router.post('/send-emails',                 sendCertificatesEmail);

// Pricing
router.get('/pricing/info',                 getPricingInfo);

// ── NEW: organiser all-issued dashboard view ─────────────────
router.get('/organizer/all-issued',         getAllIssuedByOrganizer);

export default router;