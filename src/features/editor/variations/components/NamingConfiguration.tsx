import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, RotateCcw, Save, Loader2 } from 'lucide-react';
import NamingConventionsService from '@/services/naming-conventions-service';

export interface NamingConfig {
  elementNames: {
    video: string;
    audio: string;
    text: string;
    image: string;
    font: string;
    speed: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await NamingConventionsService.saveUserNamingConvention(localConfig);
      if (success) {
        onConfigChange(localConfig);
        setIsOpen(false);
      } else {
        console.error('Failed to save naming convention');
      }
    } catch (error) {
      console.error('Error saving naming convention:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const success = await NamingConventionsService.resetToDefaults();
      if (success) {
        setLocalConfig(defaultConfig);
        onConfigChange(defaultConfig);
      } else {
        console.error('Failed to reset naming convention');
      }
    } catch (error) {
      console.error('Error resetting naming convention:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToAll = async () => {
    setIsSaving(true);
    try {
      const success = await NamingConventionsService.saveUserNamingConvention(localConfig);
      if (success) {
        onConfigChange(localConfig);
        onApplyToAll();
        setIsOpen(false);
      } else {
        console.error('Failed to save naming convention');
      }
    } catch (error) {
      console.error('Error saving naming convention:', error);
    } finally {
      setIsSaving(false);
    }
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

     const variationPart = `M-${elementNames.video}_${getPatternValue(1)}-${elementNames.text}_${getPatternValue(2)}-${elementNames.audio}_${getPatternValue(3)}-${elementNames.font}_${getPatternValue(4)}-${elementNames.speed}`;
    
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
        className={`flex items-center gap-1 ${className}`}
        title="Naming Settings"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden xl:inline">Naming</span>
      </Button>
    );
  }

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-4 shadow-lg max-w-md w-full ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Naming Configuration</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      {/* Element Names */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Element Names</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Video</Label>
            <Input
              value={localConfig.elementNames.video}
              onChange={(e) => handleElementNameChange('video', e.target.value)}
              placeholder="video, clip..."
              className="text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Audio</Label>
            <Input
              value={localConfig.elementNames.audio}
              onChange={(e) => handleElementNameChange('audio', e.target.value)}
              placeholder="audio, music..."
              className="text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Text</Label>
            <Input
              value={localConfig.elementNames.text}
              onChange={(e) => handleElementNameChange('text', e.target.value)}
              placeholder="text, title..."
              className="text-sm h-8"
            />
          </div>
           <div>
             <Label className="text-xs">Image</Label>
             <Input
               value={localConfig.elementNames.image}
               onChange={(e) => handleElementNameChange('image', e.target.value)}
               placeholder="image, photo..."
               className="text-sm h-8"
             />
           </div>
           <div>
             <Label className="text-xs">Font</Label>
             <Input
               value={localConfig.elementNames.font}
               onChange={(e) => handleElementNameChange('font', e.target.value)}
               placeholder="font, typography..."
               className="text-sm h-8"
             />
           </div>
           <div>
             <Label className="text-xs">Speed</Label>
             <Input
               value={localConfig.elementNames.speed}
               onChange={(e) => handleElementNameChange('speed', e.target.value)}
               placeholder="speed, velocity..."
               className="text-sm h-8"
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
          <SelectTrigger className="h-8">
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
             placeholder="First, Second, Third..."
             className="text-sm h-8"
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
               placeholder="reel, tiktok, youtube..."
               className="text-sm h-8"
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
          className="flex-1 h-8 text-xs"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3 w-3 mr-1" />
              Apply to All
            </>
          )}
        </Button>
        <Button
          onClick={handleSave}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Save'
          )}
        </Button>
        <Button
          onClick={handleReset}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default NamingConfiguration;
