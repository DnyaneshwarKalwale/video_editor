import React from 'react';
import { useCurrentFrame } from 'remotion';
import useStore from '../store/use-store';
import { useProgressBarStore } from '../store/use-progress-bar-store';
import { ProgressBar } from '../../../components/shared/ProgressBar';

interface DeceptiveProgressBarProps {
  platformConfig: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  effectiveDuration?: number;
  speedMultiplier?: number;
}

export const DeceptiveProgressBar: React.FC<DeceptiveProgressBarProps> = ({
  platformConfig,
  effectiveDuration,
  speedMultiplier = 1.0
}) => {
  const { duration, fps } = useStore();
  const { settings } = useProgressBarStore();
  const frame = useCurrentFrame();

  const actualDuration = effectiveDuration || duration;
  const currentTimeInMs = (frame / fps) * 1000;

  // Use the shared ProgressBar component
  return (
    <ProgressBar
      platformConfig={platformConfig}
      settings={settings}
      currentTimeInMs={currentTimeInMs}
      duration={actualDuration}
      speedMultiplier={speedMultiplier}
    />
  );
};

export default DeceptiveProgressBar;