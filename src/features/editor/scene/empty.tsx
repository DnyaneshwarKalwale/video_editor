import { useRef, useState, useEffect } from "react";
import { Droppable } from "@/components/ui/droppable";
import { ADD_IMAGE, ADD_VIDEO, ADD_AUDIO } from "@designcombo/state";
import { dispatch } from "@designcombo/events";
import { generateId } from "@designcombo/timeline";
import { PlusIcon } from "lucide-react";
import { LogoIcons } from "@/components/shared/logos";
import useStore from "../store/use-store";
import ScalezLoader from "@/components/ui/scalez-loader";

import { usePlatformStoreClient } from "../platform-preview";
import { DroppableArea } from "./droppable";

const SceneEmpty = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const [desiredSize, setDesiredSize] = useState({ width: 0, height: 0 });
	const { size } = useStore();
	const { currentPlatform } = usePlatformStoreClient();

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			console.log("Container not ready yet");
			return;
		}

		const PADDING = 96;
		const containerHeight = container.clientHeight - PADDING;
		const containerWidth = container.clientWidth - PADDING;
		const { width, height } = size;

		console.log("SceneEmpty sizing:", { containerHeight, containerWidth, size });

		if (containerHeight <= 0 || containerWidth <= 0 || !width || !height) {
			console.log("Invalid dimensions, keeping loading state");
			return;
		}

		const desiredZoom = Math.min(
			containerWidth / width,
			containerHeight / height,
		);
		
		const calculatedSize = {
			width: width * desiredZoom,
			height: height * desiredZoom,
		};
		
		console.log("SceneEmpty calculated size:", calculatedSize);
		setDesiredSize(calculatedSize);
		setIsLoading(false);
		console.log("SceneEmpty loading complete");
	}, [size]);

	const onSelectFiles = async (files: File[]) => {
		console.log("onSelectFiles called with files:", files);
		setIsLoading(true);
		
		// Check file size limit (50MB)
		const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
		
		for (const file of files) {
			console.log("Processing file:", file.name, file.type, "Size:", file.size);
			
			// Check file size
			if (file.size > MAX_FILE_SIZE) {
				console.error(`File ${file.name} is too large. Max size: 50MB`);
				continue;
			}
			
			const fileType = file.type;
			
			try {
				// Upload file to Cloudinary first
				const formData = new FormData();
				formData.append('file', file);
				formData.append('projectId', window.location.pathname.split('/')[2]); // Get project ID from URL
				
				console.log(`Uploading ${file.name} to Cloudinary...`);
				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					body: formData,
				});
				
				if (!uploadResponse.ok) {
					throw new Error('Upload failed');
				}
				
				const uploadResult = await uploadResponse.json();
				const cloudinaryUrl = uploadResult.asset.cloudinaryUrl;
				
				console.log("File uploaded to Cloudinary:", cloudinaryUrl);
			
			if (fileType.startsWith('image/')) {
					console.log("Adding image file");
					// Create image payload with Cloudinary URL
				const imagePayload = {
					id: generateId(),
					display: {
						from: 0,
						to: 5000,
					},
					type: "image",
					details: {
							src: cloudinaryUrl, // Use Cloudinary URL instead of local URL
							left: 0,
							top: 0,
							width: currentPlatform.width,
							height: currentPlatform.height,
					},
				};
				
				dispatch(ADD_IMAGE, {
					payload: {
						...imagePayload,
							metadata: {
								cloudinaryUrl: cloudinaryUrl,
								assetId: uploadResult.asset.id,
							},
					},
					options: {},
				});
			} else if (fileType.startsWith('video/')) {
					console.log("Adding video file");
					
					// Get duration from Cloudinary upload result (more reliable)
					const videoDuration = uploadResult.asset.metadata?.duration 
						? Math.round(uploadResult.asset.metadata.duration * 1000) // Convert seconds to milliseconds
						: 5000; // Fallback duration
					
					console.log("Video duration from Cloudinary:", videoDuration, "ms");
					
					// Create video payload with Cloudinary URL
					const videoPayload = {
						id: generateId(),
						display: {
							from: 0,
							to: videoDuration,
						},
						type: "video",
						details: {
							src: cloudinaryUrl, // Use Cloudinary URL instead of local URL
							left: 0,
							top: 0,
							width: currentPlatform.width,
							height: currentPlatform.height,
						},
					};
					
					dispatch(ADD_VIDEO, {
						payload: {
							...videoPayload,
							metadata: {
								previewUrl: cloudinaryUrl,
								duration: videoDuration,
								originalWidth: uploadResult.asset.metadata?.width || 1920,
								originalHeight: uploadResult.asset.metadata?.height || 1080,
								cloudinaryUrl: cloudinaryUrl,
								assetId: uploadResult.asset.id,
							},
						},
						options: {
							resourceId: "main",
							scaleMode: "fit",
						},
				});
			} else if (fileType.startsWith('audio/')) {
					console.log("Adding audio file");
				dispatch(ADD_AUDIO, {
					payload: {
						id: generateId(),
						type: 'audio',
						details: {
								src: cloudinaryUrl, // Use Cloudinary URL instead of local URL
							},
							metadata: {
								cloudinaryUrl: cloudinaryUrl,
								assetId: uploadResult.asset.id,
							},
					},
					options: {},
				});
				} else {
					console.log("Unknown file type:", fileType);
				}
			} catch (error) {
				console.error("Error uploading file:", error);
			}
		}
		
		setIsLoading(false);
	};

	return (
		<div ref={containerRef} className="absolute z-50 flex h-full w-full flex-1">
			{!isLoading ? (
				<Droppable
					maxFileCount={4}
					maxSize={50 * 1024 * 1024} // 50MB limit
					disabled={isLoading}
					multiple={true}
					onValueChange={onSelectFiles}
					accept={{
						"image/*": [],
						"video/*": [],
						"audio/*": []
					}}
					className="h-full w-full flex-1 bg-background"
				>
					<DroppableArea
						onDragStateChange={setIsDraggingOver}
						className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform items-center justify-center border border-dashed text-center transition-colors duration-200 ease-in-out ${
							isDraggingOver ? "border-white bg-white/10" : "border-white/15"
						}`}
						style={{
							width: desiredSize.width,
							height: desiredSize.height,
						}}
					>
						<div className="flex flex-col items-center justify-center gap-6 pb-12">
							{/* Scalez Logo and Brand */}
							<div className="flex flex-col items-center gap-3 mb-4">
								<div className="flex items-center gap-3">
									<LogoIcons.scalez className="h-8 w-8" />
									<h1 className="text-2xl font-bold text-gray-900">Scalez</h1>
								</div>
								<p className="text-sm text-gray-600">AI Video Generator</p>
							</div>
							
							{/* Upload Area */}
							<div className="flex flex-col items-center justify-center gap-4">
								{isLoading ? (
									<div className="flex flex-col items-center gap-2">
										<ScalezLoader />
										<p className="text-sm text-muted-foreground">Uploading to Cloudinary...</p>
									</div>
								) : (
									<>
								<div className="hover:bg-primary-dark cursor-pointer rounded-md border bg-primary p-2 text-secondary transition-colors duration-200">
									<PlusIcon className="h-5 w-5" aria-hidden="true" />
								</div>
								<div className="flex flex-col gap-px">
									<p className="text-sm text-muted-foreground">Click to upload</p>
									<p className="text-xs text-muted-foreground/70">
												Or drag and drop files here (Max 50MB)
									</p>
								</div>
									</>
								)}
							</div>
						</div>
					</DroppableArea>
				</Droppable>
			) : (
				<div className="flex flex-1 items-center justify-center bg-background-subtle">
					<ScalezLoader />
				</div>
			)}
		</div>
	);
};

export default SceneEmpty;
