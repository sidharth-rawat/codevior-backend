import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import emailRoutes from './routes/email.routes.js';
import { logger, flushLogs } from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet()); // Add security headers
app.use(compression()); // Compress responses
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // HTTP request logging
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api', emailRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is running');
});

// Manual log flush endpoint (protected)
app.post('/api/logs/flush', async (req, res) => {
  try {
    // This could be enhanced with proper authentication
    if (req.ip !== '127.0.0.1' && req.ip !== '::1') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint can only be called locally',
      });
    }

    logger.info('Manual log flush requested');
    await flushLogs();

    return res.status(200).json({
      success: true,
      message: 'Logs flushed successfully',
    });
  } catch (error) {
    logger.error(`Error flushing logs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to flush logs',
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down server gracefully...');

  // Close the server first
  server.close(async () => {
    logger.info('Server closed, flushing logs...');

    try {
      // Flush the logs
      await flushLogs();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error(`Error during shutdown: ${error.message}`);
      process.exit(1);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000); // 10 seconds
};

// Handle various signals for graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
