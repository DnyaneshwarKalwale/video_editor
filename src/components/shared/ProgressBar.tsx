import React from 'react';
import { AbsoluteFill } from 'remotion';

interface ProgressBarSettings {
  backgroundColor: string;
  progressColor: string;
  scrubberColor: string;
  height: number;
  scrubberSize: number;
  borderRadius: number;
  opacity: number;
  shadowBlur: number;
  shadowColor: string;
  isVisible: boolean;
  useDeceptiveProgress: boolean;
  fastStartDuration: number; // seconds to show fast progress at start
  fastStartProgress: number; // percentage to reach in fast start (0-1)
  fastEndDuration: number; // seconds to show fast progress at end
  fastEndProgress: number; // percentage to start fast progress at end (0-1)
}

interface ProgressBarProps {
  platformConfig: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  settings: ProgressBarSettings;
  currentTimeInMs: number;
  duration: number;
  speedMultiplier?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  platformConfig,
  settings,
  currentTimeInMs,
  duration,
  speedMultiplier = 1.0
}) => {

  // Progress bar with specific time periods and progress amounts
  const getVariableSpeedProgress = (currentTime: number, totalDuration: number): number => {
    const currentTimeMs = currentTime;
    const totalDurationMs = totalDuration;

    // Time periods in milliseconds
    const fastStartDurationMs = settings.fastStartDuration * 1000;
    const fastEndDurationMs = settings.fastEndDuration * 1000;

    // Progress amounts (0-1)
    const fastStartProgressAmount = settings.fastStartProgress;
    const fastEndStartProgress = settings.fastEndProgress;

    // Check what user has set
    const hasFastStartDuration = fastStartDurationMs > 0;
    const hasFastStartProgress = fastStartProgressAmount > 0;
    const hasFastEndDuration = fastEndDurationMs > 0;
    const hasFastEndProgress = fastEndStartProgress > 0;

    // If no settings at all, use default deceptive pattern (very fast → normal → slow → very slow)
    if (!hasFastStartDuration && !hasFastStartProgress && !hasFastEndDuration && !hasFastEndProgress) {
      // Default deceptive pattern: 0% → 20% (fast) → 60% (slow) → 100% (very fast)
      const quarter1 = totalDurationMs * 0.25; // First 25%
      const quarter3 = totalDurationMs * 0.75; // Last 25%
      
      if (currentTimeMs <= quarter1) {
        // Very fast start: 0% → 20% in first 25%
        const timeRatio = currentTimeMs / quarter1;
        return timeRatio * 0.2;
      } else if (currentTimeMs >= quarter3) {
        // Very fast end: 60% → 100% in last 25%
        const timeRatio = (currentTimeMs - quarter3) / (totalDurationMs - quarter3);
        const endProgress = timeRatio * 0.4; // 40% progress in this period
        return 0.6 + endProgress;
      } else {
        // Slow middle: 20% → 60% in middle 50%
        const middleTimeRatio = (currentTimeMs - quarter1) / (quarter3 - quarter1);
        const middleProgress = middleTimeRatio * 0.4; // 40% progress in this period
        return 0.2 + middleProgress;
      }
    }

    // Determine effective settings with smart defaults
    let fastStartEndTime, fastStartProgress, fastEndStartTime, fastEndProgress;

    // Fast Start Settings
    if (hasFastStartDuration && hasFastStartProgress) {
      // Both set: use user values
      fastStartEndTime = Math.min(fastStartDurationMs, totalDurationMs);
      fastStartProgress = fastStartProgressAmount;
    } else if (hasFastStartDuration && !hasFastStartProgress) {
      // Only duration: reach 70% in that time (much faster than normal)
      fastStartEndTime = Math.min(fastStartDurationMs, totalDurationMs);
      fastStartProgress = 0.7;
    } else if (!hasFastStartDuration && hasFastStartProgress) {
      // Only progress: reach that % in first 20% of video
      fastStartEndTime = totalDurationMs * 0.2;
      fastStartProgress = fastStartProgressAmount;
    } else {
      // Neither set: no fast start
      fastStartEndTime = 0;
      fastStartProgress = 0;
    }

    // Fast End Settings
    if (hasFastEndDuration && hasFastEndProgress) {
      // Both set: use user values
      fastEndStartTime = Math.max(totalDurationMs - fastEndDurationMs, fastStartEndTime);
      fastEndProgress = fastEndStartProgress;
    } else if (hasFastEndDuration && !hasFastEndProgress) {
      // Only duration: start from 30% in that time (much faster than normal)
      fastEndStartTime = Math.max(totalDurationMs - fastEndDurationMs, fastStartEndTime);
      fastEndProgress = 0.3;
    } else if (!hasFastEndDuration && hasFastEndProgress) {
      // Only progress: start from that % in last 20% of video
      fastEndStartTime = Math.max(totalDurationMs * 0.8, fastStartEndTime);
      fastEndProgress = fastEndStartProgress;
    } else {
      // Neither set: no fast end
      fastEndStartTime = totalDurationMs;
      fastEndProgress = 1;
    }

    // Ensure fast start progress is less than fast end progress
    if (fastStartProgress >= fastEndProgress) {
      fastStartProgress = Math.max(0, fastEndProgress - 0.01);
    }

    // Calculate progress based on current time
    if (currentTimeMs <= fastStartEndTime) {
      // Fast start period: 0% to fastStartProgress%
      const timeRatio = fastStartEndTime > 0 ? currentTimeMs / fastStartEndTime : 0;
      return timeRatio * fastStartProgress;
    }
    else if (currentTimeMs >= fastEndStartTime) {
      // Fast end period: fastEndProgress% to 100%
      const timeRatio = (totalDurationMs - fastEndStartTime) > 0 ? 
        (currentTimeMs - fastEndStartTime) / (totalDurationMs - fastEndStartTime) : 0;
      const endProgress = timeRatio * (1 - fastEndProgress);
      return fastEndProgress + endProgress;
    }
    else {
      // Middle period: fastStartProgress% to fastEndProgress%
      const middleTimeRatio = (fastEndStartTime - fastStartEndTime) > 0 ? 
        (currentTimeMs - fastStartEndTime) / (fastEndStartTime - fastStartEndTime) : 0;
      const middleProgress = middleTimeRatio * (fastEndProgress - fastStartProgress);
      return fastStartProgress + middleProgress;
    }
  };

  let progress = settings.useDeceptiveProgress ?
    getVariableSpeedProgress(currentTimeInMs, duration) :
    Math.min(currentTimeInMs / duration, 1);

  // Adjust for speed variations
  if (speedMultiplier > 1) {
    progress = Math.min(progress * speedMultiplier * 0.7, 1);
  } else if (speedMultiplier < 1) {
    progress = progress / Math.max(speedMultiplier, 0.3);
  }

  progress = Math.min(progress, 1);

  if (!settings.isVisible) {
    return null;
  }

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
};

export default ProgressBar;
