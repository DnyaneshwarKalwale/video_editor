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
    audioTrackItems = []
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
    </AbsoluteFill>
  );
};

export default VideoComposition; 