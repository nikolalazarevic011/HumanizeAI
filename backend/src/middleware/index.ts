import { Request, Response, NextFunction } from 'express';
import { loggers } from '@/utils/logger';

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalJson = res.json;

  // Override res.json to capture response
  res.json = function (body: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log the request
    loggers.request(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      req.ip
    );

    // Log slow requests
    if (responseTime > 5000) { // 5 seconds
      loggers.performance('Slow request detected', responseTime, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
      });
    }

    // Call original json method
    return originalJson.call(this, body);
  };

  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove potentially revealing headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
}

// Request ID middleware for tracing
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = generateRequestId();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Add request ID to Request interface
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export default {
  requestLogger,
  securityHeaders,
  requestId,
};