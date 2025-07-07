import { Request, Response } from 'express';
import { z } from 'zod';
import { userStore } from '@/data/userStore';
import { jwtService } from '@/services/jwtService';
import { ErrorCode, LoginRequest, ApiResponse, LoginResponse } from '@/types';
import logger from '@/utils/logger';

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Invalid login data',
            details: validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      const { username, password }: LoginRequest = validationResult.data;

      // Find user
      const user = await userStore.findByUsername(username);
      if (!user) {
        logger.warn('Login attempt with invalid username', { username });
        res.status(401).json({
          success: false,
          error: {
            code: ErrorCode.INVALID_CREDENTIALS,
            message: 'Invalid username or password',
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      // Validate password
      const isPasswordValid = await userStore.validatePassword(user, password);
      if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', { username });
        res.status(401).json({
          success: false,
          error: {
            code: ErrorCode.INVALID_CREDENTIALS,
            message: 'Invalid username or password',
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      // Update last login
      await userStore.updateLastLogin(user.id);

      // Generate JWT token
      const token = jwtService.generateToken(user.id, user.username);

      logger.info('User logged in successfully', { username, userId: user.id });

      const response: ApiResponse<LoginResponse> = {
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            lastLogin: user.lastLogin,
          },
          token,
        },
        message: 'Login successful',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Login error', error);
      res.status(500).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  async verify(req: Request, res: Response): Promise<void> {
    try {
      // This endpoint is protected by authMiddleware, so req.user is guaranteed to exist
      const user = req.user!;

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.userId,
            username: user.username,
          },
          valid: true,
        },
        message: 'Token is valid',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Token verification error', error);
      res.status(500).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // Since we're using JWT tokens, logout is essentially handled client-side
    // by removing the token. We can log the event for security purposes.
    try {
      const user = req.user;
      if (user) {
        logger.info('User logged out', { username: user.username, userId: user.userId });
      }

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Logout error', error);
      res.status(500).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}

export const authController = new AuthController();
