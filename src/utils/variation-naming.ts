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
 * Generates a meaningful filename for a video variation using flexible naming patterns
 * Default format: M-video_M-image_M-audio_M-text_V1-font_V2-speed.mp4
 * Can be customized to: A-video_B-image_A-audio_B-text_C-font_D-speed.mp4 or 1-video_2-image_1-audio_2-text_3-font_4-speed.mp4
 * Note: Font and speed only appear when user adds variations (not for originals)
 */
export function generateVariationFileName(variationData: VariationData, projectName?: string, customNamingPattern?: NamingPattern): string {
  const parts: string[] = [];
  const namingPattern = customNamingPattern || getUserNamingPattern();

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

  // Only include elements that actually exist in the project
  if (hasVideo) {
    const elementName = applyNamingPatternToElement('video', videoVariation, isOriginal || videoVariation === 0, namingPattern);
    parts.push(elementName);
  }

  if (hasImage) {
    const elementName = applyNamingPatternToElement('image', imageVariation, isOriginal || imageVariation === 0, namingPattern);
    parts.push(elementName);
  }

  if (hasAudio) {
    const elementName = applyNamingPatternToElement('audio', audioVariation, isOriginal || audioVariation === 0, namingPattern);
    parts.push(elementName);
  }

  if (hasText) {
    const elementName = applyNamingPatternToElement('text', textVariation, isOriginal || textVariation === 0, namingPattern);
    parts.push(elementName);
  }
  
  // Font and speed variations are only included if there are actual variations (index > 0)
  // This ensures M-font and M-speed don't show for originals
  if (fontVariation > 0) {
    const fontInfo = getFontVariationName(variationData);
    const elementName = applyNamingPatternToElement(fontInfo, fontVariation, false, namingPattern);
    parts.push(elementName);
  }

  if (speedVariation > 0) {
    const speedInfo = getSpeedVariationName(variationData);
    const elementName = applyNamingPatternToElement(speedInfo, speedVariation, false, namingPattern);
    parts.push(elementName);
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
    for (const element of combination) {
      if (element.type === 'text') {
        // Extract variation index from the key (e.g., "TEXT0" = 0, "TEXT1" = 1)
        const keyMatch = element.key?.match(/TEXT(\d+)/);
        if (keyMatch) {
          const index = parseInt(keyMatch[1]);
          if (index > 0) {
            return index;
          }
        }
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
  
  // Font and speed variations are only included if they have actual variations
  if (fontInfo !== 'Main-font') {
    parts.push(fontInfo);
  }

  if (speedInfo !== 'Main-speed') {
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
        let name = 'font';
        if (element.metadata?.fontFamily) {
          const fontName = element.metadata.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          name = `font-${fontName}`;
        }
        return `V${element.variationIndex}-${name}`;
      }
    }
  }

  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'font' && element.variationIndex && element.variationIndex > 0) {
        let name = 'font';
        if (element.metadata?.fontFamily) {
          const fontName = element.metadata.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          name = `font-${fontName}`;
        }
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

/**
 * Gets a meaningful name for font variations
 */
function getFontVariationName(variationData: VariationData): string {
  // Check metadata combination for font variations
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'font' && element.variationIndex && element.variationIndex > 0) {
        if (element.metadata?.fontFamily) {
          const fontName = element.metadata.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          return `font-${fontName}`;
        }
        return 'font';
      }
    }
  }

  // Check metadata for font elements
  if (variationData.metadata?.fontElements) {
    const fontElements = variationData.metadata.fontElements;
    for (const element of fontElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        if (element.metadata?.fontFamily) {
          const fontName = element.metadata.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          return `font-${fontName}`;
        }
        return 'font';
      }
    }
  }

  return 'font';
}

/**
 * Gets a meaningful name for speed variations
 */
function getSpeedVariationName(variationData: VariationData): string {
  // Check metadata combination for speed variations
  if (variationData.metadata?.combination) {
    const combination = variationData.metadata.combination;
    for (const element of combination) {
      if (element.type === 'speed' && element.variationIndex && element.variationIndex > 0) {
        if (element.metadata?.speed) {
          const speed = parseFloat(element.metadata.speed);
          return `speed-${speed}x`;
        }
        return 'speed';
      }
    }
  }

  // Check metadata for speed elements
  if (variationData.metadata?.speedElements) {
    const speedElements = variationData.metadata.speedElements;
    for (const element of speedElements) {
      if (element.variationIndex && element.variationIndex > 0) {
        if (element.metadata?.speed) {
          const speed = parseFloat(element.metadata.speed);
          return `speed-${speed}x`;
        }
        return 'speed';
      }
    }
  }

  return 'speed';
}

// Naming pattern configuration
interface NamingPattern {
  type: 'numbers' | 'letters' | 'uppercase_letters' | 'roman' | 'custom';
  customSequence?: string[];
  elementNames?: {
    video?: string;
    image?: string;
    audio?: string;
    text?: string;
    font?: string;
    speed?: string;
  };
}

// Default naming pattern (current system - V1, V2, V3)
const defaultNamingPattern: NamingPattern = {
  type: 'numbers', // Changed from 'letters' to 'numbers' to get V1, V2, V3
  elementNames: {
    video: 'video',
    image: 'image',
    audio: 'audio',
    text: 'text',
    font: 'font',
    speed: 'speed'
  }
};

// Get user's naming pattern (async version for database)
async function getUserNamingPatternAsync(): Promise<NamingPattern> {
  try {
    const projectId = window.location.pathname.split('/')[2];
    const response = await fetch(`/api/projects/${projectId}/naming-pattern`, {
      credentials: 'include' // Include cookies for authentication
    });

    if (response.ok) {
      const data = await response.json();
      if (data.pattern) {
        return {
          type: data.pattern.pattern_type === 'default' ? 'numbers' : data.pattern.pattern_type === 'numbers' ? 'custom' : data.pattern.pattern_type,
          customSequence: data.pattern.pattern_type === 'numbers' ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] : undefined,
          elementNames: data.pattern.element_names
        };
      }
    }
  } catch (error) {
    console.error('Error loading naming pattern:', error);
  }
  return defaultNamingPattern;
}

// Synchronous fallback for existing code - this should be replaced with async version
function getUserNamingPattern(): NamingPattern {
  // This is a fallback - in practice, we should use getUserNamingPatternAsync
  // But since generateVariationFileName is called synchronously, we need to handle this differently
  return defaultNamingPattern;
}

// Get naming pattern by ID
function getNamingPatternById(patternId: string): NamingPattern {
  const patterns: Record<string, NamingPattern> = {
    'default': {
      type: 'numbers',
      elementNames: {
        video: 'video', image: 'image', audio: 'audio',
        text: 'text', font: 'font', speed: 'speed'
      }
    },
    'numbers': {
      type: 'custom', // Pure numbers: 1, 2, 3
      customSequence: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      elementNames: {
        video: 'video', image: 'image', audio: 'audio',
        text: 'text', font: 'font', speed: 'speed'
      }
    },
    'letters': {
      type: 'letters', // Lowercase: a, b, c
      elementNames: {
        video: 'video', image: 'image', audio: 'audio',
        text: 'text', font: 'font', speed: 'speed'
      }
    },
    'letters-upper': {
      type: 'uppercase_letters', // Uppercase: A, B, C
      elementNames: {
        video: 'video', image: 'image', audio: 'audio',
        text: 'text', font: 'font', speed: 'speed'
      }
    }
  };

  return patterns[patternId] || defaultNamingPattern;
}

// Apply naming pattern to an element
function applyNamingPatternToElement(
  elementType: string,
  variationIndex: number,
  isOriginal: boolean,
  pattern: NamingPattern
): string {
  const elementName = pattern.elementNames?.[elementType as keyof typeof pattern.elementNames] || elementType;

  // For pure numbers pattern, use 1 for original instead of M
  if (isOriginal || variationIndex === 0) {
    if (pattern.type === 'custom' && pattern.customSequence?.[0]) {
      return `${pattern.customSequence[0]}-${elementName}`;
    }
    return `M-${elementName}`;
  }

  const prefix = getVariationPrefix(variationIndex, pattern);
  return `${prefix}-${elementName}`;
}

// Get variation prefix based on pattern
function getVariationPrefix(index: number, pattern: NamingPattern): string {
  switch (pattern.type) {
    case 'numbers':
      return `V${index}`; // Default V1, V2, V3 behavior
    case 'letters':
      return String.fromCharCode(96 + index); // a, b, c, d...
    case 'uppercase_letters':
      return String.fromCharCode(64 + index); // A, B, C, D...
    case 'roman':
      return toRomanNumeral(index);
    case 'custom':
      return pattern.customSequence?.[index - 1] || `V${index}`;
    default:
      return `V${index}`;
  }
}

// Convert number to Roman numeral
function toRomanNumeral(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  
  let result = '';
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += symbols[i];
      num -= values[i];
    }
  }
  return result;
}

/**
 * Async function to generate variation filename with user's custom naming pattern
 * This should be used in components that need to load the user's naming pattern
 */
export async function generateVariationFileNameAsync(variationData: VariationData, projectName?: string): Promise<string> {
  const namingPattern = await getUserNamingPatternAsync();
  return generateVariationFileName(variationData, projectName, namingPattern);
}

/**
 * Generate filename using the new template-based naming system
 */
export async function generateTemplateBasedFileName(
  variationData: VariationData, 
  projectName?: string
): Promise<string> {
  try {
    // Import the template system
    const { generateTemplateFilename, extractTemplateValues } = await import('./template-naming');
    
    // Load user's custom template
    const template = await getUserNamingTemplateAsync();
    
    console.log('Loaded template:', template);
    console.log('Variation data received:', variationData);
    console.log('Text overlays in variation data:', variationData.textOverlays);
    
    // Create context for template processing
    const context = {
      projectName: projectName || 'UntitledProject',
      textOverlays: variationData.textOverlays?.map(overlay => ({
        text: overlay.text || '',
        style: {
          fontFamily: overlay.style?.fontFamily,
          fontSize: overlay.style?.fontSize,
          fontWeight: overlay.style?.fontWeight,
          color: overlay.style?.color
        }
      })) || [],
      videoTrackItems: variationData.videoTrackItems?.map(item => ({
        playbackRate: item.playbackRate || 1,
        details: {
          src: item.details?.src,
          name: item.details?.name
        }
      })) || [],
      audioTrackItems: variationData.audioTrackItems?.map(item => ({
        playbackRate: item.playbackRate || 1,
        details: {
          src: item.details?.src,
          name: item.details?.name
        }
      })) || [],
      imageTrackItems: variationData.imageTrackItems?.map(item => ({
        details: {
          src: item.details?.src,
          name: item.details?.name
        }
      })) || [],
      progressBarSettings: {
        position: 'Bottom',
        isVisible: true
      },
      metadata: variationData.metadata,
      customValues: template.customValues || {} // Include custom values from saved template
    };
    
    console.log('Template context:', context);
    console.log('Context textOverlays:', context.textOverlays);
    console.log('First text overlay:', context.textOverlays?.[0]);
    console.log('Variation metadata:', variationData.metadata);
    
    // Generate filename using template
    return generateTemplateFilename(template.template, context);
    
  } catch (error) {
    console.error('Error generating template-based filename:', error);
    // Fallback to original naming system
    return generateVariationFileNameAsync(variationData, projectName);
  }
}

/**
 * Load user's naming template from API
 */
async function getUserNamingTemplateAsync(): Promise<{ template: string; name: string; description: string; customValues?: Record<string, string> }> {
  try {
    const projectId = window.location.pathname.split('/')[2];
    const response = await fetch(`/api/projects/${projectId}/naming-template`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.template) {
        return data.template;
      }
    }
  } catch (error) {
    console.error('Error loading naming template:', error);
  }
  
  // Return default template
  return {
    template: '{ProjectName}-{Headline}-{VideoSpeed}-{FontName}-{FontSize}-{ProgressBar}',
    name: 'Default Template',
    description: 'Standard template with project name, headline, speed, font, and progress bar',
    customValues: {}
  };
}