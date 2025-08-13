import { useState } from "react";
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
import { getDefaultVideoSize } from "../utils/platform-positioning";

export const Uploads = () => {
	const isDraggingOverTimeline = useIsDraggingOverTimeline();
	const { currentPlatform } = usePlatformStoreClient();
	const { uploads, pendingUploads, activeUploads, setShowUploadModal } = useUploadStore();

	const videos = uploads.filter((upload: any) => upload.type === "video");
	const images = uploads.filter((upload: any) => upload.type === "image");
	const audios = uploads.filter((upload: any) => upload.type === "audio");

	const handleAddVideo = (video: any) => {
		const srcVideo = video.metadata?.uploadedUrl || video.url;
		const defaultVideoSize = getDefaultVideoSize(currentPlatform);

		// Create video payload with proper positioning based on current platform
		const videoPayload = {
			id: generateId(),
			display: {
				from: 0,
				to: 5000,
			},
			type: "video",
			details: {
				src: srcVideo,
				left: 0,
				top: 0,
				width: defaultVideoSize.width,
				height: defaultVideoSize.height,
			},
			metadata: {
				previewUrl:
					"https://cdn.designcombo.dev/caption_previews/static_preset1.webp",
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
		const srcImage = image.metadata?.uploadedUrl || image.url;
		const defaultImageSize = getDefaultVideoSize(currentPlatform); // Use same logic as video

		// Create image payload with proper positioning based on current platform
		const imagePayload = {
			id: generateId(),
			display: {
				from: 0,
				to: 5000,
			},
			type: "image",
			details: {
				src: srcImage,
				left: 0,
				top: 0,
				width: defaultImageSize.width,
				height: defaultImageSize.height,
			},
			metadata: {},
		};

		dispatch(ADD_IMAGE, {
			payload: imagePayload,
			options: {},
		});
	};

	const handleAddAudio = (audio: any) => {
		const srcAudio = audio.metadata?.uploadedUrl || audio.url;
		dispatch(ADD_AUDIO, {
			payload: {
				id: generateId(),
				type: "audio",
				details: {
					src: srcAudio,
				},
				metadata: {},
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
			<div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
				Your uploads
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
										{video.file?.name || video.url || "Video"}
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
										{image.file?.name || image.url || "Image"}
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
										{audio.file?.name || audio.url || "Audio"}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
