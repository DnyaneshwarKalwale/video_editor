/**
 * Advanced Template-Based Naming System
 * Supports custom templates with dynamic placeholders
 */

export interface TemplatePlaceholder {
  id: string;
  name: string;
  description: string;
  example: string;
  category: 'project' | 'content' | 'style' | 'media' | 'system';
}

export interface NamingTemplate {
  id: string;
  name: string;
  template: string;
  description: string;
  isDefault?: boolean;
}

export interface VariationContext {
  projectName?: string;
  textOverlays?: Array<{
    text: string;
    style?: {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string;
      color?: string;
    };
  }>;
  videoTrackItems?: Array<{
    playbackRate?: number;
    details?: {
      src?: string;
      name?: string;
    };
  }>;
  audioTrackItems?: Array<{
    playbackRate?: number;
    details?: {
      src?: string;
      name?: string;
    };
  }>;
  imageTrackItems?: Array<{
    details?: {
      src?: string;
      name?: string;
    };
  }>;
  progressBarSettings?: {
    position?: string;
    style?: string;
    isVisible?: boolean;
  };
  metadata?: {
    videoElements?: any[];
    imageElements?: any[];
    audioElements?: any[];
    fontElements?: any[];
    speedElements?: any[];
    combination?: any[];
  };
  customValues?: Record<string, string>; // For user-edited values
}

// Available placeholders
export const TEMPLATE_PLACEHOLDERS: TemplatePlaceholder[] = [
  // Project placeholders
  {
    id: 'ProjectName',
    name: 'Project Name',
    description: 'The name of the current project',
    example: 'SummerLaunch',
    category: 'project'
  },
  
  // Content placeholders
  {
    id: 'Headline',
    name: 'Headline',
    description: 'First 2-3 words from the main text overlay',
    example: 'StopScrolling',
    category: 'content'
  },
  {
    id: 'FullText',
    name: 'Full Text',
    description: 'Complete text from the main text overlay',
    example: 'StopScrollingNow',
    category: 'content'
  },
  {
    id: 'TextCount',
    name: 'Text Count',
    description: 'Number of text overlays in the video',
    example: '3',
    category: 'content'
  },
  
  // Style placeholders
  {
    id: 'FontName',
    name: 'Font Name',
    description: 'Primary font family used in text',
    example: 'Arial',
    category: 'style'
  },
  {
    id: 'FontSize',
    name: 'Font Size',
    description: 'Primary font size used in text',
    example: '16px',
    category: 'style'
  },
  {
    id: 'FontWeight',
    name: 'Font Weight',
    description: 'Font weight (bold, normal, etc.)',
    example: 'bold',
    category: 'style'
  },
  {
    id: 'TextColor',
    name: 'Text Color',
    description: 'Primary text color',
    example: 'white',
    category: 'style'
  },
  
  // Media placeholders
  {
    id: 'VideoSpeed',
    name: 'Video Speed',
    description: 'Playback speed of the video',
    example: '1.25x',
    category: 'media'
  },
  {
    id: 'AudioSpeed',
    name: 'Audio Speed',
    description: 'Playback speed of the audio',
    example: '0.75x',
    category: 'media'
  },
  {
    id: 'VideoName',
    name: 'Video Name',
    description: 'Name of the primary video file',
    example: 'background-video',
    category: 'media'
  },
  {
    id: 'AudioName',
    name: 'Audio Name',
    description: 'Name of the primary audio file',
    example: 'background-music',
    category: 'media'
  },
  {
    id: 'ImageName',
    name: 'Image Name',
    description: 'Name of the primary image/background',
    example: 'hero-image',
    category: 'media'
  },
  
  // System placeholders
  {
    id: 'ProgressBar',
    name: 'Progress Bar',
    description: 'Progress bar type and position',
    example: 'TopBar',
    category: 'system'
  },
  {
    id: 'Duration',
    name: 'Duration',
    description: 'Video duration in seconds',
    example: '30s',
    category: 'system'
  },
  {
    id: 'AspectRatio',
    name: 'Aspect Ratio',
    description: 'Video aspect ratio',
    example: '16:9',
    category: 'system'
  },
  {
    id: 'Resolution',
    name: 'Resolution',
    description: 'Video resolution',
    example: '1920x1080',
    category: 'system'
  },
  {
    id: 'VariationIndex',
    name: 'Variation Index',
    description: 'Index of this variation (1, 2, 3, etc.)',
    example: '1',
    category: 'system'
  },
  {
    id: 'Timestamp',
    name: 'Timestamp',
    description: 'Current date and time',
    example: '2024-01-15',
    category: 'system'
  }
];

// Default templates
export const DEFAULT_TEMPLATES: NamingTemplate[] = [
  {
    id: 'default',
    name: 'Default Template',
    template: '{ProjectName}-{Headline}-{VideoSpeed}-{FontName}-{FontSize}-{ProgressBar}',
    description: 'Standard template with project name, headline, speed, font, and progress bar',
    isDefault: true
  },
  {
    id: 'simple',
    name: 'Simple Template',
    template: '{Headline}{FontName}{VideoSpeed}',
    description: 'Minimal template with just headline, font, and speed'
  },
  {
    id: 'detailed',
    name: 'Detailed Template',
    template: '{ProjectName}-Ad-{Headline}-{ProgressBar}-{FontSize}-{Duration}',
    description: 'Comprehensive template for detailed naming'
  },
  {
    id: 'media-focused',
    name: 'Media Focused',
    template: '{VideoName}-{AudioName}-{Headline}-{VideoSpeed}',
    description: 'Template focused on media elements'
  },
  {
    id: 'style-focused',
    name: 'Style Focused',
    template: '{ProjectName}-{FontName}-{FontSize}-{TextColor}-{Headline}',
    description: 'Template focused on styling elements'
  }
];

/**
 * Extract values from variation context for template placeholders
 */
export function extractTemplateValues(context: VariationContext): Record<string, string> {
  const values: Record<string, string> = {};
  
  // Use custom values if provided (for user-edited values)
  if (context.customValues) {
    Object.assign(values, context.customValues);
  }
  
  // Project values - Use custom value or extract from project name
  console.log('Template naming - context.projectName:', context.projectName);
  console.log('Template naming - context.customValues?.ProjectName:', context.customValues?.ProjectName);

  let projectName = context.customValues?.ProjectName || context.projectName || 'UntitledProject';

  // Check if project name looks like an ID and clean it up
  if (projectName && projectName !== 'Untitled Project' && projectName !== 'UntitledProject') {
    // Check for specific project ID patterns (like a0c0063f-a664-4777-9206-4e66670d9f59)
    const isProjectIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(projectName) ||
                              /^[A-Za-z0-9]{10,}$/.test(projectName) ||
                              (projectName.includes('-') && projectName.length > 20);

    if (isProjectIdPattern) {
      console.log('Project name looks like an ID, using generic name instead:', projectName);
      projectName = 'Project';
    } else {
      // Sanitize the project name for filename use but keep it
      projectName = projectName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
      if (!projectName) {
        projectName = 'Project';
      }
    }
  } else if (!projectName || projectName === 'Untitled Project') {
    projectName = 'UntitledProject';
  }

  values.ProjectName = projectName;

  console.log('Template naming - final ProjectName value:', values.ProjectName);
  
  // Content values - Prioritize textOverlays (variation-specific) over metadata.combination (original video)
  if (!context.customValues?.Headline && !context.customValues?.FullText) {
    if (context.textOverlays && context.textOverlays.length > 0) {
      // Use the actual text from the variation's text overlays (this is variation-specific)
      const mainText = context.textOverlays[0].text;
      values.FullText = sanitizeText(mainText);
      values.Headline = extractHeadline(mainText);
    } else if (context.metadata?.combination) {
      // Fallback to metadata combination if no text overlays available
      const textVariation = context.metadata.combination.find((item: any) => item.type === 'text');
      if (textVariation && textVariation.value) {
        values.FullText = sanitizeText(textVariation.value);
        values.Headline = extractHeadline(textVariation.value);
      } else {
        values.FullText = 'NoText';
        values.Headline = 'NoText';
      }
    } else {
      values.FullText = 'NoText';
      values.Headline = 'NoText';
    }
  }
  
  values.TextCount = context.textOverlays?.length?.toString() || '0';
  
  // Style values - Prioritize textOverlays (variation-specific) over metadata.combination (original video)
  if (!context.customValues?.FontName && !context.customValues?.FontSize) {
    if (context.textOverlays && context.textOverlays.length > 0) {
      // Use the actual style from the variation's text overlays (this is variation-specific)
      const style = context.textOverlays[0].style;
      if (style) {
        values.FontName = extractFontName(style.fontFamily || 'Arial');
        values.FontSize = style.fontSize ? `${style.fontSize}px` : '16px';
        values.FontWeight = style.fontWeight || 'normal';
        values.TextColor = style.color || 'white';
      } else {
        values.FontName = 'Arial';
        values.FontSize = '16px';
        values.FontWeight = 'normal';
        values.TextColor = 'white';
      }
    } else if (context.metadata?.combination) {
      // Fallback to metadata combination if no text overlays available
      const fontVariation = context.metadata.combination.find((item: any) => item.type === 'font');
      if (fontVariation && fontVariation.metadata) {
        values.FontName = extractFontName(fontVariation.metadata.fontFamily || 'Arial');
        values.FontSize = fontVariation.metadata.fontSize ? `${fontVariation.metadata.fontSize}px` : '16px';
        values.FontWeight = fontVariation.metadata.fontWeight || 'normal';
        values.TextColor = fontVariation.metadata.color || 'white';
      } else {
        values.FontName = 'Arial';
        values.FontSize = '16px';
        values.FontWeight = 'normal';
        values.TextColor = 'white';
      }
    } else {
      values.FontName = 'Arial';
      values.FontSize = '16px';
      values.FontWeight = 'normal';
      values.TextColor = 'white';
    }
  }
  
  // Media values - Extract from metadata combination if available
  if (context.metadata?.combination) {
    // Find speed variation from combination
    const speedVariation = context.metadata.combination.find((item: any) => item.type === 'speed');
    if (speedVariation && speedVariation.metadata && speedVariation.metadata.speed) {
      values.VideoSpeed = formatSpeed(speedVariation.metadata.speed);
      values.AudioSpeed = formatSpeed(speedVariation.metadata.speed);
    } else {
      values.VideoSpeed = '1x';
      values.AudioSpeed = '1x';
    }
    
    // Find video variation from combination
    const videoVariation = context.metadata.combination.find((item: any) => item.type === 'video');
    if (videoVariation && videoVariation.value) {
      values.VideoName = extractFileName(videoVariation.value);
    } else {
      values.VideoName = 'NoVideo';
    }
    
    // Find audio variation from combination
    const audioVariation = context.metadata.combination.find((item: any) => item.type === 'audio');
    if (audioVariation && audioVariation.value) {
      values.AudioName = extractFileName(audioVariation.value);
    } else {
      values.AudioName = 'NoAudio';
    }
    
    // Find image variation from combination
    const imageVariation = context.metadata.combination.find((item: any) => item.type === 'image');
    if (imageVariation && imageVariation.value) {
      values.ImageName = extractFileName(imageVariation.value);
    } else {
      values.ImageName = 'NoImage';
    }
  } else {
    // Fallback to track items
    if (context.videoTrackItems && context.videoTrackItems.length > 0) {
      const video = context.videoTrackItems[0];
      values.VideoSpeed = formatSpeed(video.playbackRate || 1);
      values.VideoName = extractFileName(video.details?.src || 'video');
    } else {
      values.VideoSpeed = '1x';
      values.VideoName = 'NoVideo';
    }
    
    if (context.audioTrackItems && context.audioTrackItems.length > 0) {
      const audio = context.audioTrackItems[0];
      values.AudioSpeed = formatSpeed(audio.playbackRate || 1);
      values.AudioName = extractFileName(audio.details?.src || 'audio');
    } else {
      values.AudioSpeed = '1x';
      values.AudioName = 'NoAudio';
    }
    
    if (context.imageTrackItems && context.imageTrackItems.length > 0) {
      const image = context.imageTrackItems[0];
      values.ImageName = extractFileName(image.details?.src || 'image');
    } else {
      values.ImageName = 'NoImage';
    }
  }
  
  // System values
  if (context.progressBarSettings) {
    values.ProgressBar = context.progressBarSettings.isVisible 
      ? (context.progressBarSettings.position || 'Bottom') 
      : 'None';
  } else {
    values.ProgressBar = 'None';
  }
  
  values.Duration = '30s'; // Default, could be extracted from context
  values.AspectRatio = '16:9'; // Default, could be extracted from context
  values.Resolution = '1920x1080'; // Default, could be extracted from context
  values.VariationIndex = '1'; // Default, could be extracted from variation data
  values.Timestamp = new Date().toISOString().split('T')[0]; // Current date
  
  console.log('Extracted template values:', values);
  console.log('Context projectName:', context.projectName);
  console.log('Context customValues:', context.customValues);
  console.log('Final ProjectName value:', values.ProjectName);
  console.log('Context metadata combination:', context.metadata?.combination);
  console.log('Context text overlays:', context.textOverlays);
  console.log('Text variation found in combination:', context.metadata?.combination?.find((item: any) => item.type === 'text'));
  console.log('Using textOverlays for text extraction:', context.textOverlays && context.textOverlays.length > 0);
  console.log('First text overlay text:', context.textOverlays?.[0]?.text);
  
  return values;
}

/**
 * Generate filename from template and context
 */
export function generateTemplateFilename(
  template: string, 
  context: VariationContext,
  fallbackValue: string = 'NA'
): string {
  const values = extractTemplateValues(context);
  
  // Replace placeholders in template
  let filename = template;
  
  // Find all placeholders in the template
  const placeholderRegex = /\{([^}]+)\}/g;
  const matches = filename.match(placeholderRegex);
  
  if (matches) {
    matches.forEach(match => {
      const placeholder = match.slice(1, -1); // Remove { and }
      const value = values[placeholder] || fallbackValue;
      filename = filename.replace(match, value);
    });
  }
  
  // Clean up the filename
  filename = sanitizeFilename(filename);
  
  // Ensure .mp4 extension
  if (!filename.endsWith('.mp4')) {
    filename += '.mp4';
  }
  
  return filename;
}

/**
 * Validate template syntax
 */
export function validateTemplate(template: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for balanced braces
  const openBraces = (template.match(/\{/g) || []).length;
  const closeBraces = (template.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push('Unbalanced braces in template');
  }
  
  // Check for valid placeholders
  const placeholderRegex = /\{([^}]+)\}/g;
  const matches = template.match(placeholderRegex);
  
  if (matches) {
    const validPlaceholders = TEMPLATE_PLACEHOLDERS.map(p => p.id);
    matches.forEach(match => {
      const placeholder = match.slice(1, -1);
      if (!validPlaceholders.includes(placeholder)) {
        errors.push(`Invalid placeholder: ${placeholder}`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Preview template with sample data
 */
export function previewTemplate(template: string): string {
  const sampleContext: VariationContext = {
    projectName: 'SampleProject',
    textOverlays: [{
      text: 'Stop Scrolling Now',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white'
      }
    }],
    videoTrackItems: [{
      playbackRate: 1.25,
      details: { src: 'background-video.mp4' }
    }],
    audioTrackItems: [{
      playbackRate: 1.0,
      details: { src: 'background-music.mp3' }
    }],
    progressBarSettings: {
      position: 'Top',
      isVisible: true
    }
  };
  
  return generateTemplateFilename(template, sampleContext);
}

// Helper functions
function sanitizeText(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .substring(0, 50); // Limit length
}

function extractHeadline(text: string): string {
  const words = text.split(/\s+/).slice(0, 3); // First 3 words
  return words.join('').replace(/[^a-zA-Z0-9]/g, '');
}

function extractFontName(fontFamily: string): string {
  return fontFamily.split(',')[0].replace(/['"]/g, '').trim();
}

function formatSpeed(speed: number): string {
  if (speed === 1) return '1x';
  return `${speed}x`;
}

function extractFileName(src: string): string {
  const filename = src.split('/').pop() || src;
  return filename.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\-_\.]/g, '_') // Replace invalid characters with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}

