import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import useStore from '../store/use-store';
import { useProgressBarStore } from '../store/use-progress-bar-store';

interface PersistentProgressBarProps {
  platformConfig: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  effectiveDuration?: number; // For variations with speed changes
  speedMultiplier?: number; // For variations with speed changes
}

export const PersistentProgressBar: React.FC<PersistentProgressBarProps> = ({ 
  platformConfig, 
  effectiveDuration, 
  speedMultiplier 
}) => {
  const { duration, fps } = useStore();
  const { settings } = useProgressBarStore();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  // Use effective duration for variations, fallback to original duration
  const actualDuration = effectiveDuration || duration;
  
  // Debug logging for variations
  if (effectiveDuration && speedMultiplier) {
    console.log(`🎬 ProgressBar: Using variation duration ${actualDuration}ms (speed: ${speedMultiplier}x, original: ${duration}ms)`);
  }
  
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
          top: `${styles.top}px`,
          left: `${styles.left}px`,
          width: `${styles.width}px`,
          height: `${styles.height}px`,
          backgroundColor: 'transparent',
          borderRadius: `${settings.borderRadius}px`,
          overflow: 'hidden',
          boxShadow: 'none',
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: settings.progressColor,
            borderRadius: `${settings.borderRadius}px`,
            transition: 'width 0.1s ease-out',
          }}
        />
        
        {/* Scrubber (playhead) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${progress * 100}%`,
            width: `${settings.scrubberSize}px`,
            height: `${settings.scrubberSize}px`,
            backgroundColor: settings.scrubberColor,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            transition: 'left 0.1s ease-out',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default PersistentProgressBar;

