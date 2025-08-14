import { create } from 'zustand';
import { PlatformConfig, PLATFORM_CONFIGS, DEFAULT_PLATFORM } from './platform-preview';
import { dispatch } from "@designcombo/events";
import { DESIGN_RESIZE } from "@designcombo/state";

interface PlatformState {
  currentPlatform: PlatformConfig;
  showOverlay: boolean;
  setCurrentPlatform: (platform: PlatformConfig) => void;
  setPlatform: (platform: PlatformConfig) => void;
  setShowOverlay: (show: boolean) => void;
  toggleOverlay: () => void;
}

const usePlatformStore = create<PlatformState>((set) => ({
  currentPlatform: DEFAULT_PLATFORM,
  showOverlay: false,
  setCurrentPlatform: (platform) => set({ currentPlatform: platform }),
  setPlatform: (platform) => {
    set({ currentPlatform: platform });
    // Dispatch DESIGN_RESIZE to update canvas size like in old code
    dispatch(DESIGN_RESIZE, {
      payload: {
        width: platform.width,
        height: platform.height,
        name: platform.aspectRatio,
      },
    });
  },
  setShowOverlay: (show) => set({ showOverlay: show }),
  toggleOverlay: () => set((state) => ({ showOverlay: !state.showOverlay })),
}));

// Client-side only hook to prevent hydration issues
export const usePlatformStoreClient = () => {
  if (typeof window === 'undefined') {
    return {
      currentPlatform: DEFAULT_PLATFORM,
      showOverlay: false,
      setCurrentPlatform: () => {},
      setPlatform: () => {},
      setShowOverlay: () => {},
      toggleOverlay: () => {},
    };
  }
  return usePlatformStore();
};

export default usePlatformStore; 