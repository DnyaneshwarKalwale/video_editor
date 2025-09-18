
import { registerRoot, getInputProps } from 'remotion';
import { Composition } from 'remotion';
import VideoComposition from './VideoComposition';

const Root = () => {
  // Get input props for composition configuration
  const inputProps = getInputProps() as any;
  
  
  // Calculate duration in frames from the JSON data
  const durationInMs = inputProps?.duration || 5000;
  const durationInFrames = Math.floor((durationInMs / 1000) * 24); // 24fps for better performance
  
  // Get width and height from platform config
  const width = inputProps?.platformConfig?.width || 1080;
  const height = inputProps?.platformConfig?.height || 1920;
  

  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={durationInFrames}
        fps={24}
        width={width}
        height={height}
      />
    </>
  );
};

registerRoot(Root);


