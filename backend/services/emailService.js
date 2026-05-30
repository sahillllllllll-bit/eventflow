import dotenv from 'dotenv';
dotenv.config();

import { generateTicketHTML } from './ticketGenerator.js';
import { generatePDFFromHTML } from './generateTicketPDF.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const brevoHeaders = {
  'Content-Type': 'application/json',
  'api-key': process.env.BREVO_API_KEY,
};

// ─── Core sender ──────────────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html, attachments = [] }) => {
  const payload = {
    sender: {
      email: process.env.EMAIL_FROM,
      name:  process.env.EMAIL_FROM_NAME || 'EventGlow',
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (attachments.length > 0) {
    payload.attachment = attachments.map((a) => ({
      name:    a.filename,
      content: Buffer.isBuffer(a.content)
        ? a.content.toString('base64')
        : a.content,
    }));
  }

  const response = await fetch(BREVO_API_URL, {
    method:  'POST',
    headers: brevoHeaders,
    body:    JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[EmailService] Brevo error for "${subject}" to ${to}:`, errorBody);
    throw new Error(`Brevo API error: ${response.status} ${errorBody}`);
  }

  const result = await response.json();
  console.log(`[EmailService] Sent "${subject}" to ${to} (msgId: ${result.messageId})`);
  return result;
};

// ─── Base HTML wrapper ────────────────────────────────────────────────────────
const emailWrapper = (body, accentColor = '#6C47FF') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>EventGlow</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
        <tr>
          <td style="background:${accentColor};padding:28px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">EventGlow</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;color:#e0e0e0;font-size:15px;line-height:1.7;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
            <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} EventGlow. All rights reserved.</p>
            <p style="margin:6px 0 0;color:#555;font-size:12px;">You received this because you registered on EventGlow.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const btn = (label, href, color = '#6C47FF') =>
  `<a href="${href}" style="display:inline-block;margin-top:20px;padding:13px 28px;background:${color};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${label}</a>`;

// ─── 1. Email Verification ────────────────────────────────────────────────────
export const sendVerificationEmail = async (email, verifyLink) => {
  await sendMail({
    to:      email,
    subject: 'Verify your EventGlow account',
    html:    emailWrapper(`
      <h2 style="margin:0 0 12px;color:#fff;font-size:22px;">Welcome to EventGlow! 🎉</h2>
      <p>Thanks for signing up. Please verify your email address to activate your account:</p>
      ${btn('Verify Email', verifyLink)}
      <p style="margin-top:24px;color:#888;font-size:13px;">This link expires in <strong style="color:#ccc">24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
    `),
  });
};

// ─── 2. Password Reset ────────────────────────────────────────────────────────
export const sendPasswordResetEmail = async (email, resetLink) => {
  await sendMail({
    to:      email,
    subject: 'Reset your EventGlow password',
    html:    emailWrapper(`
      <h2 style="margin:0 0 12px;color:#fff;font-size:22px;">Password Reset Request 🔐</h2>
      <p>We received a request to reset your EventGlow password. Click below to choose a new one:</p>
      ${btn('Reset Password', resetLink)}
      <p style="margin-top:24px;color:#888;font-size:13px;">This link expires in <strong style="color:#ccc">1 hour</strong>. If you didn't request a password reset, please ignore this email.</p>
    `),
  });
};

// ─── 3. Team Invite ───────────────────────────────────────────────────────────
export const sendTeamInviteEmail = async (email, eventTitle, acceptLink) => {
  await sendMail({
    to:      email,
    subject: `You're invited to join the ${eventTitle} team on EventGlow`,
    html:    emailWrapper(`
      <h2 style="margin:0 0 12px;color:#fff;font-size:22px;">You've been invited! 🤝</h2>
      <p>You have been invited to join the organiser team for:</p>
      <p style="font-size:18px;font-weight:700;color:#fff;margin:12px 0;">${eventTitle}</p>
      <p>Click below to accept the invitation and access the event dashboard:</p>
      ${btn('Accept Invite', acceptLink)}
      <p style="margin-top:24px;color:#888;font-size:13px;">If you don't have an EventGlow account, please sign up with this email address first.</p>
    `),
  });
};

// ─── 4. Ticket Confirmation ───────────────────────────────────────────────────
// Strategy:
//   • Generates ticket PDF via wkhtmltopdf — identical on all devices
//   • Attaches PDF as "ticket-XXXX.pdf"
//   • Attaches QR code as "qr-XXXX.png" — shows as image attachment in all clients
//   • Email body is clean: event details only, no broken img tags
export const sendTicketConfirmationEmail = async (email, ticketData, qrCodeBase64) => {
  const {
    eventTitle,
    attendeeName,
    ticketId,
    eventDate,
    eventTime,
    eventLocation,
    eventColor = '#6C47FF',
  } = ticketData;

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'TBA';

  // ── Normalise QR to full data URI ────────────────────────────────────────
  const qrDataUri = qrCodeBase64
    ? qrCodeBase64.startsWith('data:')
      ? qrCodeBase64
      : `data:image/png;base64,${qrCodeBase64}`
    : null;

  // Raw base64 for attachment content
  const qrRawBase64 = qrDataUri ? qrDataUri.split(',')[1] : null;

  const attachments = [];

  // ── QR PNG attachment ────────────────────────────────────────────────────
  if (qrRawBase64) {
    attachments.push({
      filename:    `qr-${ticketId}.png`,
      content:     Buffer.from(qrRawBase64, 'base64'),
      contentType: 'image/png',
    });
  }

  // ── PDF ticket attachment ────────────────────────────────────────────────
  try {
    const ticketHTML = generateTicketHTML({
      ...ticketData,
      qrCodeBase64: qrDataUri,
    });
    const pdfBuffer = await generatePDFFromHTML(ticketHTML);
    attachments.push({
      filename:    `ticket-${ticketId}.pdf`,
      content:     pdfBuffer,
      contentType: 'application/pdf',
    });
    console.log(`[EmailService] PDF generated for ${ticketId} (${pdfBuffer.length} bytes)`);
  } catch (pdfErr) {
    // Non-fatal — email still sends with QR attachment at minimum
    console.error(`[EmailService] PDF generation failed for ${ticketId}:`, pdfErr.message);
  }

  await sendMail({
    to:      email,
    subject: `Your ticket for ${eventTitle} ✅`,
    html:    emailWrapper(`
      <h2 style="margin:0 0 4px;color:#fff;font-size:22px;">You're registered! 🎟️</h2>
      <p style="margin:0 0 24px;color:#aaa;">
        Hi <strong style="color:#fff">${attendeeName}</strong>, your spot is confirmed.
      </p>

      <!-- Event details -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#111;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;border-bottom:1px solid #2a2a2a;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Event</p>
            <p style="margin:0;font-size:17px;font-weight:700;color:#fff;">${eventTitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-bottom:1px solid #2a2a2a;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td width="50%" style="padding-right:12px;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Date</p>
                <p style="margin:0;font-size:14px;color:#ddd;">${formattedDate}</p>
              </td>
              <td width="50%">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Time</p>
                <p style="margin:0;font-size:14px;color:#ddd;">${eventTime || 'TBA'}</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-bottom:1px solid #2a2a2a;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Location</p>
            <p style="margin:0;font-size:14px;color:#ddd;">${eventLocation || 'TBA'}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;">Ticket ID</p>
            <p style="margin:0;font-size:15px;font-weight:700;color:${eventColor};font-family:monospace;">${ticketId}</p>
          </td>
        </tr>
      </table>

      <!-- Attachment callout -->
      <div style="background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#fff;">📎 Your ticket is attached</p>
        <p style="margin:0;font-size:13px;color:#aaa;">
          • <strong style="color:#ccc">ticket-${ticketId}.pdf</strong> — full ticket with QR, ready to print or save<br/>
          • <strong style="color:#ccc">qr-${ticketId}.png</strong> — QR code image for quick check-in
        </p>
      </div>
    `, eventColor),
    attachments,
  });
};

// ─── 5. Event Reminder ────────────────────────────────────────────────────────
export const sendEventReminderEmail = async (email, eventData) => {
  const { eventTitle, attendeeName, eventDate, message, eventColor = '#6C47FF' } = eventData;

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'TBA';

  await sendMail({
    to:      email,
    subject: `Reminder: ${eventTitle} is coming up! ⏰`,
    html:    emailWrapper(`
      <h2 style="margin:0 0 12px;color:#fff;font-size:22px;">Event Reminder ⏰</h2>
      <p>Hi <strong style="color:#fff">${attendeeName}</strong>,</p>
      <p><strong style="color:#fff">${eventTitle}</strong> is happening on <strong style="color:#fff">${formattedDate}</strong>.</p>
      ${message ? `<p style="margin-top:16px;padding:16px;background:#111;border-left:3px solid ${eventColor};border-radius:4px;">${message}</p>` : ''}
      <p style="margin-top:20px;color:#aaa;">Don't forget to bring your ticket QR code for check-in. See you there!</p>
    `, eventColor),
  });
};

// ─── 6. Promo / Bulk Email ────────────────────────────────────────────────────
export const sendPromoEmail = async (email, promoData) => {
  await sendMail({
    to:      email,
    subject: promoData.subject,
    html:    promoData.html || promoData.body,
  });
};