import { Router } from 'express';
import humanizationController from '@/controllers/humanizationController';
import { validateRequest, sanitizeTextFields } from '@/middleware/validation';
import { processingRateLimit } from '@/middleware/rateLimiter';
import { humanizeRequestSchema } from '@/middleware/validation';

const router = Router();

// Apply processing rate limit to all humanization endpoints
router.use(processingRateLimit);

// Apply text sanitization to all POST requests
router.use(sanitizeTextFields);

// POST /api/humanize - Main humanization endpoint
router.post(
  '/',
  validateRequest(humanizeRequestSchema),
  humanizationController.humanizeText
);

// POST /api/humanize/batch - Batch humanization (future feature)
router.post(
  '/batch',
  humanizationController.humanizeBatch
);

// GET /api/humanize/styles - Get available styles and options
router.get(
  '/styles',
  humanizationController.getAvailableStyles
);

// GET /api/humanize/stats - Get humanization statistics
router.get(
  '/stats',
  humanizationController.getHumanizationStats
);

export default router;