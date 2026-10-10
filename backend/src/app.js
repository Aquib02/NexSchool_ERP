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
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || origin === ENV.CORS_ORIGIN || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      callback(new Error('CORS policy does not allow access from this origin.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// HTTP Request Logging
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan(ENV.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mount API Endpoints
app.use('/api', apiRoutes);

// Catch Unhandled Routes (404)
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
