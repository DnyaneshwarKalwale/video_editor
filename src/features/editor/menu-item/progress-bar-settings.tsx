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
               <div>
                 <Label className="text-sm">Fast Start Duration: {settings.fastStartDuration}s</Label>
                 <Slider
                   value={[settings.fastStartDuration]}
                   onValueChange={([value]) => updateSettings({ fastStartDuration: value })}
                   min={0}
                   max={10}
                   step={1}
                   className="mt-1"
                 />
               </div>
               <div>
                 <Label className="text-sm">Fast Start Progress (%)</Label>
                 <div className="flex items-center space-x-2 mt-1">
                   <input
                     type="number"
                     value={Math.round(settings.fastStartProgress * 100)}
                     onChange={(e) => {
                       const value = parseFloat(e.target.value) || 0;
                       const clampedValue = Math.max(0, Math.min(100, value));
                       updateSettings({ fastStartProgress: clampedValue / 100 });
                     }}
                     min="0"
                     max="100"
                     step="1"
                     className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Enter percentage (0-100)"
                   />
                   <span className="text-sm text-gray-500">%</span>
                 </div>
                 <p className="text-xs text-gray-500">
                   Percentage of progress to reach in fast start duration
                 </p>
               </div>
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
          <div>
            <Label className="text-sm">Height: {settings.height}px</Label>
            <Slider
              value={[settings.height]}
              onValueChange={([value]) => updateSettings({ height: value })}
              min={4}
              max={32}
              step={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Scrubber Size: {settings.scrubberSize}px</Label>
            <Slider
              value={[settings.scrubberSize]}
              onValueChange={([value]) => updateSettings({ scrubberSize: value })}
              min={8}
              max={32}
              step={2}
              className="mt-1"
            />
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-3">
          <h4 className="font-medium">Effects</h4>
          <div>
            <Label className="text-sm">Border Radius: {settings.borderRadius}px</Label>
            <Slider
              value={[settings.borderRadius]}
              onValueChange={([value]) => updateSettings({ borderRadius: value })}
              min={0}
              max={20}
              step={1}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Opacity: {Math.round(settings.opacity * 100)}%</Label>
            <Slider
              value={[settings.opacity * 100]}
              onValueChange={([value]) => updateSettings({ opacity: value / 100 })}
              min={10}
              max={100}
              step={5}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBarSettings;
