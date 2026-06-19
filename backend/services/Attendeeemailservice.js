// ─────────────────────────────────────────────────────────────
//  Attendee email service — OTP emails for non-organiser users
//  Add these exports into your existing emailService.js
//  OR import from here and re-export
// ─────────────────────────────────────────────────────────────

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const primaryHeaders = {
  'Content-Type': 'application/json',
  'api-key': process.env.BREVO_API_KEY,
};

const sendMail = async ({ to, subject, html }) => {
  const payload = {
    sender: {
      email: process.env.EMAIL_FROM,
      name: process.env.EMAIL_FROM_NAME || 'EventGlow',
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: primaryHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Brevo error: ${response.status} ${err}`);
  }
  return response.json();
};

const emailWrapper = (body) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
        <tr>
          <td style="background:#6C47FF;padding:24px 36px;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">EventGlow</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;color:#e0e0e0;font-size:15px;line-height:1.7;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;border-top:1px solid #2a2a2a;text-align:center;">
            <p style="margin:0;color:#555;font-size:12px;">© ${new Date().getFullYear()} EventGlow. This OTP expires in 10 minutes.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── OTP box HTML ─────────────────────────────────────────────
const otpBox = (otp) => `
  <div style="margin:24px 0;text-align:center;">
    <div style="display:inline-block;background:#111;border:2px solid #6C47FF;border-radius:12px;padding:20px 40px;">
      <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:2px;">Your OTP</p>
      <p style="margin:0;font-size:36px;font-weight:700;color:#fff;letter-spacing:8px;font-family:monospace;">${otp}</p>
    </div>
  </div>
  <p style="text-align:center;color:#888;font-size:13px;margin-top:8px;">Valid for <strong style="color:#ccc">10 minutes</strong>. Do not share this with anyone.</p>
`;

// ─── 7. Attendee OTP Email ────────────────────────────────────
// purpose: 'restore' | 'set_password'
export const sendAttendeeOTPEmail = async (email, name, otp, purpose) => {
  const isRestore = purpose === 'restore';
  const subject = isRestore
    ? 'Your EventGlow access code'
    : 'Set up your EventGlow password';

  const title = isRestore
    ? 'Restore your access 🔑'
    : 'Set up a password 🔐';

  const description = isRestore
    ? `Hi <strong style="color:#fff">${name}</strong>, use this code to restore access to your EventGlow profile and chatrooms.`
    : `Hi <strong style="color:#fff">${name}</strong>, you requested to set a password for your EventGlow account. Enter this code to continue.`;

  await sendMail({
    to: email,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 12px;color:#fff;font-size:20px;">${title}</h2>
      <p>${description}</p>
      ${otpBox(otp)}
      <p style="margin-top:20px;color:#888;font-size:13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `),
  });
};

// ─── 8. Organiser announcement to all event attendees ─────────
// Call this from your event controller when organiser sends a message
export const sendOrganizerAnnouncementEmail = async (attendeeEmails, eventTitle, message, organizerName) => {
  // Send to each attendee who consented to promo emails
  const promises = attendeeEmails.map((email) =>
    sendMail({
      to: email,
      subject: `📢 Message from organiser — ${eventTitle}`,
      html: emailWrapper(`
        <h2 style="margin:0 0 12px;color:#fff;font-size:20px;">Message from ${organizerName} 📢</h2>
        <p style="color:#aaa;">You received this because you registered for <strong style="color:#fff">${eventTitle}</strong>.</p>
        <div style="margin:20px 0;background:#111;border-left:3px solid #6C47FF;border-radius:4px;padding:16px 20px;">
          <p style="margin:0;color:#e0e0e0;font-size:15px;line-height:1.7;">${message}</p>
        </div>
        <p style="color:#888;font-size:13px;">Open the EventGlow chatroom to reply and chat with other attendees.</p>
      `),
    }).catch((err) => console.error(`Failed to send announcement to ${email}:`, err.message)),
  );
  await Promise.allSettled(promises);
};