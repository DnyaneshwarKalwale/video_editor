import React, { useRef, useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { VideoVariation, TextOverlayData } from '../types/variation-types';
import TextOverlayEditor from './TextOverlayEditor';
import VariationComposition from './VariationComposition';

import { VideoTrackItem, AudioTrackItem } from '../types/variation-types';

interface VideoPreviewProps {
  variation: VideoVariation;
  textOverlays: TextOverlayData[];
  videoTrackItems: VideoTrackItem[];
  audioTrackItems: AudioTrackItem[];
  allVariations: VideoVariation[];
  platformConfig: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  containerWidth?: number;
  containerHeight?: number;
  duration: number;
  onTextChange?: (variationId: string, overlayId: string, newText: string) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  variation,
  textOverlays,
  videoTrackItems,
  audioTrackItems,
  allVariations,
  platformConfig,
  containerWidth,
  containerHeight,
  duration,
  onTextChange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Calculate aspect ratio
  const aspectRatio = platformConfig.width / platformConfig.height;
  
  useEffect(() => {
    const updateContainerSize = () => {
      // Use provided container dimensions if available, otherwise measure
      if (containerWidth && containerHeight) {
        setContainerSize({ width: containerWidth, height: containerHeight });
      } else if (containerRef.current) {
        const measuredWidth = containerRef.current.clientWidth;
        const measuredHeight = containerRef.current.clientHeight;
        
        // Calculate video dimensions maintaining aspect ratio
        let videoWidth = measuredWidth;
        let videoHeight = measuredWidth / aspectRatio;
        
        if (videoHeight > measuredHeight) {
          videoHeight = measuredHeight;
          videoWidth = measuredHeight * aspectRatio;
        }
        
        setContainerSize({ width: videoWidth, height: videoHeight });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    
    return () => window.removeEventListener('resize', updateContainerSize);
  }, [aspectRatio, containerWidth, containerHeight]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime * 1000); // Convert to milliseconds
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const handleTextChange = (overlayId: string, newText: string) => {
    onTextChange?.(variation.id, overlayId, newText);
  };

  // For original video, show all overlays. For variations, only update the specific text that was varied
  const updatedOverlays = textOverlays.map(overlay => {
    const shouldUpdateText = !variation.isOriginal && overlay.id === variation.originalTextId;
    
    return {
      ...overlay,
      text: variation.isOriginal 
        ? overlay.text 
        : (shouldUpdateText ? variation.text : overlay.text)
    };
  });

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden"
    >
      {/* Complete Video Composition with Remotion Player */}
      {(() => {
        const durationInFrames = Math.ceil(duration / 1000 * 30);
        console.log(`VideoPreview for ${variation.id}: duration=${duration}ms, durationInFrames=${durationInFrames}, fps=30`);
        return (
          <Player
            component={VariationComposition}
            inputProps={{
              variation,
              textOverlays,
              allVariations,
              platformConfig,
              duration: duration,
            }}
            durationInFrames={durationInFrames} // Convert ms to frames at 30fps
            fps={30}
            compositionWidth={platformConfig.width}
            compositionHeight={platformConfig.height}
            style={{
              width: containerWidth || containerSize.width,
              height: containerHeight || containerSize.height,
            }}
            controls
            loop={false}
            autoPlay={false}
          />
        );
      })()}
    </div>
  );
};

export default VideoPreview;