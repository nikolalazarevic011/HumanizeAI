import axios from 'axios';
import config from '@/config';
import logger from '@/utils/logger';

export interface WordSynonyms {
  word: string;
  synonyms: string[];
}

export class WordsApiService {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.apis.wordsapi.baseUrl;
    this.apiKey = config.apis.wordsapi.apiKey;
    this.timeout = config.apis.wordsapi.timeout;
  }

  /**
   * Get synonyms for a word using WordsAPI
   */
  async getSynonyms(word: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/words/${word}/synonyms`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
        },
        timeout: this.timeout,
      });

      if (response.data && response.data.synonyms) {
        return response.data.synonyms;
      }

      return [];
    } catch (error) {
      logger.warn(`Failed to get synonyms for "${word}":`, error);
      return [];
    }
  }

  /**
   * Get a random synonym for a word, prioritizing natural-sounding alternatives
   */
  async getRandomSynonym(word: string): Promise<string> {
    const synonyms = await this.getSynonyms(word);
    
    if (synonyms.length === 0) {
      return word; // Return original if no synonyms found
    }

    // Much more conservative filtering - only use very close synonyms
    const filteredSynonyms = synonyms.filter(synonym => {
      const lowerSynonym = synonym.toLowerCase();
      const lowerWord = word.toLowerCase();
      
      // Only single words, no phrases
      if (synonym.includes(' ') || synonym.includes('-')) {
        return false;
      }
      
      // Reject if too different in length
      if (Math.abs(synonym.length - word.length) > 3) {
        return false;
      }
      
      // Avoid technical jargon replacements that change meaning
      const technicalWords = [
        'coding', 'programming', 'development', 'software', 'framework',
        'language', 'code', 'developers', 'digital', 'technical', 'environment',
        'workspace', 'system', 'application', 'interface', 'data', 'algorithm',
        'function', 'method', 'process', 'structure', 'design', 'build',
        'create', 'implement', 'execute', 'run', 'test', 'debug', 'expression',
        'often', 'accompanied', 'experience', 'writing', 'performance', 'room',
        'some', 'state', 'flow'
      ];
      
      if (technicalWords.includes(lowerWord)) {
        // For technical terms, only allow very close synonyms
        const allowedTechSynonyms = {
          'coding': ['programming'],
          'programming': ['coding'],
          'development': ['building'],
          'developers': ['programmers', 'coders'],
          'build': ['create', 'make'],
          'create': ['make', 'build'],
          'environment': ['setting'],
          'framework': ['structure'],
          'process': ['method']
        };
        
        const allowed = allowedTechSynonyms[lowerWord] || [];
        return allowed.includes(lowerSynonym);
      }
      
      // Avoid overly formal, archaic, or weird synonyms
      const avoidWords = [
        'steganography', 'cryptography', 'ontogenesis', 'misdirection',
        'edifice', 'outturn', 'curator', 'divine', 'beatniks', 'roger',
        'whilst', 'hitherto', 'heretofore', 'wherein', 'whereby',
        'aforementioned', 'pursuant', 'notwithstanding', 'subsequently',
        'nevertheless', 'furthermore', 'moreover', 'therefore', 'consequently',
        'utilize', 'facilitate', 'demonstrate', 'establish', 'acquire',
        'comprehensive', 'substantial', 'considerable', 'optimal',
        'enhance', 'augment', 'ameliorate', 'edifice', 'commence',
        'oft', 'attended', 'minimum', 'foreclose', 'merely', 'receive',
        'functioning', 'way', 'around', 'tell', 'humanise', 'array',
        'construction', 'originative'
      ];
      
      if (avoidWords.includes(lowerSynonym)) {
        return false;
      }
      
      return true;
    });

    if (filteredSynonyms.length === 0) {
      return word; // Return original if no suitable synonyms
    }

    // Prefer synonyms that are similar in length and common usage
    const goodSynonyms = filteredSynonyms.filter(s => 
      Math.abs(s.length - word.length) <= 2
    );
    
    const finalSynonyms = goodSynonyms.length > 0 ? goodSynonyms : filteredSynonyms;

    // Return a random synonym from filtered list
    const randomIndex = Math.floor(Math.random() * finalSynonyms.length);
    return finalSynonyms[randomIndex];
  }

  /**
   * Moderately humanize text to eliminate AI patterns while preserving meaning
   */
  async humanizeWithSynonyms(text: string): Promise<string> {
    const words = text.split(/(\s+|[^\w\s])/); // Split preserving whitespace and punctuation
    const processedWords: string[] = [];

    // Expanded skip words - protect more function words and technical terms
    const skipWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
      'him', 'her', 'us', 'them', 'my', 'your', 'his', 'their', 'our',
      'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when',
      'why', 'how', 'what', 'who', 'which', 'whose', 'whom', 'from', 'up',
      'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'among', 'under', 'over', 'may', 'might', 'must',
      
      // Protect key terms that shouldn't be changed (reduced list for better AI detection)
      'vibe', 'coding', 'code', 'api', 'ui', 'ux', 'css', 'html', 'js',
      'react', 'node', 'npm', 'git', 'dev', 'app', 'web', 'ai',
      'ml', 'data', 'json', 'sql', 'php', 'python', 'java', 'c++'
    ]);

    const promises: Promise<void>[] = [];
    let wordIndex = 0;

    for (let i = 0; i < words.length; i++) {
      const part = words[i];
      
      // Only process actual words (not whitespace or punctuation)
      if (/^\w+$/.test(part)) {
        const lowerPart = part.toLowerCase();
        
        // More aggressive replacement for better AI detection avoidance
        if (!skipWords.has(lowerPart) && 
            part.length > 3 && 
            wordIndex % 2 === 0 && // Every second word
            Math.random() < 0.65) { // 65% chance to replace eligible words
          
          const promise = this.getRandomSynonym(part).then(synonym => {
            // Only use synonym if it's actually different and reasonable
            if (synonym !== part && synonym.length > 0) {
              // Preserve original capitalization
              if (part[0] === part[0].toUpperCase()) {
                synonym = synonym.charAt(0).toUpperCase() + synonym.slice(1).toLowerCase();
              }
              processedWords[i] = synonym;
            } else {
              processedWords[i] = part;
            }
          }).catch(() => {
            processedWords[i] = part; // Keep original on error
          });
          
          promises.push(promise);
        } else {
          processedWords[i] = part;
        }
        
        wordIndex++;
      } else {
        processedWords[i] = part; // Keep whitespace and punctuation as-is
      }
    }

    // Wait for all synonym replacements to complete
    await Promise.all(promises);

    return processedWords.join('');
  }
}

export default new WordsApiService();
