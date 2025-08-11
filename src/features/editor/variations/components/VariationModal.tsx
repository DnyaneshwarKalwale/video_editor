import React, { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw, Download } from 'lucide-react';
import { VariationModalProps, VideoVariation, TextOverlayData } from '../types/variation-types';
import VideoPreview from './VideoPreview';
import { AIVariationService } from '../services/openai-service';
import { RemotionRendererService } from '../services/remotion-renderer';
import { Button } from '@/components/ui/button';
import useStore from '../../store/use-store';
import VariationDownloadProgressModal from './VariationDownloadProgressModal';


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

  const loadVariationsFromSidebar = () => {
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

    // Load variations from localStorage for each element
    const elementVariations: { [elementId: string]: any[] } = {};
    
    timelineElements.forEach(element => {
      if (element) {
        const storageKey = `simple_variations_${element.id}`;
        const savedVariations = localStorage.getItem(storageKey);
        
        if (savedVariations) {
          try {
            const variations = JSON.parse(savedVariations);
            elementVariations[element.id] = variations.map((v: any) => ({
              ...v,
              elementId: element.id,
              originalValue: element.content // Store original value for mapping
            }));
          } catch (error) {
            console.error('Error parsing variations:', error);
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

    console.log('Element variations loaded:', elementVariations);

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

  useEffect(() => {
    if (isOpen) {
      loadVariationsFromSidebar();
    }
  }, [isOpen]);

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
      
      for (let i = 0; i < 9; i++) { // Generate 9 variations
        const variationTexts: TextOverlayData[] = [];
        
        console.log(`Generating variation ${i + 1} for ${textOverlaysWithContent.length} text overlays`);
        
        // Generate variation for each text overlay
        for (const textOverlay of textOverlaysWithContent) {
          console.log(`Processing text overlay ${textOverlay.id}: "${textOverlay.text}"`);
          
          const response = await openAIService.generateTextVariations({
            originalText: textOverlay.text,
            variationType: 'auto',
            count: 10
          });

          const textVariations = response.variations;

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



  const downloadVariation = async (variation: VideoVariation) => {
    console.log('Download button clicked for variation:', variation.id);
    setDownloadingVariationId(variation.id);
    setDownloadingVariation(variation);
    setDownloadProgress(0);
    setShowProgressModal(true);
    console.log('Progress modal state set to true');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev < 90) {
            return prev + 10;
          }
          return prev;
        });
      }, 1000);

      // Convert track items to the format expected by the render API
      // Use variation's allTextOverlays if available, otherwise fallback to trackItemsMap
      const textOverlays = variation.allTextOverlays && variation.allTextOverlays.length > 0 
        ? variation.allTextOverlays.map((overlay) => ({
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
        : Object.values(trackItemsMap)
            .filter((item: any) => item.type === 'text')
            .map((item: any) => ({
              id: item.id,
              text: item.details.text || '',
              position: {
                top: typeof item.details.top === 'string' ? parseFloat(item.details.top) || 50 : item.details.top || 50,
                left: typeof item.details.left === 'string' ? parseFloat(item.details.left) || 50 : item.details.left || 50,
              },
              style: {
                fontSize: item.details.fontSize || 48,
                fontFamily: item.details.fontFamily || 'Arial, sans-serif',
                color: item.details.color || 'white',
                backgroundColor: item.details.backgroundColor || 'transparent',
                textAlign: item.details.textAlign || 'center',
                fontWeight: item.details.fontWeight?.toString() || 'bold',
                opacity: item.details.opacity || 100,
                borderWidth: item.details.borderWidth,
                borderColor: item.details.borderColor,
                textDecoration: item.details.textDecoration,
              },
              timing: {
                from: item.display.from,
                to: item.display.to,
              },
              width: item.details.width,
              height: item.details.height,
            }));

      const videoTrackItems = Object.values(trackItemsMap)
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

      const audioTrackItems = Object.values(trackItemsMap)
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
      const imageTrackItems = Object.values(trackItemsMap)
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

      // Get canvas size from project data
      const canvasWidth = project.platformConfig.width || 1080;
      const canvasHeight = project.platformConfig.height || 1920;

      // Call the render API
      const response = await fetch('/api/render-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variation: variationData,
          textOverlays,
          platformConfig: {
            width: canvasWidth,
            height: canvasHeight,
            aspectRatio: `${canvasWidth}:${canvasHeight}`,
          },
          duration: project.duration || 5000,
          videoTrackItems,
          audioTrackItems,
          imageTrackItems,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remotion API error response:', errorText);
        throw new Error(`Failed to start video rendering: ${response.status} ${response.statusText}`);
      }

      const jobResponse = await response.json();
      const { jobId } = jobResponse;
      
      console.log('Video render job created:', jobId);

      // Poll for job completion
      let attempts = 0;
      const maxAttempts = 300; // 5 minutes with 1-second intervals
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
        
        // Update progress (estimate based on time)
        const estimatedProgress = Math.min(90, (attempts / maxAttempts) * 90);
        setDownloadProgress(estimatedProgress);
        
        // Check job status
        const statusResponse = await fetch(`/api/render-video?jobId=${jobId}`);
        
        if (!statusResponse.ok) {
          console.error('Failed to check job status:', statusResponse.status);
          continue;
        }
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          console.log('Video render completed, downloading...');
          setDownloadProgress(95);
          
          // Download the completed video
          const downloadResponse = await fetch(`/api/render-video?jobId=${jobId}`, {
            method: 'PUT'
          });
          
          if (!downloadResponse.ok) {
            throw new Error(`Failed to download video: ${downloadResponse.status}`);
          }
          
          // Get the video blob and download it
          const videoBlob = await downloadResponse.blob();
          
          // Check if the blob is valid
          if (videoBlob.size === 0) {
            throw new Error('Received empty video file from server');
          }
          
          console.log('Video blob received:', {
            size: videoBlob.size,
            type: videoBlob.type
          });
          
          const url = URL.createObjectURL(videoBlob);
          setDownloadUrl(url);
          
          // Create a download link
          const a = document.createElement('a');
          a.href = url;
          a.download = `variation-${variation.id}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Keep the modal open for a moment to show completion
          setTimeout(() => {
            setShowProgressModal(false);
            setDownloadUrl(null);
            setDownloadingVariation(null);
          }, 2000);
          
          return; // Success!
          
        } else if (statusData.status === 'failed') {
          throw new Error(`Video rendering failed: ${statusData.error || 'Unknown error'}`);
        }
        
        // Still processing, continue polling
        console.log(`Job status: ${statusData.status}, progress: ${statusData.progress}%`);
      }
      
      // If we get here, the job took too long
      throw new Error('Video rendering timed out after 5 minutes');

    } catch (error) {
      console.error('Error downloading variation:', error);
      alert('Failed to download variation. Please try again.');
      setShowProgressModal(false);
    } finally {
      setDownloadingVariationId(null);
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
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600">Generating variations with AI...</p>
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
                            onClick={() => downloadVariation(variation)}
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