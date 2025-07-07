import config from '@/config';
import logger, { loggers } from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';
import { ErrorCode, HumanizeRequest, HumanizeResponse } from '@/types';
import wordsApiService from './wordsApiService';

export class HumanizationService {
  // Medical terminology whitelist - these words should never be humanized
  private readonly medicalTermsWhitelist = new Set([
    // Healthcare professionals
    'doctor', 'doctors', 'physician', 'physicians', 'nurse', 'nurses', 'surgeon', 'surgeons',
    'therapist', 'therapists', 'psychiatrist', 'psychiatrists', 'psychologist', 'psychologists',
    'radiologist', 'radiologists', 'cardiologist', 'cardiologists', 'oncologist', 'oncologists',
    'neurologist', 'neurologists', 'dermatologist', 'dermatologists', 'pediatrician', 'pediatricians',
    'gynecologist', 'gynecologists', 'urologist', 'urologists', 'anesthesiologist', 'anesthesiologists',
    'pharmacist', 'pharmacists', 'dentist', 'dentists', 'optometrist', 'optometrists',
    'paramedic', 'paramedics', 'emt', 'emts', 'technician', 'technicians',
    
    // Basic medical terms
    'patient', 'patients', 'medical', 'medicine', 'medication', 'medications', 'drug', 'drugs',
    'treatment', 'treatments', 'therapy', 'therapies', 'diagnosis', 'diagnoses', 'symptom', 'symptoms',
    'disease', 'diseases', 'condition', 'conditions', 'syndrome', 'syndromes', 'disorder', 'disorders',
    'infection', 'infections', 'virus', 'viruses', 'bacteria', 'bacterial', 'antibiotic', 'antibiotics',
    'vaccine', 'vaccines', 'vaccination', 'vaccinations', 'immunization', 'immunizations',
    
    // Body parts and systems
    'heart', 'hearts', 'lung', 'lungs', 'brain', 'brains', 'liver', 'kidney', 'kidneys',
    'stomach', 'intestine', 'intestines', 'blood', 'nerve', 'nerves', 'muscle', 'muscles',
    'bone', 'bones', 'skin', 'eye', 'eyes', 'ear', 'ears', 'nose', 'mouth', 'throat',
    
    // Medical procedures
    'surgery', 'surgeries', 'operation', 'operations', 'procedure', 'procedures',
    'examination', 'examinations', 'test', 'tests', 'scan', 'scans', 'xray', 'x-ray',
    'mri', 'ct', 'ultrasound', 'biopsy', 'biopsies',
    
    // Medical facilities
    'hospital', 'hospitals', 'clinic', 'clinics', 'emergency', 'icu', 'ward', 'wards',
    'pharmacy', 'pharmacies', 'laboratory', 'laboratories', 'lab', 'labs',
    
    // Medical measurements
    'dose', 'doses', 'dosage', 'dosages', 'mg', 'ml', 'cc', 'units', 'blood pressure',
    'temperature', 'pulse', 'heart rate', 'oxygen', 'glucose', 'cholesterol',
    
    // Pain and symptoms
    'pain', 'ache', 'aches', 'fever', 'nausea', 'headache', 'headaches', 'migraine', 'migraines',
    'fatigue', 'dizziness', 'swelling', 'inflammation', 'bleeding', 'bruising',
    
    // Common medical abbreviations (lowercase for case-insensitive matching)
    'cpr', 'ekg', 'ecg', 'iv', 'er', 'or', 'rn', 'md', 'dds', 'phd', 'dvm'
  ]);

  // Check if a word should be protected from humanization
  private isProtectedMedicalTerm(word: string): boolean {
    // Normalize the word (lowercase, remove punctuation)
    const normalizedWord = word.toLowerCase().replace(/[^a-z0-9-]/g, '');
    return this.medicalTermsWhitelist.has(normalizedWord);
  }

  // Apply pattern replacement while protecting medical terms
  private safeReplace(text: string, pattern: RegExp, replacement: string | ((match: string) => string)): string {
    return text.replace(pattern, (match, ...args) => {
      // Extract just the word part for checking (remove surrounding punctuation/spaces)
      const wordMatch = match.match(/\b[a-zA-Z0-9-]+\b/);
      if (wordMatch && this.isProtectedMedicalTerm(wordMatch[0])) {
        logger.debug('Protected medical term from replacement', { term: wordMatch[0], pattern: pattern.toString() });
        return match; // Return original if it's a protected medical term
      }
      
      // Apply replacement if it's not a protected term
      if (typeof replacement === 'function') {
        return replacement(match);
      }
      return replacement;
    });
  }
  // Main humanization method - balanced approach to eliminate AI patterns while preserving meaning
  async humanizeText(request: HumanizeRequest): Promise<HumanizeResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting aggressive AI pattern elimination with quality control', {
        textLength: request.text.length,
        style: 'professional',
        intensity: 'aggressive',
      });

      // Step 0: Separate content and references
      const { content, references } = this.separateContentAndReferences(request.text);
      
      logger.info('Text separation completed', {
        contentLength: content.length,
        referencesLength: references.length,
        hasReferences: references.length > 0
      });

      // Step 1: Remove obvious AI patterns and connectors (only on content)
      let humanizedText = this.destroyAIPatterns(content);

      // Step 2: Light sentence structure adjustments
      humanizedText = this.destroyAISentencePatterns(humanizedText);

      // Step 3: Moderate synonym replacement using WordsAPI (with medical term protection)
      humanizedText = await wordsApiService.humanizeWithSynonyms(humanizedText, this.medicalTermsWhitelist);

      // Step 4: Add minimal human touches
      humanizedText = this.addHumanImperfections(humanizedText);

      // Step 5: Final cleanup
      humanizedText = this.finalAIElimination(humanizedText);

      // Step 6: Recombine with preserved references
      const finalText = this.recombineContentAndReferences(humanizedText, references);

      // Calculate statistics (use final combined text)
      const statistics = this.calculateStatistics(request.text, finalText);
      
      const processingTime = (Date.now() - startTime) / 1000;

      loggers.performance('Balanced humanization completed', Date.now() - startTime, {
        originalLength: request.text.length,
        humanizedLength: finalText.length,
        changesCount: statistics.changesCount,
        hadReferences: references.length > 0
      });

      return {
        originalText: request.text,
        humanizedText: finalText,
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

  // Separate content from references section
  private separateContentAndReferences(text: string): { content: string; references: string } {
    // Look for "References:" (case insensitive) and everything after it
    const referencesMatch = text.match(/(.*?)\n?\s*(References?\s*:.*)/is);
    
    if (referencesMatch) {
      const content = referencesMatch[1].trim();
      const references = referencesMatch[2].trim();
      
      logger.info('References section detected and separated', {
        contentLength: content.length,
        referencesLength: references.length,
        referencesPreview: references.substring(0, 100) + (references.length > 100 ? '...' : '')
      });
      
      return { content, references };
    }
    
    // No references found, return all as content
    return { content: text.trim(), references: '' };
  }

  // Recombine humanized content with preserved references
  private recombineContentAndReferences(humanizedContent: string, references: string): string {
    if (!references) {
      return humanizedContent;
    }
    
    // Add appropriate spacing between content and references
    const spacing = humanizedContent.endsWith('.') || humanizedContent.endsWith('!') || humanizedContent.endsWith('?') 
      ? '\n\n' 
      : '.\n\n';
    
    return humanizedContent + spacing + references;
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

    // Apply transformations using safe replacement to protect medical terms
    basicAIPatterns.forEach(([pattern, replacement]) => {
      processedText = this.safeReplace(processedText, pattern as RegExp, replacement as string);
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

    // More casual replacements for AI detection avoidance (with medical term protection)
    processedText = this.safeReplace(processedText, /\bvery good\b/gi, 'really good');
    processedText = this.safeReplace(processedText, /\bvery important\b/gi, 'really important');
    processedText = this.safeReplace(processedText, /\bextremely\b/gi, 'really');
    processedText = this.safeReplace(processedText, /\bmust\b/gi, 'need to');
    processedText = this.safeReplace(processedText, /\bshall\b/gi, 'will');
    processedText = this.safeReplace(processedText, /\bwhom\b/gi, 'who');
    
    // Replace perfect structures with more casual ones (with medical term protection)
    processedText = this.safeReplace(processedText, /\bA number of\b/gi, 'Several');
    processedText = this.safeReplace(processedText, /\bA variety of\b/gi, 'Different');
    processedText = this.safeReplace(processedText, /\bNumerous\b/gi, 'Many');
    
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
