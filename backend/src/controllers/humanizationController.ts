import { Request, Response } from 'express';
import humanizationService from '@/services/humanizationService';
import { asyncHandler } from '@/middleware/errorHandler';
import { loggers } from '@/utils/logger';
import { HumanizeRequest, HumanizeResponse, ApiResponse } from '@/types';

export class HumanizationController {
  
  // POST /api/humanize
  humanizeText = asyncHandler(async (req: Request, res: Response) => {
    const request: HumanizeRequest = req.body;
    const startTime = Date.now();

    // Log request (without sensitive content)
    loggers.request(
      req.method,
      req.originalUrl,
      0, // Will be updated by middleware
      0, // Will be updated by middleware
      req.ip
    );

    // Additional validation
    humanizationService.validateInput(request);

    // Process the humanization
    const result: HumanizeResponse = await humanizationService.humanizeText(request);

    const processingTime = Date.now() - startTime;

    // Log success
    loggers.performance('Humanization completed', processingTime, {
      originalLength: request.text.length,
      humanizedLength: result.humanizedText.length,
      style: result.style,
      intensity: result.intensity,
    });

    // Build response
    const response: ApiResponse<HumanizeResponse> = {
      success: true,
      data: result,
      message: 'Text successfully humanized',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  // POST /api/humanize/batch (future feature)
  humanizeBatch = asyncHandler(async (req: Request, res: Response) => {
    const { texts, style, intensity, preserveFormatting } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid batch request',
          details: ['texts must be a non-empty array'],
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (texts.length > 10) { // Limit batch size
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Batch size too large',
          details: ['Maximum 10 texts per batch'],
        },
        timestamp: new Date().toISOString(),
      });
    }

    const results = await Promise.allSettled(
      texts.map((text: string) =>
        humanizationService.humanizeText({
          text,
          style,
          intensity,
          preserveFormatting,
        })
      )
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<HumanizeResponse> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failed = results
      .filter((result): result is PromiseRejectedResult => 
        result.status === 'rejected'
      )
      .map((result, index) => ({
        index,
        error: result.reason.message || 'Unknown error',
      }));

    res.status(200).json({
      success: true,
      data: {
        results: successful,
        failed,
        total: texts.length,
        successful: successful.length,
        failed: failed.length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // GET /api/humanize/styles
  getAvailableStyles = asyncHandler(async (req: Request, res: Response) => {
    const styles = [
      {
        id: 'professional',
        name: 'Professional',
        description: 'Business-appropriate tone for workplace communication',
        example: 'Perfect for reports, emails, and business documents',
      },
    ];

    const intensities = [
      {
        id: 'aggressive',
        name: 'Aggressive',
        description: 'Significant restructuring and vocabulary changes using WordsAPI synonyms',
        impact: 'Substantial transformation for maximum human-like feel',
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        styles,
        intensities,
        limits: {
          minLength: 10,
          maxLength: 3000,
          batchMaxItems: 10,
        },
      },
      timestamp: new Date().toISOString(),
    });
  });

  // GET /api/humanize/stats
  getHumanizationStats = asyncHandler(async (req: Request, res: Response) => {
    // This would typically come from a database or analytics service
    // For now, return mock statistics
    const stats = {
      totalHumanizations: 15420,
      averageProcessingTime: 2.8,
      popularStyles: {
        professional: 1.0, // Only professional style supported
      },
      popularIntensities: {
        aggressive: 1.0, // Only aggressive intensity supported
      },
      averageTextLength: 850,
      successRate: 0.987,
      wordsApiIntegration: true,
      synonymReplacementRate: 0.7,
    };

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  });
}

export default new HumanizationController();