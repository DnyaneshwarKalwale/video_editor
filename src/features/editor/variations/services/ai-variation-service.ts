import { AITextVariationRequest } from '../types/variation-types';

interface AITextVariationResponse {
  variations: string[];
  language: string;
}

export class AIVariationService {
  private static instance: AIVariationService;
  
  public static getInstance(): AIVariationService {
    if (!AIVariationService.instance) {
      AIVariationService.instance = new AIVariationService();
    }
    return AIVariationService.instance;
  }

  async generateTextVariations(request: AITextVariationRequest): Promise<AITextVariationResponse> {
    try {
      if (request.variationType === 'auto') {
        return await this.generateAutoVariations(request.originalText, request.count);
      } else if (request.variationType === 'language' && request.targetLanguage) {
        return await this.generateLanguageVariations(request.originalText, request.targetLanguage, request.count);
      }
      throw new Error('Invalid request type');
    } catch (error) {
      console.error('Error generating AI variations:', error);
      throw error;
    }
  }

  private async generateAutoVariations(originalText: string, count: number): Promise<AITextVariationResponse> {
    const prompt = this.buildAutoGenerationPrompt(originalText, count);
    
    // Simulate AI API call - replace with actual AI service
    const variations = await this.simulateAIGeneration(prompt, count);
    
    return {
      variations,
      language: 'English'
    };
  }

  private async generateLanguageVariations(originalText: string, language: string, count: number): Promise<AITextVariationResponse> {
    const prompt = this.buildLanguageGenerationPrompt(originalText, language, count);
    
    // Simulate AI API call - replace with actual AI service
    const variations = await this.simulateAIGeneration(prompt, count);
    
    return {
      variations,
      language
    };
  }

  private buildAutoGenerationPrompt(originalText: string, count: number): string {
    return `You are a creative marketing assistant.
Given the original text below, generate exactly ${count} short variations.
Each variation must:
- Preserve the original message intent.
- Use clear, persuasive, and engaging language.
- Be under 10 words.
- Avoid repetition.
- Include stylistic diversity (some urgent, some casual, some formal).

Original text: "${originalText}"
Output as a numbered list (1-${count}).`;
  }

  private buildLanguageGenerationPrompt(originalText: string, language: string, count: number): string {
    return `You are a translation and creative rewriting expert.
Given the original text below, generate exactly ${count} variations in ${language}.
Each variation must:
- Maintain the original intent.
- Use natural expressions for the target language.
- Be under 10 words.
- Avoid direct literal translation — make it engaging for a native audience.
- Vary the tone (some urgent, some casual, some formal).

Original text: "${originalText}"
Output as a numbered list (1-${count}) in ${language}.`;
  }

  private async simulateAIGeneration(prompt: string, count: number): Promise<string[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock variations based on the original text
    const mockVariations = [
      'Amazing deals await you',
      'Don\'t miss out on savings',
      'Limited time offers available',
      'Exclusive discounts for you',
      'Special prices just for you',
      'Incredible savings today',
      'Best deals of the season',
      'Unbeatable prices now',
      'Fantastic offers waiting',
      'Premium discounts available'
    ];
    
    return mockVariations.slice(0, count);
  }
}
