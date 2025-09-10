import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, Video, Audio } from 'remotion';
import { getInputProps } from 'remotion';
import { useRef, useEffect } from 'react';

const VideoComposition = () => {
  const frame = useCurrentFrame();
  const currentTimeInMs = (frame / 24) * 1000; // 24fps
  
  // Get the input props from the JSON file passed via --props
  const inputProps = getInputProps() as any;
  
  // Extract data from props with defaults
  const {
    variation = { id: 'default' },
    textOverlays = [],
    platformConfig = { width: 1080, height: 1920 },
    duration = 5000,
    videoTrackItems = [],
    audioTrackItems = [],
    progressBarSettings = null,
    effectiveDuration = null,
    speedMultiplier = null
  } = inputProps || {};
  
  // If we've exceeded the actual duration, don't render anything
  if (currentTimeInMs > duration) {
    return <AbsoluteFill style={{ backgroundColor: 'transparent' }} />;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'black',
        width: platformConfig.width || 1080,
        height: platformConfig.height || 1920,
        position: 'relative',
      }}
    >
      {/* Render video track items */}
      {videoTrackItems.map((videoItem: any) => {
        const isVisible = videoItem.display?.from <= currentTimeInMs && videoItem.display?.to >= currentTimeInMs;
        
        if (!isVisible) return null;
        
        return (
          <Sequence
            key={videoItem.id}
            from={Math.floor(videoItem.display.from / 1000 * 30)}
            durationInFrames={Math.floor((videoItem.display.to - videoItem.display.from) / 1000 * 30)}
          >
            <div
              style={{
                position: 'absolute',
                left: videoItem.details?.left || 0,
                top: videoItem.details?.top || 0,
                width: videoItem.details?.width || 200,
                height: videoItem.details?.height || 200,
                transform: videoItem.details?.transform || 'none',
                opacity: videoItem.details?.opacity ? videoItem.details.opacity / 100 : 1,
                borderRadius: videoItem.details?.borderRadius ? `${videoItem.details.borderRadius}px` : '0px',
                overflow: 'hidden',
              }}
            >
              <Video
                src={videoItem.src}
                startFrom={0}
                playbackRate={videoItem.playbackRate || 1}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: videoItem.details?.flipX ? 'scaleX(-1)' : videoItem.details?.flipY ? 'scaleY(-1)' : 'none',
                  filter: `
                    blur(${videoItem.details?.blur || 0}px)
                    brightness(${videoItem.details?.brightness || 100}%)
                  `,
                }}
              />
            </div>
          </Sequence>
        );
      })}

      {/* Render text overlays */}
      {textOverlays.map((textOverlay: any, index: number) => {
        const fromMs = textOverlay.timing?.from || 0;
        const toMs = textOverlay.timing?.to || duration;
        const isVisible = fromMs <= currentTimeInMs && toMs >= currentTimeInMs;
        
        if (!isVisible) return null;
        
        return (
          <Sequence
            key={textOverlay.id || index}
            from={Math.floor(fromMs / 1000 * 30)}
            durationInFrames={Math.floor((toMs - fromMs) / 1000 * 30)}
          >
            <div
              style={{
                position: 'absolute',
                left: textOverlay.position?.left || 50,
                top: textOverlay.position?.top || 50,
                color: textOverlay.style?.color || 'white',
                fontSize: `${textOverlay.style?.fontSize || 48}px`,
                fontWeight: textOverlay.style?.fontWeight || 'bold',
                textAlign: textOverlay.style?.textAlign || 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                fontFamily: textOverlay.style?.fontFamily || 'Arial, sans-serif',
                backgroundColor: textOverlay.style?.backgroundColor || 'transparent',
                opacity: textOverlay.style?.opacity !== undefined ? textOverlay.style.opacity / 100 : 1,
                width: textOverlay.width ? `${textOverlay.width}px` : 'auto',
                height: textOverlay.height ? `${textOverlay.height}px` : 'auto',
                borderWidth: textOverlay.style?.borderWidth ? `${textOverlay.style.borderWidth}px` : undefined,
                borderColor: textOverlay.style?.borderColor,
                borderStyle: textOverlay.style?.borderWidth ? 'solid' : undefined,
                textDecoration: textOverlay.style?.textDecoration,
              }}
            >
              {textOverlay.text || 'Sample Text'}
            </div>
          </Sequence>
        );
      })}

      {/* Render audio track items */}
      {audioTrackItems.map((audioItem: any) => {
        const isVisible = audioItem.display?.from <= currentTimeInMs && audioItem.display?.to >= currentTimeInMs;
        
        if (!isVisible) return null;

        return (
          <Sequence
            key={audioItem.id}
            from={Math.floor(audioItem.display.from / 1000 * 30)}
            durationInFrames={Math.floor((audioItem.display.to - audioItem.display.from) / 1000 * 30)}
          >
            <Audio
              src={audioItem.src}
              startFrom={0}
              volume={(audioItem.details?.volume || 100) / 100}
            />
          </Sequence>
        );
      })}

      {/* Render Progress Bar - Always visible */}
      {progressBarSettings && progressBarSettings.isVisible && (
        <ProgressBarRenderer 
          platformConfig={{
            width: platformConfig.width,
            height: platformConfig.height,
            aspectRatio: platformConfig.width > platformConfig.height ? '16:9' : platformConfig.width < platformConfig.height ? '9:16' : '1:1'
          }}
          effectiveDuration={effectiveDuration}
          speedMultiplier={speedMultiplier}
          settings={progressBarSettings}
        />
      )}
    </AbsoluteFill>
  );
};

// Progress Bar Renderer for Remotion
const ProgressBarRenderer: React.FC<{
  platformConfig: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  effectiveDuration?: number;
  speedMultiplier?: number;
  settings: any;
}> = ({ platformConfig, effectiveDuration, speedMultiplier, settings }) => {
  const frame = useCurrentFrame();
  const fps = 24;
  
  // Use effective duration for variations, fallback to original duration
  const actualDuration = effectiveDuration || 5000;
  
  // Calculate current progress based on frame
  const currentTimeInMs = (frame / fps) * 1000;
  
  // Create deceptive progress bar with gradual speed transitions
  const getDeceptiveProgress = (actualTime: number, totalDuration: number) => {
    if (!settings.useDeceptiveProgress) {
      // Normal progress
      return Math.min(actualTime / totalDuration, 1);
    }
    
    const progressRatio = actualTime / totalDuration;
    const fastStartRatio = settings.fastStartDuration / (totalDuration / 1000); // Convert to ratio
    
    // Phase 1: Very fast start (first 10%)
    if (progressRatio <= fastStartRatio) {
      return (progressRatio / fastStartRatio) * settings.fastStartProgress;
    }
    
    // Phase 2-8: 7 distinct speed phases with specific multipliers
    const remainingRatio = progressRatio - fastStartRatio;
    const remainingBarSpace = 1 - settings.fastStartProgress;
    
    // Speed multipliers: 2x, 1.75x, 1.5x, 1x, 0.75x, 0.5x, 0.25x
    const speedMultipliers = [2, 1.75, 1.5, 1, 0.75, 0.5, 0.25];
    
    // Calculate how much progress each phase should cover based on speed
    // Faster phases cover more progress in same time
    const totalSpeedWeight = speedMultipliers.reduce((sum, speed) => sum + speed, 0);
    const progressPerPhase = speedMultipliers.map(speed => (speed / totalSpeedWeight) * remainingBarSpace);
    
    // Time distribution (equal time for each phase)
    const timePerPhase = 1 / speedMultipliers.length;
    
    let deceptiveProgress = settings.fastStartProgress;
    let accumulatedProgress = 0;
    
    for (let i = 0; i < speedMultipliers.length; i++) {
      const phaseStart = i * timePerPhase;
      const phaseEnd = (i + 1) * timePerPhase;
      
      if (remainingRatio >= phaseStart && remainingRatio <= phaseEnd) {
        // Current phase
        const phaseProgress = (remainingRatio - phaseStart) / timePerPhase;
        deceptiveProgress += accumulatedProgress + (progressPerPhase[i] * phaseProgress);
        break;
      } else if (remainingRatio > phaseEnd) {
        // Past phase - add full progress for this phase
        accumulatedProgress += progressPerPhase[i];
      }
    }
    
    return Math.min(deceptiveProgress, 1);
  };
  
  const progress = getDeceptiveProgress(currentTimeInMs, actualDuration);
  
  // Platform-specific positioning - Always at the very bottom, full width
  const getPlatformStyles = () => {
    const { width, height, aspectRatio } = platformConfig;
    
    // Always position at the very bottom, full width from corner to corner
    return {
      top: height - settings.height, // At the very bottom
      left: 0, // Start from the very left corner
      width: width, // Full width from left to right
      height: settings.height, // Use settings height
    };
  };
  
  const styles = getPlatformStyles();
  
  // Don't render if not visible
  if (!settings.isVisible) {
    return null;
  }
  
  // Debug logging for progress bar rendering
  console.log('[ProgressBarRenderer] Rendering progress bar:', {
    frame,
    currentTimeInMs,
    actualDuration,
    progress,
    settings: {
      isVisible: settings.isVisible,
      height: settings.height,
      backgroundColor: settings.backgroundColor,
      progressColor: settings.progressColor
    }
  });

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 1000, // Always on top
        opacity: settings.opacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          ...styles,
          backgroundColor: settings.backgroundColor,
          borderRadius: `${settings.borderRadius}px`,
          overflow: 'hidden',
        }}
      >
        {/* Progress Fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: settings.progressColor,
            borderRadius: `${settings.borderRadius}px`,
            transition: 'none', // No transitions in video rendering
          }}
        />
        
        {/* Scrubber */}
        <div
          style={{
            position: 'absolute',
            left: `${progress * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${settings.scrubberSize}px`,
            height: `${settings.scrubberSize}px`,
            backgroundColor: settings.scrubberColor,
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default VideoComposition; 