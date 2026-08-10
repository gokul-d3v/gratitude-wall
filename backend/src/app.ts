import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { apiRateLimiter, noSqlSanitizer } from './middleware/security';
import { errorHandler } from './middleware/error';

import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import notificationRoutes from './routes/notificationRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import teamRoutes from './routes/teamRoutes';

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));

// Trust proxy for deployment behind reverse proxies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS Configuration
let allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
if (allowedOrigin.endsWith('/')) {
  allowedOrigin = allowedOrigin.slice(0, -1);
}
app.use(cors({
  origin: [allowedOrigin, 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Compression
app.use(compression());

// Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie Parser (manual light parser for HTTP-only cookies)
app.use((req, _res, next) => {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    req.cookies = cookieHeader.split(';').reduce((cookies: any, cookie) => {
      const [name, ...rest] = cookie.trim().split('=');
      cookies[name] = decodeURIComponent(rest.join('='));
      return cookies;
    }, {});
  } else {
    req.cookies = {};
  }
  next();
});

// Sanitization & Security
app.use(noSqlSanitizer);
app.use('/api', apiRateLimiter);

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Cron Health Check Route (No Auth)
app.get('/cron', (_req, res) => {
  res.status(200).send('Cron job ping successful');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
