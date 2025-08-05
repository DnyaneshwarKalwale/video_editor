import React, { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw, Edit3 } from 'lucide-react';
import { VariationModalProps, VideoVariation, TextOverlayData } from '../types/variation-types';
import VideoPreview from './VideoPreview';
import OpenAIService from '../services/openai-service';
import { Button } from '@/components/ui/button';
import useStore from '../../store/use-store';


const VariationModal: React.FC<VariationModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
}) => {
  const [variations, setVariations] = useState<VideoVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openAIService = new OpenAIService();
  const { trackItemsMap } = useStore();

  useEffect(() => {
    if (isOpen && project.textOverlays.length > 0) {
      generateVariations();
    }
  }, [isOpen, project]);

  const generateVariations = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Get all text overlays that have text content
      const textOverlaysWithContent = project.textOverlays.filter(overlay => 
        overlay.text && overlay.text.trim().length > 0
      );

      console.log('Text overlays found:', textOverlaysWithContent.map(o => ({ id: o.id, text: o.text, timing: o.timing })));
      console.log('Total text overlays with content:', textOverlaysWithContent.length);

      if (textOverlaysWithContent.length === 0) {
        setError('No text overlays found to generate variations for');
        setIsGenerating(false);
        return;
      }

      const allVariations: VideoVariation[] = [];

      // Create original variation for the entire video composition
      const originalVariation: VideoVariation = {
        id: 'original-composition',
        text: textOverlaysWithContent[0].text, // Use first text as main text
        originalTextId: textOverlaysWithContent[0].id,
        isOriginal: true,
        editable: false,
        allTextOverlays: textOverlaysWithContent, // Store all text overlays
      };
      allVariations.push(originalVariation);

      // Generate variations for ALL text overlays that have content
      const generatedVariations: VideoVariation[] = [];
      
      for (let i = 0; i < 5; i++) { // Generate 5 variations
        const variationTexts: TextOverlayData[] = [];
        
        console.log(`Generating variation ${i + 1} for ${textOverlaysWithContent.length} text overlays`);
        
        // Generate variation for each text overlay
        for (const textOverlay of textOverlaysWithContent) {
          console.log(`Processing text overlay ${textOverlay.id}: "${textOverlay.text}"`);
          
          const { variations: textVariations, error: apiError } = await openAIService.generateTextVariations(
            textOverlay.text
          );

          if (apiError) {
            setError(`API Error for text "${textOverlay.text}": ${apiError}`);
            continue;
          }

          // Use the i-th variation (or fallback to original if not enough variations)
          const variationText = textVariations[i] || textOverlay.text;
          console.log(`Using variation text: "${variationText}" for overlay ${textOverlay.id}`);
          
          variationTexts.push({
            ...textOverlay,
            text: variationText
          });
        }
        
        console.log(`Variation ${i + 1} complete with ${variationTexts.length} text overlays`);

        // Create variation object for this composition
        const variation: VideoVariation = {
          id: `variation-composition-${i + 1}`,
          text: variationTexts[0]?.text || textOverlaysWithContent[0].text,
          originalTextId: textOverlaysWithContent[0].id,
          isOriginal: false,
          editable: true,
          allTextOverlays: variationTexts,
        };
        
        generatedVariations.push(variation);
      }
      
      allVariations.push(...generatedVariations);

      console.log('Generated variations:', allVariations.map(v => ({ id: v.id, originalTextId: v.originalTextId, text: v.text, isOriginal: v.isOriginal })));
      
      setVariations(allVariations);
      
      // Store variations in localStorage for sharing with sidebar
      localStorage.setItem('generatedVariations', JSON.stringify(allVariations));
      
    } catch (err) {
      console.error('Error generating variations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSave(variations);
    onClose();
  };

  const handleRegenerateVariations = () => {
    generateVariations();
  };

  const handleEditVariation = (variation: VideoVariation) => {
    // Pass the variation data to the parent component for editing
    if (onSave) {
      // Pass this specific variation back to be edited
      onSave([variation]);
    }
    
    // Close the variations modal and go back to main editor
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col w-full h-full sm:w-auto sm:h-auto"
        style={{ 
          width: '95vw', 
          height: '95vh', 
          maxWidth: '1600px', 
          maxHeight: '95vh' 
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Video Variations</h2>
            <div className="text-xs sm:text-sm text-gray-500">
              Platform: {project.platformConfig.name} ({project.platformConfig.aspectRatio})
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button
              onClick={handleRegenerateVariations}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isGenerating || variations.length === 0}
              size="sm"
              className="text-xs"
            >
              <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </Button>
            
            <button
              onClick={onClose}
              className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          {error && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600">
                  ⚠️
                </div>
                <div>
                  <p className="text-yellow-800 text-sm font-medium mb-1">
                    Using Fallback Text Generation
                  </p>
                  <p className="text-yellow-700 text-xs">
                    {error.includes('OPENAI_API_KEY') 
                      ? 'OpenAI API key not configured. Add OPENAI_API_KEY to .env.local for AI-powered variations.'
                      : error
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600">Generating variations with AI...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-max pb-4">
                {variations.map((variation, index) => {
                  // Calculate exact video size - responsive sizing
                  const maxVideoWidth = 280;
                  const videoWidth = Math.min(project.platformConfig.width * 0.6, maxVideoWidth);
                  const videoHeight = (videoWidth * project.platformConfig.height) / project.platformConfig.width;
                  
                  console.log(`Rendering variation ${variation.id}:`, {
                    hasAllTextOverlays: !!variation.allTextOverlays,
                    allTextOverlaysCount: variation.allTextOverlays?.length || 0,
                    allTextOverlays: variation.allTextOverlays?.map(o => ({ id: o.id, text: o.text, timing: o.timing })) || []
                  });
                  
                  return (
                  <div key={variation.id} className="flex flex-col items-center space-y-3">
                    {/* Video Container - Fixed size matching platform */}
                    <div 
                      className="relative bg-black rounded-lg overflow-hidden"
                      style={{
                        width: `${videoWidth}px`,
                        height: `${videoHeight}px`
                      }}
                    >
                      <VideoPreview
                        variation={variation}
                        textOverlays={project.textOverlays}
                        videoTrackItems={project.videoTrackItems}
                        audioTrackItems={project.audioTrackItems}
                        allVariations={variations}
                        platformConfig={project.platformConfig}
                        containerWidth={videoWidth}
                        containerHeight={videoHeight}
                        duration={project.duration}
                      />
                    </div>
                    
                    {/* Video name and edit button */}
                    <div className="text-center space-y-2">
                      <span className="text-sm text-gray-700 font-medium">
                        {variation.isOriginal ? 'Original' : `Variation ${index}`}
                      </span>
                      <button
                        onClick={() => handleEditVariation(variation)}
                        className="flex items-center justify-center gap-1 mx-auto px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
                        title="Edit in main editor"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                  );
                })}
                
                {/* Show placeholders if not enough variations */}
                {Array.from({ length: Math.max(0, 6 - variations.length) }).map((_, index) => (
                  <div 
                    key={`placeholder-${index}`}
                    className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
                    style={{ height: '200px' }}
                  >
                    <p className="text-gray-500 text-sm">Generating...</p>
                  </div>
                ))}
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs sm:text-sm text-gray-600">
              {variations.length > 0 && (
                <span>
                  {variations.length} variations generated • Double-click text to edit
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              Powered by OpenAI GPT-4
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariationModal;