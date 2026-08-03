import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Global API rate limiter: 200 requests per 15 mins
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: true,
});

// Strict limiter for authentication routes: 20 attempts per 15 mins
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: true,
});

// Limiter for post creation: 50 posts per hour
export const postRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Posting limit reached. Please wait before sharing more gratitude.' },
  standardHeaders: true,
  legacyHeaders: true,
});

// NoSQL Injection Defense: Strip object query selectors ($gt, $where, etc.)
export const noSqlSanitizer = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};
