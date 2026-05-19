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
} from '../controllers/certificateController.js';
import { auth as protect } from '../middleware/auth.js';
import { getCertificateLogoUploader, getCertificateSignatureUploader } from '../services/cloudinaryService.js';

const router = express.Router();

// Protect all routes - require authentication
router.use(protect);

// Events endpoints
router.get('/organizer/events', getOrganizerEvents);
router.get('/event/:eventId/registrations', getEventRegistrationsHandler);

// Template endpoints
router.post('/template/create', createTemplate);
router.get('/template/:templateId', getTemplate);
router.put('/template/:templateId', updateTemplate);
router.delete('/template/:templateId', deleteTemplate);
router.post('/template/:templateId/upload-logo', getCertificateLogoUploader().single('logo'), uploadCertificateLogo);
router.post('/template/:templateId/upload-signature', getCertificateSignatureUploader().single('signature'), uploadCertificateSignature);
router.get('/organizer/templates', getOrganizerTemplates);

// Certificate generation endpoints
router.post('/preview', generatePreview);
router.post('/check-pricing', checkPricing);
router.post('/generate', generateCertificates);
router.get('/issued/:templateId', getIssuedCertificatesHandler);

// Download and email endpoints
router.get('/download/:certificateId', downloadCertificatePDF);
router.post('/send-emails', sendCertificatesEmail);

// Pricing endpoints
router.get('/pricing/info', getPricingInfo);

export default router;
