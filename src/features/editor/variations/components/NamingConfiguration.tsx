import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, RotateCcw } from 'lucide-react';

export interface NamingConfig {
  elementNames: {
    video: string;
    audio: string;
    text: string;
    image: string;
  };
  pattern: {
    type: 'numbers' | 'letters_upper' | 'letters_lower' | 'roman' | 'custom';
    customSequence?: string[];
  };
  platform: {
    enabled: boolean;
    customName?: string;
  };
}

interface NamingConfigurationProps {
  config: NamingConfig;
  onConfigChange: (config: NamingConfig) => void;
  onApplyToAll: () => void;
  className?: string;
}

const defaultConfig: NamingConfig = {
  elementNames: {
    video: 'video',
    audio: 'audio',
    text: 'text',
    image: 'image'
  },
  pattern: {
    type: 'letters_upper'
  },
  platform: {
    enabled: true,
    customName: undefined
  }
};

const patternOptions = [
  { value: 'numbers', label: 'Numbers (1, 2, 3)' },
  { value: 'letters_upper', label: 'Letters Uppercase (A, B, C)' },
  { value: 'letters_lower', label: 'Letters Lowercase (a, b, c)' },
  { value: 'roman', label: 'Roman Numerals (I, II, III)' },
  { value: 'custom', label: 'Custom Sequence' }
];

export const NamingConfiguration: React.FC<NamingConfigurationProps> = ({
  config,
  onConfigChange,
  onApplyToAll,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<NamingConfig>(config);

  const handleElementNameChange = (element: keyof NamingConfig['elementNames'], value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      elementNames: {
        ...prev.elementNames,
        [element]: value
      }
    }));
  };

  const handlePatternTypeChange = (type: NamingConfig['pattern']['type']) => {
    setLocalConfig(prev => ({
      ...prev,
      pattern: {
        type,
        customSequence: type === 'custom' ? ['First', 'Second', 'Third'] : undefined
      }
    }));
  };

  const handleCustomSequenceChange = (value: string) => {
    const sequence = value.split(',').map(item => item.trim()).filter(Boolean);
    setLocalConfig(prev => ({
      ...prev,
      pattern: {
        ...prev.pattern,
        customSequence: sequence
      }
    }));
  };

  const handlePlatformEnabledChange = (enabled: boolean) => {
    setLocalConfig(prev => ({
      ...prev,
      platform: {
        ...prev.platform,
        enabled
      }
    }));
  };

  const handlePlatformNameChange = (customName: string) => {
    setLocalConfig(prev => ({
      ...prev,
      platform: {
        ...prev.platform,
        customName: customName || undefined
      }
    }));
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalConfig(defaultConfig);
  };

  const handleApplyToAll = () => {
    onConfigChange(localConfig);
    onApplyToAll();
    setIsOpen(false);
  };

  const generatePreview = () => {
    const { elementNames, pattern, platform } = localConfig;
    const getPatternValue = (index: number) => {
      switch (pattern.type) {
        case 'numbers':
          return (index + 1).toString();
        case 'letters_upper':
          return String.fromCharCode(65 + index); // A, B, C
        case 'letters_lower':
          return String.fromCharCode(97 + index); // a, b, c
        case 'roman':
          const roman = ['I', 'II', 'III', 'IV', 'V'];
          return roman[index] || (index + 1).toString();
        case 'custom':
          return pattern.customSequence?.[index] || (index + 1).toString();
        default:
          return (index + 1).toString();
      }
    };

    const variationPart = `M-${elementNames.video}_${getPatternValue(1)}-${elementNames.text}_${getPatternValue(2)}-${elementNames.audio}`;
    
    if (platform.enabled) {
      const platformName = platform.customName || 'ProjectName';
      return `${platformName}_${variationPart}`;
    }
    
    return variationPart;
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Settings className="h-4 w-4" />
        Naming Settings
      </Button>
    );
  }

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Naming Configuration</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          ×
        </Button>
      </div>

      {/* Element Names */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Element Names</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Video</Label>
            <Input
              value={localConfig.elementNames.video}
              onChange={(e) => handleElementNameChange('video', e.target.value)}
              placeholder="video, clip, footage..."
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Audio</Label>
            <Input
              value={localConfig.elementNames.audio}
              onChange={(e) => handleElementNameChange('audio', e.target.value)}
              placeholder="audio, music, sound..."
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Text</Label>
            <Input
              value={localConfig.elementNames.text}
              onChange={(e) => handleElementNameChange('text', e.target.value)}
              placeholder="text, title, caption..."
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Image</Label>
            <Input
              value={localConfig.elementNames.image}
              onChange={(e) => handleElementNameChange('image', e.target.value)}
              placeholder="image, photo, graphic..."
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Pattern Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Numbering Pattern</Label>
        <Select
          value={localConfig.pattern.type}
          onValueChange={handlePatternTypeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {patternOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Sequence */}
      {localConfig.pattern.type === 'custom' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Custom Sequence</Label>
          <Input
            value={localConfig.pattern.customSequence?.join(', ') || ''}
            onChange={(e) => handleCustomSequenceChange(e.target.value)}
            placeholder="First, Second, Third, Fourth..."
            className="text-sm"
          />
          <p className="text-xs text-gray-500">
            Separate items with commas
          </p>
        </div>
      )}

      {/* Platform Configuration */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="platform-enabled"
            checked={localConfig.platform.enabled}
            onChange={(e) => handlePlatformEnabledChange(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="platform-enabled" className="text-sm font-medium">
            Include Platform Name
          </Label>
        </div>
        
        {localConfig.platform.enabled && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Platform Name</Label>
            <Input
              value={localConfig.platform.customName || ''}
              onChange={(e) => handlePlatformNameChange(e.target.value)}
              placeholder="reel, tiktok, youtube, instagram..."
              className="text-sm"
            />
            <p className="text-xs text-gray-500">
              Leave empty to use project name, or enter custom platform name
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preview</Label>
        <div className="p-2 bg-gray-50 rounded text-sm font-mono">
          {generatePreview()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={handleApplyToAll}
          size="sm"
          className="flex-1"
        >
          Apply to All Variations
        </Button>
        <Button
          onClick={handleSave}
          variant="outline"
          size="sm"
        >
          Save
        </Button>
        <Button
          onClick={handleReset}
          variant="ghost"
          size="sm"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NamingConfiguration;
