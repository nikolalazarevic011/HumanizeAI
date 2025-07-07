// Backend types - simplified for personal use

// User and Auth Types
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    lastLogin?: Date;
  };
  token: string;
}

export interface AuthPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string[];
}

// Humanization Types - simplified to only professional style and aggressive intensity
export type Style = 'professional';
export type Intensity = 'aggressive';

export interface HumanizeRequest {
  text: string;
  style?: Style;
  intensity?: Intensity;
  preserveFormatting?: boolean;
}

export interface HumanizeResponse {
  originalText: string;
  humanizedText: string;
  style: Style;
  intensity: Intensity;
  processingTime: number;
  statistics: {
    originalWordCount: number;
    humanizedWordCount: number;
    changesCount: number;
    readabilityScore: number;
  };
}

// Health Check Types
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
}

// Error Codes
export enum ErrorCode {
  // Auth errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TEXT_TOO_SHORT = 'TEXT_TOO_SHORT',
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',
  INVALID_STYLE = 'INVALID_STYLE',
  INVALID_INTENSITY = 'INVALID_INTENSITY',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Validation Constants (relaxed for personal use)
export const VALIDATION_LIMITS = {
  TEXT_MIN_LENGTH: 10,
  TEXT_MAX_LENGTH: 3000,
  DETECTION_MIN_LENGTH: 50,
  DETECTION_MAX_LENGTH: 3000,
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;
