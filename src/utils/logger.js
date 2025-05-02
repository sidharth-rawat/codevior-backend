import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Storage for file transports to access them for flushing
const fileTransports = [];

// Define logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'email-api' },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
    }),
  ],
});

// Create logs directory if it doesn't exist
try {
  const fs = await import('fs');
  const logsDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Set up file transports after ensuring directory exists
  const combinedFileTransport = new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
  });

  const errorFileTransport = new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
  });

  // Store transports for flushing
  fileTransports.push(combinedFileTransport, errorFileTransport);

  // Add file transports to logger
  logger.add(combinedFileTransport);
  logger.add(errorFileTransport);
} catch (error) {
  process.stderr.write(`Error creating logs directory: ${error.message}\n`);
}

// Add stream for Morgan
logger.stream = {
  write: message => logger.info(message),
};

/**
 * Flush all logs to disk
 * @returns {Promise<void>} - Promise that resolves when logs are flushed
 */
export const flushLogs = async () => {
  return new Promise((resolve, reject) => {
    // If no file transports, resolve immediately
    if (fileTransports.length === 0) {
      return resolve();
    }

    logger.info('Flushing logs to disk...');

    // Track how many transports have been flushed
    let flushedCount = 0;
    const totalToFlush = fileTransports.length;

    // For each file transport, call the flush method
    fileTransports.forEach(transport => {
      transport.on('flush', () => {
        flushedCount++;

        // Once all are flushed, resolve the promise
        if (flushedCount === totalToFlush) {
          logger.info('All logs flushed successfully');
          resolve();
        }
      });

      // Initiate the flush
      transport.flush();
    });

    // Set a timeout in case the flush never completes
    setTimeout(() => {
      if (flushedCount < totalToFlush) {
        const error = new Error(
          `Timed out flushing logs: ${flushedCount}/${totalToFlush} completed`
        );
        logger.error(error.message);
        reject(error);
      }
    }, 5000); // 5 second timeout
  });
};

// Set up process handlers for graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, flushing logs...');
  try {
    await flushLogs();
    process.exit(0);
  } catch (error) {
    process.stderr.write(`Error flushing logs: ${error.message}\n`);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, flushing logs...');
  try {
    await flushLogs();
    process.exit(0);
  } catch (error) {
    process.stderr.write(`Error flushing logs: ${error.message}\n`);
    process.exit(1);
  }
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.debug('Logging initialized at debug level');
}
