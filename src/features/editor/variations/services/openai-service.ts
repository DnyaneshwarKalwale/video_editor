import OpenAI from 'openai';

interface TextVariationsResponse {
  variations: string[];
  error?: string;
}

class OpenAIService {
  private openai: OpenAI | null = null;

  constructor() {
    // Check if we're in browser environment (Next.js client-side)
    if (typeof window !== 'undefined') {
      console.warn('OpenAI service should not be used on client-side for security reasons');
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY is not configured. Variations will use fallback text generation.');
      return;
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  private isConfigured(): boolean {
    return this.openai !== null;
  }

  async generateTextVariations(originalText: string): Promise<TextVariationsResponse> {
    // If OpenAI is not configured, return fallback variations immediately
    if (!this.isConfigured()) {
      return this.getFallbackVariations(originalText);
    }

    try {
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a creative text variation generator. Rewrite sentences keeping the core message but changing tone and style."
          },
          {
            role: "user",
            content: `Rewrite this sentence in 5 different ways, keeping the core message but changing the tone and style. Output as JSON array of plain text sentences: "${originalText}"`
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const variations = JSON.parse(content);
      
      if (!Array.isArray(variations) || variations.length !== 5) {
        throw new Error('Invalid response format from OpenAI');
      }

      return { variations };
    } catch (error) {
      console.error('Error generating text variations:', error);
      return {
        ...this.getFallbackVariations(originalText),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getFallbackVariations(originalText: string): TextVariationsResponse {
    // Create truly different sentences based on the original text theme
    const variations = [];
    
    // If it's about creating video ads, generate related variations
    if (originalText.toLowerCase().includes('video') || originalText.toLowerCase().includes('ads') || originalText.toLowerCase().includes('create')) {
      variations.push(
        "Transform Your Vision Into Viral Video Content",
        "Build Stunning Video Campaigns in Minutes", 
        "Create Professional Video Ads That Convert",
        "Generate Engaging Video Content Instantly",
        "Design Video Ads That Drive Results"
      );
    } else {
      // Generic creative variations for any text
      variations.push(
        `Make ${originalText.split(' ').slice(1, 3).join(' ')} Your Reality`,
        `Unlock the Power of ${originalText.split(' ').slice(-2).join(' ')}`,
        `Experience ${originalText.replace(/Turn|Create|Generate/gi, 'Revolutionary').split(' ').slice(0, 4).join(' ')}`,
        `Discover ${originalText.replace(/Ideas|Thoughts/gi, 'Innovation').split(' ').slice(1).join(' ')}`,
        `Master ${originalText.replace(/Video|Content/gi, 'Digital Marketing').split(' ').slice(-3).join(' ')}`
      );
    }
    
    return { 
      variations: variations.slice(0, 5)
    };
  }
}

export const openAIService = new OpenAIService();
export default OpenAIService;