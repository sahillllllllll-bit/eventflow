import {
  getOrganizerEventsWithCount,
  getEventRegistrations,
  createCertificateTemplate,
  updateCertificateTemplate,
  getCertificateTemplate,
  generateCertificatesForEvent,
  getIssuedCertificates,
  checkCertificatePricing,
  updatePricingAfterSend,
  sendCertificateEmail,
  generateCertificateHTML,
  getOrCreatePricing,
} from '../services/certificateService.js';
import { CertificateTemplate, CertificateIssued } from '../models/Certificate.js';
import Event from '../models/Event.js';

import { sendVerificationEmail, sendTicketConfirmationEmail } from '../services/emailService.js';

// Get events for organizer
export const getOrganizerEvents = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const events = await getOrganizerEventsWithCount(organizerId);
    res.json(events);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get registrations for event
export const getEventRegistrationsHandler = async (req, res) => {
  try {
    const { eventId } = req.params;
    const registrations = await getEventRegistrations(eventId);
    res.json(registrations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create certificate template
export const createTemplate = async (req, res) => {
  try {
    const { eventId, _id, id, ...templateData } = req.body;
 
    // ✅ Guard: ensure auth middleware populated req.user correctly
    const organizerId = req.user?._id;
 
    if (!organizerId) {
      console.error('req.user is:', req.user); // helps debug
      return res.status(401).json({
        error: 'Not authenticated. Please log in again.',
        field: 'organizerId',
      });
    }
 
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required', field: 'eventId' });
    }
 
    if (!templateData.templateName?.trim()) {
      return res.status(400).json({ error: 'Template name is required', field: 'templateName' });
    }
 
    const { designConfig, customElements, ...rest } = templateData;
 
    const merged = {
      ...rest,
      eventId,
      organizerId,
      customElements: customElements || [],
      backgroundColor: designConfig?.backgroundColor || rest.backgroundColor || '#ffffff',
      backgroundGradient: designConfig?.backgroundGradient || rest.backgroundGradient || null,
      borderStyle: designConfig?.borderStyle || rest.borderStyle || 'elegant',
      borderColor: designConfig?.borderColor || rest.borderColor || '#3B82F6',
      borderWidth: designConfig?.borderWidth || rest.borderWidth || 8,
      designConfig: designConfig || null,
    };
 
    console.log('Creating template for organizer:', organizerId, 'event:', eventId);
 
    const template = await createCertificateTemplate(merged);
    res.status(201).json(template);
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(400).json({
      error: error.message || 'Failed to create template',
      details: error.errors ? Object.keys(error.errors) : undefined,
    });
  }
};

// Update certificate template
export const updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { designConfig, customElements, ...rest } = req.body;
 
    const updates = {
      ...rest,
      customElements: customElements ?? undefined,
      backgroundColor: designConfig?.backgroundColor || rest.backgroundColor,
      backgroundGradient: designConfig?.backgroundGradient || rest.backgroundGradient || null,
      borderStyle: designConfig?.borderStyle || rest.borderStyle,
      borderColor: designConfig?.borderColor || rest.borderColor,
      borderWidth: designConfig?.borderWidth || rest.borderWidth,
      designConfig: designConfig || undefined,
      updatedAt: new Date(),
    };
 
    // Remove undefined keys so we don't overwrite existing fields with undefined
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
 
    const template = await updateCertificateTemplate(templateId, updates);
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get certificate template
export const getTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await getCertificateTemplate(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Check pricing for certificates
export const checkPricing = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { certificateCount } = req.body;

    const pricing = await checkCertificatePricing(organizerId, certificateCount);
    res.json(pricing);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Generate certificates preview
export const generatePreview = async (req, res) => {
  try {
    const { templateId, recipientName } = req.body;
    const template = await getCertificateTemplate(templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const html = generateCertificateHTML(template, recipientName || 'Sample Name', {
      eventName: 'Sample Event',
      uniqueCode: 'SAMPLE123',
    });

    res.json({ html });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Generate certificates for all registrations
export const generateCertificates = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { templateId, eventId, selectedRegistrationIds, autoSend } = req.body;

    // Check if user has permission
    const template = await getCertificateTemplate(templateId);
    if (template.organizerId.toString() !== organizerId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Generate certificates
    const certificates = await generateCertificatesForEvent(
      templateId,
      eventId,
      organizerId,
      selectedRegistrationIds
    );

    // Update pricing
    await updatePricingAfterSend(organizerId, certificates.length);

    // Send emails if autoSend is true
    if (autoSend) {
      for (const cert of certificates) {
        try {
          // In production, generate actual PDF and upload to storage
          const pdfUrl = `${process.env.FRONTEND_URL}/certificates/${cert._id}/download`;
          await sendCertificateEmail(cert._id, pdfUrl);
        } catch (emailError) {
          console.error(`Failed to send email to ${cert.recipientEmail}:`, emailError);
        }
      }
    }

    res.json({
      success: true,
      totalGenerated: certificates.length,
      message: autoSend
        ? `${certificates.length} certificates generated and emails sent`
        : `${certificates.length} certificates generated`,
      certificates: certificates.map((c) => ({
        _id: c._id,
        recipientName: c.recipientName,
        recipientEmail: c.recipientEmail,
        emailStatus: c.emailStatus,
      })),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get issued certificates
export const getIssuedCertificatesHandler = async (req, res) => {
  try {
    const { templateId } = req.params;
    const certificates = await getIssuedCertificates(templateId);
    res.json(certificates);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Download certificate as PDF
export const downloadCertificatePDF = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await CertificateIssued.findById(certificateId)
      .populate('templateId')
      .populate('eventId');

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (!cert.eventId) {
      return res.status(404).json({ error: 'Certificate event not found' });
    }

    // Use the saved certificateData snapshot to maintain template consistency
    const templateSnapshot = cert.certificateData || {};
    const event = cert.eventId;

    // Return complete certificate data with template for client-side rendering
    res.json({
      success: true,
      certificate: {
        _id: cert._id,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        uniqueCode: cert.uniqueCode,
        certificateData: cert.certificateData,
      },
      template: {
        _id: templateSnapshot._id,
        templateName: templateSnapshot.templateName,
        backgroundColor: templateSnapshot.backgroundColor,
        backgroundGradient: templateSnapshot.backgroundGradient,
        borderStyle: templateSnapshot.borderStyle,
        borderColor: templateSnapshot.borderColor,
        borderWidth: templateSnapshot.borderWidth,
        customElements: templateSnapshot.customElements,
        designConfig: templateSnapshot.designConfig,
        organizerName: templateSnapshot.organizerName,
      },
      event: {
        _id: event._id,
        title: event.title,
        date: event.date,
      },
      fileName: `certificate-${cert.recipientName.replace(/\s+/g, '-')}-${cert.uniqueCode}.pdf`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Send certificates via email
export const sendCertificatesEmail = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { certificateIds } = req.body;

    const certificates = await CertificateIssued.find({
      _id: { $in: certificateIds },
      organizerId,
    });

    let sentCount = 0;
    const failedEmails = [];

    for (const cert of certificates) {
      try {
        const pdfUrl = `${process.env.FRONTEND_URL}/certificates/${cert._id}/download`;
        await sendCertificateEmail(cert._id, pdfUrl);
        sentCount++;
      } catch (error) {
        failedEmails.push({
          email: cert.recipientEmail,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      sentCount,
      failedEmails,
      message: `${sentCount} emails sent successfully`,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get organizer pricing info
export const getPricingInfo = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const pricing = await getOrCreatePricing(organizerId);
    res.json(pricing);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all templates for organizer
export const getOrganizerTemplates = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const templates = await CertificateTemplate.find({ organizerId })
      .select('_id templateName eventId createdAt')
      .sort({ createdAt: -1 });

    res.json(templates);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete certificate template
export const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const organizerId = req.user._id;

    const template = await CertificateTemplate.findOne({
      _id: templateId,
      organizerId,
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Delete all issued certificates for this template
    await CertificateIssued.deleteMany({ templateId });
    await CertificateTemplate.findByIdAndDelete(templateId);

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const uploadCertificateLogo = async (req, res) => {
  try {
    const { templateId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const template = await CertificateTemplate.findOne({
      _id: templateId,
      organizerId: req.user._id,
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    template.logo = req.file.secure_url;
    await template.save();

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      logo: req.file.secure_url,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const uploadCertificateSignature = async (req, res) => {
  try {
    const { templateId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const template = await CertificateTemplate.findOne({
      _id: templateId,
      organizerId: req.user._id,
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    template.organizerSignature = req.file.secure_url;
    await template.save();

    res.status(200).json({
      success: true,
      message: 'Signature uploaded successfully',
      signature: req.file.secure_url,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
