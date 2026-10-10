import app from './app.js';
import connectDB, { disconnectDB } from './config/db.js';
import ENV from './config/env.js';
import logger from './utils/logger.js';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start HTTP Server
    const server = app.listen(ENV.PORT, () => {
      logger.info(`🚀 School ERP Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
      logger.info(`📡 Health check available at: http://localhost:${ENV.PORT}/api/health`);
    });

    // 3. Graceful Shutdown Handlers
    const handleShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });

      // Force shutdown if taking more than 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', err.message);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down...', err.message);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error.message);
    process.exit(1);
  }
};

startServer();
