import React, { useMemo } from 'react';
import { SequenceItem } from '../../player/sequence-item';
import { groupTrackItems } from '../../utils/track-items';
import { VideoVariation, TextOverlayData } from '../types/variation-types';
import useStore from '../../store/use-store';

interface VariationVideoRendererProps {
  variation: VideoVariation;
  textOverlays: TextOverlayData[];
  platformConfig: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  containerWidth?: number;
  containerHeight?: number;
}

const VariationVideoRenderer: React.FC<VariationVideoRendererProps> = ({
  variation,
  textOverlays,
  platformConfig,
  containerWidth,
  containerHeight,
}) => {
  const {
    trackItemIds,
    trackItemsMap,
    fps,
    transitionsMap,
    structure,
    activeIds,
  } = useStore();

  // Create a modified track items map with the variation text applied
  const modifiedTrackItemsMap = useMemo(() => {
    const modified = { ...trackItemsMap };
    
    // Apply variation text to the specific text overlay
    if (!variation.isOriginal && variation.originalTextId) {
      const textItem = modified[variation.originalTextId];
      if (textItem && textItem.type === 'text') {
        modified[variation.originalTextId] = {
          ...textItem,
          details: {
            ...textItem.details,
            text: variation.text,
          },
        };
      }
    }
    
    return modified;
  }, [trackItemsMap, variation]);

  // Group track items using the modified map
  const groupedItems = groupTrackItems({
    trackItemIds,
    transitionsMap,
    trackItemsMap: modifiedTrackItemsMap,
  });

  // Render the complete composition with variation text
  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden"
      style={{
        width: containerWidth || platformConfig.width,
        height: containerHeight || platformConfig.height,
      }}
    >
      {groupedItems.map((group, index) => {
        if (group.length === 1) {
          const item = modifiedTrackItemsMap[group[0].id];
          if (!item) return null;
          
          return SequenceItem[item.type](item, {
            fps,
            handleTextChange: () => {}, // No text editing in variations
            onTextBlur: () => {}, // No text editing in variations
            editableTextId: null, // No text editing in variations
            frame: 0, // Start from beginning
            size: {
              width: platformConfig.width,
              height: platformConfig.height,
            },
            isTransition: false,
          });
        }
        return null;
      })}
    </div>
  );
};

export default VariationVideoRenderer; 