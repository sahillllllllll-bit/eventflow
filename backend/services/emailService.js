import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Nodemailer with SendGrid SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

export const sendVerificationEmail = async (email, verifyLink) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify your EventFlow account',
      html: `
        <h2>Welcome to EventFlow!</h2>
        <p>Please verify your email to activate your account:</p>
        <a href="${verifyLink}" style="background-color: #6C47FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        <p>Link expires in 24 hours.</p>
      `,
    });
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset your EventFlow password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #6C47FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>Link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const sendTicketConfirmationEmail = async (email, ticketData, qrCodeBase64) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Your ticket for ${ticketData.eventTitle}`,
      html: `
        <h2>Registration Confirmed!</h2>
        <p>Hi ${ticketData.attendeeName},</p>
        <p>Your ticket for <strong>${ticketData.eventTitle}</strong> has been confirmed.</p>
        <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
        <p>Your QR code is attached below:</p>
        <img src="cid:qrcode" alt="QR Code" style="max-width: 200px;">
        <p>See you at the event!</p>
      `,
      attachments: [
        {
          filename: 'ticket-qr.png',
          content: Buffer.from(qrCodeBase64.split(',')[1], 'base64'),
          cid: 'qrcode',
        },
      ],
    });
    console.log(`Ticket confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending ticket confirmation email:', error);
    throw error;
  }
};

export const sendEventReminderEmail = async (email, eventData) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Reminder: ${eventData.eventTitle} is happening soon!`,
      html: `
        <h2>Event Reminder</h2>
        <p>Hi ${eventData.attendeeName},</p>
        <p><strong>${eventData.eventTitle}</strong> is happening on ${eventData.eventDate}</p>
        <p>See you there!</p>
      `,
    });
    console.log(`Event reminder email sent to ${email}`);
  } catch (error) {
    console.error('Error sending event reminder email:', error);
    throw error;
  }
};

export const sendPromoEmail = async (email, promoData) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: promoData.subject,
      html: promoData.body,
    });
    console.log(`Promo email sent to ${email}`);
  } catch (error) {
    console.error('Error sending promo email:', error);
    throw error;
  }
};
