import { NamingConfig } from '@/features/editor/variations/components/NamingConfiguration';

export interface VariationData {
  variation: {
    id: string;
    isOriginal: boolean;
  };
  videoTrackItems?: any[];
  audioTrackItems?: any[];
  imageTrackItems?: any[];
  textOverlays?: any[];
  metadata?: any;
}

/**
 * Generates flexible filenames based on user configuration
 */
export function generateFlexibleVariationFileName(
  variationData: VariationData, 
  projectName?: string,
  namingConfig?: NamingConfig
): string {
  const parts: string[] = [];
  
  // Use default config if none provided
  const config = namingConfig || {
    elementNames: {
      video: 'video',
      audio: 'audio', 
      text: 'text',
      image: 'image',
      font: 'font',
      speed: 'speed'
    },
    pattern: {
      type: 'letters_upper'
    },
    platform: {
      enabled: true,
      customName: undefined
    }
  };

  // Check if this is the original variation
  const isOriginal = variationData.variation?.isOriginal || false;
  
  // Get variation indices from the combination data
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
  const hasFont = (variationData.metadata?.fontElements && variationData.metadata.fontElements.length > 0);
  const hasSpeed = (variationData.metadata?.speedElements && variationData.metadata.speedElements.length > 0);
  
  // Build the filename based on what elements exist and their variations
  if (hasVideo) {
    if (videoVariation === 0) {
      parts.push(`M-${config.elementNames.video}`);
    } else {
      const patternValue = getPatternValue(videoVariation, config.pattern);
      parts.push(`${patternValue}-${config.elementNames.video}`);
    }
  }
  
  if (hasText) {
    if (textVariation === 0) {
      parts.push(`M-${config.elementNames.text}`);
    } else {
      const patternValue = getPatternValue(textVariation, config.pattern);
      parts.push(`${patternValue}-${config.elementNames.text}`);
    }
  }
  
  if (hasAudio) {
    if (audioVariation === 0) {
      parts.push(`M-${config.elementNames.audio}`);
    } else {
      const patternValue = getPatternValue(audioVariation, config.pattern);
      parts.push(`${patternValue}-${config.elementNames.audio}`);
    }
  }
  
  if (hasFont) {
    if (fontVariation === 0) {
      parts.push(`M-${config.elementNames.font}`);
    } else {
      const patternValue = getPatternValue(fontVariation, config.pattern);
      parts.push(`${patternValue}-${config.elementNames.font}`);
    }
  }
  
  if (hasSpeed) {
    if (speedVariation === 0) {
      parts.push(`M-${config.elementNames.speed}`);
    } else {
      const patternValue = getPatternValue(speedVariation, config.pattern);
      parts.push(`${patternValue}-${config.elementNames.speed}`);
    }
  }
  
  if (hasImage) {
    if (imageVariation === 0) {
      parts.push(`M-${config.elementNames.image}`);
    } else {
      const patternValue = getPatternValue(imageVariation, config.pattern);
      parts.push(`${patternValue}-${config.elementNames.image}`);
    }
  }
  
  // Join parts with underscores
  let filename = parts.join('_');
  
  // Add platform/project name prefix if enabled
  if (config.platform.enabled) {
    let platformName = '';
    
    if (config.platform.customName) {
      // Use custom platform name
      platformName = config.platform.customName.replace(/[^a-zA-Z0-9-_]/g, '_');
    } else if (projectName && projectName !== 'Untitled Project') {
      // Use project name
      platformName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
    }
    
    if (platformName) {
      filename = `${platformName}_${filename}`;
    }
  }
  
  // Ensure .mp4 extension
  if (!filename.endsWith('.mp4')) {
    filename += '.mp4';
  }
  
  return filename;
}

/**
 * Gets the pattern value for a given index
 */
function getPatternValue(index: number, pattern: NamingConfig['pattern']): string {
  switch (pattern.type) {
    case 'numbers':
      return index.toString();
    case 'letters_upper':
      return String.fromCharCode(64 + index); // A, B, C (index 1 = A)
    case 'letters_lower':
      return String.fromCharCode(96 + index); // a, b, c (index 1 = a)
    case 'roman':
      const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
      return roman[index] || index.toString();
    case 'custom':
      if (pattern.customSequence && pattern.customSequence.length > 0) {
        return pattern.customSequence[index - 1] || index.toString();
      }
      return index.toString();
    default:
      return index.toString();
  }
}

/**
 * Determines the video variation index from the variation data
 */
function getVideoVariationIndex(variationData: VariationData): number {
  // Check metadata combination for video variations
  if (variationData.metadata?.combination) {
    const videoElement = variationData.metadata.combination.find(
      (item: any) => item.type === 'video'
    );
    if (videoElement) {
      // Extract variation number from key (e.g., "VIDEO1", "VIDEO2")
      const match = videoElement.key?.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    }
  }
  return 0; // No variation (main/original)
}

/**
 * Determines the image variation index from the variation data
 */
function getImageVariationIndex(variationData: VariationData): number {
  if (variationData.metadata?.combination) {
    const imageElement = variationData.metadata.combination.find(
      (item: any) => item.type === 'image'
    );
    if (imageElement) {
      const match = imageElement.key?.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    }
  }
  return 0;
}

/**
 * Determines the audio variation index from the variation data
 */
function getAudioVariationIndex(variationData: VariationData): number {
  if (variationData.metadata?.combination) {
    const audioElement = variationData.metadata.combination.find(
      (item: any) => item.type === 'audio'
    );
    if (audioElement) {
      const match = audioElement.key?.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    }
  }
  return 0;
}

/**
 * Determines the text variation index from the variation data
 */
function getTextVariationIndex(variationData: VariationData): number {
  if (variationData.metadata?.combination) {
    const textElement = variationData.metadata.combination.find(
      (item: any) => item.type === 'text'
    );
    if (textElement) {
      const match = textElement.key?.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    }
  }
  return 0;
}

/**
 * Determines the font variation index from the variation data
 */
function getFontVariationIndex(variationData: VariationData): number {
  if (variationData.metadata?.combination) {
    const fontElement = variationData.metadata.combination.find(
      (item: any) => item.type === 'font'
    );
    if (fontElement) {
      const match = fontElement.key?.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    }
  }
  return 0;
}

/**
 * Determines the speed variation index from the variation data
 */
function getSpeedVariationIndex(variationData: VariationData): number {
  if (variationData.metadata?.combination) {
    const speedElement = variationData.metadata.combination.find(
      (item: any) => item.type === 'speed'
    );
    if (speedElement) {
      const match = speedElement.key?.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    }
  }
  return 0;
}

/**
 * Updates all variation names based on new naming configuration
 */
export function updateAllVariationNames(
  variations: any[],
  namingConfig: NamingConfig,
  projectName?: string
): any[] {
  return variations.map(variation => {
    const variationData = {
      variation: {
        id: variation.id,
        isOriginal: variation.isOriginal
      },
      videoTrackItems: variation.metadata?.videoElements,
      audioTrackItems: variation.metadata?.audioElements,
      imageTrackItems: variation.metadata?.imageElements,
      textOverlays: variation.allTextOverlays,
      metadata: variation.metadata
    };

    const newFilename = generateFlexibleVariationFileName(variationData, projectName, namingConfig);
    
    // Extract just the variation part (remove project name and .mp4)
    const variationPart = newFilename.replace(/^[^_]+_/, '').replace('.mp4', '');
    
    return {
      ...variation,
      smartName: variationPart
    };
  });
}
