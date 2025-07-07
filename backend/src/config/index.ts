import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema - simplified for personal use
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Rate limiting (relaxed for personal use)
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).default('3600000'), // 1 hour
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val, 10)).default('1000'), // Increased for personal use
  
  // AI API Keys (all optional)
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  
  // WordsAPI for synonyms
  WORDS_API_KEY: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string().default('super-secure-jwt-secret-for-cristal-humanize-ai-2025-prod'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  // Server configuration
  server: {
    port: env.PORT,
    env: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN,
  },
  
  // Rate limiting (relaxed for personal use)
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  
  // External API configurations (simplified)
  apis: {
    openai: {
      apiKey: env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-3.5-turbo', // Use cheaper model for personal use
      maxTokens: 1000,
      temperature: 0.7,
      timeout: 30000,
    },
    gemini: {
      apiKey: env.GOOGLE_GEMINI_API_KEY || 'test-key',
      model: 'gemini-1.5-flash', // Free tier model
      maxTokens: 1000,
      temperature: 0.7,
    },
    claude: {
      apiKey: env.CLAUDE_API_KEY || 'test-key',
      model: 'claude-3-haiku-20240307', // Cheapest model
      maxTokens: 1000,
      temperature: 0.7,
    },
    groq: {
      apiKey: env.GROQ_API_KEY || 'test-key',
      model: 'llama3-8b-8192', // Free tier model
      maxTokens: 1000,
      temperature: 0.7,
    },
    wordsapi: {
      apiKey: env.WORDS_API_KEY || 'test-key',
      baseUrl: 'https://wordsapiv1.p.rapidapi.com',
      timeout: 10000,
    },
  },
  
  // Security
  security: {
    jwtSecret: env.JWT_SECRET,
  },
  
  // Text processing limits (relaxed)
  limits: {
    textMinLength: 10, // Reduced for easier testing
    textMaxLength: 3000, // Reduced for cost control
    detectionMinLength: 50,
    detectionMaxLength: 3000,
  },
  
  // Logging configuration
  logging: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: env.NODE_ENV === 'production' ? 'json' : 'simple',
  },
} as const;

export type Config = typeof config;
export default config;