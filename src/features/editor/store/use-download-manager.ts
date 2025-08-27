import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DownloadItem {
  id: string;
  name: string;
  type: 'video' | 'variation';
  status: 'pending' | 'downloading' | 'completed' | 'failed';
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

      removeDownload: async (id: string) => {
        const download = get().downloads.find(d => d.id === id);
        
        // If the download is currently processing and has a jobId, cancel it on the server
        if (download?.status === 'downloading' && download.jobId) {
          try {
            console.log(`[Download Manager] Cancelling Lambda job ${download.jobId} for download ${id}`);
            
            // Call the DELETE endpoint to properly cancel the Lambda job
            const response = await fetch(`/api/render-lambda?jobId=${download.jobId}`, {
              method: 'DELETE'
            });
            
            if (response.ok) {
              console.log(`[Download Manager] Successfully cancelled Lambda job ${download.jobId}`);
            } else {
              console.error(`[Download Manager] Failed to cancel Lambda job ${download.jobId}:`, response.status);
            }
          } catch (error) {
            console.error(`[Download Manager] Failed to cancel Lambda job ${download.jobId}:`, error);
          }
        }
        
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
        
        // Remove any cancelled downloads from the queue
        const cancelledDownloads = downloads.filter(d => d.status === 'failed' && d.error === 'Download was cancelled');
        if (cancelledDownloads.length > 0) {
          console.log(`[Queue] Removing ${cancelledDownloads.length} cancelled downloads from queue`);
        }
        
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

        // Check if download was cancelled while waiting
        const currentDownload = get().downloads.find(d => d.id === download.id);
        if (!currentDownload || currentDownload.status !== 'pending') {
          return;
        }

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

        // Start the Lambda render job
        const response = await fetch('/api/render-lambda', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(download.data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error('Failed to start video rendering. Please try again.');
        }

        const jobResponse = await response.json();
        const { jobId } = jobResponse;
        
        // Update download with job ID
        get().updateDownload(download.id, { jobId });

        // Poll for completion with Lambda-optimized intervals
        let attempts = 0;
        const maxAttempts = 600; // 20 minutes for Lambda (faster than local)
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second polling for faster updates
          attempts++;
          
          // Check if download was cancelled
          const currentDownload = get().downloads.find(d => d.id === download.id);
          if (!currentDownload || currentDownload.status === 'failed') {
            console.log(`[Download Manager] Download ${download.id} was cancelled, stopping polling`);
            return;
          }
          
          // Check job status to get real progress
          const statusResponse = await fetch(`/api/render-lambda?jobId=${jobId}`);
          
          if (!statusResponse.ok) {
            if (statusResponse.status === 404) {
              // Job was cancelled or completed and cleaned up
              const errorData = await statusResponse.json();
              if (errorData.status === 'not_found') {
                console.log(`[Download Manager] Lambda job ${jobId} was cancelled or completed for ${download.name}`);
                get().updateDownload(download.id, {
                  status: 'failed',
                  error: 'Download was cancelled or completed',
                  completedAt: new Date()
                });
                return;
              }
            }
            
            console.error(`Failed to check Lambda job status for ${download.name}:`, statusResponse.status);
            // Use estimated progress as fallback
            const estimatedProgress = Math.min(90, (attempts / maxAttempts) * 90);
            get().updateDownload(download.id, { progress: estimatedProgress });
            continue;
          }
          
          const statusData = await statusResponse.json();
          
          // Update progress based on actual status
          if (statusData.status === 'processing') {
            // Use actual progress from Lambda API if available, otherwise estimate
            const actualProgress = statusData.progress || Math.min(90, (attempts / maxAttempts) * 90);
            get().updateDownload(download.id, { progress: actualProgress });
          } else if (statusData.status === 'pending') {
            // Show initial progress for pending jobs
            const initialProgress = Math.min(10, attempts * 2);
            get().updateDownload(download.id, { progress: initialProgress });
          }
          
          if (statusData.status === 'completed') {
            // Download the completed video from Lambda
            const downloadResponse = await fetch(`/api/render-lambda?jobId=${jobId}`, {
              method: 'PUT'
            });
            
            if (!downloadResponse.ok) {
              throw new Error('Failed to download video. Please try again.');
            }
            
            const videoBlob = await downloadResponse.blob();
            
            if (videoBlob.size === 0) {
              throw new Error('Video file is corrupted. Please try again.');
            }
            
            // Create download link
            const url = URL.createObjectURL(videoBlob);
            const a = document.createElement('a');
            a.href = url;
            // Check if filename already has .mp4 extension to avoid double extension
            const filename = download.name.endsWith('.mp4') ? download.name : `${download.name}.mp4`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Update status
            get().updateDownload(download.id, {
              status: 'completed',
              progress: 100,
              completedAt: new Date()
            });
            
            // Process next in queue
            setTimeout(() => get().processQueue(), 1000);
            return;
            
          } else if (statusData.status === 'failed') {
            // Use the user-friendly error message from the API
            const errorMessage = statusData.error || 'Video rendering failed. Please try again.';
            throw new Error(errorMessage);
          }
        }
        
        throw new Error('Video rendering timed out. Please try with a shorter video or check your internet connection.');
      },

      downloadVariation: async (download: DownloadItem) => {
        if (!download.data) {
          throw new Error('No variation data provided');
        }

        // Start the Lambda render job for variation
        const response = await fetch('/api/render-lambda', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(download.data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error('Failed to start video rendering. Please try again.');
        }

        const jobResponse = await response.json();
        const { jobId } = jobResponse;
        
        // Update download with job ID
        get().updateDownload(download.id, { jobId });

        // Poll for completion with Lambda-optimized intervals
        let attempts = 0;
        const maxAttempts = 600; // 20 minutes for Lambda (faster than local)
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second polling for Lambda
          attempts++;
          
          // Check if download was cancelled
          const currentDownload = get().downloads.find(d => d.id === download.id);
          if (!currentDownload || currentDownload.status === 'failed') {
            console.log(`[Download Manager] Download ${download.id} was cancelled, stopping polling`);
            return;
          }
          
          // Update progress
          const estimatedProgress = Math.min(90, (attempts / maxAttempts) * 90);
          get().updateDownload(download.id, { progress: estimatedProgress });
          
          // Check job status
          const statusResponse = await fetch(`/api/render-lambda?jobId=${jobId}`);
          
          if (!statusResponse.ok) {
            console.error(`Failed to check Lambda job status for ${download.name}:`, statusResponse.status);
            continue;
          }
          
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed') {
            // Download the completed variation from Lambda
            const downloadResponse = await fetch(`/api/render-lambda?jobId=${jobId}`, {
              method: 'PUT'
            });
            
            if (!downloadResponse.ok) {
              throw new Error('Failed to download video. Please try again.');
            }
            
            const videoBlob = await downloadResponse.blob();
            
            if (videoBlob.size === 0) {
              throw new Error('Video file is corrupted. Please try again.');
            }
            
            // Create download link
            const url = URL.createObjectURL(videoBlob);
            const a = document.createElement('a');
            a.href = url;
            // Check if filename already has .mp4 extension to avoid double extension
            const filename = download.name.endsWith('.mp4') ? download.name : `${download.name}.mp4`;
            a.download = filename;
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
