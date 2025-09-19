import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, Video, Audio } from 'remotion';
import { getInputProps } from 'remotion';
import { useRef, useEffect } from 'react';
import { ProgressBar } from '../components/shared/ProgressBar';

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
    progressBarSettings = null
  } = inputProps || {};

  // Calculate effective duration based on speed variations
  const effectiveDuration = React.useMemo(() => {
    if (variation?.metadata?.combination) {
      const speedItem = variation.metadata.combination.find((item: any) => item.type === 'speed');
      if (speedItem && speedItem.metadata && speedItem.metadata.speed) {
        const speedMultiplier = speedItem.metadata.speed;
        const extendedDuration = duration / speedMultiplier;
        console.log(`🔍 VideoComposition: Speed variation ${speedMultiplier}x, extending duration from ${duration}ms to ${extendedDuration}ms`);
        return extendedDuration;
      }
    }
    return duration;
  }, [variation?.metadata?.combination, duration]);
  
  
  // If we've exceeded the effective duration, don't render anything
  if (currentTimeInMs > effectiveDuration) {
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


      {/* Inline Progress Bar for Downloaded Videos */}
      {(() => {
        const settings = progressBarSettings || {
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  progressColor: '#ff6b35',
  scrubberColor: '#ffffff',
          height: 30,
          scrubberSize: 24,
  borderRadius: 4,
  opacity: 1,
  shadowBlur: 4,
  shadowColor: 'rgba(0, 0, 0, 0.4)',
  isVisible: true,
          useDeceptiveProgress: true,
          fastStartDuration: 1,
          fastStartProgress: 0.1
        };

        if (!settings.isVisible) {
          return null;
        }

        // Calculate deceptive progress using user settings
  const getDeceptiveProgress = (currentTime: number, totalDuration: number): number => {
    const timeRatio = Math.min(currentTime / totalDuration, 1);

          // Use actual settings from user
          const fastStartDurationMs = settings.fastStartDuration * 1000; // Convert seconds to ms
          const fastStartProgressTarget = settings.fastStartProgress; // 0-1 range
          const fastStartTimeRatio = fastStartDurationMs / totalDuration;

          // Fast initial jump - reach target progress in fast start duration
          if (timeRatio <= fastStartTimeRatio && fastStartTimeRatio > 0) {
            return (timeRatio / fastStartTimeRatio) * fastStartProgressTarget;
          }

          // If fast start duration is 0, use linear progress
          if (fastStartDurationMs === 0) {
            return timeRatio;
    }

    // Exponential slowdown for remaining progress
          const remainingTime = (timeRatio - fastStartTimeRatio) / (1 - fastStartTimeRatio);
    const k = 3; // Controls how much it slows down
    const exponentialProgress = 1 - Math.exp(-k * remainingTime);

          let progress = fastStartProgressTarget + (exponentialProgress * (1 - fastStartProgressTarget));
          
          // Ensure progress reaches exactly 100% when time is complete
          if (timeRatio >= 0.99) { // When we're very close to the end
            progress = 1.0;
          }
          
          return progress;
        };

        let progress = getDeceptiveProgress(currentTimeInMs, effectiveDuration);

        // Adjust for speed variations
        const speedMultiplier = (() => {
          if (variation?.metadata?.combination) {
            const speedItem = variation.metadata.combination.find((item: any) => item.type === 'speed');
            return speedItem?.metadata?.speed || 1.0;
          }
          return 1.0;
        })();

  if (speedMultiplier > 1) {
    progress = Math.min(progress * speedMultiplier * 0.7, 1);
  } else if (speedMultiplier < 1) {
    progress = progress / Math.max(speedMultiplier, 0.3);
  }

  progress = Math.min(progress, 1);

  return (
          <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 1000, opacity: settings.opacity }}>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: platformConfig.width,
                height: settings.height,
                backgroundColor: settings.backgroundColor,
                borderRadius: `${settings.borderRadius}px`,
          overflow: 'hidden',
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${progress * 100}%`,
            height: '100%',
                        backgroundColor: settings.progressColor,
                        borderRadius: progress >= 1.0 ? `${settings.borderRadius}px` : `${settings.borderRadius}px 0 0 ${settings.borderRadius}px`,
          }}
        />

        {/* Scrubber */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
                  left: `${Math.min(progress * 100, 100)}%`,
                  width: `${settings.scrubberSize}px`,
                  height: `${settings.scrubberSize}px`,
                  backgroundColor: settings.scrubberColor,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
          </AbsoluteFill>
        );
      })()}
    </AbsoluteFill>
  );
};

// Removed old DeceptiveProgressBarRenderer - now using shared ProgressBar component

export default VideoComposition; 