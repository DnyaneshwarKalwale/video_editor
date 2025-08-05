import React, { useRef } from 'react';
import { TextOverlayData } from '../types/variation-types';

interface TextOverlayEditorProps {
  overlay: TextOverlayData;
  videoRef: React.RefObject<HTMLVideoElement>;
  containerWidth: number;
  containerHeight: number;
  currentTime: number;
  platformConfig?: {
    width: number;
    height: number;
  };
}

const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({
  overlay,
  videoRef,
  containerWidth,
  containerHeight,
  currentTime,
  platformConfig,
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  
  // Check if overlay should be visible at current time
  // Convert currentTime from milliseconds to seconds for comparison
  const currentTimeInSeconds = currentTime / 1000;
  const isVisible = currentTimeInSeconds >= overlay.timing.from && currentTimeInSeconds <= overlay.timing.to;

  // Calculate scaling factor: current container size vs original platform size
  // This ensures text appears in the same relative position
  const scale = platformConfig ? Math.min(
    containerWidth / platformConfig.width,
    containerHeight / platformConfig.height
  ) : 1;

  const scaledStyle = {
    position: 'absolute' as const,
    top: `${overlay.position.top * scale}px`,
    left: `${overlay.position.left * scale}px`,
    fontSize: `${overlay.style.fontSize * scale}px`,
    fontFamily: overlay.style.fontFamily,
    color: overlay.style.color,
    backgroundColor: overlay.style.backgroundColor || 'transparent',
    borderWidth: overlay.style.borderWidth ? `${overlay.style.borderWidth * scale}px` : '0',
    borderColor: overlay.style.borderColor || 'transparent',
    borderStyle: 'solid',
    textAlign: overlay.style.textAlign as any,
    fontWeight: overlay.style.fontWeight || 'normal',
    textDecoration: overlay.style.textDecoration || 'none',
    opacity: overlay.style.opacity !== undefined ? overlay.style.opacity / 100 : 1,
    transform: overlay.transform || 'none',
    width: overlay.width ? `${overlay.width * scale}px` : 'auto',
    height: overlay.height ? `${overlay.height * scale}px` : 'auto',
    cursor: 'default',
    zIndex: 10,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={textRef}
      style={scaledStyle}
    >
      {overlay.text}
    </div>
  );
};

export default TextOverlayEditor;