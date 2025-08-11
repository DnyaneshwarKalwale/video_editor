import { IDesign } from "@designcombo/types";
import { create } from "zustand";
interface Output {
	url: string;
	type: string;
}

interface DownloadState {
	projectId: string;
	exporting: boolean;
	exportType: "json" | "mp4";
	progress: number;
	output?: Output;
	payload?: IDesign;
	displayProgressModal: boolean;
	actions: {
		setProjectId: (projectId: string) => void;
		setExporting: (exporting: boolean) => void;
		setExportType: (exportType: "json" | "mp4") => void;
		setProgress: (progress: number) => void;
		setState: (state: Partial<DownloadState>) => void;
		setOutput: (output: Output) => void;
		startExport: () => void;
		setDisplayProgressModal: (displayProgressModal: boolean) => void;
	};
}

//const baseUrl = "https://api.combo.sh/v1";

export const useDownloadState = create<DownloadState>((set, get) => ({
	projectId: "",
	exporting: false,
	exportType: "mp4",
	progress: 0,
	displayProgressModal: false,
	actions: {
		setProjectId: (projectId) => set({ projectId }),
		setExporting: (exporting) => set({ exporting }),
		setExportType: (exportType) => set({ exportType }),
		setProgress: (progress) => set({ progress }),
		setState: (state) => set({ ...state }),
		setOutput: (output) => set({ output }),
		setDisplayProgressModal: (displayProgressModal) =>
			set({ displayProgressModal }),
		startExport: async () => {
			try {
				// Set exporting to true at the start
				set({ exporting: true, displayProgressModal: true, progress: 0 });

				// Assume payload to be stored in the state for POST request
				const { payload } = get();

				if (!payload) throw new Error("Payload is not defined");

				// Simulate progress updates for Remotion rendering
				const progressInterval = setInterval(() => {
					const currentProgress = get().progress;
					if (currentProgress < 90) {
						set({ progress: currentProgress + 10 });
					}
				}, 1000);

				// Convert DesignCombo data to Remotion format
				const textOverlays = Object.values(payload.trackItemsMap)
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

				const videoTrackItems = Object.values(payload.trackItemsMap)
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

				const audioTrackItems = Object.values(payload.trackItemsMap)
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

				// Create variation data for the current composition
				const variation = {
					id: 'current-composition',
					text: textOverlays[0]?.text || 'Video',
					originalTextId: textOverlays[0]?.id,
					isOriginal: true,
					editable: false,
				};

				// Get the correct canvas size from the payload
				const canvasWidth = payload.size?.width || 1080;
				const canvasHeight = payload.size?.height || 1920;
				
				console.log('Exporting with canvas size:', { width: canvasWidth, height: canvasHeight });
				console.log('Payload size:', payload.size);
				console.log('Text overlays count:', textOverlays.length);
				console.log('Video track items count:', videoTrackItems.length);
				console.log('Audio track items count:', audioTrackItems.length);

				// Use Remotion renderer instead of DesignCombo
				const response = await fetch('/api/render-video', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						variation,
						textOverlays,
						platformConfig: {
							width: canvasWidth,
							height: canvasHeight,
							aspectRatio: `${canvasWidth}:${canvasHeight}`,
						},
						duration: payload.duration || 5000,
						videoTrackItems,
						audioTrackItems,
					}),
				});

				if (!response.ok) {
					const errorText = await response.text();
					console.error('Remotion API error response:', errorText);
					throw new Error(`Failed to start video rendering: ${response.status} ${response.statusText}`);
				}

				const jobResponse = await response.json();
				const { jobId } = jobResponse;
				
				console.log('Video render job created:', jobId);

				// Poll for job completion
				let attempts = 0;
				const maxAttempts = 300; // 5 minutes with 1-second intervals
				
				while (attempts < maxAttempts) {
					await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
					attempts++;
					
					// Update progress (estimate based on time)
					const estimatedProgress = Math.min(90, (attempts / maxAttempts) * 90);
					set({ progress: estimatedProgress });
					
					// Check job status
					const statusResponse = await fetch(`/api/render-video?jobId=${jobId}`);
					
					if (!statusResponse.ok) {
						console.error('Failed to check job status:', statusResponse.status);
						continue;
					}
					
					const statusData = await statusResponse.json();
					
					if (statusData.status === 'completed') {
						console.log('Video render completed, downloading...');
						set({ progress: 95 });
						
						// Download the completed video
						const downloadResponse = await fetch(`/api/render-video?jobId=${jobId}`, {
							method: 'PUT'
						});
						
						if (!downloadResponse.ok) {
							throw new Error(`Failed to download video: ${downloadResponse.status}`);
						}
						
						// Get the video blob
						const videoBlob = await downloadResponse.blob();
						
						// Check if the blob is valid
						if (videoBlob.size === 0) {
							throw new Error('Received empty video file from server');
						}
						
						console.log('Video blob received:', {
							size: videoBlob.size,
							type: videoBlob.type
						});
						
						// Create a temporary URL for the blob
						const url = URL.createObjectURL(videoBlob);
						
						// Set the output
						set({ 
							exporting: false, 
							output: { url, type: get().exportType },
							progress: 100 
						});
						
						return; // Success!
						
					} else if (statusData.status === 'failed') {
						throw new Error(`Video rendering failed: ${statusData.error || 'Unknown error'}`);
					}
					
					// Still processing, continue polling
					console.log(`Job status: ${statusData.status}, progress: ${statusData.progress}%`);
				}
				
				// If we get here, the job took too long
				throw new Error('Video rendering timed out after 5 minutes');

			} catch (error) {
				console.error('Error in Remotion export:', error);
				set({ exporting: false, progress: 0 });
			}
		},
	},
}));
