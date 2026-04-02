import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const getIp = (req: Request) => {
  return `${req.ip}_ip`;
};

const keyGenerator = (req: Request) => {
  const authUserSub = (req as any).authUser?.sub;
  return authUserSub || getIp(req);
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  keyGenerator,
  message: {
    error: 'Too many requests, please try again later.'
  },
  validate: { keyGeneratorIpFallback: false, default: true },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, 
  keyGenerator: getIp, 
  message: {
    error: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  validate: { keyGeneratorIpFallback: false, default: true },
  standardHeaders: true,
  legacyHeaders: false,
});

export const voteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator,
  message: {
    error: 'Too many voting submissions, please slow down.'
  },
  validate: { keyGeneratorIpFallback: false, default: true },
  standardHeaders: true,
  legacyHeaders: false,
});
