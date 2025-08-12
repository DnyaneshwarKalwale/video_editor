import { create } from 'zustand';
import { useDownloadManager } from './use-download-manager';

interface DownloadState {
  exporting: boolean;
  progress: number;
  output: { url: string; type: string } | null;
  exportType: string;
  setExporting: (exporting: boolean) => void;
  setProgress: (progress: number) => void;
  setOutput: (output: { url: string; type: string } | null) => void;
  setExportType: (type: string) => void;
  exportVideo: (stateManager: any, projectName?: string) => Promise<void>;
}

export const useDownloadState = create<DownloadState>((set, get) => ({
  exporting: false,
  progress: 0,
  output: null,
  exportType: 'mp4',

  setExporting: (exporting) => set({ exporting }),
  setProgress: (progress) => set({ progress }),
  setOutput: (output) => set({ output }),
  setExportType: (type) => set({ exportType: type }),

  exportVideo: async (stateManager, projectName = 'Untitled Project') => {
    const { addDownload } = useDownloadManager.getState();
    
    try {
      set({ exporting: true, progress: 0, output: null });

      // Get the current scene data using the correct method
      const sceneData = stateManager.getState();
      const canvasWidth = sceneData.size?.width || 1080;
      const canvasHeight = sceneData.size?.height || 1920;

      // Convert track items to the format expected by the render API
      const textOverlays = Object.values(sceneData.trackItemsMap || {})
        .filter((item: any) => item.type === 'text')
        .map((item: any) => ({
          id: item.id,
          text: item.details.text || '',
          position: {
            top: typeof item.details.top === 'string' ? parseFloat(item.details.top) || 50 : item.details.top || 50,
            left: typeof item.details.left === 'string' ? parseFloat(item.details.left) || 50 : item.details.left || 50,
          },
          style: {
            fontSize: item.details.fontSize || 48,
            fontFamily: item.details.fontFamily || 'Arial, sans-serif',
            color: item.details.color || 'white',
            backgroundColor: item.details.backgroundColor || 'transparent',
            textAlign: item.details.textAlign || 'center',
            fontWeight: item.details.fontWeight?.toString() || 'bold',
            opacity: item.details.opacity || 100,
            borderWidth: item.details.borderWidth,
            borderColor: item.details.borderColor,
            textDecoration: item.details.textDecoration,
          },
          timing: {
            from: item.display.from,
            to: item.display.to,
          },
          width: item.details.width,
          height: item.details.height,
        }));

      const videoTrackItems = Object.values(sceneData.trackItemsMap || {})
        .filter((item: any) => item.type === 'video')
        .map((item: any) => ({
          id: item.id,
          src: item.details.src,
          display: {
            from: item.display.from,
            to: item.display.to,
          },
          details: {
            ...item.details,
            left: typeof item.details.left === 'string' ? parseFloat(item.details.left) || 0 : item.details.left || 0,
            top: typeof item.details.top === 'string' ? parseFloat(item.details.top) || 0 : item.details.top || 0,
            width: item.details.width || 200,
            height: item.details.height || 200,
          },
          trim: item.trim,
          playbackRate: item.playbackRate || 1,
          volume: item.details.volume || 0,
          crop: item.details.crop,
        }));

      const audioTrackItems = Object.values(sceneData.trackItemsMap || {})
        .filter((item: any) => item.type === 'audio')
        .map((item: any) => ({
          id: item.id,
          src: item.details.src,
          display: {
            from: item.display.from,
            to: item.display.to,
          },
          details: {
            ...item.details,
            volume: item.details.volume || 0,
          },
        }));

      // Prepare video data
      const videoData = {
        variation: { id: 'original', isOriginal: true },
        textOverlays,
        platformConfig: {
          width: canvasWidth,
          height: canvasHeight,
          aspectRatio: `${canvasWidth}:${canvasHeight}`,
        },
        duration: sceneData.duration || 5000,
        videoTrackItems,
        audioTrackItems,
      };

      // Add to download manager
      const downloadId = addDownload(
        `${projectName}.mp4`,
        'video',
        videoData
      );

      console.log('Video added to download queue:', downloadId);
      
      // Show progress for a moment then reset
      set({ progress: 100 });
      setTimeout(() => {
        set({ exporting: false, progress: 0 });
      }, 1000);

    } catch (error) {
      console.error('Error adding video to download queue:', error);
      set({ exporting: false, progress: 0 });
      throw error;
    }
  },
}));
