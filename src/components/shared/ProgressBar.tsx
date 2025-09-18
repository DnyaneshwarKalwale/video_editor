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
  fastStartDuration: number; // seconds to show fast progress
  fastStartProgress: number; // percentage to reach in fast start (0-1)
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

    return fastStartProgressTarget + (exponentialProgress * (1 - fastStartProgressTarget));
  };

  let progress = getDeceptiveProgress(currentTimeInMs, duration);

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
            borderRadius: `${settings.borderRadius}px`,
          }}
        />

        {/* Scrubber */}
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
            border: '2px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default ProgressBar;
