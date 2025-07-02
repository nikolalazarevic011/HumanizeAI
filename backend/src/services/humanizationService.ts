import config from '@/config';
import logger, { loggers } from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';
import { ErrorCode, HumanizeRequest, HumanizeResponse } from '@/types';
import wordsApiService from './wordsApiService';

export class HumanizationService {
  // Main humanization method - balanced approach to eliminate AI patterns while preserving meaning
  async humanizeText(request: HumanizeRequest): Promise<HumanizeResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting aggressive AI pattern elimination with quality control', {
        textLength: request.text.length,
        style: 'professional',
        intensity: 'aggressive',
      });

      // Step 1: Remove obvious AI patterns and connectors
      let humanizedText = this.destroyAIPatterns(request.text);

      // Step 2: Light sentence structure adjustments
      humanizedText = this.destroyAISentencePatterns(humanizedText);

      // Step 3: Moderate synonym replacement using WordsAPI
      humanizedText = await wordsApiService.humanizeWithSynonyms(humanizedText);

      // Step 4: Add minimal human touches
      humanizedText = this.addHumanImperfections(humanizedText);

      // Step 5: Final cleanup
      humanizedText = this.finalAIElimination(humanizedText);

      // Calculate statistics
      const statistics = this.calculateStatistics(request.text, humanizedText);
      
      const processingTime = (Date.now() - startTime) / 1000;

      loggers.performance('Balanced humanization completed', Date.now() - startTime, {
        originalLength: request.text.length,
        humanizedLength: humanizedText.length,
        changesCount: statistics.changesCount,
      });

      return {
        originalText: request.text,
        humanizedText,
        style: 'professional',
        intensity: 'aggressive',
        processingTime,
        statistics,
      };

    } catch (error) {
      loggers.error(error as Error, {
        operation: 'humanizeText',
        textLength: request.text.length,
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

  // Eliminate common AI patterns but preserve readability
  private destroyAIPatterns(text: string): string {
    let processedText = text;

    // Replace only the most obvious AI connectors
    const basicAIPatterns = [
      // Classic AI transitions - replace with simpler alternatives
      [/\bFurthermore,?\s*/gi, 'Also, '],
      [/\bMoreover,?\s*/gi, 'Plus, '],
      [/\bIn addition,?\s*/gi, 'Also, '],
      [/\bAdditionally,?\s*/gi, 'Also, '],
      [/\bTherefore,?\s*/gi, 'So '],
      [/\bConsequently,?\s*/gi, 'As a result, '],
      [/\bNevertheless,?\s*/gi, 'However, '],
      [/\bOn the other hand,?\s*/gi, 'However, '],
      [/\bIn conclusion,?\s*/gi, 'Overall, '],
      [/\bTo summarize,?\s*/gi, 'In summary, '],
      
      // Remove obvious AI hedging
      [/\bIt should be noted that\s*/gi, ''],
      [/\bIt is important to note that\s*/gi, ''],
      [/\bIt is worth noting that\s*/gi, ''],
      
      // Basic contractions for naturalness (more aggressive)
      [/\bcannot\b/gi, "can't"],
      [/\bdo not\b/gi, "don't"],
      [/\bdoes not\b/gi, "doesn't"],
      [/\bwill not\b/gi, "won't"],
      [/\bwould not\b/gi, "wouldn't"],
      [/\bshould not\b/gi, "shouldn't"],
      [/\bcould not\b/gi, "couldn't"],
      [/\bit is\b/gi, "it's"],
      [/\bthat is\b/gi, "that's"],
      [/\bwe are\b/gi, "we're"],
      [/\bthey are\b/gi, "they're"],
      [/\byou are\b/gi, "you're"],
      [/\bI am\b/gi, "I'm"],
      [/\bhe is\b/gi, "he's"],
      [/\bshe is\b/gi, "she's"],
      [/\bwho is\b/gi, "who's"],
      [/\bwhat is\b/gi, "what's"],
      [/\bthere is\b/gi, "there's"],
      [/\bhere is\b/gi, "here's"],
      
      // Replace only obviously formal terms (more aggressive)
      [/\butili[sz]e[sd]?\b/gi, 'use'],
      [/\bdemonstrate[sd]?\b/gi, 'show'],
      [/\bfacilitate[sd]?\b/gi, 'help'],
      [/\bimplement[ed|ing|s]?\b/gi, 'put in place'],
      [/\bin order to\b/gi, 'to'],
      [/\bdue to the fact that\b/gi, 'because'],
      [/\bwith regard to\b/gi, 'regarding'],
      [/\bwith respect to\b/gi, 'about'],
      [/\bin terms of\b/gi, 'for'],
      [/\bsignificant(ly)?\b/gi, 'major'],
      [/\bsubstantial(ly)?\b/gi, 'big'],
      [/\bcomprehensive(ly)?\b/gi, 'complete'],
    ];

    // Apply transformations
    basicAIPatterns.forEach(([pattern, replacement]) => {
      processedText = processedText.replace(pattern as RegExp, replacement as string);
    });

    return processedText;
  }

  // Lightly adjust sentence patterns while preserving structure
  private destroyAISentencePatterns(text: string): string {
    let processedText = text;

    // Only remove the most obvious AI sentence starters
    processedText = processedText.replace(/^It\s+is\s+(important|crucial|essential)\s+to\s+(note|understand|recognize)\s+that\s+/gi, '');
    processedText = processedText.replace(/^It\s+should\s+be\s+noted\s+that\s+/gi, '');
    
    // Clean up any double spaces from removals
    processedText = processedText.replace(/\s+/g, ' ');
    
    return processedText.trim();
  }

  // Add more human touches for better AI detection avoidance
  private addHumanImperfections(text: string): string {
    let processedText = text;

    // More casual replacements for AI detection avoidance
    processedText = processedText.replace(/\bvery good\b/gi, 'really good');
    processedText = processedText.replace(/\bvery important\b/gi, 'really important');
    processedText = processedText.replace(/\bextremely\b/gi, 'really');
    processedText = processedText.replace(/\bmust\b/gi, 'need to');
    processedText = processedText.replace(/\bshall\b/gi, 'will');
    processedText = processedText.replace(/\bwhom\b/gi, 'who');
    
    // Replace perfect structures with more casual ones
    processedText = processedText.replace(/\bA number of\b/gi, 'Several');
    processedText = processedText.replace(/\bA variety of\b/gi, 'Different');
    processedText = processedText.replace(/\bNumerous\b/gi, 'Many');
    
    return processedText;
  }

  // Final cleanup pass
  private finalAIElimination(text: string): string {
    let processedText = text;

    // Clean up em dashes and replace with spaces when they look awkward
    // Pattern: word—word becomes word word (when not part of proper punctuation)
    processedText = processedText.replace(/(\w)—(\w)/g, '$1 $2');
    
    // Keep em dashes only when they're clearly intentional (after spaces or at word boundaries)
    // This preserves things like "coding sessions. Vibe coding—it's becoming" but fixes "rhythm—often"
    
    // Just clean up spacing and basic formatting
    processedText = processedText.replace(/\s+/g, ' ');
    processedText = processedText.replace(/,\s*,/g, ',');
    processedText = processedText.replace(/\.\s*\./g, '.');
    
    // Ensure first letter is capitalized
    if (processedText.length > 0) {
      processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
    }
    
    return processedText.trim();
  }

  // Calculate statistics about the humanization
  private calculateStatistics(originalText: string, humanizedText: string) {
    const originalWords = this.countWords(originalText);
    const humanizedWords = this.countWords(humanizedText);
    
    const changesCount = this.estimateChanges(originalText, humanizedText);
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
    
    if (sentences === 0 || words === 0) return 8.5; // Higher for human-like text
    
    const avgWordsPerSentence = words / sentences;
    
    // Human-like readability (higher is more readable)
    if (avgWordsPerSentence < 15) return 9.0;
    if (avgWordsPerSentence < 20) return 8.5;
    return 8.0;
  }

  // Validate input text
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
