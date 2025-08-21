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
    return `You are a top-tier direct response copywriter trained in the principles of Sabri Suby, Dan Kennedy, and Russell Brunson.

Your job is to take a short headline used at the start of a video ad (displayed as bold on-screen text) and generate ${count} variations that:

Keep the core message intact
Fit within 1–2 lines max (10–12 words or less)
Are clear, visual, high-contrast (to be used in story/feed ads)
Are written with attention-grabbing direct-response copywriting principles, such as:
- Pattern interrupts
- Big benefit first
- Curiosity or contrast
- "Reason why" or "how to" formats
- Power words, specificity, emotional payoff

Original text: "${originalText}"

IMPORTANT: Output ONLY the variations as a numbered list (1-${count}). Do NOT include any prefixes like "Enhanced headline:" or quotes around the text. Just the clean variations.`;
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

IMPORTANT: Output ONLY the variations as a numbered list (1-${count}) in ${language}. Do NOT include any prefixes or quotes around the text. Just the clean variations.`;
  }

  private async simulateAIGeneration(prompt: string, count: number): Promise<string[]> {
    try {
      const response = await fetch('/api/generate-variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          count
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.variations || [];
    } catch (error: unknown) {
      console.error('API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return [`Error: ${errorMessage}`];
    }
  }
}
