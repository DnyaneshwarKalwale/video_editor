import React, { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw, Download, Settings } from 'lucide-react';
import ScalezLoader from "@/components/ui/scalez-loader";
import { VariationModalProps, VideoVariation, TextOverlayData } from '../types/variation-types';
import VideoPreview from './VideoPreview';
import { AIVariationService } from '../services/openai-service';
import { RemotionRendererService } from '../services/remotion-renderer';
import { Button } from '@/components/ui/button';
import useStore from '../../store/use-store';
import VariationDownloadProgressModal from './VariationDownloadProgressModal';
import { useDownloadManager } from '../../store/use-download-manager';
import { useProgressBarStore } from '../../store/use-progress-bar-store';
import { generateVariationFileName, generateTemplateBasedFileName } from '@/utils/variation-naming';
import EditableFilename from './EditableFilename';
import SimpleNamingSelector from '@/components/naming/SimpleNamingSelector';
import TemplateBuilder from '@/components/naming/TemplateBuilder';


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
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [showNamingSettings, setShowNamingSettings] = useState(false);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [namingPattern, setNamingPattern] = useState<any>(null);
  const [namingTemplate, setNamingTemplate] = useState<any>(null);
  const [useTemplateSystem, setUseTemplateSystem] = useState(true); // Toggle between old and new system - default to template system
  const [projectName, setProjectName] = useState<string>('Untitled Project');

  // Helper function to check if a string looks like a project ID
  const isProjectId = (str: string): boolean => {
    return str.includes('-') && str.length > 15 && /^[a-zA-Z0-9-]+$/.test(str);
  };

  const openAIService = AIVariationService.getInstance();
  const { trackItemsMap, trackItemIds } = useStore();
  const { addDownload, setOpen } = useDownloadManager();
  const { settings: progressBarSettings, loadSettings: loadProgressBarSettings } = useProgressBarStore();
  
  // Load progress bar settings on mount
  useEffect(() => {
    loadProgressBarSettings();
  }, [loadProgressBarSettings]);

  // Load naming pattern when modal opens
  const loadNamingPattern = async () => {
    try {
      const projectId = window.location.pathname.split('/')[2];
      const response = await fetch(`/api/projects/${projectId}/naming-pattern`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNamingPattern(data.pattern);
      }
    } catch (error) {
      console.error('Error loading naming pattern:', error);
    }
  };

  // Load naming template when modal opens
  const loadNamingTemplate = async () => {
    try {
      const projectId = window.location.pathname.split('/')[2];
      const response = await fetch(`/api/projects/${projectId}/naming-template`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNamingTemplate(data.template);
      }
    } catch (error) {
      console.error('Error loading naming template:', error);
    }
  };

  // Load project name - wait for actual name, no fallbacks
  const loadProjectName = async () => {
    try {
      const projectId = window.location.pathname.split('/')[2];
      console.log('Loading project name for project ID:', projectId);

      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Project data received:', data);

        // Extract project name from the data
        let actualProjectName = null;

        // Check if data has a project property (API response format)
        if (data && data.project && typeof data.project === 'object') {
          actualProjectName = data.project.name;
        }
        // If it's an array, get the first item's name
        else if (Array.isArray(data) && data.length > 0) {
          actualProjectName = data[0].name;
        } 
        // If it's a direct object with name property
        else if (data && typeof data === 'object') {
          actualProjectName = data.name;
        }

        console.log('Project name extraction debug:', {
          isArray: Array.isArray(data),
          dataLength: Array.isArray(data) ? data.length : 'N/A',
          hasProject: !!(data && data.project),
          projectName: data?.project?.name,
          firstItemName: Array.isArray(data) && data.length > 0 ? data[0].name : 'N/A',
          dataName: data?.name,
          extractedName: actualProjectName,
          fullData: data
        });

        if (actualProjectName) {
          console.log('Successfully loaded project name:', actualProjectName);
          setProjectName(actualProjectName);
          // Trigger variation name update after project name is loaded
          setTimeout(() => {
            if (variations.length > 0) {
              console.log('Triggering variation name update after project name loaded');
              updateVariationNames();
            }
          }, 100);
        } else {
          console.log('No project name found in data, retrying...');
          // Retry after a short delay
          setTimeout(() => loadProjectName(), 1000);
        }
      } else {
        console.log('Failed to load project data, retrying...');
        // Retry after a short delay
        setTimeout(() => loadProjectName(), 1000);
      }
    } catch (error) {
      console.error('Error loading project name:', error);
      // Retry after a short delay
      setTimeout(() => loadProjectName(), 1000);
    }
  };

  // Update variation names when naming pattern changes
  const updateVariationNames = async () => {
    if (variations.length === 0) return;

    // Use project name or fallback to ensure names are always generated
    const effectiveProjectName = projectName && projectName !== 'Untitled Project' ? projectName : 'Project';

    const updatedVariations = await Promise.all(
      variations.map(async (variation) => {
        if (customNames[variation.id]) {
          return variation; // Keep custom names as is
        }

        // Generate new name with current naming system
        const variationNamingData = {
          variation: {
            id: variation.id,
            isOriginal: variation.isOriginal
          },
          videoTrackItems: project.videoTrackItems,
          audioTrackItems: project.audioTrackItems,
          textOverlays: variation.allTextOverlays || [], // Always use variation's specific text overlays
          metadata: variation.metadata
        };

        try {
        // Always use template-based system
        const filename = await generateTemplateBasedFileName(variationNamingData, effectiveProjectName);

          // Remove .mp4 extension for display
          const variationPart = filename.replace('.mp4', '');

          return {
            ...variation,
            text: variationPart // Update the display name
          };
        } catch (error) {
          console.error(`Error generating name for ${variation.id}:`, error);
          return variation; // Keep existing name if generation fails
        }
      })
    );
    setVariations(updatedVariations);
  };

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

    // Create font elements from text elements
    const textElements = timelineElements.filter(el => el.type === 'text');
    const fontElements = textElements.map(textEl => ({
      id: `font-${textEl.id}`,
      type: 'font' as const,
      content: 'Arial, sans-serif', // Default font
      variations: []
    }));

    // Create speed elements (global for the entire project)
    const speedElements = [{
      id: 'speed-global',
      type: 'speed' as const,
      content: '1.0x',
      variations: []
    }];

    // Combine all elements
    const allElements = [...timelineElements, ...fontElements, ...speedElements];
    console.log(`🔍 All elements for combination generation:`, allElements.map(el => ({ id: el.id, type: el.type, name: (el as any).name || el.content })));

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
      
      // Load font variations
      const fontResponse = await fetch(`/api/projects/${projectId}/font-variations`);
      const fontData = fontResponse.ok ? await fontResponse.json() : { fontVariations: [] };
      
      // Load speed variations
      const speedResponse = await fetch(`/api/projects/${projectId}/speed-variations`);
      const speedData = speedResponse.ok ? await speedResponse.json() : { speedVariations: [] };
      console.log(`🔍 Loaded speed variations:`, speedData);
    
    allElements.forEach(element => {
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
                  originalValue: element.content,
                  variationIndex: index + 1
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
                  metadata: v.metadata,
                  variationIndex: index + 1
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
          } else if (element.type === 'font') {
            // Handle font variations - map back to original text element ID
            const originalTextElementId = element.id.startsWith('font-') 
              ? element.id.replace('font-', '') 
              : element.id;
            const elementVariationData = fontData.fontVariations.find((v: any) => v.elementId === originalTextElementId);
            
            if (elementVariationData && elementVariationData.variations.length > 0) {
              // Create variations array with original + font variations
              const variations = [
                {
                  id: 'original',
                  key: `${element.type.toUpperCase()}0`,
                  value: element.content,
                  type: element.type,
                  elementId: element.id,
                  originalValue: element.content,
                  metadata: {
                    fontFamily: elementVariationData.originalFont || 'Arial, sans-serif',
                    fontSize: 48,
                    fontWeight: 'bold',
                    color: '#ffffff',
                    textAlign: 'center',
                    opacity: 100,
                    fontStyle: 'normal',
                    textDecoration: 'none',
                    lineHeight: 1.2,
                    letterSpacing: 'normal',
                    textShadow: 'none'
                  }
                },
                ...elementVariationData.variations.map((v: any, index: number) => ({
                  id: v.id,
                  key: `${element.type.toUpperCase()}${index + 1}`,
                  value: v.content,
                  type: element.type,
                  elementId: element.id,
                  originalValue: element.content,
                  metadata: v.metadata,
                  variationIndex: index + 1
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
          } else if (element.type === 'speed') {
            // Handle speed variations
            console.log(`🔍 Processing speed element: ${element.id}`);
            const elementVariationData = speedData.speedVariations.find((v: any) => v.elementId === element.id);
            console.log(`🔍 Found speed variation data for ${element.id}:`, elementVariationData);
            
            if (elementVariationData && elementVariationData.variations.length > 0) {
              // Create variations array with original + speed variations
              const variations = [
                {
                  id: 'original',
                  key: `${element.type.toUpperCase()}0`,
                  value: element.content,
                  type: element.type,
                  elementId: element.id,
                  originalValue: element.content,
                  metadata: {
                    speed: elementVariationData.originalSpeed || 1.0,
                    label: 'Original Speed',
                    duration: 0,
                    description: 'Original video speed'
                  }
                },
                ...elementVariationData.variations.map((v: any, index: number) => ({
                  id: v.id,
                  key: `${element.type.toUpperCase()}${index + 1}`,
                  value: v.content,
                  type: element.type,
                  elementId: element.id,
                  originalValue: element.content,
                  metadata: v.metadata,
                  variationIndex: index + 1
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
                originalValue: element.content,
                metadata: {
                  speed: 1.0,
                  label: 'Original Speed',
                  duration: 0,
                  description: 'Original video speed'
                }
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
      allElements.forEach(element => {
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

    console.log('🔍 Element variations loaded from backend:', elementVariations);
    console.log('🔍 Element IDs with variations:', Object.keys(elementVariations));
    Object.keys(elementVariations).forEach(elementId => {
      const variations = elementVariations[elementId];
      console.log(`🔍 Element ${elementId} (${variations[0]?.type}): ${variations.length} variations`);
      variations.forEach((variation: any, index: number) => {
        console.log(`  - ${index}: ${variation.key} = ${variation.value?.substring(0, 50)}...`);
      });
    });

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
      
      console.log('🔍 Element IDs for combinations:', elementIds);
      console.log('🔍 Variation arrays for combinations:', variationArrays.map((arr, i) => 
        `${elementIds[i]} (${arr[0]?.type}): ${arr.length} variations`
      ));
      
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
      
      console.log(`🔍 Generated ${combinations.length} total combinations`);
      console.log('🔍 First few combinations:', combinations.slice(0, 5).map((combo, i) => 
        `${i + 1}: ${combo.map(item => `${item.type}:${item.key}`).join(' + ')}`
      ));
      
      combinations.forEach((combination, index) => {
        // Build video data for this combination
        const textElements = combination.filter(item => item.type === 'text');
        const videoElements = combination.filter(item => item.type === 'video');
        const imageElements = combination.filter(item => item.type === 'image');
        const audioElements = combination.filter(item => item.type === 'audio');
        const fontElements = combination.filter(item => item.type === 'font');
        const speedElements = combination.filter(item => item.type === 'speed');
        
        // Debug logging for font elements
        console.log(`🔍 Combination ${index + 1} font elements:`, fontElements.map(f => ({ 
          elementId: f.elementId, 
          key: f.key, 
          value: f.value,
          metadata: f.metadata 
        })));
        
        // Use empty title - proper naming will be handled by updateVariationNames
        let title = '';
        
        // Create text overlays with proper structure for this combination
        const textOverlaysForCombination: TextOverlayData[] = textElements.map((textItem) => {
          // Find the original trackItem to get the correct ID and positioning
          const originalTrackItem = Object.values(trackItemsMap).find((item: any) => 
            item.type === 'text' && item.id === textItem.elementId
          ) as any;
          
          // Find font variation for this text element if available
          const fontVariation = fontElements.find(fontItem => 
            fontItem.elementId === `font-${textItem.elementId}`
          );
          
          // Debug logging
          console.log(`🔍 Looking for font variation for text element ${textItem.elementId}`);
          console.log(`🔍 Available font elements:`, fontElements.map(f => ({ elementId: f.elementId, key: f.key })));
          console.log(`🔍 Found font variation:`, fontVariation ? { elementId: fontVariation.elementId, metadata: fontVariation.metadata } : 'None');
          
          if (originalTrackItem) {
            // Apply font variation if available
            const baseStyle = {
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
            };

            // Override with font variation if available
            if (fontVariation && fontVariation.metadata) {
              console.log(`🔍 Applying font variation metadata:`, fontVariation.metadata);
              baseStyle.fontFamily = fontVariation.metadata.fontFamily || baseStyle.fontFamily;
              baseStyle.fontSize = fontVariation.metadata.fontSize || baseStyle.fontSize;
              baseStyle.fontWeight = fontVariation.metadata.fontWeight || baseStyle.fontWeight;
              baseStyle.color = fontVariation.metadata.color || baseStyle.color;
              baseStyle.textAlign = fontVariation.metadata.textAlign || baseStyle.textAlign;
              baseStyle.opacity = fontVariation.metadata.opacity || baseStyle.opacity;
              
              // Add custom font information if it's a custom font
              if (fontVariation.metadata.isCustomFont && fontVariation.metadata.customFontUrl) {
                (baseStyle as any).isCustomFont = true;
                (baseStyle as any).customFontUrl = fontVariation.metadata.customFontUrl;
                (baseStyle as any).customFontData = fontVariation.metadata.customFontData;
              }
              
              console.log(`🔍 Final baseStyle after font variation:`, baseStyle);
            } else {
              console.log(`🔍 No font variation metadata found for text element ${textItem.elementId}`);
            }

            return {
              id: originalTrackItem.id, // Use the actual track item ID
              text: textItem.value, // Use the variation text
              position: {
                top: typeof originalTrackItem.details.top === 'string' ? parseFloat(originalTrackItem.details.top) || 50 : originalTrackItem.details.top || 50,
                left: typeof originalTrackItem.details.left === 'string' ? parseFloat(originalTrackItem.details.left) || 50 : originalTrackItem.details.left || 50,
              },
              style: baseStyle,
              timing: {
                from: originalTrackItem.display.from,
                to: originalTrackItem.display.to,
              },
              width: originalTrackItem.details.width,
              height: originalTrackItem.details.height,
            };
          } else {
            // Fallback if trackItem not found
            const fallbackStyle = {
              fontSize: 48,
              fontFamily: 'Arial, sans-serif',
              color: 'white',
              backgroundColor: 'transparent',
              textAlign: 'center' as const,
              fontWeight: 'bold',
              opacity: 100
            };

            // Apply font variation to fallback if available
            if (fontVariation && fontVariation.metadata) {
              fallbackStyle.fontFamily = fontVariation.metadata.fontFamily || fallbackStyle.fontFamily;
              fallbackStyle.fontSize = fontVariation.metadata.fontSize || fallbackStyle.fontSize;
              fallbackStyle.fontWeight = fontVariation.metadata.fontWeight || 'bold';
              fallbackStyle.color = fontVariation.metadata.color || fallbackStyle.color;
              fallbackStyle.textAlign = fontVariation.metadata.textAlign || fallbackStyle.textAlign;
              fallbackStyle.opacity = fontVariation.metadata.opacity || fallbackStyle.opacity;
              
              // Add custom font information if it's a custom font
              if (fontVariation.metadata.isCustomFont && fontVariation.metadata.customFontUrl) {
                (fallbackStyle as any).isCustomFont = true;
                (fallbackStyle as any).customFontUrl = fontVariation.metadata.customFontUrl;
                (fallbackStyle as any).customFontData = fontVariation.metadata.customFontData;
              }
            }

            return {
              id: textItem.elementId,
              text: textItem.value,
              position: { top: 50, left: 50 },
              style: fallbackStyle,
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
          // Store video/media/font/speed variations for potential use
          metadata: {
            videoElements,
            imageElements,
            audioElements,
            fontElements,
            speedElements,
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
    
    // Always try to update names immediately after setting variations
    console.log('Variations set, attempting to update names immediately');
    setTimeout(() => {
      updateVariationNames();
    }, 100);
  };

  // Load variations and naming systems when modal opens
  useEffect(() => {
    if (isOpen) {
      loadVariationsFromSidebar();
      loadNamingPattern();
      loadNamingTemplate();
      loadProjectName();
    }
  }, [isOpen]);

  // Update variation names when naming pattern or template changes
  useEffect(() => {
    if (variations.length > 0) {
      // Always use template system by default
      updateVariationNames();
    }
  }, [namingPattern, namingTemplate, useTemplateSystem, projectName]);


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
                originalValue: element.content,
                variationIndex: index + 1
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
          
          // Use empty title - proper naming will be handled by updateVariationNames
          let title = '';

          // Try to generate proper name immediately if project name is available
          if (projectName && projectName !== 'Untitled Project') {
            try {
              const variationNamingData = {
                variation: {
                  id: `combination-${index}`,
                  isOriginal: index === 0
                },
                videoTrackItems: project.videoTrackItems,
                audioTrackItems: project.audioTrackItems,
                textOverlays: [], // Will be set below
                metadata: {
                  videoElements,
                  imageElements,
                  audioElements,
                  combination
                }
              };

              // Set text overlays for naming (will be created properly below)
              const tempTextOverlays = textElements.map((textItem) => ({
                text: textItem.value,
                style: {
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: '#ffffff'
                }
              }));
              variationNamingData.textOverlays = tempTextOverlays;

              // Use default title format - proper naming will be handled by updateVariationNames
            } catch (error) {
              console.error('Error generating initial variation name:', error);
              // Keep the default title format
            }
          }
          
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
      
      // Always try to update names immediately after setting variations
      console.log('Variations generated, attempting to update names immediately');
      setTimeout(() => {
        updateVariationNames();
      }, 100);
      
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

  const handleNameChange = (variationId: string, newName: string) => {
    setCustomNames(prev => ({
      ...prev,
      [variationId]: newName
    }));
  };

  const handleDownload = async (variation: any) => {
    // Prevent multiple downloads of the same variation
    if (downloadingVariationId === variation.id) {
      console.log(`[VariationModal] Download already in progress for variation ${variation.id}`);
      return;
    }
    
    try {
      setDownloadingVariation(variation.id);
      setShowProgressModal(true);

      // Ensure progress bar settings are loaded
      await loadProgressBarSettings();
      const { settings: loadedProgressBarSettings } = useProgressBarStore.getState();

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
          let playbackRate = item.playbackRate || 1;
          let display = {
            from: item.display.from,
            to: item.display.to,
          };
          
          if (variation.metadata?.combination) {
            const videoVariation = variation.metadata.combination.find((combo: any) => 
              combo.type === 'video' && combo.elementId === item.id
            );
            if (videoVariation) {
              videoSrc = videoVariation.value; // Use the variation video URL
            }
            
            // Apply speed variations
            const speedVariation = variation.metadata.combination.find((combo: any) => 
              combo.type === 'speed'
            );
            if (speedVariation && speedVariation.metadata && speedVariation.metadata.speed) {
              playbackRate = speedVariation.metadata.speed;
              
              // Adjust display timing for speed variations
              if (playbackRate < 1.0) {
                const originalDuration = display.to - display.from;
                const extendedDuration = originalDuration / playbackRate;
                display = {
                  from: display.from,
                  to: display.from + extendedDuration,
                };
              }
            }
          }
          
          return {
            id: item.id,
            src: videoSrc,
            display: display,
            details: {
              ...item.details,
              src: videoSrc, // Apply variation here too
              left: typeof item.details.left === 'string' ? parseFloat(item.details.left) || 0 : item.details.left || 0,
              top: typeof item.details.top === 'string' ? parseFloat(item.details.top) || 0 : item.details.top || 0,
              width: item.details.width || 200,
              height: item.details.height || 200,
            },
            trim: item.trim,
            playbackRate: playbackRate,
            volume: item.details.volume || 0,
            crop: item.details.crop,
          };
        });

      const audioTrackItems = Object.values(storeState.trackItemsMap)
        .filter((item: any) => item.type === 'audio')
        .map((item: any) => {
          // Check if this audio has a variation in the combination
          let audioSrc = item.details.src;
          let playbackRate = 1;
          let display = {
            from: item.display.from,
            to: item.display.to,
          };
          
          if (variation.metadata?.combination) {
            const audioVariation = variation.metadata.combination.find((combo: any) => 
              combo.type === 'audio' && combo.elementId === item.id
            );
            if (audioVariation) {
              audioSrc = audioVariation.value; // Use the variation audio URL
            }
            
            // Apply speed variations
            const speedVariation = variation.metadata.combination.find((combo: any) => 
              combo.type === 'speed'
            );
            if (speedVariation && speedVariation.metadata && speedVariation.metadata.speed) {
              playbackRate = speedVariation.metadata.speed;
              
              // Adjust display timing for speed variations
              if (playbackRate < 1.0) {
                const originalDuration = display.to - display.from;
                const extendedDuration = originalDuration / playbackRate;
                display = {
                  from: display.from,
                  to: display.from + extendedDuration,
                };
              }
            }
          }
          
          return {
            id: item.id,
            src: audioSrc,
            display: display,
            details: {
              ...item.details,
              src: audioSrc, // Apply variation here too
              volume: item.details.volume || 0,
            },
            playbackRate: playbackRate,
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
        metadata: variation.metadata, // Include the full metadata with all variations
      };

      // Use original duration - speed variations will be handled differently
      const effectiveDuration = storeState.duration || 5000;

      // Prepare variation data
      const downloadData = {
        variation: variationData,
        textOverlays,
        platformConfig: {
          width: canvasWidth,
          height: canvasHeight,
          aspectRatio: `${canvasWidth}:${canvasHeight}`,
        },
        duration: effectiveDuration,
        videoTrackItems,
        audioTrackItems,
        imageTrackItems,
        progressBarSettings: loadedProgressBarSettings ? { ...loadedProgressBarSettings, isVisible: true } : { isVisible: true },
      };

      // Generate meaningful filename based on variation data
      // Use the loaded project name
      const actualProjectName = projectName;
      
      // Use custom name if available, otherwise generate smart name
      let filename: string;
      if (customNames[variation.id]) {
        // Use custom name with project prefix
        const cleanProjectName = actualProjectName.replace(/[^a-zA-Z0-9-_]/g, '_');
        filename = `${cleanProjectName}_${customNames[variation.id]}.mp4`;
      } else {
        // Prepare data in the format expected by naming functions
      const variationNamingData = {
        variation: {
          id: variation.id,
          isOriginal: variation.isOriginal
        },
        videoTrackItems,
        audioTrackItems,
        imageTrackItems,
          textOverlays: variation.allTextOverlays || [], // Always use variation's specific text overlays
        metadata: variation.metadata
      };
      
        // Always use template-based system
        console.log('Download: Calling generateTemplateBasedFileName with:', {
          variationNamingData,
          actualProjectName,
          actualProjectNameType: typeof actualProjectName
        });
        filename = await generateTemplateBasedFileName(variationNamingData, actualProjectName);
        console.log('Download: Generated filename:', filename);
      }

      // Add to download manager
      const downloadId = addDownload(
        filename,
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
      
      // Close the variation modal
      onClose();
      
      // Navigate to download manager after a short delay
      setTimeout(() => {
        setOpen(true);
      }, 500);
      
    } catch (error) {
      console.error('Error adding all variations to download queue:', error);
    }
  };

  const handleDownloadAgain = () => {
    if (downloadUrl && downloadingVariation) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      // Check if filename already has .mp4 extension to avoid double extension
      const filename = `variation-${downloadingVariation.id}`;
      a.download = filename.endsWith('.mp4') ? filename : `${filename}.mp4`;
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
      <div className="fixed inset-0 z-50 bg-gray-900/60 flex items-center justify-center p-2 sm:p-4">
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
                onClick={() => setShowTemplateBuilder(true)}
                variant="outline"
                size="sm"
                className="text-xs"
                title="Build custom naming template"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Template</span>
              </Button>
              
              <Button
                onClick={() => setShowNamingSettings(true)}
                variant="outline"
                size="sm"
                className="text-xs"
                title="Simple naming patterns"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Patterns</span>
              </Button>

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
                    <div key={variation.id} className="flex flex-col items-center space-y-3 w-full max-w-full p-2 min-w-0">
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
                      <div className="text-center space-y-2 w-full max-w-full">
                        <div className="w-full min-w-0 max-w-full overflow-hidden">
                          <EditableFilename
                            variationId={variation.id}
                            currentName={(() => {
                              // Use custom name if available, otherwise generate smart name
                              if (customNames[variation.id]) {
                                return customNames[variation.id];
                              }
                              
                              if (variation.isOriginal) {
                                return 'Original';
                              }
                              
                            // Use the variation's current text (which should be updated with the latest naming pattern)
                            return variation.text || 'Loading...';
                          })()}
                            onNameChange={handleNameChange}
                            className="w-full min-w-0 max-w-full"
                          />
                        </div>
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
            variationName={downloadingVariation.isOriginal ? 'Original' : downloadingVariation.text}
            isCompleted={downloadProgress === 100}
            downloadUrl={downloadUrl || undefined}
            onDownload={handleDownloadAgain}
          />
        </>
      )}

      {/* Naming Pattern Settings Modal */}
      <SimpleNamingSelector
        isOpen={showNamingSettings}
        onClose={() => setShowNamingSettings(false)}
        onPatternChange={async (patternId) => {
          // Pattern changed - reload naming pattern and update variation names
          console.log('Naming pattern changed to:', patternId);
          setUseTemplateSystem(false); // Switch to pattern system
          await loadNamingPattern();
          // The useEffect will automatically update variation names when namingPattern changes
        }}
      />

      {/* Template Builder Modal */}
      <TemplateBuilder
        isOpen={showTemplateBuilder}
        onClose={() => setShowTemplateBuilder(false)}
        onTemplateChange={async (template) => {
          // Template changed - reload template and update variation names
          console.log('Naming template changed to:', template);
          setUseTemplateSystem(true); // Switch to template system
          await loadNamingTemplate();
          // The useEffect will automatically update variation names when namingTemplate changes
        }}
        currentTemplate={namingTemplate}
        variations={variations}
        projectData={{
          ...project,
          name: projectName // Override with the actual loaded project name
        }}
      />
    </>
  );
};

export default VariationModal;