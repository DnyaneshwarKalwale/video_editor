import { create } from 'zustand';
import { TimelineElement, VariationState, GeneratedVideo, AITextVariationRequest } from '../types/variation-types';

// Simple ID generator
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface VariationStore extends VariationState {
  // Actions
  setElements: (elements: TimelineElement[]) => void;
  addElement: (element: TimelineElement) => void;
  updateElement: (elementId: string, updates: Partial<TimelineElement>) => void;
  removeElement: (elementId: string) => void;
  
  // Variation management
  addTextVariations: (elementId: string, variations: string[], type: 'ai-generated' | 'manual', language?: string) => void;
  addMediaVariations: (elementId: string, files: File[]) => Promise<void>;
  removeVariation: (elementId: string, variationId: string) => void;
  
  // AI Text generation
  generateAITextVariations: (request: AITextVariationRequest) => Promise<string[]>;
  
  // Video generation
  generateAllVideos: () => Promise<void>;
  updateVideoStatus: (videoId: string, status: GeneratedVideo['status'], outputUrl?: string) => void;
  
  // Calculations
  calculateTotalCombinations: () => number;
  
  // Reset
  reset: () => void;
}

const initialState: VariationState = {
  elements: [],
  totalCombinations: 0,
  generatedVideos: [],
};

export const useVariationStore = create<VariationStore>((set, get) => ({
  ...initialState,

  setElements: (elements) => {
    set({ elements });
    get().calculateTotalCombinations();
  },

  addElement: (element) => {
    set((state) => ({
      elements: [...state.elements, element],
    }));
    get().calculateTotalCombinations();
  },

  updateElement: (elementId, updates) => {
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === elementId ? { ...element, ...updates } : element
      ),
    }));
    get().calculateTotalCombinations();
  },

  removeElement: (elementId) => {
    set((state) => ({
      elements: state.elements.filter((element) => element.id !== elementId),
    }));
    get().calculateTotalCombinations();
  },

  addTextVariations: (elementId, variations, type, language) => {
    set((state) => ({
      elements: state.elements.map((element) => {
        if (element.id === elementId) {
          const newVariations = variations.map((content) => ({
            id: generateId(),
            content,
            type,
            metadata: {
              language,
              aiPrompt: type === 'ai-generated' ? 'AI generated variation' : undefined,
            },
          }));

          return {
            ...element,
            variations: [...element.variations, ...newVariations],
            currentVariationCount: element.variations.length + newVariations.length,
          };
        }
        return element;
      }),
    }));
    get().calculateTotalCombinations();
  },

  addMediaVariations: async (elementId, files) => {
    // Simulate file upload - in real implementation, upload to server
    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        // Create a temporary URL for demo
        return URL.createObjectURL(file);
      })
    );

    set((state) => ({
      elements: state.elements.map((element) => {
        if (element.id === elementId) {
          const newVariations = files.map((file, index) => ({
            id: generateId(),
            content: uploadedUrls[index],
            type: 'manual' as const,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            },
          }));

          return {
            ...element,
            variations: [...element.variations, ...newVariations],
            currentVariationCount: element.variations.length + newVariations.length,
          };
        }
        return element;
      }),
    }));
    get().calculateTotalCombinations();
  },

  removeVariation: (elementId, variationId) => {
    set((state) => ({
      elements: state.elements.map((element) => {
        if (element.id === elementId) {
          const filteredVariations = element.variations.filter(
            (variation) => variation.id !== variationId
          );
          return {
            ...element,
            variations: filteredVariations,
            currentVariationCount: filteredVariations.length,
          };
        }
        return element;
      }),
    }));
    get().calculateTotalCombinations();
  },

  generateAITextVariations: async (request) => {
    // Simulate AI API call
    const { originalText, variationType, targetLanguage, count } = request;
    
    // Mock AI response - replace with actual AI API call
    const variations = [];
    
    if (variationType === 'auto') {
      // Auto generate variations
      const templates = [
        'Amazing {text}',
        'Incredible {text}',
        'Best {text} ever',
        'Don\'t miss {text}',
        'Limited time {text}',
        'Exclusive {text}',
        'Premium {text}',
        'Special {text}',
        'Ultimate {text}',
        'Perfect {text}',
      ];
      
      for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        variations.push(template.replace('{text}', originalText));
      }
    } else if (variationType === 'language' && targetLanguage) {
      // Language variations
      const translations = {
        spanish: [
          'Increíble {text}',
          'Mejor {text}',
          'Oferta especial {text}',
          'No te pierdas {text}',
          'Tiempo limitado {text}',
          'Exclusivo {text}',
          'Premium {text}',
          'Especial {text}',
          'Último {text}',
          'Perfecto {text}',
        ],
        french: [
          'Incroyable {text}',
          'Meilleur {text}',
          'Offre spéciale {text}',
          'Ne manquez pas {text}',
          'Temps limité {text}',
          'Exclusif {text}',
          'Premium {text}',
          'Spécial {text}',
          'Ultime {text}',
          'Parfait {text}',
        ],
        german: [
          'Unglaubliche {text}',
          'Beste {text}',
          'Sonderangebot {text}',
          'Verpassen Sie nicht {text}',
          'Zeitlich begrenzt {text}',
          'Exklusiv {text}',
          'Premium {text}',
          'Spezial {text}',
          'Ultimative {text}',
          'Perfekt {text}',
        ],
      };
      
      const languageVariations = translations[targetLanguage as keyof typeof translations] || [];
      for (let i = 0; i < count; i++) {
        const template = languageVariations[i % languageVariations.length];
        variations.push(template.replace('{text}', originalText));
      }
    }
    
    return variations;
  },

  generateAllVideos: async () => {
    const { elements } = get();
    
    // Generate all possible combinations
    const combinations = generateCombinations(elements);
    
    // Create video generation tasks
    const videos: GeneratedVideo[] = combinations.map((combination) => ({
      id: generateId(),
      combination,
      status: 'pending',
    }));
    
    set({ generatedVideos: videos });
    
    // Simulate video generation
    for (const video of videos) {
      set((state) => ({
        generatedVideos: state.generatedVideos.map((v) =>
          v.id === video.id ? { ...v, status: 'processing' } : v
        ),
      }));
      
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      set((state) => ({
        generatedVideos: state.generatedVideos.map((v) =>
          v.id === video.id 
            ? { 
                ...v, 
                status: 'completed',
                outputUrl: `https://example.com/video-${video.id}.mp4`,
                metadata: {
                  duration: 30,
                  size: 1024 * 1024 * 5, // 5MB
                  format: 'mp4',
                },
              } 
            : v
        ),
      }));
    }
  },

  updateVideoStatus: (videoId, status, outputUrl) => {
    set((state) => ({
      generatedVideos: state.generatedVideos.map((video) =>
        video.id === videoId 
          ? { ...video, status, outputUrl: outputUrl || video.outputUrl }
          : video
      ),
    }));
  },

  calculateTotalCombinations: () => {
    const { elements } = get();
    const total = elements.reduce((acc, element) => {
      const variationCount = Math.max(element.currentVariationCount, 1);
      return acc * variationCount;
    }, 1);
    
    set({ totalCombinations: total });
    return total;
  },

  reset: () => {
    set(initialState);
  },
}));

// Helper function to generate all possible combinations
function generateCombinations(elements: TimelineElement[]) {
  const combinations: { elementId: string; variationId: string }[][] = [];
  
  function generateRecursive(index: number, currentCombination: { elementId: string; variationId: string }[]) {
    if (index === elements.length) {
      combinations.push([...currentCombination]);
      return;
    }
    
    const element = elements[index];
    const variations = element.variations.length > 0 ? element.variations : [{ id: 'original', content: element.originalContent, type: 'original' }];
    
    for (const variation of variations) {
      currentCombination.push({
        elementId: element.id,
        variationId: variation.id,
      });
      
      generateRecursive(index + 1, currentCombination);
      
      currentCombination.pop();
    }
  }
  
  generateRecursive(0, []);
  return combinations;
}
