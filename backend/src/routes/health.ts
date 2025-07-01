import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import config from '@/config';
import { HealthResponse } from '@/types';

const router = Router();

// Health check endpoint
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Basic health checks
  const checks = {
    server: true,
    memory: checkMemoryUsage(),
    uptime: process.uptime(),
    environment: config.server.env,
  };

  // Check external dependencies (simplified for personal use)
  const dependencies = await checkDependencies();
  
  const responseTime = Date.now() - startTime;
  
  // Determine overall health status
  const isHealthy = checks.server && checks.memory.healthy;
  
  const healthData: HealthResponse = {
    status: isHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    uptime: Math.floor(checks.uptime),
  };

  const response = {
    success: true,
    data: {
      ...healthData,
      checks,
      dependencies,
      responseTime,
      timestamp: new Date().toISOString(),
    },
  };

  // Return appropriate status code
  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(response);
}));

// Detailed health check endpoint
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
  };

  const configInfo = {
    environment: config.server.env,
    port: config.server.port,
    corsOrigin: config.server.corsOrigin,
    rateLimitMax: config.rateLimit.maxRequests,
    rateLimitWindow: config.rateLimit.windowMs,
  };

  const apiStatus = await checkAPIStatus();
  const dependencies = await checkDependencies();
  
  const responseTime = Date.now() - startTime;
  
  const allHealthy = apiStatus.openai;
  
  res.status(allHealthy ? 200 : 503).json({
    success: true,
    data: {
      status: allHealthy ? 'healthy' : 'degraded',
      version: '1.0.0',
      responseTime,
      system: systemInfo,
      config: configInfo,
      apis: apiStatus,
      dependencies,
      timestamp: new Date().toISOString(),
    },
  });
}));

// Memory usage check
function checkMemoryUsage() {
  const usage = process.memoryUsage();
  const totalMemory = usage.heapTotal;
  const usedMemory = usage.heapUsed;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  return {
    healthy: memoryUsagePercent < 98, // More relaxed for development (was 90%)
    usage: {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    },
    percentage: Math.round(memoryUsagePercent),
  };
}

// Check external dependencies (simplified for personal use)
async function checkDependencies() {
  const results = {
    openai: !!config.apis.openai.apiKey && config.apis.openai.apiKey !== 'test-key',
  };

  return results;
}

// Check API status
async function checkAPIStatus() {
  const results = {
    openai: !!config.apis.openai.apiKey && config.apis.openai.apiKey !== 'test-key',
  };

  return results;
}

export default router;