import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import ColorPicker from '@/components/color-picker';
import { RotateCcw, Save, Loader2 } from 'lucide-react';
import { useProgressBarStore } from '../store/use-progress-bar-store';

const ProgressBarSettings: React.FC = () => {
  const { 
    settings, 
    isLoading, 
    isSaving, 
    updateSettings, 
    resetToDefault, 
    loadSettings, 
    saveSettings 
  } = useProgressBarStore();

  // Validation function for progress settings
  const validateProgressSettings = (fastStartProgress: number, fastEndProgress: number) => {
    const errors: string[] = [];
    
    // Fast start progress should be less than fast end progress
    if (fastStartProgress >= fastEndProgress) {
      errors.push("Fast Start Progress must be less than Fast End Start Progress");
    }
    
    // Fast end progress should not exceed 100%
    if (fastEndProgress > 1) {
      errors.push("Fast End Start Progress cannot exceed 100%");
    }
    
    // Fast start progress should not be negative
    if (fastStartProgress < 0) {
      errors.push("Fast Start Progress cannot be negative");
    }
    
    return errors;
  };

  // Get validation errors for current settings
  const validationErrors = validateProgressSettings(settings.fastStartProgress, settings.fastEndProgress);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Auto-save settings when they change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isLoading) {
        saveSettings().catch(console.error);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [settings, isLoading, saveSettings]);

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Progress Bar</h3>
          <div className="flex gap-2">
            {isSaving && (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </div>
            )}
            <Button
              onClick={resetToDefault}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

         {/* Visibility */}
         <div className="flex items-center space-x-2 p-3 border rounded">
           <Switch
             checked={settings.isVisible}
             onCheckedChange={(checked) => updateSettings({ isVisible: checked })}
           />
           <Label>Show Progress Bar</Label>
         </div>

         {/* Deceptive Progress */}
         <div className="space-y-3">
           <div className="flex items-center space-x-2 p-3 border rounded">
             <Switch
               checked={settings.useDeceptiveProgress}
               onCheckedChange={(checked) => updateSettings({ useDeceptiveProgress: checked })}
             />
             <Label>Deceptive Progress (for ads)</Label>
           </div>
           
           {settings.useDeceptiveProgress && (
             <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Fast Start Duration</Label>
                    <div className="text-xs text-gray-500 mb-1">How long to show fast progress at start</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="number"
                        value={settings.fastStartDuration}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const clampedValue = Math.max(0, Math.min(60, value));
                          updateSettings({ fastStartDuration: clampedValue });
                        }}
                        min="0"
                        max="60"
                        step="0.5"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0-60"
                      />
                      <span className="text-sm text-gray-500">sec</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Fast End Duration</Label>
                    <div className="text-xs text-gray-500 mb-1">How long to show fast progress at end</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="number"
                        value={settings.fastEndDuration}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const clampedValue = Math.max(0, Math.min(60, value));
                          updateSettings({ fastEndDuration: clampedValue });
                        }}
                        min="0"
                        max="60"
                        step="0.5"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0-60"
                      />
                      <span className="text-sm text-gray-500">sec</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Fast Start Progress</Label>
                    <div className="text-xs text-gray-500 mb-1">How much progress to complete in fast start (e.g., 10% = reach 10%)</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="number"
                        value={Math.round(settings.fastStartProgress * 100)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const clampedValue = Math.max(0, Math.min(100, value));
                          const newFastStartProgress = clampedValue / 100;
                          
                          // Auto-adjust fast end progress if it would be invalid
                          let newFastEndProgress = settings.fastEndProgress;
                          if (newFastStartProgress >= newFastEndProgress) {
                            newFastEndProgress = Math.min(1, newFastStartProgress + 0.1); // Add 10% buffer
                          }
                          
                          updateSettings({ 
                            fastStartProgress: newFastStartProgress,
                            fastEndProgress: newFastEndProgress
                          });
                        }}
                        min="0"
                        max="100"
                        step="1"
                        className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                          validationErrors.some(err => err.includes("Fast Start Progress")) 
                            ? "border-red-500 focus:ring-red-500" 
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="0-100"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Fast End Start Progress</Label>
                    <div className="text-xs text-gray-500 mb-1">When to start fast progress (e.g., 90% = start at 90%)</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="number"
                        value={Math.round(settings.fastEndProgress * 100)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const clampedValue = Math.max(0, Math.min(100, value));
                          const newFastEndProgress = clampedValue / 100;
                          
                          // Auto-adjust fast start progress if it would be invalid
                          let newFastStartProgress = settings.fastStartProgress;
                          if (newFastStartProgress >= newFastEndProgress) {
                            newFastStartProgress = Math.max(0, newFastEndProgress - 0.1); // Subtract 10% buffer
                          }
                          
                          updateSettings({ 
                            fastStartProgress: newFastStartProgress,
                            fastEndProgress: newFastEndProgress
                          });
                        }}
                        min="0"
                        max="100"
                        step="1"
                        className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                          validationErrors.some(err => err.includes("Fast End Start Progress")) 
                            ? "border-red-500 focus:ring-red-500" 
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="0-100"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                {/* Validation Errors Display */}
                {validationErrors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm font-medium text-red-800 mb-1">⚠️ Validation Errors:</div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Progress Visualization */}
                {validationErrors.length === 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="text-sm font-medium text-green-800 mb-2">✅ Progress Bar Timeline:</div>
                    <div className="text-xs text-green-700 space-y-1">
                      <div>• Fast Start: 0% → {Math.round(settings.fastStartProgress * 100)}% (first {settings.fastStartDuration}s)</div>
                      <div>• Middle: {Math.round(settings.fastStartProgress * 100)}% → {Math.round(settings.fastEndProgress * 100)}% (slow)</div>
                      <div>• Fast End: {Math.round(settings.fastEndProgress * 100)}% → 100% (last {settings.fastEndDuration}s)</div>
                    </div>
                  </div>
                )}

             </div>
           )}
         </div>

        {/* Colors - Simple Input */}
        <div className="space-y-3">
          <h4 className="font-medium">Colors</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Progress Color</Label>
              <input
                type="color"
                value={settings.progressColor}
                onChange={(e) => updateSettings({ progressColor: e.target.value })}
                className="w-full h-8 border rounded mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Scrubber Color</Label>
              <input
                type="color"
                value={settings.scrubberColor}
                onChange={(e) => updateSettings({ scrubberColor: e.target.value })}
                className="w-full h-8 border rounded mt-1"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-3">
          <h4 className="font-medium">Size</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">Height</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.height}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 4;
                    const clampedValue = Math.max(4, value);
                    updateSettings({ height: clampedValue });
                  }}
                  min="4"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="4+"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">px</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Scrubber Size</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.scrubberSize}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 8;
                    const clampedValue = Math.max(8, value);
                    updateSettings({ scrubberSize: clampedValue });
                  }}
                  min="8"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8+"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-3">
          <h4 className="font-medium">Effects</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">Border Radius</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.borderRadius}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    const clampedValue = Math.max(0, value);
                    updateSettings({ borderRadius: clampedValue });
                  }}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0+"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">px</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Opacity: {Math.round(settings.opacity * 100)}%</Label>
              <Slider
                value={[settings.opacity * 100]}
                onValueChange={([value]) => updateSettings({ opacity: value / 100 })}
                min={10}
                max={100}
                step={5}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBarSettings;
