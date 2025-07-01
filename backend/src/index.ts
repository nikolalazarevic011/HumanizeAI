import { startServer } from '@/app';
import logger from '@/utils/logger';
import config from '@/config';

// Main entry point
async function main() {
  try {
    logger.info('🚀 Starting HumanizeAI Backend Server...');
    logger.info(`📝 Environment: ${config.server.env}`);
    logger.info(`🔑 AI API configured: ${getConfiguredAPIs()}`);
    
    await startServer();
    
    logger.info('✅ Server started successfully');
  } catch (error) {
    logger.error('❌ Failed to start server', error);
    process.exit(1);
  }
}

// Helper function to show which APIs are configured
function getConfiguredAPIs(): string {
  const apis = [];
  if (config.apis.gemini.apiKey && config.apis.gemini.apiKey !== 'test-key') {
    apis.push('Gemini (Free)');
  }
  if (config.apis.openai.apiKey && config.apis.openai.apiKey !== 'test-key') {
    apis.push('OpenAI');
  }
  return apis.length > 0 ? apis.join(', ') : 'Rule-based only';
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main();