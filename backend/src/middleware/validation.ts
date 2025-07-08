import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ErrorCode, VALIDATION_LIMITS } from '@/types';
import { loggers } from '@/utils/logger';

// Base validation schemas
export const textSchema = z.string()
  .min(VALIDATION_LIMITS.TEXT_MIN_LENGTH, `Text must be at least ${VALIDATION_LIMITS.TEXT_MIN_LENGTH} characters`)
  .max(VALIDATION_LIMITS.TEXT_MAX_LENGTH, `Text must not exceed ${VALIDATION_LIMITS.TEXT_MAX_LENGTH} characters`)
  .trim();

export const detectionTextSchema = z.string()
  .min(VALIDATION_LIMITS.DETECTION_MIN_LENGTH, `Text must be at least ${VALIDATION_LIMITS.DETECTION_MIN_LENGTH} characters for detection`)
  .max(VALIDATION_LIMITS.DETECTION_MAX_LENGTH, `Text must not exceed ${VALIDATION_LIMITS.DETECTION_MAX_LENGTH} characters`)
  .trim();

export const styleSchema = z.enum(['academic', 'casual', 'professional', 'creative']).optional();

export const intensitySchema = z.enum(['subtle', 'moderate', 'aggressive']).optional();

export const ratingSchema = z.number()
  .min(VALIDATION_LIMITS.RATING_MIN)
  .max(VALIDATION_LIMITS.RATING_MAX);

// Request validation schemas
export const humanizeRequestSchema = z.object({
  text: textSchema,
  style: styleSchema.default('casual'),
  intensity: intensitySchema.default('moderate'),
  preserveFormatting: z.boolean().optional().default(false),
});

export const detectRequestSchema = z.object({
  text: detectionTextSchema,
});

export const feedbackRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  rating: ratingSchema,
  originalText: textSchema,
  humanizedText: textSchema,
  comments: z.string().optional(),
  detectionScoreBefore: z.number().min(0).max(1).optional(),
  detectionScoreAfter: z.number().min(0).max(1).optional(),
});

// Validation middleware factory
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        
        loggers.error(new Error('Validation failed'), {
          path: req.path,
          method: req.method,
          errors: details,
          body: req.body,
        });

        res.status(400).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Request validation failed',
            details,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Handle unexpected validation errors
      loggers.error(error as Error, {
        path: req.path,
        method: req.method,
        body: req.body,
      });

      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid request format',
          details: ['Unexpected validation error'],
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
  };
}

// Text sanitization utility
export function sanitizeText(text: string): string {
  return text
    .trim()
    // Remove null bytes and other control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove potentially dangerous HTML/JS content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Limit length as a safety measure
    .substring(0, VALIDATION_LIMITS.TEXT_MAX_LENGTH);
}

// Text sanitization middleware
export function sanitizeTextFields(req: Request, res: Response, next: NextFunction) {
  if (req.body.text) {
    req.body.text = sanitizeText(req.body.text);
  }
  
  if (req.body.originalText) {
    req.body.originalText = sanitizeText(req.body.originalText);
  }
  
  if (req.body.humanizedText) {
    req.body.humanizedText = sanitizeText(req.body.humanizedText);
  }
  
  if (req.body.comments && typeof req.body.comments === 'string') {
    req.body.comments = req.body.comments.trim().substring(0, 1000); // Limit comments to 1000 chars
  }
  
  next();
}

// Content type validation
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Content-Type must be application/json',
          details: ['Invalid content type'],
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }
  
  next();
}

// Request size validation
export function validateRequestSize(maxSizeBytes: number = 1024 * 1024) { // 1MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSizeBytes) {
      res.status(413).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Request entity too large',
          details: [`Maximum request size is ${Math.floor(maxSizeBytes / 1024)}KB`],
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    next();
  };
}

// IP validation for security
export function validateClientIP(req: Request, res: Response, next: NextFunction): void {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Block obviously invalid or dangerous IPs
  const blockedPatterns = [
    /^0\.0\.0\.0$/,
    /^255\.255\.255\.255$/,
    /^127\.0\.0\.1$/, // Only in production
  ];
  
  if (process.env.NODE_ENV === 'production') {
    for (const pattern of blockedPatterns) {
      if (clientIP && pattern.test(clientIP)) {
        loggers.security('Blocked suspicious IP', { ip: clientIP });
        res.status(403).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Access denied',
            details: ['Invalid client IP'],
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }
  }
  
  next();
}

export default {
  validateRequest,
  sanitizeTextFields,
  validateContentType,
  validateRequestSize,
  validateClientIP,
  schemas: {
    humanizeRequest: humanizeRequestSchema,
    detectRequest: detectRequestSchema,
    feedbackRequest: feedbackRequestSchema,
  },
};