import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateOrganizerSlug = (name) => {
  const slug = generateSlug(name);
  return `${slug}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};

export const generateTicketId = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};
