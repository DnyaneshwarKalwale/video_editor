import { useMemo } from 'react';
import { ITrackItem, IText } from '@designcombo/types';
import useStore from '../../store/use-store';
import { usePlatformStoreClient } from '../../platform-preview';
import { VariationProject, TextOverlayData } from '../types/variation-types';

export const useVariationProject = (): VariationProject | null => {
  const { trackItemsMap, trackItemIds, duration } = useStore();
  const { currentPlatform } = usePlatformStoreClient();

  return useMemo(() => {
    // Filter text track items
    const textTrackItems = trackItemIds
      .map(id => trackItemsMap[id])
      .filter((item): item is ITrackItem & IText => item?.type === 'text')
      .sort((a, b) => a.display.from - b.display.from);

    console.log('useVariationProject - All track items:', trackItemIds.map(id => ({ id, type: trackItemsMap[id]?.type })));
    console.log('useVariationProject - Text track items found:', textTrackItems.map(item => ({ 
      id: item.id, 
      text: item.details.text, 
      timing: { from: item.display.from, to: item.display.to } 
    })));

    if (textTrackItems.length === 0) {
      return null;
    }

    // Convert track items to text overlay data
    const textOverlays: TextOverlayData[] = textTrackItems.map(item => ({
      id: item.id,
      text: item.details.text || '',
      position: {
        top: typeof item.details.top === 'string' ? parseFloat(item.details.top) || 0 : item.details.top || 0,
        left: typeof item.details.left === 'string' ? parseFloat(item.details.left) || 0 : item.details.left || 0,
      },
      style: {
        fontSize: item.details.fontSize || 16,
        fontFamily: item.details.fontFamily || 'Arial',
        color: item.details.color || '#000000',
        backgroundColor: item.details.backgroundColor,
        borderWidth: item.details.borderWidth,
        borderColor: item.details.borderColor,
        textAlign: item.details.textAlign || 'left',
        fontWeight: item.details.fontWeight?.toString(),
        textDecoration: item.details.textDecoration,
        opacity: item.details.opacity,
      },
      timing: {
        from: item.display.from,
        to: item.display.to,
      },
      transform: item.details.transform,
      width: item.details.width,
      height: item.details.height,
    }));

    // Get all video track items with their timing information
    const videoTrackItems = trackItemIds
      .map(id => trackItemsMap[id])
      .filter((item): item is ITrackItem => item?.type === 'video')
      .sort((a, b) => a.display.from - b.display.from);

    // Get all audio track items
    const audioTrackItems = trackItemIds
      .map(id => trackItemsMap[id])
      .filter((item): item is ITrackItem => item?.type === 'audio')
      .sort((a, b) => a.display.from - b.display.from);

    const project: VariationProject = {
      id: `project-${Date.now()}`,
      videoTrackItems: videoTrackItems.map(item => ({
        id: item.id,
        src: item.details.src,
        timing: {
          from: item.display.from,
          to: item.display.to,
        },
        trim: item.trim,
        playbackRate: item.playbackRate || 1,
        volume: item.details.volume || 0,
        crop: item.details.crop,
        width: item.details.width,
        height: item.details.height,
      })),
      audioTrackItems: audioTrackItems.map(item => ({
        id: item.id,
        src: item.details.src,
        timing: {
          from: item.display.from,
          to: item.display.to,
        },
        volume: item.details.volume || 0,
      })),
      textOverlays,
      variations: [],
      platformConfig: {
        name: currentPlatform.name,
        width: currentPlatform.width,
        height: currentPlatform.height,
        aspectRatio: currentPlatform.description,
      },
      duration: duration || 5000,
    };

    return project;
  }, [trackItemsMap, trackItemIds, currentPlatform, duration]);
};

export default useVariationProject;