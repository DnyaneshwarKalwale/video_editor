import React, { useMemo } from 'react';
import { Sequence, AbsoluteFill, useCurrentFrame } from 'remotion';
import { SequenceItem } from '../../player/sequence-item';
import { groupTrackItems } from '../../utils/track-items';
import { VideoVariation, TextOverlayData } from '../types/variation-types';
import useStore from '../../store/use-store';

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
  const {
    trackItemIds,
    trackItemsMap,
    fps,
    transitionsMap,
  } = useStore();
  
  const frame = useCurrentFrame();

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
    }))
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
            fontSize: textOverlay.style?.fontSize || textItem.details.fontSize,
            color: textOverlay.style?.color || textItem.details.color,
          },
        };
        console.log(`✅ Applied text "${textOverlay.text}" to text overlay ${textOverlay.id} with timing ${textOverlay.timing.from}-${textOverlay.timing.to}ms, position: top=${textOverlay.position?.top}, left=${textOverlay.position?.left}`);
      } else {
        console.log(`❌ Text item not found in trackItemsMap for overlay ${textOverlay.id}`);
      }
    });

    // Apply media variations (video, image, audio) from combinationData
    if (variation.metadata?.combination) {
      const combination = variation.metadata.combination;
      console.log('Applying media variations from combination:', combination);
      
      combination.forEach((item: any) => {
        // Use elementId for direct mapping if available
        if (item.elementId && trackItemsMap[item.elementId] && item.type !== 'text') {
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
          
          console.log(`Rendering item ${item.id} (${item.type}): timing=${item.display.from}-${item.display.to}ms, currentFrame=${frame}`);
          
          const sequenceItem = SequenceItem[item.type](item, {
            fps,
            handleTextChange: () => {}, // No text editing in variations
            onTextBlur: () => {}, // No text editing in variations
            editableTextId: null, // No text editing in variations
            frame: frame, // Use current frame for proper timing
            size: {
              width: platformConfig.width,
              height: platformConfig.height,
            },
            isTransition: false,
          });
          
          console.log(`SequenceItem rendered for ${item.id}:`, sequenceItem);
          return sequenceItem;
        }
        return null;
      })}
    </AbsoluteFill>
  );
};

export default VariationComposition; 