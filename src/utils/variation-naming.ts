/**
 * Utility functions for generating meaningful file names for video variations
 */

export interface VariationElement {
  type: 'video' | 'image' | 'audio' | 'text' | 'font' | 'speed';
  elementId: string;
  elementName?: string;
  variationIndex?: number;
  isOriginal?: boolean;
}

export interface VariationData {
  variation?: {
    id: string;
    isOriginal?: boolean;
  };
  videoTrackItems?: any[];
  imageTrackItems?: any[];
  audioTrackItems?: any[];
  textOverlays?: any[];
  metadata?: {
    videoElements?: any[];
    imageElements?: any[];
    audioElements?: any[];
    fontElements?: any[];
    speedElements?: any[];
    combination?: any[];
  };
}

/**
 * Generates a meaningful filename for a video variation
 * Format: M-video_M-image_M-audio_M-text_M-font_M-speed.mp4 or V1-video_V2-image_M-audio_V3-text_V4-font_V5-speed.mp4
 */
export function generateVariationFileName(variationData: VariationData, projectName?: string): string {
  const parts: string[] = [];
  
  // Debug logging to see what data we're receiving
  console.log('[VariationNaming] Input data:', {
    variation: variationData.variation,
    hasMetadata: !!variationData.metadata,
    metadataKeys: variationData.metadata ? Object.keys(variationData.metadata) : [],
    combination: variationData.metadata?.combination,
    videoTrackItems: variationData.videoTrackItems?.length || 0,
    audioTrackItems: variationData.audioTrackItems?.length || 0,
    imageTrackItems: variationData.imageTrackItems?.length || 0,
    textOverlays: variationData.textOverlays?.length || 0
  });
  
  // Check if this is the original variation
  const isOriginal = variationData.variation?.isOriginal || false;
  
  // Check which elements actually exist and have variations
  const videoVariation = getVideoVariationIndex(variationData);
  const imageVariation = getImageVariationIndex(variationData);
  const audioVariation = getAudioVariationIndex(variationData);
  const textVariation = getTextVariationIndex(variationData);
  const fontVariation = getFontVariationIndex(variationData);
  const speedVariation = getSpeedVariationIndex(variationData);
  
  // Check if elements actually exist in the project
  const hasVideo = (variationData.videoTrackItems && variationData.videoTrackItems.length > 0);
  const hasImage = (variationData.imageTrackItems && variationData.imageTrackItems.length > 0);
  const hasAudio = (variationData.audioTrackItems && variationData.audioTrackItems.length > 0);
  const hasText = (variationData.textOverlays && variationData.textOverlays.length > 0);
  
  console.log('[VariationNaming] Element detection:', {
    hasVideo,
    hasImage,
    hasAudio,
    hasText,
    videoCount: variationData.videoTrackItems?.length || 0,
    imageCount: variationData.imageTrackItems?.length || 0,
    audioCount: variationData.audioTrackItems?.length || 0,
    textCount: variationData.textOverlays?.length || 0,
    variations: {
      video: videoVariation,
      image: imageVariation,
      audio: audioVariation,
      text: textVariation,
      font: fontVariation,
      speed: speedVariation
    }
  });
  
  // Only include elements that actually exist in the project
  if (hasVideo) {
    if (isOriginal || videoVariation === 0) {
      parts.push('M-video');
    } else {
      parts.push(`V${videoVariation}-video`);
    }
  }
  
  if (hasImage) {
    if (isOriginal || imageVariation === 0) {
      parts.push('M-image');
    } else {
      parts.push(`V${imageVariation}-image`);
    }
  }
  
  if (hasAudio) {
    if (isOriginal || audioVariation === 0) {
      parts.push('M-audio');
    } else {
      parts.push(`V${audioVariation}-audio`);
    }
  }
  
  if (hasText) {
    if (isOriginal || textVariation === 0) {
      parts.push('M-text');
    } else {
      parts.push(`V${textVariation}-text`);
    }
  }
  
  // Font and speed variations are always included if they exist in metadata
  if (fontVariation > 0 || (variationData.metadata?.fontElements && variationData.metadata.fontElements.length > 0)) {
    if (isOriginal || fontVariation === 0) {
      parts.push('M-font');
    } else {
      parts.push(`V${fontVariation}-font`);
    }
  }
  
  if (speedVariation > 0 || (variationData.metadata?.speedElements && variationData.metadata.speedElements.length > 0)) {
    if (isOriginal || speedVariation === 0) {
      parts.push('M-speed');
    } else {
      parts.push(`V${speedVariation}-speed`);
    }
  }
  
  // Join parts with underscores
  let filename = parts.join('_');
  
  // Add project name prefix if provided
  if (projectName && projectName !== 'Untitled Project') {
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
    filename = `${cleanProjectName}_${filename}`;
  }
  
  // Ensure .mp4 extension
  if (!filename.endsWith('.mp4')) {
    filename += '.mp4';
  }
  
  return filename;
}

/**
 * Determines the video variation index from the variation data
 */
function getVideoVariationIndex(variationData: VariationData): number {
  // Check metadata combination for video variations (this is the main source)
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'video') {
        // Extract variation index from the key (e.g., "VIDEO0" = 0, "VIDEO1" = 1)
        const keyMatch = element.key?.match(/VIDEO(\d+)/);
        if (keyMatch) {
          const index = parseInt(keyMatch[1]);
          if (index > 0) {
            console.log('[VariationNaming] Found video variation in combination:', index);
            return index;
          }
        }
      }
    }
  }
  
  // Check metadata for video elements
  if (variationData.metadata?.videoElements) {
    const videoElements = variationData.metadata.videoElements;
    for (const element of videoElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        console.log('[VariationNaming] Found video variation index:', element.variationIndex);
        return element.variationIndex;
      }
    }
  }
  
  // Check video track items for variations
  if (variationData.videoTrackItems) {
    for (const item of variationData.videoTrackItems) {
      if (item.variationIndex && item.variationIndex > 0) {
        console.log('[VariationNaming] Found video variation in track items:', item.variationIndex);
        return item.variationIndex;
      }
    }
  }
  
  console.log('[VariationNaming] No video variation found, using main');
  return 0; // No variation (main/original)
}

/**
 * Determines the image variation index from the variation data
 */
function getImageVariationIndex(variationData: VariationData): number {
  // Check metadata combination for image variations (this is the main source)
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'image') {
        // Extract variation index from the key (e.g., "IMAGE0" = 0, "IMAGE1" = 1)
        const keyMatch = element.key?.match(/IMAGE(\d+)/);
        if (keyMatch) {
          const index = parseInt(keyMatch[1]);
          if (index > 0) {
            console.log('[VariationNaming] Found image variation in combination:', index);
            return index;
          }
        }
      }
    }
  }
  
  // Check metadata for image elements
  if (variationData.metadata?.imageElements) {
    const imageElements = variationData.metadata.imageElements;
    for (const element of imageElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        return element.variationIndex;
      }
    }
  }
  
  return 0; // No variation (main/original)
}

/**
 * Determines the audio variation index from the variation data
 */
function getAudioVariationIndex(variationData: VariationData): number {
  // Check metadata combination for audio variations (this is the main source)
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'audio') {
        // Extract variation index from the key (e.g., "AUDIO0" = 0, "AUDIO1" = 1)
        const keyMatch = element.key?.match(/AUDIO(\d+)/);
        if (keyMatch) {
          const index = parseInt(keyMatch[1]);
          if (index > 0) {
            console.log('[VariationNaming] Found audio variation in combination:', index);
            return index;
          }
        }
      }
    }
  }
  
  // Check metadata for audio elements
  if (variationData.metadata?.audioElements) {
    const audioElements = variationData.metadata.audioElements;
    for (const element of audioElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        return element.variationIndex;
      }
    }
  }
  
  // Check audio track items for variations
  if (variationData.audioTrackItems) {
    for (const item of variationData.audioTrackItems) {
      if (item.variationIndex && item.variationIndex > 0) {
        return item.variationIndex;
      }
    }
  }
  
  return 0; // No variation (main/original)
}

/**
 * Determines the text variation index from the variation data
 */
function getTextVariationIndex(variationData: VariationData): number {
  // Check metadata combination for text variations (this is the main source)
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    console.log('[VariationNaming] Checking combination for text variations:', combination);
    for (const element of combination) {
      if (element.type === 'text') {
        // Extract variation index from the key (e.g., "TEXT0" = 0, "TEXT1" = 1)
        const keyMatch = element.key?.match(/TEXT(\d+)/);
        if (keyMatch) {
          const index = parseInt(keyMatch[1]);
          if (index > 0) {
            console.log('[VariationNaming] Found text variation in combination:', index);
            return index;
          }
        }
      }
    }
  }
  
  // Check text overlays for variations
  if (variationData.textOverlays) {
    console.log('[VariationNaming] Checking text overlays for variations:', variationData.textOverlays);
    for (const overlay of variationData.textOverlays) {
      if (overlay.variationIndex && overlay.variationIndex > 0) {
        console.log('[VariationNaming] Found text variation in overlays:', overlay.variationIndex);
        return overlay.variationIndex;
      }
    }
  }
  
  console.log('[VariationNaming] No text variation found, using main');
  return 0; // No variation (main/original)
}

/**
 * Determines the font variation index from the variation data
 */
function getFontVariationIndex(variationData: VariationData): number {
  // Check metadata combination for font variations (this is the main source)
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'font') {
        // Extract variation index from the key (e.g., "FONT0" = 0, "FONT1" = 1)
        const keyMatch = element.key?.match(/FONT(\d+)/);
        if (keyMatch) {
          const index = parseInt(keyMatch[1]);
          if (index > 0) {
            console.log('[VariationNaming] Found font variation in combination:', index);
            return index;
          }
        }
      }
    }
  }
  
  // Check metadata for font elements
  if (variationData.metadata?.fontElements) {
    const fontElements = variationData.metadata.fontElements;
    for (const element of fontElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        return element.variationIndex;
      }
    }
  }
  
  // Check text overlays for font variations
  if (variationData.textOverlays) {
    for (const overlay of variationData.textOverlays) {
      if (overlay.fontVariationIndex && overlay.fontVariationIndex > 0) {
        return overlay.fontVariationIndex;
      }
    }
  }
  
  return 0; // No variation (main/original)
}

/**
 * Determines the speed variation index from the variation data
 */
function getSpeedVariationIndex(variationData: VariationData): number {
  // Check metadata combination for speed variations (this is the main source)
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'speed') {
        // Extract variation index from the key (e.g., "SPEED0" = 0, "SPEED1" = 1)
        const keyMatch = element.key?.match(/SPEED(\d+)/);
        if (keyMatch) {
          const index = parseInt(keyMatch[1]);
          if (index > 0) {
            console.log('[VariationNaming] Found speed variation in combination:', index);
            return index;
          }
        }
      }
    }
  }
  
  // Check metadata for speed elements
  if (variationData.metadata?.speedElements) {
    const speedElements = variationData.metadata.speedElements;
    for (const element of speedElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        return element.variationIndex;
      }
    }
  }
  
  // Check video track items for speed variations
  if (variationData.videoTrackItems) {
    for (const item of variationData.videoTrackItems) {
      if (item.speedVariationIndex && item.speedVariationIndex > 0) {
        return item.speedVariationIndex;
      }
    }
  }
  
  // Check audio track items for speed variations
  if (variationData.audioTrackItems) {
    for (const item of variationData.audioTrackItems) {
      if (item.speedVariationIndex && item.speedVariationIndex > 0) {
        return item.speedVariationIndex;
      }
    }
  }
  
  return 0; // No variation (main/original)
}

/**
 * Alternative naming function that uses element names if available
 */
export function generateDetailedVariationFileName(variationData: VariationData, projectName?: string): string {
  const parts: string[] = [];
  
  // Check if this is the original variation
  const isOriginal = variationData.variation?.isOriginal || false;
  
  // Check which elements actually exist and have variations
  const videoInfo = getVideoVariationInfo(variationData);
  const imageInfo = getImageVariationInfo(variationData);
  const audioInfo = getAudioVariationInfo(variationData);
  const textInfo = getTextVariationInfo(variationData);
  const fontInfo = getFontVariationInfo(variationData);
  const speedInfo = getSpeedVariationInfo(variationData);
  
  // Check if elements actually exist in the project
  const hasVideo = (variationData.videoTrackItems && variationData.videoTrackItems.length > 0);
  const hasImage = (variationData.imageTrackItems && variationData.imageTrackItems.length > 0);
  const hasAudio = (variationData.audioTrackItems && variationData.audioTrackItems.length > 0);
  const hasText = (variationData.textOverlays && variationData.textOverlays.length > 0);
  
  // Only include elements that actually exist in the project
  if (hasVideo) parts.push(videoInfo);
  if (hasImage) parts.push(imageInfo);
  if (hasAudio) parts.push(audioInfo);
  if (hasText) parts.push(textInfo);
  
  // Font and speed variations are included if they exist in metadata
  if (fontInfo !== 'Main-font' || (variationData.metadata?.fontElements && variationData.metadata.fontElements.length > 0)) {
    parts.push(fontInfo);
  }
  
  if (speedInfo !== 'Main-speed' || (variationData.metadata?.speedElements && variationData.metadata.speedElements.length > 0)) {
    parts.push(speedInfo);
  }
  
  // Join parts with underscores
  let filename = parts.join('_');
  
  // Add project name prefix if provided
  if (projectName && projectName !== 'Untitled Project') {
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
    filename = `${cleanProjectName}_${filename}`;
  }
  
  // Ensure .mp4 extension
  if (!filename.endsWith('.mp4')) {
    filename += '.mp4';
  }
  
  return filename;
}

function getVideoVariationInfo(variationData: VariationData): string {
  if (variationData.metadata?.videoElements) {
    const videoElements = variationData.metadata.videoElements;
    for (const element of videoElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        const name = element.elementName || 'video';
        return `V${element.variationIndex}-${name}`;
      }
    }
  }
  return 'Main-video';
}

function getImageVariationInfo(variationData: VariationData): string {
  if (variationData.metadata?.imageElements) {
    const imageElements = variationData.metadata.imageElements;
    for (const element of imageElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        const name = element.elementName || 'image';
        return `V${element.variationIndex}-${name}`;
      }
    }
  }
  
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'image' && element.variationIndex && element.variationIndex > 0) {
        const name = element.elementName || 'image';
        return `V${element.variationIndex}-${name}`;
      }
    }
  }
  
  return 'Main-image';
}

function getAudioVariationInfo(variationData: VariationData): string {
  if (variationData.metadata?.audioElements) {
    const audioElements = variationData.metadata.audioElements;
    for (const element of audioElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        const name = element.elementName || 'audio';
        return `V${element.variationIndex}-${name}`;
      }
    }
  }
  return 'Main-audio';
}

function getTextVariationInfo(variationData: VariationData): string {
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'text' && element.variationIndex && element.variationIndex > 0) {
        const name = element.elementName || 'text';
        return `V${element.variationIndex}-${name}`;
      }
    }
  }
  return 'Main-text';
}

function getFontVariationInfo(variationData: VariationData): string {
  if (variationData.metadata?.fontElements) {
    const fontElements = variationData.metadata.fontElements;
    for (const element of fontElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        const name = element.elementName || 'font';
        return `V${element.variationIndex}-${name}`;
      }
    }
  }
  
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'font' && element.variationIndex && element.variationIndex > 0) {
        const name = element.elementName || 'font';
        return `V${element.variationIndex}-${name}`;
      }
    }
  }
  
  return 'Main-font';
}

function getSpeedVariationInfo(variationData: VariationData): string {
  if (variationData.metadata?.speedElements) {
    const speedElements = variationData.metadata.speedElements;
    for (const element of speedElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        const name = element.elementName || 'speed';
        return `V${element.variationIndex}-${name}`;
      }
    }
  }
  
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'speed' && element.variationIndex && element.variationIndex > 0) {
        const name = element.elementName || 'speed';
        return `V${element.variationIndex}-${name}`;
      }
    }
  }
  
  return 'Main-speed';
}
