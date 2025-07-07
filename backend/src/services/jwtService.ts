import jwt from 'jsonwebtoken';
import config from '@/config';
import { AuthPayload } from '@/types';

export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string = '7d'; // 7 days for convenience

  constructor() {
    this.secret = config.security.jwtSecret;
  }

  generateToken(userId: string, username: string): string {
    const payload: Omit<AuthPayload, 'iat' | 'exp'> = {
      userId,
      username,
    };

    return jwt.sign(payload, this.secret, { 
      expiresIn: this.expiresIn,
      issuer: 'humanize-ai',
      audience: 'humanize-ai-client',
    });
  }

  verifyToken(token: string): AuthPayload {
    try {
      return jwt.verify(token, this.secret, {
        issuer: 'humanize-ai',
        audience: 'humanize-ai-client',
      }) as AuthPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('TOKEN_INVALID');
      }
      throw new Error('TOKEN_INVALID');
    }
  }

  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

export const jwtService = new JwtService();
