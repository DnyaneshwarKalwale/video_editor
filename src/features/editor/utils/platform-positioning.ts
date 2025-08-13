import { PlatformConfig } from "../platform-preview/platform-preview";

export interface PositioningResult {
  left: number;
  top: number;
  width: number;
  height: number;
  objectFit: 'cover' | 'contain' | 'fill';
}

/**
 * Calculate proper video positioning and sizing for different platform aspect ratios
 */
export function calculateVideoPositioning(
  videoWidth: number,
  videoHeight: number,
  platform: PlatformConfig
): PositioningResult {
  const canvasWidth = platform.width;
  const canvasHeight = platform.height;
  
  const videoAspectRatio = videoWidth / videoHeight;
  const canvasAspectRatio = canvasWidth / canvasHeight;
  
  let width: number;
  let height: number;
  let left: number;
  let top: number;
  let objectFit: 'cover' | 'contain' | 'fill' = 'cover';
  
  if (videoAspectRatio > canvasAspectRatio) {
    // Video is wider than canvas - fit to height
    height = canvasHeight;
    width = height * videoAspectRatio;
    left = (canvasWidth - width) / 2;
    top = 0;
  } else {
    // Video is taller than canvas - fit to width
    width = canvasWidth;
    height = width / videoAspectRatio;
    left = 0;
    top = (canvasHeight - height) / 2;
  }
  
  return {
    left,
    top,
    width,
    height,
    objectFit
  };
}

/**
 * Calculate proper text positioning for different platform aspect ratios
 */
export function calculateTextPositioning(
  textWidth: number,
  textHeight: number,
  platform: PlatformConfig
): PositioningResult {
  const canvasWidth = platform.width;
  const canvasHeight = platform.height;
  
  // Center the text on the canvas
  const left = (canvasWidth - textWidth) / 2;
  const top = (canvasHeight - textHeight) / 2;
  
  return {
    left,
    top,
    width: textWidth,
    height: textHeight,
    objectFit: 'fill'
  };
}

/**
 * Get default text size based on platform
 */
export function getDefaultTextSize(platform: PlatformConfig): { width: number; height: number; fontSize: number } {
  const canvasWidth = platform.width;
  const canvasHeight = platform.height;
  
  // Calculate text size based on canvas dimensions
  const baseFontSize = Math.min(canvasWidth, canvasHeight) * 0.08; // 8% of smaller dimension
  const textWidth = canvasWidth * 0.8; // 80% of canvas width
  const textHeight = baseFontSize * 2; // Approximate height for 2 lines
  
  return {
    width: textWidth,
    height: textHeight,
    fontSize: Math.max(baseFontSize, 24) // Minimum 24px font size
  };
}

/**
 * Get default video size based on platform
 */
export function getDefaultVideoSize(platform: PlatformConfig): { width: number; height: number } {
  const canvasWidth = platform.width;
  const canvasHeight = platform.height;
  
  // For videos, we want to cover the entire canvas by default
  return {
    width: canvasWidth,
    height: canvasHeight
  };
}
