import express from 'express';
import {
  initAttendee,
  requestRestoreOTP,
  verifyRestoreOTP,
  attendeeLogin,
  requestSetPasswordOTP,
  setAttendeePassword,
  getAttendeeProfile,
  checkMembership,
} from '../controllers/attendeeController.js';

const router = express.Router();

// Identity init (called after event registration)
router.post('/init', initAttendee);

// Email restore (when localStorage cleared)
router.post('/restore', requestRestoreOTP);
router.post('/restore/verify', verifyRestoreOTP);

// Password login (Tier 3)
router.post('/login', attendeeLogin);

// Set password flow
router.post('/set-password/request', requestSetPasswordOTP);
router.post('/set-password', setAttendeePassword);

// Profile + membership check
router.get('/profile', getAttendeeProfile);
router.get('/check-member', checkMembership);

export default router;