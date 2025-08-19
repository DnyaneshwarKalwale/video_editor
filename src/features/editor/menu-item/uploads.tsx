import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ADD_AUDIO, ADD_IMAGE, ADD_VIDEO } from "@designcombo/state";
import { dispatch } from "@designcombo/events";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import Draggable from "@/components/shared/draggable";
import { cn } from "@/lib/utils";
import { generateId } from "@designcombo/timeline";
import { UploadIcon, VideoIcon, ImageIcon, Music, Loader2 } from "lucide-react";
import ModalUpload from "@/components/modal-upload";
import useUploadStore from "../store/use-upload-store";

import { usePlatformStoreClient } from "../platform-preview";


export const Uploads = () => {
	const isDraggingOverTimeline = useIsDraggingOverTimeline();
	const { currentPlatform } = usePlatformStoreClient();
	const { uploads, pendingUploads, activeUploads, setShowUploadModal } = useUploadStore();
	
	// State for assets from database
	const [assets, setAssets] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	// Fetch assets from database
	const fetchAssets = async () => {
		try {
			setLoading(true);
			const response = await fetch('/api/assets');
			if (response.ok) {
				const data = await response.json();
				setAssets(data.assets || []);
			}
		} catch (error) {
			console.error('Error fetching assets:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAssets();
	}, []);

	// Combine local uploads with database assets
	const allUploads = [...uploads, ...assets];
	const videos = allUploads.filter((upload: any) => 
		upload.type === "video" || upload.fileType?.startsWith("video/")
	);
	const images = allUploads.filter((upload: any) => 
		upload.type === "image" || upload.fileType?.startsWith("image/")
	);
	const audios = allUploads.filter((upload: any) => 
		upload.type === "audio" || upload.fileType?.startsWith("audio/")
	);

	const handleAddVideo = (video: any) => {
		// Use Cloudinary URL from database assets or fallback to local uploads
		const srcVideo = video.url || video.metadata?.uploadedUrl || video.metadata?.cloudinaryUrl;

		// Get duration from metadata (convert seconds to milliseconds if needed)
		let videoDuration = 5000; // Default fallback
		if (video.metadata?.duration) {
			// If duration is in seconds, convert to milliseconds
			videoDuration = video.metadata.duration > 1000 
				? video.metadata.duration // Already in milliseconds
				: Math.round(video.metadata.duration * 1000); // Convert seconds to milliseconds
		}

		console.log("Adding video with duration:", videoDuration, "ms");

		// Create video payload with simple positioning
		const videoPayload = {
			id: generateId(),
			display: {
				from: 0,
				to: videoDuration,
			},
			type: "video",
			details: {
				src: srcVideo,
				left: 0,
				top: 0,
				width: currentPlatform.width,
				height: currentPlatform.height,
			},
			metadata: {
				previewUrl: srcVideo,
				duration: videoDuration,
				cloudinaryUrl: srcVideo,
				assetId: video.id,
				originalWidth: video.metadata?.width || 1920,
				originalHeight: video.metadata?.height || 1080,
			},
		};

		dispatch(ADD_VIDEO, {
			payload: videoPayload,
			options: {
				resourceId: "main",
				scaleMode: "fit",
			},
		});
	};

	const handleAddImage = (image: any) => {
		// Use Cloudinary URL from database assets or fallback to local uploads
		const srcImage = image.url || image.metadata?.uploadedUrl || image.metadata?.cloudinaryUrl;

		// Create image payload with simple positioning
		const imagePayload = {
			id: generateId(),
			display: {
				from: 0,
				left: 0,
				to: 5000,
			},
			type: "image",
			details: {
				src: srcImage,
				left: 0,
				top: 0,
				width: currentPlatform.width,
				height: currentPlatform.height,
			},
			metadata: {
				cloudinaryUrl: srcImage,
				assetId: image.id,
			},
		};

		dispatch(ADD_IMAGE, {
			payload: imagePayload,
			options: {},
		});
	};

	const handleAddAudio = (audio: any) => {
		// Use Cloudinary URL from database assets or fallback to local uploads
		const srcAudio = audio.url || audio.metadata?.uploadedUrl || audio.metadata?.cloudinaryUrl;
		
		dispatch(ADD_AUDIO, {
			payload: {
				id: generateId(),
				type: "audio",
				details: {
					src: srcAudio,
				},
				metadata: {
					cloudinaryUrl: srcAudio,
					assetId: audio.id,
				},
			},
			options: {},
		});
	};

	const UploadPrompt = () => (
		<div className="flex items-center justify-center px-4">
			<Button
				className="w-full cursor-pointer"
				onClick={() => setShowUploadModal(true)}
			>
				<UploadIcon className="w-4 h-4" />
				<span className="ml-2">Upload</span>
			</Button>
		</div>
	);

	return (
		<div className="flex flex-1 flex-col">
			<div className="text-text-primary flex h-12 flex-none items-center justify-between px-4 text-sm font-medium">
				<span>Your uploads</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={fetchAssets}
					disabled={loading}
					className="h-6 w-6 p-0"
				>
					<Loader2 className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
				</Button>
			</div>
			<ModalUpload />
			<UploadPrompt />

			{/* Uploads in Progress Section */}
			{(pendingUploads.length > 0 || activeUploads.length > 0) && (
				<div className="p-4">
					<div className="font-medium text-sm mb-2 flex items-center gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
						Uploads in Progress
					</div>
					<div className="flex flex-col gap-2">
						{pendingUploads.map((upload: any) => (
							<div key={upload.id} className="flex items-center gap-2">
								<span className="truncate text-xs flex-1">
									{upload.file?.name || upload.url || "Unknown"}
								</span>
								<span className="text-xs text-muted-foreground">Pending</span>
							</div>
						))}
						{activeUploads.map((upload: any) => (
							<div key={upload.id} className="flex items-center gap-2">
								<span className="truncate text-xs flex-1">
									{upload.file?.name || upload.url || "Unknown"}
								</span>
								<div className="flex items-center gap-1">
									<Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
									<span className="text-xs">{upload.progress ?? 0}%</span>
									<span className="text-xs text-muted-foreground ml-2">
										{upload.status}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="flex flex-col gap-10 p-4">
				{loading ? (
					<div className="flex items-center justify-center py-8">
						<div className="flex items-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span className="text-sm text-muted-foreground">Loading your uploads...</span>
						</div>
					</div>
				) : (
					<>
						{/* Videos Section */}
						{videos.length > 0 && (
					<div>
						<div className="flex items-center gap-2 mb-2">
							<VideoIcon className="w-4 h-4 text-muted-foreground" />
							<span className="font-medium text-sm">Videos</span>
						</div>
						<div className="grid grid-cols-3 gap-2 max-w-full">
							{videos.map((video: any, idx: number) => (
								<div
									className="flex items-center gap-2 flex-col w-full"
									key={video.id || idx}
								>
									<div
										className="w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
										onClick={() => handleAddVideo(video)}
									>
										<VideoIcon className="w-8 h-8 text-muted-foreground" />
									</div>
									<div className="text-xs text-muted-foreground truncate w-full text-center">
										{video.fileName || video.file?.name || video.url || "Video"}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Images Section */}
				{images.length > 0 && (
					<div>
						<div className="flex items-center gap-2 mb-2">
							<ImageIcon className="w-4 h-4 text-muted-foreground" />
							<span className="font-medium text-sm">Images</span>
						</div>
						<div className="grid grid-cols-3 gap-2 max-w-full">
							{images.map((image: any, idx: number) => (
								<div
									className="flex items-center gap-2 flex-col w-full"
									key={image.id || idx}
								>
									<div
										className="w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
										onClick={() => handleAddImage(image)}
									>
										<ImageIcon className="w-8 h-8 text-muted-foreground" />
									</div>
									<div className="text-xs text-muted-foreground truncate w-full text-center">
										{image.fileName || image.file?.name || image.url || "Image"}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Audios Section */}
				{audios.length > 0 && (
					<div>
						<div className="flex items-center gap-2 mb-2">
							<Music className="w-4 h-4 text-muted-foreground" />
							<span className="font-medium text-sm">Audios</span>
						</div>
						<div className="grid grid-cols-3 gap-2 max-w-full">
							{audios.map((audio: any, idx: number) => (
								<div
									className="flex items-center gap-2 flex-col w-full"
									key={audio.id || idx}
								>
									<div
										className="w-16 h-16 flex items-center justify-center overflow-hidden relative cursor-pointer"
										onClick={() => handleAddAudio(audio)}
									>
										<Music className="w-8 h-8 text-muted-foreground" />
									</div>
									<div className="text-xs text-muted-foreground truncate w-full text-center">
										{audio.fileName || audio.file?.name || audio.url || "Audio"}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
					</>
				)}
			</div>
		</div>
	);
};
