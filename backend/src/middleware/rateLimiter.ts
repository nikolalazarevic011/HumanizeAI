import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '@/config';
import { loggers } from '@/utils/logger';
import { ErrorCode } from '@/types';

// Simple rate limiter for personal use (no Redis needed)
export const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests, please try again later.',
      details: [`Rate limit: ${config.rateLimit.maxRequests} requests per hour`],
    },
    timestamp: new Date().toISOString(),
  },
  handler: (req: Request, res: Response) => {
    loggers.rateLimit(
      req.ip || 'unknown',
      req.path,
      0
    );
    
    res.status(429).json({
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests, please try again later.',
        details: [`Rate limit: ${config.rateLimit.maxRequests} requests per hour`],
      },
      timestamp: new Date().toISOString(),
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks and in development
    return req.path === '/api/health' || config.server.env === 'development';
  },
  keyGenerator: (req: Request) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
});

// Relaxed rate limiter for text processing (personal use)
export const processingRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests, // Same as general for personal use
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip in development for easier testing
    return config.server.env === 'development';
  },
});

export default {
  general: generalRateLimit,
  processing: processingRateLimit,
};