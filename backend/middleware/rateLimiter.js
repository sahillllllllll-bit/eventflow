import rateLimit from 'express-rate-limit';

const proxyConfig = {
  validate: { xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
};

export const authLimiter = rateLimit({
  ...proxyConfig,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
});

export const registrationLimiter = rateLimit({
  ...proxyConfig,
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later',
  },
});

export const generalLimiter = rateLimit({
  ...proxyConfig,
  windowMs: 1 * 60 * 1000,
  max: 100,
});