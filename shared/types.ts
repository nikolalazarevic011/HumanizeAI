// Shared types between frontend and backend

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

// Humanization Types
export type Style = 'academic' | 'casual' | 'professional' | 'creative';
export type Intensity = 'subtle' | 'moderate' | 'aggressive';

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

// Detection Types (simplified for personal use)
export interface DetectRequest {
  text: string;
}

export interface DetectResponse {
  text: string;
  score: number; // Simple 0-1 score
  confidence: number;
  isAiGenerated: boolean;
  processingTime: number;
}

// Feedback Types (simplified)
export interface FeedbackRequest {
  rating: number; // 1-5
  originalText: string;
  humanizedText: string;
  comments?: string;
}

export interface FeedbackResponse {
  message: string;
}

// Health Check Types
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
}

// Error Codes
export enum ErrorCode {
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

// Processing Status
export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

// UI State Types
export interface TextProcessingState {
  originalText: string;
  humanizedText: string;
  style: Style;
  intensity: Intensity;
  preserveFormatting: boolean;
  status: ProcessingStatus;
  error?: string;
  processingTime?: number;
  statistics?: HumanizeResponse['statistics'];
}

export interface DetectionState {
  text: string;
  results?: DetectResponse;
  status: ProcessingStatus;
  error?: string;
}