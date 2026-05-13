import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateTicketEmailHTML } from './ticketGenerator.js';

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

export  const  sendVerificationEmail = async (email, verifyLink) => {
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

export const sendTeamInviteEmail = async (email, eventTitle, acceptLink) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `You're invited to join the ${eventTitle} team on EventFlow`,
      html: `
        <h2>You've been invited to collaborate</h2>
        <p>You have been invited to join the event team for <strong>${eventTitle}</strong>.</p>
        <p>Click below to accept the invitation and access the event dashboard:</p>
        <a href="${acceptLink}" style="background-color: #6C47FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invite</a>
        <p>If you do not have an EventFlow account, please sign up with the same email address to accept the invitation.</p>
      `,
    });
    console.log(`Team invite email sent to ${email}`);
  } catch (error) {
    console.error('Error sending team invite email:', error);
    throw error;
  }
};

export const sendTicketConfirmationEmail = async (email, ticketData, qrCodeBase64) => {
  try {
    const ticketHTML = generateTicketEmailHTML({
      ticketId: ticketData.ticketId,
      attendeeName: ticketData.attendeeName,
      eventTitle: ticketData.eventTitle,
      eventDate: ticketData.eventDate || new Date(),
      eventTime: ticketData.eventTime || '',
      eventLocation: ticketData.eventLocation || '',
      qrCodeBase64: qrCodeBase64,
      phone: ticketData.phone || '',
      email: email,
      eventColor: ticketData.eventColor || '#6C47FF',
    });

    await transporter.sendMail({
      from: `"${process.env.SENDGRID_FROM_NAME}" <${process.env.SENDGRID_FROM_EMAIL}>`,
      to: email,
      subject: `Your Ticket for ${ticketData.eventTitle} 🎫`,
      html: ticketHTML,
      // Embed QR code as inline attachment for better compatibility
      attachments: qrCodeBase64.startsWith('data:') ? [] : [
        {
          filename: 'ticket-qr.png',
          content: Buffer.from(qrCodeBase64, 'base64'),
          cid: 'qrcode',
        },
      ],
    });
    console.log(`Professional ticket confirmation email sent to ${email}`);
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
        <p>${eventData.message || 'This is a reminder for your upcoming event.'}</p>
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
