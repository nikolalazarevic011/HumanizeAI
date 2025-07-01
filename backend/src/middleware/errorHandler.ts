import { Request, Response, NextFunction } from 'express';
import { loggers } from '@/utils/logger';
import { ErrorCode } from '@/types';

// Custom error class for application-specific errors
export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public isOperational: boolean;
  public details?: string[];

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    details?: string[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  loggers.error(error, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle known application errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details || [],
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: [error.message],
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (error.name === 'SyntaxError' && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid JSON in request body',
        details: ['Request body contains malformed JSON'],
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle timeout errors
  if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
    return res.status(503).json({
      success: false,
      error: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Request timeout',
        details: ['The request took too long to process'],
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle network/connection errors
  if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND')) {
    return res.status(503).json({
      success: false,
      error: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'External service unavailable',
        details: ['Unable to connect to external service'],
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Default to internal server error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
      details: isDevelopment ? [error.message] : ['An unexpected error occurred'],
    },
    timestamp: new Date().toISOString(),
  });
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Route not found',
      details: [`The endpoint ${req.method} ${req.path} does not exist`],
    },
    timestamp: new Date().toISOString(),
  });
}

// Async error wrapper to catch async errors
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request timeout middleware
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: {
            code: ErrorCode.SERVICE_UNAVAILABLE,
            message: 'Request timeout',
            details: [`Request exceeded ${timeoutMs}ms timeout`],
          },
          timestamp: new Date().toISOString(),
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
}

// Global uncaught exception handler
export function setupGlobalErrorHandlers() {
  process.on('uncaughtException', (error: Error) => {
    loggers.error(error, { type: 'uncaughtException' });
    
    // Give ongoing requests time to finish
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  });

  process.on('unhandledRejection', (reason: any) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    loggers.error(error, { type: 'unhandledRejection' });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

export default {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestTimeout,
  setupGlobalErrorHandlers,
};