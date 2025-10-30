import { create } from 'zustand';

interface ProgressBarSettings {
  // Colors
  backgroundColor: string;
  progressColor: string;
  scrubberColor: string;
  
  // Size
  height: number;
  scrubberSize: number;
  
  // Effects
  borderRadius: number;
  opacity: number;
  shadowBlur: number;
  shadowColor: string;
  
  // Visibility
  isVisible: boolean;
  
  // Deceptive Progress (for ads)
  useDeceptiveProgress: boolean;
  useFastStart: boolean; // enable/disable fast start independently
  fastStartDuration: number; // seconds to show fast progress at start
  fastStartProgress: number; // percentage to reach in fast start (0-1)
  useFastEnd: boolean; // enable/disable fast end independently
  fastEndDuration: number; // seconds to show fast progress at end
  fastEndProgress: number; // percentage to start fast progress at end (0-1)
}

interface ProgressBarStore {
  settings: ProgressBarSettings;
  isLoading: boolean;
  isSaving: boolean;
  updateSettings: (updates: Partial<ProgressBarSettings>) => void;
  resetToDefault: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const defaultSettings: ProgressBarSettings = {
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  progressColor: '#ff6b35',
  scrubberColor: '#ffffff',
  height: 16,
  scrubberSize: 18,
  borderRadius: 4,
  opacity: 1,
  shadowBlur: 4,
  shadowColor: 'rgba(0, 0, 0, 0.4)',
  isVisible: true,
  useDeceptiveProgress: false,
  useFastStart: false, // disabled by default
  fastStartDuration: 10, // 10 seconds fast start (user can adjust 0-60)
  fastStartProgress: 0.1, // reach 10% in first 10 seconds
  useFastEnd: false, // disabled by default
  fastEndDuration: 5, // 5 seconds fast end (user can adjust 0-60)
  fastEndProgress: 0.9, // start fast progress at 90%
};

export const useProgressBarStore = create<ProgressBarStore>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  isSaving: false,
  
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),
    
  resetToDefault: () =>
    set({ settings: defaultSettings }),
    
  loadSettings: async () => {
    set({ isLoading: true });
    
    try {
      const response = await fetch('/api/progress-bar-settings');
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const data = await response.json();
      
      if (data.settings) {
        const mergedSettings = { ...defaultSettings, ...data.settings };
        console.log('[Progress Bar Store] Loaded settings from API:', {
          apiSettings: data.settings,
          defaultSettings,
          mergedSettings
        });
        set({ settings: mergedSettings });
      } else {
        console.log('[Progress Bar Store] No settings from API, using defaults');
      }
    } catch (error) {
      console.error('Error loading progress bar settings:', error);
      // Keep default settings on error
    } finally {
      set({ isLoading: false });
    }
  },
  
  saveSettings: async () => {
    const { settings } = get();
    set({ isSaving: true });
    
    try {
      const response = await fetch('/api/progress-bar-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      console.log('Progress bar settings saved successfully');
    } catch (error) {
      console.error('Error saving progress bar settings:', error);
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },
}));
