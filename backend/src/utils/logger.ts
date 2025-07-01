import winston from 'winston';
import config from '@/config';

// Custom log format for development
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Production format
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: config.server.env === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { service: 'humanize-ai-backend' },
  transports: [
    // Console output
    new winston.transports.Console({
      silent: config.server.env === 'test',
    }),
  ],
});

// Add file transport in production
if (config.server.env === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 14,
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 14,
    })
  );
}

// Helper functions for structured logging
export const loggers = {
  // Request logging
  request: (method: string, url: string, statusCode: number, responseTime: number, ip?: string) => {
    logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip,
    });
  },

  // Error logging
  error: (error: Error, context?: Record<string, any>) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  },

  // API call logging
  apiCall: (service: string, endpoint: string, duration: number, success: boolean) => {
    logger.info('External API Call', {
      service,
      endpoint,
      duration: `${duration}ms`,
      success,
    });
  },

  // Performance logging
  performance: (operation: string, duration: number, metadata?: Record<string, any>) => {
    logger.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  },

  // Security logging
  security: (event: string, details: Record<string, any>) => {
    logger.warn('Security Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },

  // Rate limiting logging
  rateLimit: (ip: string, endpoint: string, remaining: number) => {
    logger.warn('Rate Limit Warning', {
      ip,
      endpoint,
      remaining,
    });
  },
};

export default logger;