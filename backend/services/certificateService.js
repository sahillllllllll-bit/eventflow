import { CertificateTemplate, CertificateIssued, CertificatePricing } from '../models/Certificate.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const certEmailTransporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: { user: process.env.BREVO_SMTP_LOGIN, pass: process.env.BREVO_SMTP_KEY },
});

export const getOrCreatePricing = async (organizerId) => {
  let pricing = await CertificatePricing.findOne({ organizerId });
  if (!pricing) { pricing = new CertificatePricing({ organizerId }); await pricing.save(); }
  return pricing;
};

export const getOrganizerEventsWithCount = async (organizerId) => {
  const events = await Event.find({
    organizer: organizerId,
    status: { $in: ['published', 'completed'] },
  }).select('_id title description date venue isOnline currentRegistrations coverImage').sort({ date: -1 }).lean();

  if (!events.length) return [];

  const counts = await Registration.aggregate([
    { $match: { event: { $in: events.map(e => e._id) } } },
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[c._id.toString()] = c.count; });

  return events.map(event => ({
    ...event,
    registrationCount: countMap[event._id.toString()] ?? event.currentRegistrations ?? 0,
  }));
};

export const getEventRegistrations = async (eventId) => {
  return await Registration.find({ event: eventId }).select('_id name email phone').sort({ registeredAt: -1 });
};

// ── KEY FIX: explicit handling of customElements and designConfig ─────────────
export const createCertificateTemplate = async (templateData) => {
  if (!templateData.templateName) throw new Error('Template name is required');
  if (!templateData.organizerId)  throw new Error('Organizer ID is required');
  if (!templateData.eventId)      throw new Error('Event ID is required');

  const { customElements, designConfig, ...rest } = templateData;

  console.log('[CertService] Saving template, elements:', customElements?.length ?? 0);

  const template = new CertificateTemplate({
    ...rest,
    templateName:   rest.templateName.trim(),
    // ── Set explicitly so Mongoose Mixed array is preserved ──
    customElements: Array.isArray(customElements) ? customElements : [],
    designConfig:   designConfig ? {
      backgroundColor:    designConfig.backgroundColor    || '#FFFFFF',
      backgroundGradient: designConfig.backgroundGradient || null,
      borderStyle:        designConfig.borderStyle        || 'elegant',
      borderColor:        designConfig.borderColor        || '#D4A574',
      borderWidth:        designConfig.borderWidth        || 8,
      width:              designConfig.width              || 1050,
      height:             designConfig.height             || 744,
      padding:            designConfig.padding            || 40,
    } : undefined,
  });

  await template.save();
  console.log('[CertService] Saved, elements in DB:', template.customElements.length);
  return template;
};

export const updateCertificateTemplate = async (templateId, updateData) => {
  const { customElements, designConfig, ...rest } = updateData;
  const update = { ...rest, updatedAt: new Date() };
  if (Array.isArray(customElements)) update.customElements = customElements;
  if (designConfig) update.designConfig = designConfig;
  return await CertificateTemplate.findByIdAndUpdate(templateId, update, { new: true });
};

export const getCertificateTemplate = async (templateId) => {
  return await CertificateTemplate.findById(templateId);
};

export const generateCertificateHTML = (template, recipientName, recipientData = {}) => {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const borderStyles = {
    none:    'border:none;',
    simple:  `border:3px solid ${template.borderColor};`,
    elegant: `border:8px double ${template.borderColor};box-shadow:inset 0 0 0 2px ${template.borderColor};`,
    modern:  `border-top:4px solid ${template.borderColor};border-bottom:4px solid ${template.borderColor};`,
  };
  const footerText = (template.footerText || 'Issued on {date}').replace('{date}', date);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{margin:0;padding:0;font-family:'Georgia',serif;}
    .c{width:${template.templateDesign==='landscape'?'1200px':'800px'};height:${template.templateDesign==='landscape'?'800px':'1100px'};
    background-color:${template.backgroundColor||'#fff'};display:flex;flex-direction:column;
    justify-content:center;align-items:center;padding:40px;box-sizing:border-box;
    ${borderStyles[template.borderStyle]||borderStyles.simple}position:relative;}
    .h{font-size:${template.headingFontSize}px;color:${template.headingColor};font-weight:bold;margin:20px 0;text-align:center;}
    .s{font-size:${template.subHeadingFontSize}px;color:${template.descriptionColor};margin-bottom:20px;text-align:center;}
    .n{font-size:${template.recipientNameFontSize}px;color:${template.recipientNameColor};font-weight:bold;margin:30px 0;text-decoration:underline;text-align:center;}
    .d{font-size:${template.descriptionFontSize}px;color:${template.descriptionColor};margin:20px 0;text-align:center;}
    .e{font-size:${template.descriptionFontSize}px;font-style:italic;color:${template.accentColor};margin:10px 0;text-align:center;}
    .f{font-size:${template.footerFontSize}px;color:${template.footerColor};margin-top:40px;text-align:center;}
    .code{position:absolute;bottom:20px;right:30px;font-size:10px;color:${template.footerColor};}
    </style></head><body><div class="c">
    ${template.logo?`<img src="${template.logo}" style="width:${template.logoWidth}px;height:${template.logoHeight}px;margin-bottom:30px;" alt="Logo">`:''}
    <div class="h">${template.heading||''}</div>
    <div class="s">${template.subHeading||''}</div>
    <div class="n">${recipientName}</div>
    <div class="d">${template.descriptionText||''}</div>
    <div class="e">${recipientData.eventName||''}</div>
    <div class="f">${footerText}</div>
    <div class="code">Cert ID: ${recipientData.uniqueCode||''}</div>
    </div></body></html>`;
};

export const checkCertificatePricing = async (organizerId, certificateCount) => {
  const pricing = await getOrCreatePricing(organizerId);
  const available = pricing.freeCertificatesRemaining;
  const paidCertificates = Math.max(0, certificateCount - available);
  const totalCost = paidCertificates * 1;
  return {
    freeCertificatesAvailable: available,
    freeRemaining: available,
    certificateCount,
    paidCertificates,
    costPerCertificate: paidCertificates > 0 ? 1 : 0,
    totalCost,
    message: totalCost === 0
      ? `All ${certificateCount} certificates are free`
      : `${available} free + ${paidCertificates} paid @ ₹1 each = ₹${totalCost}`,
  };
};

export const generateCertificatesForEvent = async (templateId, eventId, organizerId, registrationIds = null) => {
  const template = await getCertificateTemplate(templateId);
  if (!template) throw new Error('Certificate template not found');
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  let registrations;
  if (registrationIds?.length) {
    registrations = await Registration.find({ _id: { $in: registrationIds }, event: eventId });
  } else {
    registrations = await Registration.find({ event: eventId });
  }

  const generatedCerts = [];
  for (const reg of registrations) {
    const existing = await CertificateIssued.findOne({ registrationId: reg._id, templateId });
    if (existing) { generatedCerts.push(existing); continue; }

    const uniqueCode = uuidv4().substring(0, 12).toUpperCase();
    const cert = new CertificateIssued({
      templateId, eventId, organizerId,
      registrationId: reg._id,
      recipientName:  reg.name || 'Participant',
      recipientEmail: reg.email,
      uniqueCode,
      certificateData: { recipientName: reg.name, eventName: event.title || event.name, uniqueCode },
    });
    await cert.save();
    generatedCerts.push(cert);
  }
  return generatedCerts;
};

export const getIssuedCertificates = async (templateId) => {
  return await CertificateIssued.find({ templateId })
    .select('recipientName recipientEmail issuedAt emailStatus emailSentAt uniqueCode')
    .sort({ issuedAt: -1 });
};

export const sendCertificateEmail = async (certificateId, pdfUrl) => {
  const cert = await CertificateIssued.findById(certificateId);
  if (!cert) throw new Error('Certificate not found');
  const template = await getCertificateTemplate(cert.templateId);
  const event = await Event.findById(cert.eventId);

  await certEmailTransporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@eventglow.com',
    to:   cert.recipientEmail,
    subject: `Your Certificate - ${event?.title || 'EventGlow'}`,
    html: `<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
            <tr><td style="background:#3B82F6;padding:28px 40px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#fff;font-size:24px;">🎓 Certificate Issued</h1></td></tr>
            <tr><td style="padding:36px 40px;color:#e0e0e0;font-size:15px;line-height:1.7;">
              <p>Dear <strong>${cert.recipientName}</strong>,</p>
              <p>Congratulations! Your certificate for <strong>${event?.title||'the event'}</strong> is ready.</p>
              <p><a href="${pdfUrl}" style="display:inline-block;padding:12px 28px;background:#3B82F6;color:white;text-decoration:none;border-radius:6px;font-weight:600;">Download Certificate</a></p>
              <p style="margin-top:30px;color:#999;font-size:13px;">Best regards,<br><strong>${template?.organizerName||'EventGlow'}</strong></p>
            </td></tr>
          </table>
        </td></tr>
      </table></body>`,
  });

  cert.emailSentAt = new Date();
  cert.emailStatus = 'sent';
  await cert.save();
  return cert;
};

export const updatePricingAfterSend = async (organizerId, certificateCount) => {
  const pricing = await getOrCreatePricing(organizerId);
  if (certificateCount <= pricing.freeCertificatesRemaining) {
    pricing.freeCertificatesRemaining -= certificateCount;
    pricing.certificatesSentThisMonth += certificateCount;
  } else {
    const paidCount = certificateCount - pricing.freeCertificatesRemaining;
    pricing.certificatesSentThisMonth += certificateCount;
    pricing.freeCertificatesRemaining  = 0;
    pricing.totalPaid += paidCount;
  }
  await pricing.save();
  return pricing;
};