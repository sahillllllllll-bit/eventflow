import express from 'express';
import { z } from 'zod';
import { register, login, me, forgotPassword, resetPassword, verifyEmail, uploadProfilePhoto } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { validateSchema } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { getProfilePhotoUploader } from '../services/cloudinaryService.js';

const router = express.Router();

const profilePhotoUploader = getProfilePhotoUploader();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  college: z.string().min(2, 'College name required'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Routes
router.post('/register', authLimiter, validateSchema(registerSchema), register);
router.post('/login', authLimiter, validateSchema(loginSchema), login);
router.get('/me', auth, me);
router.post('/forgot-password', validateSchema(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validateSchema(resetPasswordSchema), resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Profile photo upload to Cloudinary
router.post('/upload-profile-photo', auth, profilePhotoUploader.single('profilePhoto'), uploadProfilePhoto);

export default router;
