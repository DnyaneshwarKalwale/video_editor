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

  // Calculate variable speed progress - progress bar always goes 0% to 100% but speed varies
  const getVariableSpeedProgress = (currentTime: number, totalDuration: number): number => {
    const currentTimeMs = currentTime;

    // Convert user settings to milliseconds
    const fastStartDurationMs = settings.fastStartDuration * 1000;
    const fastEndDurationMs = settings.fastEndDuration * 1000;

    // Speed multipliers (reinterpret progress values as speed multipliers)
    // If user sets 0.5, that means 5x speed (0.5 * 10 = 5)
    const fastStartSpeed = Math.max(settings.fastStartProgress * 10, 1);
    const fastEndSpeed = Math.max(settings.fastEndProgress * 10, 1);
    const normalSpeed = 1.0; // Normal speed for middle section

    // Time boundaries in milliseconds
    const fastStartEndTime = Math.min(fastStartDurationMs, totalDuration);
    const fastEndStartTime = Math.max(totalDuration - fastEndDurationMs, fastStartEndTime);

    let effectiveTime = 0;

    // Calculate effective time based on which period we're in
    if (currentTimeMs <= fastStartEndTime) {
      // In fast start period
      effectiveTime = currentTimeMs * fastStartSpeed;
    } else if (currentTimeMs >= fastEndStartTime) {
      // In fast end period
      const fastStartEffectiveTime = fastStartEndTime * fastStartSpeed;
      const middleEffectiveTime = (fastEndStartTime - fastStartEndTime) * normalSpeed;
      const fastEndElapsed = currentTimeMs - fastEndStartTime;
      const fastEndEffectiveTime = fastEndElapsed * fastEndSpeed;

      effectiveTime = fastStartEffectiveTime + middleEffectiveTime + fastEndEffectiveTime;
    } else {
      // In middle period (normal/slow speed)
      const fastStartEffectiveTime = fastStartEndTime * fastStartSpeed;
      const middleElapsed = currentTimeMs - fastStartEndTime;
      const middleEffectiveTime = middleElapsed * normalSpeed;

      effectiveTime = fastStartEffectiveTime + middleEffectiveTime;
    }

    // Calculate total effective duration (what the total would be with speed changes)
    const totalFastStartEffective = fastStartEndTime * fastStartSpeed;
    const totalMiddleEffective = (fastEndStartTime - fastStartEndTime) * normalSpeed;
    const totalFastEndEffective = (totalDuration - fastEndStartTime) * fastEndSpeed;
    const totalEffectiveDuration = totalFastStartEffective + totalMiddleEffective + totalFastEndEffective;

    // Calculate progress as ratio of effective time to total effective duration
    const progress = Math.min(effectiveTime / totalEffectiveDuration, 1);

    return progress;
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
