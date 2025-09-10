import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Player } from '@remotion/player';
import { VideoVariation, TextOverlayData } from '../types/variation-types';
import ScalezLoader from '@/components/ui/scalez-loader';
import TextOverlayEditor from './TextOverlayEditor';
import VariationComposition from './VariationComposition';
import { VideoTrackItem, AudioTrackItem } from '../types/variation-types';
import VideoPlayerManager from '../utils/videoPlayerManager';

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
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [canLoad, setCanLoad] = useState(false);

  // Calculate aspect ratio
  const aspectRatio = platformConfig.width / platformConfig.height;

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Request player slot from manager
            VideoPlayerManager.getInstance().requestPlayer(variation.id).then(() => {
              setCanLoad(true);
              // Delay loading to prevent overwhelming the browser
              setTimeout(() => setShouldLoad(true), Math.random() * 1000);
            });
          } else {
            setIsVisible(false);
            setShouldLoad(false);
            setCanLoad(false);
            // Release player slot
            VideoPlayerManager.getInstance().releasePlayer(variation.id);
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      // Release player slot on unmount
      VideoPlayerManager.getInstance().releasePlayer(variation.id);
    };
  }, [variation.id]);
  
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

  const handlePlayerError = useCallback((error: any) => {
    console.error(`Video player error for variation ${variation.id}:`, error);
    setHasError(true);
  }, [variation.id]);

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
      {/* Show loading placeholder when not visible */}
      {!isVisible && (
        <div className="flex items-center justify-center w-full h-full bg-gray-100">
          <div className="text-gray-500 text-sm">Loading preview...</div>
        </div>
      )}

      {/* Show error state */}
      {hasError && (
        <div className="flex items-center justify-center w-full h-full bg-red-50">
          <div className="text-red-500 text-sm">Failed to load video</div>
        </div>
      )}

      {/* Complete Video Composition with Remotion Player - Only load when visible and slot available */}
      {isVisible && shouldLoad && canLoad && !hasError && (() => {
        const fps = 30; // Use consistent fps
        // Calculate effective duration for this variation
        let effectiveDuration = duration;
        if (variation.metadata?.combination) {
          const speedItem = variation.metadata.combination.find((item: any) => item.type === 'speed');
          if (speedItem && speedItem.metadata && speedItem.metadata.speed) {
            const speedMultiplier = speedItem.metadata.speed;
            effectiveDuration = duration / speedMultiplier;
            console.log(`🔍 VideoPreview: Speed ${speedMultiplier}x, extending duration from ${duration}ms to ${effectiveDuration}ms`);
          }
        }
        const durationInFrames = Math.ceil(effectiveDuration / 1000 * fps);
        console.log(`VideoPreview for ${variation.id}: effectiveDuration=${effectiveDuration}ms, durationInFrames=${durationInFrames}, fps=${fps}`);
        return (
          <Player
            component={VariationComposition}
            inputProps={{
              variation,
              textOverlays,
              allVariations,
              platformConfig,
              duration: effectiveDuration,
            }}
            durationInFrames={durationInFrames}
            fps={fps}
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