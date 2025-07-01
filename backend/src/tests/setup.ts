// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.REDIS_URL = 'redis://localhost:6380'; // Different port for test
process.env.OPENAI_API_KEY = 'test-key';

// Mock external services in tests
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('redis');

// Suppress console.log in tests unless explicitly testing logging
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn, // Keep warnings
  error: console.error, // Keep errors
};

// Global test timeout
jest.setTimeout(10000);