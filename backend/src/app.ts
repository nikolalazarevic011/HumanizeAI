import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from '@/config';
import logger from '@/utils/logger';
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers, requestTimeout } from '@/middleware/errorHandler';
import { requestLogger, securityHeaders, requestId } from '@/middleware';
import { generalRateLimit } from '@/middleware/rateLimiter';
import { validateContentType, validateRequestSize, validateClientIP } from '@/middleware/validation';

// Import routes
import healthRoutes from '@/routes/health';
import humanizeRoutes from '@/routes/humanize';
// import detectRoutes from '@/routes/detect';
// import feedbackRoutes from '@/routes/feedback';
// import statsRoutes from '@/routes/stats';

// Setup global error handlers
setupGlobalErrorHandlers();

// Create Express application
const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API usage
}));

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-Tier'],
  credentials: false, // No cookies needed for now
  maxAge: 86400, // 24 hours preflight cache
}));

// Compression middleware
app.use(compression({
  level: 6, // Good balance between compression and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Fallback to standard filter
    return compression.filter(req, res);
  },
}));

// Request parsing middleware
app.use(express.json({ 
  limit: '10mb', // Generous limit for text content
  strict: true, // Only parse objects and arrays
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Custom middleware
app.use(requestId);
app.use(securityHeaders);
app.use(requestLogger);
app.use(requestTimeout(30000)); // 30-second timeout
app.use(validateClientIP);
app.use(validateContentType);
app.use(validateRequestSize(10 * 1024 * 1024)); // 10MB limit

// Rate limiting
app.use('/api', generalRateLimit);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/humanize', humanizeRoutes);
// app.use('/api/detect', detectRoutes);
// app.use('/api/feedback', feedbackRoutes);
// app.use('/api/stats', statsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'HumanizeAI API Server',
      version: '1.0.0',
      status: 'running',
      environment: config.server.env,
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server function
export function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📝 Environment: ${config.server.env}`);
      logger.info(`🔗 CORS enabled for: ${config.server.corsOrigin}`);
      resolve();
    });

    server.on('error', (error: Error) => {
      logger.error('Failed to start server', error);
      reject(error);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  });
}

export default app;