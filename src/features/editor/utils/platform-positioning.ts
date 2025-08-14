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
 * This ensures videos are centered and properly fit within the canvas bounds
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
  
  // Calculate the maximum size that fits within the canvas while maintaining aspect ratio
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
  
  // Ensure the element doesn't go outside canvas bounds
  if (left < 0) left = 0;
  if (top < 0) top = 0;
  if (left + width > canvasWidth) width = canvasWidth - left;
  if (top + height > canvasHeight) height = canvasHeight - top;
  
  return {
    left,
    top,
    width,
    height,
    objectFit
  };
}

/**
 * Calculate proper image positioning and sizing for different platform aspect ratios
 * Similar to video positioning but optimized for images
 */
export function calculateImagePositioning(
  imageWidth: number,
  imageHeight: number,
  platform: PlatformConfig
): PositioningResult {
  return calculateVideoPositioning(imageWidth, imageHeight, platform);
}

/**
 * Calculate proper text positioning for different platform aspect ratios
 * Centers text on the canvas
 */
export function calculateTextPositioning(
  textWidth: number,
  textHeight: number,
  platform: PlatformConfig
): PositioningResult {
  const canvasWidth = platform.width;
  const canvasHeight = platform.height;
  
  // Center the text on the canvas
  const left = Math.max(0, (canvasWidth - textWidth) / 2);
  const top = Math.max(0, (canvasHeight - textHeight) / 2);
  
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
 * Calculates appropriate text dimensions for the current platform
 */
export function getDefaultTextSize(platform: PlatformConfig): { width: number; height: number; fontSize: number } {
  const canvasWidth = platform.width;
  const canvasHeight = platform.height;
  
  // Calculate text size based on canvas dimensions
  const baseFontSize = Math.min(canvasWidth, canvasHeight) * 0.06; // 6% of smaller dimension
  const textWidth = canvasWidth * 0.7; // 70% of canvas width
  const textHeight = baseFontSize * 2.5; // Approximate height for 2-3 lines
  
  return {
    width: textWidth,
    height: textHeight,
    fontSize: Math.max(baseFontSize, 20) // Minimum 20px font size
  };
}

/**
 * Get default video size based on platform
 * Returns the full canvas size for videos to cover the entire area
 */
export function getDefaultVideoSize(platform: PlatformConfig): { width: number; height: number } {
  return {
    width: platform.width,
    height: platform.height
  };
}

/**
 * Get default image size based on platform
 * Similar to video but can be adjusted for images
 */
export function getDefaultImageSize(platform: PlatformConfig): { width: number; height: number } {
  return getDefaultVideoSize(platform);
}

/**
 * Universal positioning function that works for all element types
 * Automatically determines the best positioning based on element type and platform
 */
export function calculateElementPositioning(
  elementType: 'video' | 'image' | 'text',
  originalWidth: number,
  originalHeight: number,
  platform: PlatformConfig
): PositioningResult {
  switch (elementType) {
    case 'video':
      return calculateVideoPositioning(originalWidth, originalHeight, platform);
    case 'image':
      return calculateImagePositioning(originalWidth, originalHeight, platform);
    case 'text':
      const textSize = getDefaultTextSize(platform);
      return calculateTextPositioning(textSize.width, textSize.height, platform);
    default:
      const defaultSize = getDefaultVideoSize(platform);
      return {
        left: 0,
        top: 0,
        width: defaultSize.width,
        height: defaultSize.height,
        objectFit: 'cover'
      };
  }
}
