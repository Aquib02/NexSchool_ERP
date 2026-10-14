import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import './models/index.js';
import apiRoutes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import ApiError from './utils/ApiError.js';
import ENV from './config/env.js';
import globalAuditMiddleware from './middleware/auditMiddleware.js';

const app = express();

// Disable ETags to ensure real-time dynamic API responses (avoids 304 Not Modified cache)
app.disable('etag');

// Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Set to true with custom directives in strict production
  })
);

// CORS Configuration
const allowedOrigins = (ENV.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Check against explicit CORS_ORIGIN list or wildcard
      if (allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Automatically allow localhost development origins
      if (
        normalizedOrigin.startsWith('http://localhost:') ||
        normalizedOrigin.startsWith('http://127.0.0.1:') ||
        normalizedOrigin.startsWith('https://localhost:')
      ) {
        return callback(null, true);
      }

      // Automatically allow all Render deployments (*.onrender.com)
      try {
        const url = new URL(normalizedOrigin);
        if (url.hostname.endsWith('.onrender.com')) {
          return callback(null, true);
        }
      } catch (_) {}

      // Cleanly reject unknown origins without throwing unhandled exceptions
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Root Health & Deployment Verification Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NexSchool ERP Backend API is online and operational.',
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// HTTP Request Logging
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving for uploads and educational documents
app.use('/uploads', express.static('uploads'));
app.use('/documents', express.static('uploads/documents'));

// Global Audit & Security Activity Interceptor
app.use(globalAuditMiddleware);

// Mount API Endpoints
app.use('/api', apiRoutes);

// Catch Unhandled Routes (404)
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
