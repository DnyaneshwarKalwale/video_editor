import { create } from 'zustand';
import { PlatformConfig, PLATFORM_CONFIGS } from './platform-preview';

interface PlatformState {
  currentPlatform: PlatformConfig;
  showOverlay: boolean;
  setCurrentPlatform: (platform: PlatformConfig) => void;
  setShowOverlay: (show: boolean) => void;
  toggleOverlay: () => void;
}

const usePlatformStore = create<PlatformState>((set) => ({
  currentPlatform: PLATFORM_CONFIGS[0], // Default to Instagram Reels
  showOverlay: false, // Start with overlay off to avoid hydration issues
  setCurrentPlatform: (platform) => set({ currentPlatform: platform }),
  setShowOverlay: (show) => set({ showOverlay: show }),
  toggleOverlay: () => set((state) => ({ showOverlay: !state.showOverlay })),
}));

// Client-side only hook to prevent hydration issues
export const usePlatformStoreClient = () => {
  if (typeof window === 'undefined') {
    return {
      currentPlatform: PLATFORM_CONFIGS[0],
      showOverlay: false,
      setCurrentPlatform: () => {},
      setShowOverlay: () => {},
      toggleOverlay: () => {},
    };
  }
  return usePlatformStore();
};

export default usePlatformStore; 