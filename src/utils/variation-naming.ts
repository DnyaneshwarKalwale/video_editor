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
 * Format: M-video_M-audio_M-text_M-font_M-speed.mp4 or V1-video_M-audio_V2-text_V3-font_V4-speed.mp4
 */
export function generateVariationFileName(variationData: VariationData, projectName?: string): string {
  const parts: string[] = [];
  
  // Check if this is the original variation
  const isOriginal = variationData.variation?.isOriginal || false;
  
  if (isOriginal) {
    // For original, use "M" prefix for all elements
    parts.push('M-video', 'M-audio', 'M-text', 'M-font', 'M-speed');
  } else {
    // For variations, determine which elements have variations
    const videoVariation = getVideoVariationIndex(variationData);
    const audioVariation = getAudioVariationIndex(variationData);
    const textVariation = getTextVariationIndex(variationData);
    const fontVariation = getFontVariationIndex(variationData);
    const speedVariation = getSpeedVariationIndex(variationData);
    
    // Add video part
    if (videoVariation > 0) {
      parts.push(`V${videoVariation}-video`);
    } else {
      parts.push('M-video');
    }
    
    // Add audio part
    if (audioVariation > 0) {
      parts.push(`V${audioVariation}-audio`);
    } else {
      parts.push('M-audio');
    }
    
    // Add text part
    if (textVariation > 0) {
      parts.push(`V${textVariation}-text`);
    } else {
      parts.push('M-text');
    }
    
    // Add font part
    if (fontVariation > 0) {
      parts.push(`V${fontVariation}-font`);
    } else {
      parts.push('M-font');
    }
    
    // Add speed part
    if (speedVariation > 0) {
      parts.push(`V${speedVariation}-speed`);
    } else {
      parts.push('M-speed');
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
  // Check metadata for video elements
  if (variationData.metadata?.videoElements) {
    const videoElements = variationData.metadata.videoElements;
    for (const element of videoElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        return element.variationIndex;
      }
    }
  }
  
  // Check video track items for variations
  if (variationData.videoTrackItems) {
    for (const item of variationData.videoTrackItems) {
      if (item.variationIndex && item.variationIndex > 0) {
        return item.variationIndex;
      }
    }
  }
  
  return 0; // No variation (main/original)
}

/**
 * Determines the audio variation index from the variation data
 */
function getAudioVariationIndex(variationData: VariationData): number {
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
  // Check metadata for text elements
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'text' && element.variationIndex && element.variationIndex > 0) {
        return element.variationIndex;
      }
    }
  }
  
  // Check text overlays for variations
  if (variationData.textOverlays) {
    for (const overlay of variationData.textOverlays) {
      if (overlay.variationIndex && overlay.variationIndex > 0) {
        return overlay.variationIndex;
      }
    }
  }
  
  return 0; // No variation (main/original)
}

/**
 * Determines the font variation index from the variation data
 */
function getFontVariationIndex(variationData: VariationData): number {
  // Check metadata for font elements
  if (variationData.metadata?.fontElements) {
    const fontElements = variationData.metadata.fontElements;
    for (const element of fontElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        return element.variationIndex;
      }
    }
  }
  
  // Check metadata combination for font variations
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'font' && element.variationIndex && element.variationIndex > 0) {
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
  // Check metadata for speed elements
  if (variationData.metadata?.speedElements) {
    const speedElements = variationData.metadata.speedElements;
    for (const element of speedElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        return element.variationIndex;
      }
    }
  }
  
  // Check metadata combination for speed variations
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'speed' && element.variationIndex && element.variationIndex > 0) {
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
  
  if (isOriginal) {
    // For original, use "Main" prefix
    parts.push('Main-video', 'Main-audio', 'Main-text', 'Main-font', 'Main-speed');
  } else {
    // For variations, use element names and variation indices
    const videoInfo = getVideoVariationInfo(variationData);
    const audioInfo = getAudioVariationInfo(variationData);
    const textInfo = getTextVariationInfo(variationData);
    const fontInfo = getFontVariationInfo(variationData);
    const speedInfo = getSpeedVariationInfo(variationData);
    
    parts.push(videoInfo, audioInfo, textInfo, fontInfo, speedInfo);
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
