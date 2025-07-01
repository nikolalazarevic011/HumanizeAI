import request from 'supertest';
import app from '@/app';
import { HumanizeRequest } from '@shared/types';

// Mock OpenAI
jest.mock('openai');
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

// Mock Anthropic
jest.mock('@anthropic-ai/sdk');

describe('Humanization API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful OpenAI response
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'This is a humanized version of the text that sounds more natural and engaging.',
          },
        },
      ],
    });
  });

  describe('POST /api/humanize', () => {
    const validRequest: HumanizeRequest = {
      text: 'This is a sample AI-generated text that needs to be humanized for better readability and natural flow.',
      style: 'casual',
      intensity: 'moderate',
      preserveFormatting: false,
    };

    it('should humanize text successfully', async () => {
      const response = await request(app)
        .post('/api/humanize')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('originalText', validRequest.text);
      expect(response.body.data).toHaveProperty('humanizedText');
      expect(response.body.data).toHaveProperty('style', 'casual');
      expect(response.body.data).toHaveProperty('intensity', 'moderate');
      expect(response.body.data).toHaveProperty('processingTime');
      expect(response.body.data).toHaveProperty('statistics');
    });

    it('should use default values for optional fields', async () => {
      const minimalRequest = {
        text: validRequest.text,
      };

      const response = await request(app)
        .post('/api/humanize')
        .send(minimalRequest)
        .expect(200);

      expect(response.body.data).toHaveProperty('style', 'casual');
      expect(response.body.data).toHaveProperty('intensity', 'moderate');
    });

    it('should validate text length - too short', async () => {
      const shortRequest = {
        text: 'Too short',
      };

      const response = await request(app)
        .post('/api/humanize')
        .send(shortRequest)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate text length - too long', async () => {
      const longRequest = {
        text: 'A'.repeat(6000), // Exceeds max length
      };

      const response = await request(app)
        .post('/api/humanize')
        .send(longRequest)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate style parameter', async () => {
      const invalidStyleRequest = {
        text: validRequest.text,
        style: 'invalid-style',
      };

      const response = await request(app)
        .post('/api/humanize')
        .send(invalidStyleRequest)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should validate intensity parameter', async () => {
      const invalidIntensityRequest = {
        text: validRequest.text,
        intensity: 'invalid-intensity',
      };

      const response = await request(app)
        .post('/api/humanize')
        .send(invalidIntensityRequest)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should handle missing text field', async () => {
      const noTextRequest = {
        style: 'casual',
      };

      const response = await request(app)
        .post('/api/humanize')
        .send(noTextRequest)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should sanitize input text', async () => {
      const maliciousRequest = {
        text: 'This text contains <script>alert("xss")</script> malicious content that should be sanitized.',
      };

      const response = await request(app)
        .post('/api/humanize')
        .send(maliciousRequest)
        .expect(200);

      // The sanitized text should not contain script tags
      expect(response.body.data.originalText).not.toContain('<script>');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI API failure
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/api/humanize')
        .send(validRequest)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'PROCESSING_ERROR');
    });

    it('should include statistics in response', async () => {
      const response = await request(app)
        .post('/api/humanize')
        .send(validRequest)
        .expect(200);

      const { statistics } = response.body.data;
      expect(statistics).toHaveProperty('originalWordCount');
      expect(statistics).toHaveProperty('humanizedWordCount');
      expect(statistics).toHaveProperty('changesCount');
      expect(statistics).toHaveProperty('readabilityScore');
      expect(typeof statistics.originalWordCount).toBe('number');
      expect(typeof statistics.humanizedWordCount).toBe('number');
      expect(typeof statistics.changesCount).toBe('number');
      expect(typeof statistics.readabilityScore).toBe('number');
    });
  });

  describe('GET /api/humanize/styles', () => {
    it('should return available styles and intensities', async () => {
      const response = await request(app)
        .get('/api/humanize/styles')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('styles');
      expect(response.body.data).toHaveProperty('intensities');
      expect(response.body.data).toHaveProperty('limits');
      
      expect(Array.isArray(response.body.data.styles)).toBe(true);
      expect(Array.isArray(response.body.data.intensities)).toBe(true);
      expect(response.body.data.styles.length).toBeGreaterThan(0);
      expect(response.body.data.intensities.length).toBeGreaterThan(0);
    });

    it('should include all expected style options', async () => {
      const response = await request(app)
        .get('/api/humanize/styles')
        .expect(200);

      const styles = response.body.data.styles;
      const styleIds = styles.map((style: any) => style.id);
      
      expect(styleIds).toContain('academic');
      expect(styleIds).toContain('professional');
      expect(styleIds).toContain('casual');
      expect(styleIds).toContain('creative');
    });

    it('should include all expected intensity options', async () => {
      const response = await request(app)
        .get('/api/humanize/styles')
        .expect(200);

      const intensities = response.body.data.intensities;
      const intensityIds = intensities.map((intensity: any) => intensity.id);
      
      expect(intensityIds).toContain('subtle');
      expect(intensityIds).toContain('moderate');
      expect(intensityIds).toContain('aggressive');
    });
  });

  describe('GET /api/humanize/stats', () => {
    it('should return humanization statistics', async () => {
      const response = await request(app)
        .get('/api/humanize/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalHumanizations');
      expect(response.body.data).toHaveProperty('averageProcessingTime');
      expect(response.body.data).toHaveProperty('popularStyles');
      expect(response.body.data).toHaveProperty('popularIntensities');
      expect(response.body.data).toHaveProperty('successRate');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply processing rate limits', async () => {
      // This test would need to be configured based on your rate limiting setup
      // For now, just verify the endpoint exists and works
      const response = await request(app)
        .post('/api/humanize')
        .send({
          text: 'This is a test text for rate limiting verification that meets the minimum length requirement.',
        })
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject requests without proper content-type', async () => {
      const response = await request(app)
        .post('/api/humanize')
        .set('Content-Type', 'text/plain')
        .send('plain text')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty OpenAI responses', async () => {
      // Mock empty response from OpenAI
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const response = await request(app)
        .post('/api/humanize')
        .send({
          text: 'This is a test text that should fail due to empty API response from the humanization service.',
        })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'PROCESSING_ERROR');
    });

    it('should handle malformed OpenAI responses', async () => {
      // Mock malformed response from OpenAI
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [],
      });

      const response = await request(app)
        .post('/api/humanize')
        .send({
          text: 'This is a test text that should fail due to malformed API response from the humanization service.',
        })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'PROCESSING_ERROR');
    });
  });
});

describe('Humanization Service Unit Tests', () => {
  // These would be separate unit tests for the service itself
  // Testing the service logic independently of the API endpoints
  
  describe('Text Statistics Calculation', () => {
    it('should calculate word counts correctly', () => {
      // Test word counting logic
      const text = 'This is a test sentence with eight words.';
      // This would test the private methods if they were exposed or through public methods
    });

    it('should estimate readability scores', () => {
      // Test readability calculation
    });
  });

  describe('Prompt Engineering', () => {
    it('should generate appropriate prompts for different styles', () => {
      // Test prompt generation logic
    });

    it('should adjust temperature based on intensity', () => {
      // Test temperature calculation
    });
  });
});