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

    // Safety check for zero duration
    if (totalDurationMs <= 0) {
      return 0;
    }

    // Validation: Ensure progress settings are valid
    const fastStartProgress = Math.max(0, Math.min(1, settings.fastStartProgress));
    const fastEndProgress = Math.max(0, Math.min(1, settings.fastEndProgress));
    
    // If fast start >= fast end, fall back to normal progress
    if (fastStartProgress >= fastEndProgress) {
      return Math.min(currentTimeMs / totalDurationMs, 1);
    }

    // Time periods in milliseconds
    const fastStartDurationMs = settings.fastStartDuration * 1000;
    const fastEndDurationMs = settings.fastEndDuration * 1000;

    // Progress amounts (0-1) - how much progress to complete in each period
    const fastStartProgressAmount = fastStartProgress; // e.g., 0.1 = 10% of progress bar
    const fastEndStartProgress = fastEndProgress; // e.g., 0.9 = start fast end at 90%

    // Calculate how much progress to complete in fast end period
    const fastEndProgressAmount = 1 - fastEndStartProgress; // e.g., 0.1 = complete remaining 10%
    
    // The remaining progress for middle section
    const middleProgressAmount = fastEndStartProgress - fastStartProgressAmount;

    // Time boundaries with safety checks
    const fastStartEndTime = Math.min(fastStartDurationMs, totalDurationMs);
    const fastEndStartTime = Math.max(totalDurationMs - fastEndDurationMs, fastStartEndTime);

    let progress = 0;

    if (currentTimeMs <= fastStartEndTime) {
      // Fast start period: 0% to fastStartProgressAmount%
      const timeRatio = fastStartEndTime > 0 ? currentTimeMs / fastStartEndTime : 0;
      progress = timeRatio * fastStartProgressAmount;
    }
    else if (currentTimeMs >= fastEndStartTime) {
      // Fast end period: fastEndStartProgress% to 100%
      const fastStartProgress = fastStartProgressAmount;
      const middleProgress = middleProgressAmount;
      const endTimeRatio = (totalDurationMs - fastEndStartTime) > 0 ? 
        (currentTimeMs - fastEndStartTime) / (totalDurationMs - fastEndStartTime) : 0;
      const endProgress = endTimeRatio * fastEndProgressAmount;

      progress = fastStartProgress + middleProgress + endProgress;
    }
    else {
      // Middle period: fastStartProgressAmount% to fastEndStartProgress%
      const fastStartProgress = fastStartProgressAmount;
      const middleTimeRatio = (fastEndStartTime - fastStartEndTime) > 0 ? 
        (currentTimeMs - fastStartEndTime) / (fastEndStartTime - fastStartEndTime) : 0;
      const middleProgress = middleTimeRatio * middleProgressAmount;

      progress = fastStartProgress + middleProgress;
    }

    // Ensure we reach exactly 100% at the end
    if (currentTimeMs >= totalDurationMs * 0.99) {
      progress = 1.0;
    }

    return Math.min(Math.max(progress, 0), 1);
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
