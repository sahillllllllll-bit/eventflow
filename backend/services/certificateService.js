import { CertificateTemplate, CertificateIssued, CertificatePricing } from '../models/Certificate.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { sendVerificationEmail, sendTicketConfirmationEmail } from './emailService.js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─── Certificate Email Transporter ─────────────────────────────────────────────
const certEmailTransporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// Get or create pricing info for organizer
export const getOrCreatePricing = async (organizerId) => {
  let pricing = await CertificatePricing.findOne({ organizerId });
  if (!pricing) {
    pricing = new CertificatePricing({ organizerId });
    await pricing.save();
  }
  return pricing;
};

// Get organizer events with registration count
export const getOrganizerEventsWithCount = async (organizerId) => {
  // Fetch events that are worth issuing certificates for
  const events = await Event.find({
    organizer: organizerId,
    status: { $in: ['published', 'completed'] },
  })
    .select('_id title description date venue isOnline currentRegistrations coverImage')
    .sort({ date: -1 })
    .lean();                         // plain JS objects — fast, no Mongoose overhead
 
  if (!events.length) return [];
 
  // Attach live registration counts (currentRegistrations on Event is a cached
  // counter; we do a real count here so the cert page always shows the truth)
  const counts = await Registration.aggregate([
    { $match: { event: { $in: events.map((e) => e._id) } } },
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ]);
 
  const countMap = {};
  counts.forEach((c) => { countMap[c._id.toString()] = c.count; });
 
  return events.map((event) => ({
    ...event,
    registrationCount: countMap[event._id.toString()] ?? event.currentRegistrations ?? 0,
  }));
};

// Get registrations for an event
export const getEventRegistrations = async (eventId) => {
  return await Registration.find({ event: eventId })
    .select('_id name email phone')
    .sort({ registeredAt: -1 });
};

// Create certificate template
export const createCertificateTemplate = async (templateData) => {
  // Validate required fields
  if (!templateData.templateName) {
    throw new Error('Template name is required');
  }

  if (!templateData.organizerId) {
    throw new Error('Organizer ID is required');
  }

  if (!templateData.eventId) {
    throw new Error('Event ID is required');
  }

  console.log('Creating template in service:', {
    templateName: templateData.templateName,
    organizerId: templateData.organizerId,
    eventId: templateData.eventId,
  });

  const template = new CertificateTemplate({
    ...templateData,
    templateName: templateData.templateName.trim(),
  });

  await template.save();
  
  console.log('Template saved successfully:', template._id);
  return template;
};

// Update certificate template
export const updateCertificateTemplate = async (templateId, updateData) => {
  return await CertificateTemplate.findByIdAndUpdate(templateId, updateData, {
    new: true,
  });
};

// Get certificate template
export const getCertificateTemplate = async (templateId) => {
  return await CertificateTemplate.findById(templateId);
};

// Generate certificate HTML
export const generateCertificateHTML = (template, recipientName, recipientData = {}) => {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const borderStyles = {
    none: 'border: none;',
    simple: `border: 3px solid ${template.borderColor};`,
    elegant: `border: 8px double ${template.borderColor}; box-shadow: inset 0 0 0 2px ${template.borderColor};`,
    modern: `border-top: 4px solid ${template.borderColor}; border-bottom: 4px solid ${template.borderColor};`,
  };

  const footerText = template.footerText.replace('{date}', date);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Georgia', serif;
        }
        .certificate-container {
          width: ${template.templateDesign === 'landscape' ? '1200px' : '800px'};
          height: ${template.templateDesign === 'landscape' ? '800px' : '1100px'};
          background-color: ${template.backgroundColor};
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          box-sizing: border-box;
          ${borderStyles[template.borderStyle]}
          position: relative;
        }
        .logo {
          width: ${template.logoWidth}px;
          height: ${template.logoHeight}px;
          margin-bottom: 30px;
        }
        .heading {
          font-size: ${template.headingFontSize}px;
          color: ${template.headingColor};
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .subheading {
          font-size: ${template.subHeadingFontSize}px;
          color: ${template.descriptionColor};
          margin-bottom: 20px;
          text-align: center;
        }
        .recipient-name {
          font-size: ${template.recipientNameFontSize}px;
          color: ${template.recipientNameColor};
          font-weight: bold;
          margin: 30px 0;
          text-decoration: underline;
          text-align: center;
          min-width: 400px;
        }
        .description {
          font-size: ${template.descriptionFontSize}px;
          color: ${template.descriptionColor};
          margin: 20px 0;
          text-align: center;
          max-width: 900px;
        }
        .event-name {
          font-size: ${template.descriptionFontSize}px;
          font-style: italic;
          color: ${template.accentColor};
          margin: 10px 0;
          text-align: center;
        }
        .signature-section {
          display: flex;
          justify-content: space-around;
          width: 100%;
          margin-top: 60px;
          max-width: 800px;
        }
        .signature-box {
          text-align: center;
          flex: 1;
        }
        .signature-image {
          height: 60px;
          margin-bottom: 10px;
        }
        .signature-line {
          border-top: 2px solid ${template.descriptionColor};
          margin-top: 10px;
          padding-top: 5px;
          font-size: 14px;
          color: ${template.descriptionColor};
        }
        .footer {
          font-size: ${template.footerFontSize}px;
          color: ${template.footerColor};
          margin-top: 40px;
          text-align: center;
        }
        .code {
          position: absolute;
          bottom: 20px;
          right: 30px;
          font-size: 10px;
          color: ${template.footerColor};
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        ${template.logo ? `<img src="${template.logo}" class="logo" alt="Logo">` : ''}
        <div class="heading">${template.heading}</div>
        <div class="subheading">${template.subHeading}</div>
        <div class="recipient-name">${recipientName}</div>
        <div class="description">${template.descriptionText}</div>
        <div class="event-name">${recipientData.eventName || 'this event'}</div>
        
        <div class="signature-section">
          <div class="signature-box">
            ${template.organizerSignature ? `<img src="${template.organizerSignature}" class="signature-image" alt="Signature">` : ''}
            <div class="signature-line">${template.organizerName}</div>
            <div style="font-size: 12px; color: ${template.descriptionColor}; margin-top: 5px;">Organizer</div>
          </div>
        </div>
        
        <div class="footer">${footerText}</div>
        <div class="code">Cert ID: ${recipientData.uniqueCode || ''}</div>
      </div>
    </body>
    </html>
  `;

  return html;
};

// Check pricing and get available certificates
export const checkCertificatePricing = async (organizerId, certificateCount) => {
  const pricing = await getOrCreatePricing(organizerId);

  const available = pricing.freeCertificatesRemaining;
  let costPerCertificate = 0;
  let totalCost = 0;

  if (certificateCount <= available) {
    totalCost = 0;
  } else {
    const paidCertificates = certificateCount - available;
    totalCost = paidCertificates * 1; // 1 rupee per certificate
    costPerCertificate = 1;
  }

  return {
    freeCertificatesAvailable: available,
    certificateCount,
    paidCertificates: Math.max(0, certificateCount - available),
    costPerCertificate,
    totalCost,
    message:
      totalCost === 0
        ? `All ${certificateCount} certificates are free`
        : `${available} free certificates + ${Math.max(0, certificateCount - available)} paid certificates @ ₹1 each = ₹${totalCost}`,
  };
};

// Generate and save certificates for all registrations
export const generateCertificatesForEvent = async (
  templateId,
  eventId,
  organizerId,
  registrationIds = null
) => {
  const template = await getCertificateTemplate(templateId);
  if (!template) throw new Error('Certificate template not found');

  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  // Get registrations
  let registrations;
  if (registrationIds && registrationIds.length > 0) {
    registrations = await Registration.find({
      _id: { $in: registrationIds },
      event: eventId,
    });
  } else {
    registrations = await Registration.find({ event: eventId });
  }

  const generatedCerts = [];

  for (const registration of registrations) {
    // Check if a certificate already exists for this registration with the same template
    const existingCert = await CertificateIssued.findOne({
      registrationId: registration._id,
      templateId,
    });

    if (existingCert) {
      // Certificate already exists for this registration with this template, skip it
      generatedCerts.push(existingCert);
      continue;
    }

    const uniqueCode = uuidv4().substring(0, 12).toUpperCase();
    const recipientName = registration.name || 'Participant';

    const cert = new CertificateIssued({
      templateId,
      eventId,
      organizerId,
      registrationId: registration._id,
      recipientName,
      recipientEmail: registration.email,
      uniqueCode,
      certificateData: {
        ...template.toObject(),
        recipientName,
        eventName: event.name,
        uniqueCode,
      },
    });

    await cert.save();
    generatedCerts.push(cert);
  }

  return generatedCerts;
};

// Get issued certificates for template
export const getIssuedCertificates = async (templateId) => {
  return await CertificateIssued.find({ templateId })
    .select('recipientName recipientEmail issuedAt emailStatus emailSentAt')
    .sort({ issuedAt: -1 });
};

// Send certificate via email
export const sendCertificateEmail = async (certificateId, pdfUrl) => {
  try {
    const cert = await CertificateIssued.findById(certificateId);
    if (!cert) throw new Error('Certificate not found');

    const template = await getCertificateTemplate(cert.templateId);
    const event = await Event.findById(cert.eventId);

    const emailContent = `
      <h2 style="color: #fff; margin-top: 0;">Congratulations!</h2>
      <p>Dear <strong>${cert.recipientName}</strong>,</p>
      <p>We are delighted to provide you with your certificate for successfully completing <strong>${event?.title || 'the event'}</strong>.</p>
      <p>You can download your certificate by clicking the button below:</p>
      <p><a href="${pdfUrl}" style="display:inline-block;margin-top:15px;padding:12px 28px;background:#3B82F6;color:white;text-decoration:none;border-radius:6px;font-weight:600;">Download Certificate</a></p>
      <p style="margin-top: 30px; color: #999; font-size: 13px;">Best regards,<br><strong>${template?.organizerName || 'EventGlow'}</strong></p>
    `;

    const mailOptions = {
      to: cert.recipientEmail,
      subject: `Your Certificate - ${event?.title || 'EventGlow'}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
                  <tr>
                    <td style="background:#3B82F6;padding:28px 40px;">
                      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🎓 Certificate Issued</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:36px 40px;color:#e0e0e0;font-size:15px;line-height:1.7;">
                      ${emailContent}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
                      <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} EventGlow. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await certEmailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@eventglow.com',
      ...mailOptions,
    });

    cert.emailSentAt = new Date();
    cert.emailStatus = 'sent';
    await cert.save();

    console.log(`[CertificateService] Certificate email sent to ${cert.recipientEmail}`);
    return cert;
  } catch (error) {
    console.error(`[CertificateService] Failed to send certificate email:`, error.message);
    throw error;
  }
};

// Update pricing after sending certificates
export const updatePricingAfterSend = async (organizerId, certificateCount) => {
  const pricing = await getOrCreatePricing(organizerId);

  if (certificateCount <= pricing.freeCertificatesRemaining) {
    pricing.freeCertificatesRemaining -= certificateCount;
    pricing.certificatesSentThisMonth += certificateCount;
  } else {
    const paidCount = certificateCount - pricing.freeCertificatesRemaining;
    pricing.certificatesSentThisMonth += certificateCount;
    pricing.freeCertificatesRemaining = 0;
    pricing.totalPaid += paidCount * 1;
  }

  await pricing.save();
  return pricing;
};
