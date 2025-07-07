import { Request, Response, NextFunction } from 'express';
import { jwtService } from '@/services/jwtService';
import { userStore } from '@/data/userStore';
import { ErrorCode, AuthPayload } from '@/types';
import logger from '@/utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Authentication token required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const payload = jwtService.verifyToken(token);
    req.user = payload;
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    let errorCode = ErrorCode.TOKEN_INVALID;
    let message = 'Invalid authentication token';

    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        errorCode = ErrorCode.TOKEN_EXPIRED;
        message = 'Authentication token has expired';
      }
    }

    res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

// Optional auth middleware for routes that work with or without auth
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = jwtService.verifyToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  next();
}
