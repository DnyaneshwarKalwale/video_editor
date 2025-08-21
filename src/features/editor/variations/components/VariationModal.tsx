import React, { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw, Download } from 'lucide-react';
import ScalezLoader from "@/components/ui/scalez-loader";
import { VariationModalProps, VideoVariation, TextOverlayData } from '../types/variation-types';
import VideoPreview from './VideoPreview';
import { AIVariationService } from '../services/openai-service';
import { RemotionRendererService } from '../services/remotion-renderer';
import { Button } from '@/components/ui/button';
import useStore from '../../store/use-store';
import VariationDownloadProgressModal from './VariationDownloadProgressModal';
import { useDownloadManager } from '../../store/use-download-manager';


const VariationModal: React.FC<VariationModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
}) => {
  const [variations, setVariations] = useState<VideoVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingVariationId, setDownloadingVariationId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [downloadingVariation, setDownloadingVariation] = useState<VideoVariation | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const openAIService = AIVariationService.getInstance();
  const { trackItemsMap, trackItemIds } = useStore();
  const { addDownload } = useDownloadManager();

  const loadVariationsFromSidebar = async () => {
    // Get all timeline elements
    const timelineElements = trackItemIds
      .map(id => {
        const item = trackItemsMap[id];
        if (!item) return null;
        return {
          id: item.id,
          type: item.type,
          content: item.type === 'text' ? item.details?.text : item.details?.src,
          variations: []
        };
      })
      .filter(Boolean);

    // Load variations from backend for each element
    const elementVariations: { [elementId: string]: any[] } = {};
    
    try {
      // Get project ID from URL
      const projectId = window.location.pathname.split('/')[2];
      
      // Load text variations
      const textResponse = await fetch(`/api/projects/${projectId}/text-variations`);
      const textData = textResponse.ok ? await textResponse.json() : { textVariations: [] };
      
      // Load media variations
      const mediaResponse = await fetch(`/api/projects/${projectId}/media-variations`);
      const mediaData = mediaResponse.ok ? await mediaResponse.json() : { mediaVariations: [] };
    
    timelineElements.forEach(element => {
      if (element) {
          if (element.type === 'text') {
            // Handle text variations
            const elementVariationData = textData.textVariations.find((v: any) => v.elementId === element.id);
            
            if (elementVariationData && elementVariationData.variations.length > 0) {
              // Create variations array with original + generated variations
              const variations = [
                {
                  id: 'original',
                  key: `${element.type.toUpperCase()}0`,
                  value: element.content,
                  type: element.type,
                  elementId: element.id,
                  originalValue: element.content
                },
                ...elementVariationData.variations.map((v: any, index: number) => ({
                  id: v.id,
                  key: `${element.type.toUpperCase()}${index + 1}`,
                  value: v.text,
                  type: element.type,
                  elementId: element.id,
                  originalValue: element.content
                }))
              ];
              elementVariations[element.id] = variations;
            } else {
              // If no variations found, use original
              elementVariations[element.id] = [{
                id: 'original',
                key: `${element.type.toUpperCase()}0`,
                value: element.content,
                type: element.type,
                elementId: element.id,
                originalValue: element.content
              }];
            }
          } else if (['video', 'image', 'audio'].includes(element.type)) {
            // Handle media variations
            const elementVariationData = mediaData.mediaVariations.find((v: any) => v.elementId === element.id);
            
            if (elementVariationData && elementVariationData.variations.length > 0) {
              // Create variations array with original + uploaded variations
              const variations = [
                {
                  id: 'original',
                  key: `${element.type.toUpperCase()}0`,
                  value: element.content,
                  type: element.type,
                  elementId: element.id,
                  originalValue: element.content
                },
                ...elementVariationData.variations.map((v: any, index: number) => ({
                  id: v.id,
                  key: `${element.type.toUpperCase()}${index + 1}`,
                  value: v.videoUrl, // Use the uploaded URL
                  type: element.type,
              elementId: element.id,
                  originalValue: element.content,
                  metadata: v.metadata
                }))
              ];
              elementVariations[element.id] = variations;
            } else {
            // If no variations found, use original
              elementVariations[element.id] = [{
                id: 'original',
                key: `${element.type.toUpperCase()}0`,
                value: element.content,
                type: element.type,
                elementId: element.id,
                originalValue: element.content
              }];
            }
          } else {
            // For other types, use original
            elementVariations[element.id] = [{
              id: 'original',
              key: `${element.type.toUpperCase()}0`,
              value: element.content,
              type: element.type,
              elementId: element.id,
              originalValue: element.content
            }];
          }
        }
      });
    } catch (error) {
      console.error('Error loading variations from backend:', error);
      // Fallback to original values
      timelineElements.forEach(element => {
        if (element) {
          elementVariations[element.id] = [{
            id: 'original',
            key: `${element.type.toUpperCase()}0`,
            value: element.content,
            type: element.type,
            elementId: element.id,
            originalValue: element.content
          }];
        }
      });
      }

    console.log('Element variations loaded from backend:', elementVariations);

    // Generate all combinations
    const allVideoCombinations: VideoVariation[] = [];
    
    if (Object.keys(elementVariations).length === 0) {
      // No elements, create original video
      const originalVariation: VideoVariation = {
        id: 'original-composition',
        text: 'Original Video',
        originalTextId: 'original',
        isOriginal: true,
        editable: false,
        allTextOverlays: []
      };
      allVideoCombinations.push(originalVariation);
    } else {
      // Generate all possible combinations
      const elementIds = Object.keys(elementVariations);
      const variationArrays = elementIds.map(id => elementVariations[id]);
      
      function generateCombinations(arrays: any[][], current: any[] = [], index = 0): any[][] {
        if (index === arrays.length) {
          return [current];
        }
        
        const results: any[][] = [];
        for (const item of arrays[index]) {
          results.push(...generateCombinations(arrays, [...current, item], index + 1));
        }
        return results;
      }
      
      const combinations = generateCombinations(variationArrays);
      
      console.log(`Generated ${combinations.length} total combinations`);
      
      combinations.forEach((combination, index) => {
        // Build video data for this combination
        const textElements = combination.filter(item => item.type === 'text');
        const videoElements = combination.filter(item => item.type === 'video');
        const imageElements = combination.filter(item => item.type === 'image');
        const audioElements = combination.filter(item => item.type === 'audio');
        
        // Create unique title for this combination
        const combinationParts = combination.map(item => item.key).join(' + ');
        const title = `Video ${index + 1} (${combinationParts})`;
        
        // Create text overlays with proper structure for this combination
        const textOverlaysForCombination: TextOverlayData[] = textElements.map((textItem) => {
          // Find the original trackItem to get the correct ID and positioning
          const originalTrackItem = Object.values(trackItemsMap).find((item: any) => 
            item.type === 'text' && item.id === textItem.elementId
          ) as any;
          
          if (originalTrackItem) {
            return {
              id: originalTrackItem.id, // Use the actual track item ID
              text: textItem.value, // Use the variation text
              position: {
                top: typeof originalTrackItem.details.top === 'string' ? parseFloat(originalTrackItem.details.top) || 50 : originalTrackItem.details.top || 50,
                left: typeof originalTrackItem.details.left === 'string' ? parseFloat(originalTrackItem.details.left) || 50 : originalTrackItem.details.left || 50,
              },
              style: {
                fontSize: originalTrackItem.details.fontSize || 48,
                fontFamily: originalTrackItem.details.fontFamily || 'Arial, sans-serif',
                color: originalTrackItem.details.color || 'white',
                backgroundColor: originalTrackItem.details.backgroundColor || 'transparent',
                textAlign: originalTrackItem.details.textAlign || 'center',
                fontWeight: originalTrackItem.details.fontWeight || 'bold',
                opacity: originalTrackItem.details.opacity || 100,
                borderWidth: originalTrackItem.details.borderWidth,
                borderColor: originalTrackItem.details.borderColor,
                textDecoration: originalTrackItem.details.textDecoration,
              },
              timing: {
                from: originalTrackItem.display.from,
                to: originalTrackItem.display.to,
              },
              width: originalTrackItem.details.width,
              height: originalTrackItem.details.height,
            };
          } else {
            // Fallback if trackItem not found
            return {
              id: textItem.elementId,
              text: textItem.value,
              position: { top: 50, left: 50 },
              style: {
                fontSize: 48,
                fontFamily: 'Arial, sans-serif',
                color: 'white',
                backgroundColor: 'transparent',
                textAlign: 'center' as const,
                opacity: 100
              },
              timing: { from: 0, to: 5000 },
              width: 600,
              height: 100,
            };
          }
        });
        
        const videoVariation: VideoVariation = {
          id: `combination-${index}`,
          text: title,
          originalTextId: textElements[0]?.elementId || 'original',
          isOriginal: index === 0, // First combination is considered "original"
          editable: false,
          allTextOverlays: textOverlaysForCombination,
          // Store video/media variations for potential use
          metadata: {
            videoElements,
            imageElements,
            audioElements,
            combination
          }
        };
        
        allVideoCombinations.push(videoVariation);
      });
    }

    console.log(`Setting ${allVideoCombinations.length} video combinations`);
    console.log('Video combinations preview:', allVideoCombinations.map(v => ({
      id: v.id,
      text: v.text,
      allTextOverlaysCount: v.allTextOverlays?.length || 0,
      textContents: v.allTextOverlays?.map(o => o.text) || []
    })));
    setVariations(allVideoCombinations);
  };

  // Load variations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadVariationsFromSidebar();
    }
  }, [isOpen]);

  const generateVariations = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Get project ID from URL
      const projectId = window.location.pathname.split('/')[2];
      
      // Load variations from backend first
      const response = await fetch(`/api/projects/${projectId}/text-variations`);
      let backendVariations: any[] = [];
      
      if (response.ok) {
        const data = await response.json();
        backendVariations = data.textVariations || [];
      }

      // Get current timeline elements
      const currentState = useStore.getState();
      const timelineElements = Object.values(currentState.trackItemsMap)
        .map((item: any) => {
          if (item.type === 'text') {
            return {
              id: item.id,
              type: item.type,
              content: item.details?.text,
              variations: []
            };
          }
          return null;
        })
        .filter(Boolean);

      // Create element variations from backend data
      const elementVariations: { [elementId: string]: any[] } = {};
      
      timelineElements.forEach(element => {
        if (element) {
          const elementVariationData = backendVariations.find((v: any) => v.elementId === element.id);
          
          if (elementVariationData && elementVariationData.variations.length > 0) {
            // Create variations array with original + generated variations
            const variations = [
              {
                id: 'original',
                key: `${element.type.toUpperCase()}0`,
                value: element.content,
                type: element.type,
                elementId: element.id,
                originalValue: element.content
              },
              ...elementVariationData.variations.map((v: any, index: number) => ({
                id: v.id,
                key: `${element.type.toUpperCase()}${index + 1}`,
                value: v.text,
                type: element.type,
                elementId: element.id,
                originalValue: element.content
              }))
            ];
            elementVariations[element.id] = variations;
          } else {
            // If no variations found, use original
            elementVariations[element.id] = [{
              id: 'original',
              key: `${element.type.toUpperCase()}0`,
              value: element.content,
              type: element.type,
              elementId: element.id,
              originalValue: element.content
            }];
          }
        }
      });

      console.log('Element variations loaded from backend:', elementVariations);
      
      // Generate all combinations
      const allVideoCombinations: VideoVariation[] = [];
      
      if (Object.keys(elementVariations).length === 0) {
        // No elements, create original video
      const originalVariation: VideoVariation = {
        id: 'original-composition',
          text: 'Original Video',
          originalTextId: 'original',
        isOriginal: true,
        editable: false,
          allTextOverlays: []
        };
        allVideoCombinations.push(originalVariation);
      } else {
        // Generate all possible combinations
        const elementIds = Object.keys(elementVariations);
        const variationArrays = elementIds.map(id => elementVariations[id]);
        
        function generateCombinations(arrays: any[][], current: any[] = [], index = 0): any[][] {
          if (index === arrays.length) {
            return [current];
          }
          
          const results: any[][] = [];
          for (const item of arrays[index]) {
            results.push(...generateCombinations(arrays, [...current, item], index + 1));
          }
          return results;
        }
        
        const combinations = generateCombinations(variationArrays);
        
        console.log(`Generated ${combinations.length} total combinations`);
        
        combinations.forEach((combination, index) => {
          // Build video data for this combination
          const textElements = combination.filter(item => item.type === 'text');
          const videoElements = combination.filter(item => item.type === 'video');
          const imageElements = combination.filter(item => item.type === 'image');
          const audioElements = combination.filter(item => item.type === 'audio');
          
          // Create unique title for this combination
          const combinationParts = combination.map(item => item.key).join(' + ');
          const title = `Video ${index + 1} (${combinationParts})`;
          
          // Create text overlays with proper structure for this combination
          const textOverlaysForCombination: TextOverlayData[] = textElements.map((textItem) => {
            // Find the original trackItem to get the correct ID and positioning
            const originalTrackItem = Object.values(trackItemsMap).find((item: any) => 
              item.type === 'text' && item.id === textItem.elementId
            ) as any;
            
            if (originalTrackItem) {
              return {
                id: originalTrackItem.id, // Use the actual track item ID
                text: textItem.value, // Use the variation text
                position: {
                  top: typeof originalTrackItem.details.top === 'string' ? parseFloat(originalTrackItem.details.top) || 50 : originalTrackItem.details.top || 50,
                  left: typeof originalTrackItem.details.left === 'string' ? parseFloat(originalTrackItem.details.left) || 50 : originalTrackItem.details.left || 50,
                },
                style: {
                  fontSize: originalTrackItem.details.fontSize || 48,
                  fontFamily: originalTrackItem.details.fontFamily || 'Arial, sans-serif',
                  color: originalTrackItem.details.color || 'white',
                  backgroundColor: originalTrackItem.details.backgroundColor || 'transparent',
                  textAlign: originalTrackItem.details.textAlign || 'center',
                  fontWeight: originalTrackItem.details.fontWeight || 'bold',
                  opacity: originalTrackItem.details.opacity || 100,
                  borderWidth: originalTrackItem.details.borderWidth,
                  borderColor: originalTrackItem.details.borderColor,
                  textDecoration: originalTrackItem.details.textDecoration,
                },
                timing: {
                  from: originalTrackItem.display.from,
                  to: originalTrackItem.display.to,
                },
                width: originalTrackItem.details.width,
                height: originalTrackItem.details.height,
              };
            } else {
              // Fallback if trackItem not found
              return {
                id: textItem.elementId,
                text: textItem.value,
                position: { top: 50, left: 50 },
                style: {
                  fontSize: 48,
                  fontFamily: 'Arial, sans-serif',
                  color: 'white',
                  backgroundColor: 'transparent',
                  textAlign: 'center' as const,
                  opacity: 100
                },
                timing: { from: 0, to: 5000 },
                width: 600,
                height: 100,
              };
            }
          });
          
          const videoVariation: VideoVariation = {
            id: `combination-${index}`,
            text: title,
            originalTextId: textElements[0]?.elementId || 'original',
            isOriginal: index === 0, // First combination is considered "original"
            editable: false,
            allTextOverlays: textOverlaysForCombination,
            // Store video/media variations for potential use
            metadata: {
              videoElements,
              imageElements,
              audioElements,
              combination
            }
          };
          
          allVideoCombinations.push(videoVariation);
        });
      }

      console.log(`Setting ${allVideoCombinations.length} video combinations`);
      console.log('Video combinations preview:', allVideoCombinations.map(v => ({
        id: v.id,
        text: v.text,
        allTextOverlaysCount: v.allTextOverlays?.length || 0,
        textContents: v.allTextOverlays?.map(o => o.text) || []
      })));
      setVariations(allVideoCombinations);
      
    } catch (err) {
      console.error('Error generating variations:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateVariations = () => {
    generateVariations();
  };

  const handleDownload = async (variation: any) => {
    try {
      setDownloadingVariation(variation.id);
      setShowProgressModal(true);

      // Get scene data from the store
      const storeState = useStore.getState();
      const canvasWidth = storeState.size.width;
      const canvasHeight = storeState.size.height;

      // Convert track items to the format expected by the render API
      // Use variation's allTextOverlays if available, otherwise fallback to trackItemsMap
      const textOverlays = variation.allTextOverlays && variation.allTextOverlays.length > 0 
        ? variation.allTextOverlays.map((overlay: any) => ({
            id: overlay.id,
            text: overlay.text, // Use the actual variation text
            position: {
              top: overlay.position.top,
              left: overlay.position.left,
            },
            style: {
              fontSize: overlay.style.fontSize,
              fontFamily: overlay.style.fontFamily,
              color: overlay.style.color,
              backgroundColor: overlay.style.backgroundColor,
              textAlign: overlay.style.textAlign,
              fontWeight: overlay.style.fontWeight?.toString() || 'bold',
              opacity: overlay.style.opacity,
              borderWidth: overlay.style.borderWidth,
              borderColor: overlay.style.borderColor,
              textDecoration: overlay.style.textDecoration,
            },
            timing: {
              from: overlay.timing.from,
              to: overlay.timing.to,
            },
            width: overlay.width,
            height: overlay.height,
          }))
        : [];

      // Handle video track items with variations
      const videoTrackItems = Object.values(storeState.trackItemsMap)
        .filter((item: any) => item.type === 'video')
        .map((item: any) => {
          // Check if this video has a variation in the combination
          let videoSrc = item.details.src;
          if (variation.metadata?.combination) {
            const videoVariation = variation.metadata.combination.find((combo: any) => 
              combo.type === 'video' && combo.elementId === item.id
            );
            if (videoVariation) {
              videoSrc = videoVariation.value; // Use the variation video URL
              console.log(`Applying video variation: ${videoSrc} for element ${item.id}`);
            }
          }
          
          return {
            id: item.id,
            src: videoSrc,
            display: {
              from: item.display.from,
              to: item.display.to,
            },
            details: {
              ...item.details,
              src: videoSrc, // Apply variation here too
              left: typeof item.details.left === 'string' ? parseFloat(item.details.left) || 0 : item.details.left || 0,
              top: typeof item.details.top === 'string' ? parseFloat(item.details.top) || 0 : item.details.top || 0,
              width: item.details.width || 200,
              height: item.details.height || 200,
            },
            trim: item.trim,
            playbackRate: item.playbackRate || 1,
            volume: item.details.volume || 0,
            crop: item.details.crop,
          };
        });

      const audioTrackItems = Object.values(storeState.trackItemsMap)
        .filter((item: any) => item.type === 'audio')
        .map((item: any) => {
          // Check if this audio has a variation in the combination
          let audioSrc = item.details.src;
          if (variation.metadata?.combination) {
            const audioVariation = variation.metadata.combination.find((combo: any) => 
              combo.type === 'audio' && combo.elementId === item.id
            );
            if (audioVariation) {
              audioSrc = audioVariation.value; // Use the variation audio URL
              console.log(`Applying audio variation: ${audioSrc} for element ${item.id}`);
            }
          }
          
          return {
            id: item.id,
            src: audioSrc,
            display: {
              from: item.display.from,
              to: item.display.to,
            },
            details: {
              ...item.details,
              src: audioSrc, // Apply variation here too
              volume: item.details.volume || 0,
            },
          };
        });

      // Handle image track items with variations
      const imageTrackItems = Object.values(storeState.trackItemsMap)
        .filter((item: any) => item.type === 'image')
        .map((item: any) => {
          // Check if this image has a variation in the combination
          let imageSrc = item.details.src;
          if (variation.metadata?.combination) {
            const imageVariation = variation.metadata.combination.find((combo: any) => 
              combo.type === 'image' && combo.elementId === item.id
            );
            if (imageVariation) {
              imageSrc = imageVariation.value; // Use the variation image URL
              console.log(`Applying image variation: ${imageSrc} for element ${item.id}`);
            }
          }
          
          return {
            id: item.id,
            src: imageSrc,
            display: {
              from: item.display.from,
              to: item.display.to,
            },
            details: {
              ...item.details,
              src: imageSrc, // Apply variation here too
              left: typeof item.details.left === 'string' ? parseFloat(item.details.left) || 0 : item.details.left || 0,
              top: typeof item.details.top === 'string' ? parseFloat(item.details.top) || 0 : item.details.top || 0,
              width: item.details.width || 200,
              height: item.details.height || 200,
            },
          };
        });

      // Create variation data for this specific variation
      const variationData = {
        id: variation.id,
        text: variation.text,
        originalTextId: variation.originalTextId,
        isOriginal: variation.isOriginal,
        editable: false,
      };

      // Prepare variation data
      const downloadData = {
        variation: variationData,
        textOverlays,
        platformConfig: {
          width: canvasWidth,
          height: canvasHeight,
          aspectRatio: `${canvasWidth}:${canvasHeight}`,
        },
        duration: storeState.duration || 5000,
        videoTrackItems,
        audioTrackItems,
        imageTrackItems,
      };

      // Add to download manager
      const downloadId = addDownload(
        `variation-${variation.id}.mp4`,
        'variation',
        downloadData
      );

      console.log('Variation added to download queue:', downloadId);
      
      // Close progress modal after a short delay
      setTimeout(() => {
        setShowProgressModal(false);
        setDownloadingVariation(null);
      }, 2000);

    } catch (error) {
      console.error('Error adding variation to download queue:', error);
      setShowProgressModal(false);
      setDownloadingVariation(null);
    }
  };

  const handleDownloadAll = async () => {
    try {
      // Add all variations to download queue
      for (const variation of variations) {
        await handleDownload(variation);
        // Small delay between adding each variation
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error adding all variations to download queue:', error);
    }
  };

  const handleDownloadAgain = () => {
    if (downloadUrl && downloadingVariation) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `variation-${downloadingVariation.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSave = () => {
    onSave(variations);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
        <div 
          className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col w-full h-full sm:w-auto sm:h-auto max-w-7xl max-h-[90vh]"
          style={{ 
            width: '95vw', 
            height: '95vh', 
            maxWidth: '1600px', 
            maxHeight: '95vh' 
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Video Variations</h2>
              <div className="text-xs sm:text-sm text-gray-500">
                Platform: {project.platformConfig.name} ({project.platformConfig.aspectRatio})
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Button
                onClick={handleDownloadAll}
                disabled={isGenerating || variations.length === 0}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Download All</span>
              </Button>
              
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
              
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ScalezLoader />
                  <p className="text-gray-600 mt-4">Generating variations with AI...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-10 auto-rows-max pb-6 px-4 sm:px-6">
                  {variations.map((variation, index) => {
                    // Calculate exact video size - responsive sizing
                    const maxVideoWidth = window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 240 : 280;
                    const videoWidth = Math.min(project.platformConfig.width * 0.6, maxVideoWidth);
                    const videoHeight = (videoWidth * project.platformConfig.height) / project.platformConfig.width;
                    
                    console.log(`Rendering variation ${variation.id}:`, {
                      hasAllTextOverlays: !!variation.allTextOverlays,
                      allTextOverlaysCount: variation.allTextOverlays?.length || 0,
                      allTextOverlays: variation.allTextOverlays?.map(o => ({ id: o.id, text: o.text, timing: o.timing })) || []
                    });
                    
                    return (
                    <div key={variation.id} className="flex flex-col items-center space-y-3 w-full max-w-full p-2">
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
                      
                      {/* Video name and buttons */}
                      <div className="text-center space-y-2">
                        <span className="text-sm text-gray-700 font-medium">
                          {variation.isOriginal ? 'Original' : `Variation ${index}`}
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDownload(variation)}
                            disabled={downloadingVariationId === variation.id}
                            className="flex items-center justify-center gap-1 px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download variation video"
                          >
                            {downloadingVariationId === variation.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            Download
                          </button>
                        </div>
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
          <div className="border-t border-gray-200 p-3 sm:p-4 md:p-6 bg-gray-50 flex-shrink-0">
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

      {/* Progress Modal - Rendered outside main modal */}
      {showProgressModal && downloadingVariation && (
        <>
          {console.log('Rendering progress modal:', { showProgressModal, downloadingVariation: !!downloadingVariation, progress: downloadProgress })}
          <VariationDownloadProgressModal
            isOpen={showProgressModal}
            onClose={() => setShowProgressModal(false)}
            progress={downloadProgress}
            variationName={downloadingVariation.isOriginal ? 'Original' : `Variation ${downloadingVariation.id}`}
            isCompleted={downloadProgress === 100}
            downloadUrl={downloadUrl || undefined}
            onDownload={handleDownloadAgain}
          />
        </>
      )}
    </>
  );
};

export default VariationModal;