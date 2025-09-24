import React, { useState, useEffect } from 'react';
import { X, Check, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
);

interface NamingOption {
  id: string;
  name: string;
  example: string;
}

const NAMING_OPTIONS: NamingOption[] = [
  {
    id: 'default',
    name: 'V1, V2, V3',
    example: 'M-video → V1-video → V2-video'
  },
  {
    id: 'numbers',
    name: '1, 2, 3',
    example: '1-video → 2-video → 3-video'
  },
  {
    id: 'letters',
    name: 'a, b, c',
    example: 'a-video → b-video → c-video'
  },
  {
    id: 'letters-upper',
    name: 'A, B, C',
    example: 'A-video → B-video → C-video'
  }
];

interface ElementNames {
  video: string;
  image: string;
  audio: string;
  text: string;
  font: string;
  speed: string;
}

const DEFAULT_ELEMENT_NAMES: ElementNames = {
  video: 'video',
  image: 'image',
  audio: 'audio',
  text: 'text',
  font: 'font',
  speed: 'speed'
};

interface SimpleNamingSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onPatternChange?: (patternId?: string) => void;
}

export const SimpleNamingSelector: React.FC<SimpleNamingSelectorProps> = ({
  isOpen,
  onClose,
  onPatternChange
}) => {
  const [selectedPattern, setSelectedPattern] = useState('default');
  const [elementNames, setElementNames] = useState<ElementNames>(DEFAULT_ELEMENT_NAMES);
  const [showCustomNames, setShowCustomNames] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNamingPattern();
    }
  }, [isOpen]);

  const loadNamingPattern = async () => {
    setIsLoading(true);
    try {
      const projectId = window.location.pathname.split('/')[2];

      // Get auth token from supabase client
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders = session?.access_token
        ? { 'Authorization': `Bearer ${session.access_token}` }
        : {};

      const response = await fetch(`/api/projects/${projectId}/naming-pattern`, {
        headers: authHeaders
      });

      if (response.ok) {
        const data = await response.json();
        if (data.pattern) {
          setSelectedPattern(data.pattern.pattern_type || 'default');
          setElementNames(data.pattern.element_names || DEFAULT_ELEMENT_NAMES);
        }
      }
    } catch (error) {
      console.error('Error loading naming pattern:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    setIsLoading(true);
    try {
      const projectId = window.location.pathname.split('/')[2];

      const response = await fetch(`/api/projects/${projectId}/naming-pattern`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern_type: selectedPattern,
          element_names: elementNames
        }),
      });

      if (response.ok) {
        onPatternChange?.(selectedPattern);
        onClose();
      } else {
        console.error('Failed to save naming pattern');
      }
    } catch (error) {
      console.error('Error saving naming pattern:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleElementNameChange = (element: keyof ElementNames, value: string) => {
    setElementNames(prev => ({
      ...prev,
      [element]: value || DEFAULT_ELEMENT_NAMES[element]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Naming Settings
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Pattern Selection */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Choose Pattern:</h4>
            <div className="grid grid-cols-2 gap-2">
              {NAMING_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPattern === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPattern(option.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                        selectedPattern === option.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedPattern === option.id && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium text-sm">{option.name}</span>
                  </div>
                  <code className="text-xs text-gray-600 block">
                    {option.example}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Element Names */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Element Names:</h4>
              <Button
                onClick={() => setShowCustomNames(!showCustomNames)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                {showCustomNames ? 'Hide' : 'Customize'}
              </Button>
            </div>

            {showCustomNames ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(elementNames).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1 capitalize">
                      {key}:
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleElementNameChange(key as keyof ElementNames, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder={DEFAULT_ELEMENT_NAMES[key as keyof ElementNames]}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600 space-y-1">
                <div>Video: <code className="bg-gray-100 px-1 rounded">{elementNames.video}</code></div>
                <div>Audio: <code className="bg-gray-100 px-1 rounded">{elementNames.audio}</code></div>
                <div>Text: <code className="bg-gray-100 px-1 rounded">{elementNames.text}</code></div>
                <div>Image: <code className="bg-gray-100 px-1 rounded">{elementNames.image}</code></div>
                <div>Font: <code className="bg-gray-100 px-1 rounded">{elementNames.font}</code></div>
                <div>Speed: <code className="bg-gray-100 px-1 rounded">{elementNames.speed}</code></div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Preview:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Original: <code>M-{elementNames.video}_M-{elementNames.text}</code></div>
              <div>Variation: <code>V1-{elementNames.video}_V2-{elementNames.text}</code></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Apply'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleNamingSelector;