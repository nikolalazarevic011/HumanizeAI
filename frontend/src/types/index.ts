// Frontend types
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