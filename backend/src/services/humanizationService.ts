import OpenAI from 'openai';
import config from '@/config';
import logger, { loggers } from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';
import { ErrorCode, Style, Intensity, HumanizeRequest, HumanizeResponse } from '@/types';

// Initialize API clients only if API keys are provided
let openai: OpenAI | null = null;
let gemini: any = null;

if (config.apis.openai.apiKey && config.apis.openai.apiKey !== 'test-key') {
  openai = new OpenAI({
    apiKey: config.apis.openai.apiKey,
    timeout: config.apis.openai.timeout,
  });
}

// Try to import Google AI SDK (optional)
if (config.apis.gemini.apiKey && config.apis.gemini.apiKey !== 'test-key') {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    gemini = new GoogleGenerativeAI(config.apis.gemini.apiKey);
    logger.info('✅ Google Gemini AI configured');
  } catch (error) {
    logger.warn('⚠️ Google AI SDK not installed. Install with: npm install @google/generative-ai');
    gemini = null;
  }
}

export class HumanizationService {
  // Main humanization method
  async humanizeText(request: HumanizeRequest): Promise<HumanizeResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting text humanization', {
        textLength: request.text.length,
        style: request.style,
        intensity: request.intensity,
        usingAPI: gemini ? 'Gemini' : openai ? 'OpenAI' : 'Rules',
      });

      let humanizedText: string;

      // Try APIs in order of preference: Gemini (free) -> OpenAI -> Rules
      if (gemini) {
        humanizedText = await this.humanizeWithGemini(request);
      } else if (openai) {
        humanizedText = await this.humanizeWithOpenAI(request);
      } else {
        humanizedText = await this.humanizeWithRules(request);
      }

      // Calculate statistics
      const statistics = this.calculateStatistics(request.text, humanizedText);
      
      const processingTime = (Date.now() - startTime) / 1000;

      loggers.performance('Text humanization completed', Date.now() - startTime, {
        originalLength: request.text.length,
        humanizedLength: humanizedText.length,
        changesCount: statistics.changesCount,
      });

      return {
        originalText: request.text,
        humanizedText,
        style: request.style || 'casual',
        intensity: request.intensity || 'moderate',
        processingTime,
        statistics,
      };

    } catch (error) {
      loggers.error(error as Error, {
        operation: 'humanizeText',
        textLength: request.text.length,
        style: request.style,
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to humanize text',
        500,
        ErrorCode.PROCESSING_ERROR,
        [error instanceof Error ? error.message : 'Unknown error']
      );
    }
  }

  // Humanize using Google Gemini (Free Tier)
  private async humanizeWithGemini(request: HumanizeRequest): Promise<string> {
    if (!gemini) {
      throw new Error('Gemini not configured');
    }

    const prompt = this.buildPrompt(request);
    const systemPrompt = this.getSystemPrompt(request.style, request.intensity);
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    try {
      const model = gemini.getGenerativeModel({ 
        model: config.apis.gemini.model,
        generationConfig: {
          maxOutputTokens: config.apis.gemini.maxTokens,
          temperature: this.getTemperature(request.intensity),
        }
      });

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const humanizedText = response.text();
      
      if (!humanizedText) {
        throw new Error('Empty response from Gemini API');
      }

      loggers.apiCall('Gemini', 'generateContent', Date.now(), true);
      return humanizedText.trim();

    } catch (error) {
      loggers.apiCall('Gemini', 'generateContent', Date.now(), false);
      
      // Fallback to OpenAI if available, otherwise rules
      if (openai) {
        logger.warn('Gemini failed, trying OpenAI fallback');
        return await this.humanizeWithOpenAI(request);
      } else {
        logger.warn('Gemini failed, using rule-based fallback');
        return await this.humanizeWithRules(request);
      }
    }
  }

  // Humanize using OpenAI
  private async humanizeWithOpenAI(request: HumanizeRequest): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI not configured');
    }

    const prompt = this.buildPrompt(request);
    
    try {
      const completion = await openai.chat.completions.create({
        model: config.apis.openai.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.style, request.intensity),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: config.apis.openai.maxTokens,
        temperature: this.getTemperature(request.intensity),
        top_p: 0.9,
        frequency_penalty: 0.2,
        presence_penalty: 0.1,
      });

      const humanizedText = completion.choices[0]?.message?.content;
      
      if (!humanizedText) {
        throw new Error('Empty response from OpenAI API');
      }

      loggers.apiCall('OpenAI', 'chat.completions.create', Date.now(), true);
      return humanizedText.trim();

    } catch (error) {
      loggers.apiCall('OpenAI', 'chat.completions.create', Date.now(), false);
      throw error;
    }
  }

  // Simple rule-based humanization for testing without API key
  private async humanizeWithRules(request: HumanizeRequest): Promise<string> {
    let text = request.text;
    
    logger.info('Using rule-based humanization (no AI API configured)');
    
    // Simple transformations to make text seem more human
    const transformations = [
      // Replace formal phrases with casual ones
      [/furthermore/gi, 'also'],
      [/therefore/gi, 'so'],
      [/however/gi, 'but'],
      [/in addition/gi, 'plus'],
      [/consequently/gi, 'as a result'],
      [/moreover/gi, 'what\'s more'],
      [/nevertheless/gi, 'still'],
      
      // Add contractions
      [/cannot/gi, "can't"],
      [/do not/gi, "don't"],
      [/will not/gi, "won't"],
      [/it is/gi, "it's"],
      [/that is/gi, "that's"],
      [/you are/gi, "you're"],
      [/we are/gi, "we're"],
      [/they are/gi, "they're"],
      
      // Replace formal words
      [/utilize/gi, 'use'],
      [/commence/gi, 'start'],
      [/terminate/gi, 'end'],
      [/demonstrate/gi, 'show'],
      [/facilitate/gi, 'help'],
    ];

    // Apply transformations based on style
    switch (request.style) {
      case 'casual':
        transformations.forEach(([pattern, replacement]) => {
          text = text.replace(pattern as RegExp, replacement as string);
        });
        // Add some casual flair
        text = text.replace(/very/gi, 'really');
        text = text.replace(/quite/gi, 'pretty');
        break;
        
      case 'professional':
        // Keep more formal but add some variety - only apply some transformations
        text = text.replace(/furthermore/gi, 'additionally');
        text = text.replace(/therefore/gi, 'consequently');
        break;
        
      case 'creative':
        transformations.forEach(([pattern, replacement]) => {
          text = text.replace(pattern as RegExp, replacement as string);
        });
        // Add more expressive language
        text = text.replace(/good/gi, 'great');
        text = text.replace(/bad/gi, 'terrible');
        break;
        
      case 'academic':
        // Minimal changes for academic style
        text = text.replace(/furthermore/gi, 'moreover');
        text = text.replace(/in addition/gi, 'additionally');
        break;
    }

    // Add some human-like imperfections based on intensity
    if (request.intensity === 'aggressive') {
      // More transformations
      text = text.replace(/important/gi, 'crucial');
      text = text.replace(/big/gi, 'huge');
      text = text.replace(/small/gi, 'tiny');
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return text;
  }

  // Build prompt for AI APIs
  private buildPrompt(request: HumanizeRequest): string {
    const { text, style, intensity, preserveFormatting } = request;
    
    let prompt = `Please rewrite the following text to sound more natural and human-written:\n\n"${text}"\n\n`;
    
    prompt += `Instructions:\n`;
    prompt += `- Make it sound more human and natural\n`;
    prompt += `- Keep the same meaning and information\n`;
    prompt += `- Use varied sentence structures and lengths\n`;
    prompt += `- Add natural flow and transitions\n`;
    
    if (preserveFormatting) {
      prompt += `- Keep the original formatting\n`;
    }
    
    prompt += `\nProvide only the rewritten text, no explanations.`;
    
    return prompt;
  }

  // Get system prompt based on style and intensity
  private getSystemPrompt(style?: Style, intensity?: Intensity): string {
    let basePrompt = `You are an expert text editor specializing in humanizing AI-generated content. Rewrite the text to sound more human and natural while preserving the original meaning.`;
    
    switch (style) {
      case 'academic':
        basePrompt += ' Use scholarly language but keep it readable and engaging.';
        break;
      case 'professional':
        basePrompt += ' Use professional business language that is clear and polished.';
        break;
      case 'creative':
        basePrompt += ' Use creative, engaging language with vivid expressions and storytelling elements.';
        break;
      case 'casual':
      default:
        basePrompt += ' Use casual, conversational language that feels natural and friendly.';
        break;
    }
    
    switch (intensity) {
      case 'subtle':
        basePrompt += ' Make minimal changes, focusing on small improvements to flow and naturalness.';
        break;
      case 'aggressive':
        basePrompt += ' Make significant changes to structure, vocabulary, and style for maximum humanization.';
        break;
      case 'moderate':
      default:
        basePrompt += ' Make moderate changes to improve naturalness while maintaining clarity.';
        break;
    }
    
    return basePrompt;
  }

  // Get temperature based on intensity
  private getTemperature(intensity?: Intensity): number {
    switch (intensity) {
      case 'subtle':
        return 0.3;
      case 'aggressive':
        return 0.9;
      case 'moderate':
      default:
        return 0.7;
    }
  }

  // Calculate statistics about the humanization
  private calculateStatistics(originalText: string, humanizedText: string) {
    const originalWords = this.countWords(originalText);
    const humanizedWords = this.countWords(humanizedText);
    
    // Simple change detection
    const changesCount = this.estimateChanges(originalText, humanizedText);
    
    // Basic readability score
    const readabilityScore = this.calculateReadabilityScore(humanizedText);
    
    return {
      originalWordCount: originalWords,
      humanizedWordCount: humanizedWords,
      changesCount,
      readabilityScore,
    };
  }

  // Count words in text
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Estimate number of changes made
  private estimateChanges(original: string, humanized: string): number {
    const originalWords = original.toLowerCase().split(/\s+/);
    const humanizedWords = humanized.toLowerCase().split(/\s+/);
    
    let changes = Math.abs(originalWords.length - humanizedWords.length);
    const minLength = Math.min(originalWords.length, humanizedWords.length);
    
    for (let i = 0; i < minLength; i++) {
      if (originalWords[i] !== humanizedWords[i]) {
        changes++;
      }
    }
    
    return changes;
  }

  // Calculate basic readability score
  private calculateReadabilityScore(text: string): number {
    const words = this.countWords(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    if (sentences === 0 || words === 0) return 7.5; // Default score
    
    const avgWordsPerSentence = words / sentences;
    
    // Simple readability estimate (higher is more readable)
    if (avgWordsPerSentence < 15) return 8.5;
    if (avgWordsPerSentence < 20) return 7.5;
    return 6.5;
  }

  // Validate input text (relaxed for personal use)
  validateInput(request: HumanizeRequest): void {
    if (!request.text || typeof request.text !== 'string') {
      throw new AppError(
        'Text is required',
        400,
        ErrorCode.VALIDATION_ERROR,
        ['Text field is required and must be a string']
      );
    }

    if (request.text.length < config.limits.textMinLength) {
      throw new AppError(
        'Text too short',
        400,
        ErrorCode.TEXT_TOO_SHORT,
        [`Text must be at least ${config.limits.textMinLength} characters`]
      );
    }

    if (request.text.length > config.limits.textMaxLength) {
      throw new AppError(
        'Text too long',
        400,
        ErrorCode.TEXT_TOO_LONG,
        [`Text must not exceed ${config.limits.textMaxLength} characters`]
      );
    }
  }
}

export default new HumanizationService();