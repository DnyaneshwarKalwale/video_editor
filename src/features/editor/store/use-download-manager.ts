import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DownloadItem {
  id: string;
  name: string;
  type: 'video' | 'variation';
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  size?: number;
  error?: string;
  jobId?: string;
  createdAt: Date;
  completedAt?: Date;
  data?: any; // Video data for rendering
}

interface DownloadManagerState {
  downloads: DownloadItem[];
  isOpen: boolean;
  maxConcurrent: number;
  isProcessing: boolean; // Global processing lock
  
  // Actions
  addDownload: (name: string, type: 'video' | 'variation', data?: any) => string;
  removeDownload: (id: string) => void;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  setOpen: (open: boolean) => void;
  setMaxConcurrent: (max: number) => void;
  
  // Queue management
  processQueue: () => void;
  startDownload: (download: DownloadItem) => Promise<void>;
  
  // Download methods
  downloadVideo: (download: DownloadItem) => Promise<void>;
  downloadVariation: (download: DownloadItem) => Promise<void>;
}

export const useDownloadManager = create<DownloadManagerState>()(
  persist(
    (set, get) => ({
      downloads: [],
      isOpen: false,
      maxConcurrent: 1, // Only one download at a time
      isProcessing: false, // Global processing lock // Reduced from 2 to 1 to prevent server overload

      addDownload: (name: string, type: 'video' | 'variation', data?: any) => {
        const id = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newDownload: DownloadItem = {
          id,
          name,
          type,
          status: 'pending',
          progress: 0,
          createdAt: new Date(),
          data
        };

        set(state => ({
          downloads: [...state.downloads, newDownload]
        }));

        // Process queue after adding with longer delay
        setTimeout(() => get().processQueue(), 500);
        
        return id;
      },

      removeDownload: (id: string) => {
        set(state => ({
          downloads: state.downloads.filter(d => d.id !== id)
        }));
      },

      updateDownload: (id: string, updates: Partial<DownloadItem>) => {
        set(state => ({
          downloads: state.downloads.map(d => 
            d.id === id ? { ...d, ...updates } : d
          )
        }));
      },

      pauseDownload: (id: string) => {
        get().updateDownload(id, { status: 'paused' });
      },

      resumeDownload: (id: string) => {
        get().updateDownload(id, { status: 'pending' });
        setTimeout(() => get().processQueue(), 100);
      },

      clearCompleted: () => {
        set(state => ({
          downloads: state.downloads.filter(d => d.status !== 'completed')
        }));
      },

      clearAll: () => {
        set({ downloads: [] });
      },

      setOpen: (open: boolean) => {
        set({ isOpen: open });
      },

      setMaxConcurrent: (max: number) => {
        set({ maxConcurrent: max });
      },

      processQueue: () => {
        const { downloads, maxConcurrent, isProcessing } = get();
        const pendingDownloads = downloads.filter(d => d.status === 'pending');
        const downloadingCount = downloads.filter(d => d.status === 'downloading').length;
        
        console.log(`[Queue] Processing queue: ${downloadingCount} downloading, ${pendingDownloads.length} pending, max: ${maxConcurrent}, isProcessing: ${isProcessing}`);
        
        if (!isProcessing && downloadingCount < maxConcurrent && pendingDownloads.length > 0) {
          const nextDownload = pendingDownloads[0];
          console.log(`[Queue] Starting download: ${nextDownload.name}`);
          set({ isProcessing: true });
          get().startDownload(nextDownload);
        } else if (downloadingCount >= maxConcurrent) {
          console.log(`[Queue] Max concurrent downloads reached (${downloadingCount}/${maxConcurrent}), waiting...`);
        } else if (isProcessing) {
          console.log(`[Queue] Already processing, skipping...`);
        }
      },

      startDownload: async (download: DownloadItem) => {
        if (download.status !== 'pending') return;

        // Update status to downloading
        get().updateDownload(download.id, { status: 'downloading' });

        try {
          if (download.type === 'video') {
            await get().downloadVideo(download);
          } else if (download.type === 'variation') {
            await get().downloadVariation(download);
          }
        } catch (error) {
          console.error(`Download failed for ${download.name}:`, error);
          get().updateDownload(download.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          });
        } finally {
          // Always release the processing lock
          set({ isProcessing: false });
          // Process next in queue
          setTimeout(() => get().processQueue(), 1000);
        }
      },

      downloadVideo: async (download: DownloadItem) => {
        if (!download.data) {
          throw new Error('No video data provided');
        }

        // Start the render job
        const response = await fetch('/api/render-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(download.data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to start video rendering: ${response.status} ${response.statusText}`);
        }

        const jobResponse = await response.json();
        const { jobId } = jobResponse;
        
        // Update download with job ID
        get().updateDownload(download.id, { jobId });

        // Poll for completion with longer intervals
        let attempts = 0;
        const maxAttempts = 1200; // Increased to 20 minutes for server processing
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Increased polling interval
          attempts++;
          
          // Update progress (estimate)
          const estimatedProgress = Math.min(90, (attempts / maxAttempts) * 90);
          get().updateDownload(download.id, { progress: estimatedProgress });
          
          // Check job status
          const statusResponse = await fetch(`/api/render-video?jobId=${jobId}`);
          
          if (!statusResponse.ok) {
            console.error(`Failed to check job status for ${download.name}:`, statusResponse.status);
            continue;
          }
          
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed') {
            // Download the completed video
            const downloadResponse = await fetch(`/api/render-video?jobId=${jobId}`, {
              method: 'PUT'
            });
            
            if (!downloadResponse.ok) {
              throw new Error(`Failed to download video: ${downloadResponse.status}`);
            }
            
            const videoBlob = await downloadResponse.blob();
            
            if (videoBlob.size === 0) {
              throw new Error('Received empty video file');
            }
            
            // Create download link
            const url = URL.createObjectURL(videoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${download.name}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Update status
            get().updateDownload(download.id, {
              status: 'completed',
              progress: 100,
              completedAt: new Date()
            });
            
            // Process next in queue with longer delay
            setTimeout(() => get().processQueue(), 1000);
            return;
            
          } else if (statusData.status === 'failed') {
            throw new Error(`Video rendering failed: ${statusData.error || 'Unknown error'}`);
          }
        }
        
        throw new Error('Video rendering timed out after 20 minutes');
      },

      downloadVariation: async (download: DownloadItem) => {
        if (!download.data) {
          throw new Error('No variation data provided');
        }

        // Start the render job for variation
        const response = await fetch('/api/render-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(download.data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to start variation rendering: ${response.status} ${response.statusText}`);
        }

        const jobResponse = await response.json();
        const { jobId } = jobResponse;
        
        // Update download with job ID
        get().updateDownload(download.id, { jobId });

        // Poll for completion with longer intervals
        let attempts = 0;
        const maxAttempts = 1200; // Increased to 20 minutes for server processing
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Increased polling interval
          attempts++;
          
          // Update progress
          const estimatedProgress = Math.min(90, (attempts / maxAttempts) * 90);
          get().updateDownload(download.id, { progress: estimatedProgress });
          
          // Check job status
          const statusResponse = await fetch(`/api/render-video?jobId=${jobId}`);
          
          if (!statusResponse.ok) {
            console.error(`Failed to check job status for ${download.name}:`, statusResponse.status);
            continue;
          }
          
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed') {
            // Download the completed variation
            const downloadResponse = await fetch(`/api/render-video?jobId=${jobId}`, {
              method: 'PUT'
            });
            
            if (!downloadResponse.ok) {
              throw new Error(`Failed to download variation: ${downloadResponse.status}`);
            }
            
            const videoBlob = await downloadResponse.blob();
            
            if (videoBlob.size === 0) {
              throw new Error('Received empty video file');
            }
            
            // Create download link
            const url = URL.createObjectURL(videoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${download.name}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Update status
            get().updateDownload(download.id, {
              status: 'completed',
              progress: 100,
              completedAt: new Date()
            });
            
            // Process next in queue with longer delay
            setTimeout(() => get().processQueue(), 1000);
            return;
            
          } else if (statusData.status === 'failed') {
            throw new Error(`Variation rendering failed: ${statusData.error || 'Unknown error'}`);
          }
        }
        
        throw new Error('Variation rendering timed out after 20 minutes');
      },
    }),
    {
      name: 'download-manager',
      partialize: (state) => ({ 
        downloads: state.downloads,
        maxConcurrent: state.maxConcurrent 
      }),
    }
  )
);
