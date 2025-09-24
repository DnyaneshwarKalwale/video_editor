/**
 * Flexible naming pattern system for video variations
 * Allows users to customize naming patterns beyond the default V1, V2, V3
 */

export type NamingPatternType = 'numbers' | 'letters-upper' | 'letters-lower' | 'roman' | 'custom';

export interface NamingPattern {
  id: string;
  name: string;
  type: NamingPatternType;
  originalPrefix: string; // What to use for original (e.g., "M", "Original", "1")
  variationPrefix: string; // Pattern for variations (e.g., "V", "A", "1")
  customLabels?: string[]; // For custom patterns like ["Alpha", "Beta", "Gamma"]
  description: string;
}

export const DEFAULT_NAMING_PATTERNS: NamingPattern[] = [
  {
    id: 'default',
    name: 'Default (M, V1, V2, V3)',
    type: 'numbers',
    originalPrefix: 'M',
    variationPrefix: 'V',
    description: 'Original video editor pattern: M for main/original, V1, V2, V3 for variations'
  },
  {
    id: 'numbers',
    name: 'Numbers (1, 2, 3, 4)',
    type: 'numbers',
    originalPrefix: '1',
    variationPrefix: '',
    description: 'Simple numbering: 1 for original, 2, 3, 4 for variations'
  },
  {
    id: 'letters-upper',
    name: 'Uppercase Letters (A, B, C, D)',
    type: 'letters-upper',
    originalPrefix: 'A',
    variationPrefix: '',
    description: 'Uppercase letters: A for original, B, C, D for variations'
  },
  {
    id: 'letters-lower',
    name: 'Lowercase Letters (a, b, c, d)',
    type: 'letters-lower',
    originalPrefix: 'a',
    variationPrefix: '',
    description: 'Lowercase letters: a for original, b, c, d for variations'
  },
  {
    id: 'roman',
    name: 'Roman Numerals (I, II, III, IV)',
    type: 'roman',
    originalPrefix: 'I',
    variationPrefix: '',
    description: 'Roman numerals: I for original, II, III, IV for variations'
  }
];

/**
 * Generates a variation identifier based on the pattern and index
 * @param pattern The naming pattern to use
 * @param index The variation index (0 = original, 1+ = variations)
 * @param isOriginal Whether this is the original/main element
 */
export function generateVariationIdentifier(
  pattern: NamingPattern,
  index: number,
  isOriginal: boolean = false
): string {
  // Always use original prefix for index 0 or when explicitly marked as original
  if (index === 0 || isOriginal) {
    return pattern.originalPrefix;
  }

  switch (pattern.type) {
    case 'numbers':
      return pattern.variationPrefix
        ? `${pattern.variationPrefix}${index}`
        : `${index + 1}`; // For pure numbers, add 1 to make it 2, 3, 4...

    case 'letters-upper':
      const upperLetter = String.fromCharCode(65 + index); // A=65, B=66, etc.
      return pattern.variationPrefix
        ? `${pattern.variationPrefix}${upperLetter}`
        : upperLetter;

    case 'letters-lower':
      const lowerLetter = String.fromCharCode(97 + index); // a=97, b=98, etc.
      return pattern.variationPrefix
        ? `${pattern.variationPrefix}${lowerLetter}`
        : lowerLetter;

    case 'roman':
      const romanNumeral = convertToRoman(index + 1);
      return pattern.variationPrefix
        ? `${pattern.variationPrefix}${romanNumeral}`
        : romanNumeral;

    case 'custom':
      if (pattern.customLabels && pattern.customLabels[index]) {
        return pattern.variationPrefix
          ? `${pattern.variationPrefix}${pattern.customLabels[index]}`
          : pattern.customLabels[index];
      }
      // Fallback to numbers if custom labels run out
      return pattern.variationPrefix
        ? `${pattern.variationPrefix}${index}`
        : `${index + 1}`;

    default:
      return `${pattern.variationPrefix}${index}`;
  }
}

/**
 * Convert number to Roman numerals
 */
function convertToRoman(num: number): string {
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
 * Creates a custom naming pattern
 */
export function createCustomNamingPattern(
  name: string,
  originalLabel: string,
  customLabels: string[],
  description?: string
): NamingPattern {
  return {
    id: `custom-${Date.now()}`,
    name,
    type: 'custom',
    originalPrefix: originalLabel,
    variationPrefix: '',
    customLabels: [originalLabel, ...customLabels],
    description: description || `Custom pattern: ${originalLabel}, ${customLabels.join(', ')}`
  };
}

/**
 * Gets the user's selected naming pattern from localStorage
 */
export function getUserNamingPattern(): NamingPattern {
  try {
    const saved = localStorage.getItem('video-editor-naming-pattern');
    if (saved) {
      const pattern = JSON.parse(saved);
      // Validate the pattern has required properties
      if (pattern.id && pattern.originalPrefix !== undefined && pattern.variationPrefix !== undefined) {
        return pattern;
      }
    }
  } catch (error) {
    console.error('Error loading naming pattern:', error);
  }

  // Return default pattern if nothing saved or error occurred
  return DEFAULT_NAMING_PATTERNS[0];
}

/**
 * Saves the user's selected naming pattern to localStorage
 */
export function saveUserNamingPattern(pattern: NamingPattern): void {
  try {
    localStorage.setItem('video-editor-naming-pattern', JSON.stringify(pattern));
  } catch (error) {
    console.error('Error saving naming pattern:', error);
  }
}

/**
 * Applies the naming pattern to generate element names
 */
export function applyNamingPatternToElement(
  elementType: string,
  index: number,
  isOriginal: boolean = false,
  pattern?: NamingPattern
): string {
  const currentPattern = pattern || getUserNamingPattern();
  const identifier = generateVariationIdentifier(currentPattern, index, isOriginal);

  return `${identifier}-${elementType}`;
}

/**
 * Updates all variation names when pattern changes
 */
export function updateVariationNamesWithNewPattern(
  variations: any[],
  newPattern: NamingPattern,
  elementType: string
): any[] {
  return variations.map((variation, index) => {
    const isOriginal = variation.isOriginal || index === 0;
    const newIdentifier = generateVariationIdentifier(newPattern, index, isOriginal);

    return {
      ...variation,
      key: `${elementType.toUpperCase()}${index}`, // Keep internal key format
      displayName: `${newIdentifier}-${elementType}`, // New display name
      namingIdentifier: newIdentifier // Store just the identifier part
    };
  });
}