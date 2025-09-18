import React, { useMemo } from 'react';
import { Sequence, AbsoluteFill, useCurrentFrame } from 'remotion';
import { SequenceItem } from '../../player/sequence-item';
import { groupTrackItems } from '../../utils/track-items';
import { VideoVariation, TextOverlayData } from '../types/variation-types';
import useStore from '../../store/use-store';
import PersistentProgressBar from '../../player/persistent-progress-bar';

interface VariationCompositionProps {
  variation: VideoVariation;
  textOverlays: TextOverlayData[];
  allVariations: VideoVariation[]; // All variations to find the right ones
  platformConfig: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  duration: number;
}

const VariationComposition: React.FC<VariationCompositionProps> = ({
  variation,
  textOverlays,
  allVariations,
  platformConfig,
  duration,
}) => {
  // The duration passed in is already the effective duration from VideoPreview
  // We don't need to calculate it again here
  const effectiveDuration = duration;
  const {
    trackItemIds,
    trackItemsMap,
    fps,
    transitionsMap,
  } = useStore();
  
  const frame = useCurrentFrame();
  
  // Use consistent fps to match VideoPreview
  const effectiveFps = 30;

  // Only log once per variation to prevent constant re-rendering
  console.log(`VariationComposition for ${variation.id}:`, {
    textOverlaysCount: textOverlays.length,
    textOverlays: textOverlays.map(o => ({ id: o.id, text: o.text, timing: o.timing })),
    hasAllTextOverlays: !!variation.allTextOverlays,
    allTextOverlaysCount: variation.allTextOverlays?.length || 0,
    allTextOverlays: variation.allTextOverlays?.map(o => ({ id: o.id, text: o.text, timing: o.timing })) || [],
    duration: duration,
    fps: fps,
    trackItemsMapKeys: Object.keys(trackItemsMap),
    textItemsInMap: Object.keys(trackItemsMap).filter(key => trackItemsMap[key]?.type === 'text').map(key => ({
      id: key,
      text: trackItemsMap[key]?.details?.text,
      timing: trackItemsMap[key]?.display
    })),
    // Debug speed variations
    hasMetadata: !!variation.metadata,
    hasCombination: !!variation.metadata?.combination,
    combinationLength: variation.metadata?.combination?.length || 0,
    combination: variation.metadata?.combination || [],
    speedElements: variation.metadata?.combination?.filter((item: any) => item.type === 'speed') || []
  });

    // Create a modified track items map with the variation text and media applied
  const modifiedTrackItemsMap = useMemo(() => {
    const modified = { ...trackItemsMap };
    
    // Always use variation's allTextOverlays for proper text variation display
    const overlaysToUse = variation.allTextOverlays && variation.allTextOverlays.length > 0 ? variation.allTextOverlays : textOverlays;
    
    // Apply variation texts to all text overlays
    overlaysToUse.forEach(textOverlay => {
      const textItem = modified[textOverlay.id];
      console.log(`Checking text overlay ${textOverlay.id}:`, {
        exists: !!textItem,
        type: textItem?.type,
        currentText: textItem?.details?.text,
        newText: textOverlay.text
      });
      
      if (textItem && textItem.type === 'text') {
        modified[textOverlay.id] = {
          ...textItem,
          details: {
            ...textItem.details,
            text: textOverlay.text, // Use the text from the overlay directly
            // Ensure positioning is correct
            top: textOverlay.position?.top || textItem.details.top,
            left: textOverlay.position?.left || textItem.details.left,
            // Apply all font styles from the variation
            fontSize: textOverlay.style?.fontSize || textItem.details.fontSize,
            fontFamily: textOverlay.style?.fontFamily || textItem.details.fontFamily,
            fontWeight: Number(textOverlay.style?.fontWeight || textItem.details.fontWeight),
            color: textOverlay.style?.color || textItem.details.color,
            textAlign: (textOverlay.style?.textAlign || textItem.details.textAlign) as "center" | "left" | "right",
            opacity: textOverlay.style?.opacity || textItem.details.opacity,
            // Apply custom font properties if available
            ...((textOverlay.style as any)?.isCustomFont !== undefined && { isCustomFont: (textOverlay.style as any).isCustomFont }),
            ...((textOverlay.style as any)?.customFontUrl !== undefined && { customFontUrl: (textOverlay.style as any).customFontUrl }),
            ...((textOverlay.style as any)?.customFontData !== undefined && { customFontData: (textOverlay.style as any).customFontData }),
          },
        };
        console.log(`✅ Applied text "${textOverlay.text}" to text overlay ${textOverlay.id} with timing ${textOverlay.timing.from}-${textOverlay.timing.to}ms, position: top=${textOverlay.position?.top}, left=${textOverlay.position?.left}`);
        console.log(`🔍 Applied font styles:`, {
          fontFamily: textOverlay.style?.fontFamily || textItem.details.fontFamily,
          fontSize: textOverlay.style?.fontSize || textItem.details.fontSize,
          fontWeight: textOverlay.style?.fontWeight || textItem.details.fontWeight,
          color: textOverlay.style?.color || textItem.details.color,
          isCustomFont: (textOverlay.style as any)?.isCustomFont
        });
      } else {
        console.log(`❌ Text item not found in trackItemsMap for overlay ${textOverlay.id}`);
      }
    });

    // Apply media variations (video, image, audio) from combinationData
    if (variation.metadata?.combination) {
      const combination = variation.metadata.combination;
      console.log('🔍 Applying media variations from combination:', combination);
      console.log('🔍 Speed elements in combination:', combination.filter(item => item.type === 'speed'));
      
      combination.forEach((item: any) => {
        // Handle speed variations - apply to ALL elements (video, audio, text)
        if (item.type === 'speed' && item.metadata) {
          const speedMultiplier = item.metadata.speed || 1.0;
          console.log(`🔍 Applying speed variation ${speedMultiplier}x to ALL timeline elements`);
          
          // Apply speed variation to ALL elements on the timeline
          Object.keys(modified).forEach(trackItemId => {
            const trackItem = modified[trackItemId];
            if (trackItem) {
              // Calculate new display duration based on speed
              const originalDuration = trackItem.display.to - trackItem.display.from;
              const newDuration = originalDuration / speedMultiplier;
              
              // Apply speed variation to all element types
              if (trackItem.type === 'video') {
                modified[trackItemId] = {
                  ...trackItem,
                  // Keep the individual playbackRate from user settings, then apply speed variation on top
                  playbackRate: (trackItem.playbackRate || 1.0) * speedMultiplier,
                  display: {
                    ...trackItem.display,
                    to: trackItem.display.from + newDuration
                  }
                };
                console.log(`✅ Applied ${speedMultiplier}x speed variation to video ${trackItemId}: ${originalDuration}ms → ${newDuration}ms`);
              } else if (trackItem.type === 'audio') {
                modified[trackItemId] = {
                  ...trackItem,
                  playbackRate: (trackItem.playbackRate || 1.0) * speedMultiplier,
                  display: {
                    ...trackItem.display,
                    to: trackItem.display.from + newDuration
                  }
                };
                console.log(`✅ Applied ${speedMultiplier}x speed variation to audio ${trackItemId}: ${originalDuration}ms → ${newDuration}ms`);
              } else if (trackItem.type === 'text') {
                // For text, just adjust the display timing (no playback rate)
                modified[trackItemId] = {
                  ...trackItem,
                  display: {
                    ...trackItem.display,
                    to: trackItem.display.from + newDuration
                  }
                };
                console.log(`✅ Applied ${speedMultiplier}x speed variation to text ${trackItemId}: ${originalDuration}ms → ${newDuration}ms`);
              }
            }
          });
        }
        // Use elementId for direct mapping if available
        else if (item.elementId && trackItemsMap[item.elementId] && item.type !== 'text') {
          const trackItem = trackItemsMap[item.elementId];
          
          console.log(`Applying ${item.type} variation using elementId:`, {
            elementId: item.elementId,
            originalSrc: trackItem.details?.src,
            newSrc: item.value,
            type: item.type
          });
          
          modified[item.elementId] = {
            ...trackItem,
            details: {
              ...trackItem.details,
              src: item.value, // Use the variation's media URL
            },
          };
          
          console.log(`✅ Applied ${item.type} variation "${item.value}" to ${item.elementId}`);
        } else {
          // Fallback to finding by content match
          const originalItem = Object.values(trackItemsMap).find(trackItem => 
            trackItem.type === item.type && (
              (item.type === 'text' && trackItem.details?.text === item.originalValue) ||
              (item.type !== 'text' && trackItem.details?.src === item.originalValue)
            )
          );
          
          if (originalItem && item.type !== 'text') {
            console.log(`Applying ${item.type} variation using content match:`, {
              id: originalItem.id,
              originalSrc: originalItem.details?.src,
              newSrc: item.value,
              type: item.type
            });
            
            modified[originalItem.id] = {
              ...originalItem,
              details: {
                ...originalItem.details,
                src: item.value, // Use the variation's media URL
              },
            };
            
            console.log(`✅ Applied ${item.type} variation "${item.value}" to ${originalItem.id}`);
          }
        }
      });
    }
    
    return modified;
  }, [trackItemsMap, variation, textOverlays]);

  // Group track items using the modified map
  const groupedItems = groupTrackItems({
    trackItemIds,
    transitionsMap,
    trackItemsMap: modifiedTrackItemsMap,
  });

  // Only log once to prevent constant re-rendering
  console.log('VariationComposition - Grouped items count:', groupedItems.length);
  console.log('VariationComposition - Grouped items:', groupedItems.map(group => 
    group.map(item => ({
      id: item.id,
      type: modifiedTrackItemsMap[item.id]?.type,
      timing: modifiedTrackItemsMap[item.id]?.display
    }))
  ));

  return (
    <AbsoluteFill
      style={{
        width: platformConfig.width,
        height: platformConfig.height,
        backgroundColor: 'black',
      }}
    >
      {groupedItems.map((group, index) => {
        if (group.length === 1) {
          const item = modifiedTrackItemsMap[group[0].id];
          if (!item) return null;
          
          console.log(`Rendering item ${item.id} (${item.type}): timing=${item.display.from}-${item.display.to}ms, currentFrame=${frame}, playbackRate=${item.playbackRate || 1.0}`);
          
          const sequenceItem = SequenceItem[item.type](item, {
            fps: effectiveFps, // Use effective fps for speed variations
            handleTextChange: () => {}, // No text editing in variations
            onTextBlur: () => {}, // No text editing in variations
            editableTextId: null, // No text editing in variations
            frame: frame, // Use current frame for proper timing
            size: {
              width: platformConfig.width,
              height: platformConfig.height,
            },
            isTransition: false,
            playbackRate: item.playbackRate || 1.0, // Pass playbackRate for video elements
          });
          
          console.log(`SequenceItem rendered for ${item.id}:`, sequenceItem);
          return sequenceItem;
        }
        return null;
      })}
      
      {/* Persistent Progress Bar - Always visible */}
      <PersistentProgressBar
        platformConfig={platformConfig}
        effectiveDuration={effectiveDuration}
      />
    </AbsoluteFill>
  );
};

export default VariationComposition; 