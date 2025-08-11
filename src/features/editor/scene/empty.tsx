import { useRef, useState } from "react";
import { Droppable } from "@/components/ui/droppable";
import { ADD_IMAGE, ADD_VIDEO, ADD_AUDIO } from "@designcombo/state";
import { dispatch } from "@designcombo/events";
import { generateId } from "@designcombo/timeline";
import { PlusIcon } from "lucide-react";
import { LogoIcons } from "@/components/shared/logos";
import useStore from "../store/use-store";

import { usePlatformStoreClient } from "../platform-preview";
import { DroppableArea } from "./droppable";

const SceneEmpty = () => {
	const { size: desiredSize } = useStore();
	const { currentPlatform } = usePlatformStoreClient();
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isDraggingOver, setIsDraggingOver] = useState(false);

	const onSelectFiles = (files: File[]) => {
		setIsLoading(true);
		
		files.forEach((file) => {
			const fileType = file.type;
			const fileUrl = URL.createObjectURL(file);
			
			if (fileType.startsWith('image/')) {
				// Create image payload with proper positioning based on current platform
				const imagePayload = {
					id: generateId(),
					display: {
						from: 0,
						to: 5000,
					},
					type: "image",
					details: {
						src: fileUrl,
						width: 400,
						height: 300,
					},
				};
				
				dispatch(ADD_IMAGE, {
					payload: {
						...imagePayload,
						metadata: {},
					},
					options: {},
				});
			} else if (fileType.startsWith('video/')) {
				// Create video payload with proper positioning based on current platform
				const videoPayload = {
					id: generateId(),
					display: {
						from: 0,
						to: 5000,
					},
					type: "video",
					details: {
						src: fileUrl,
						width: 400,
						height: 300,
					},
				};
				
				dispatch(ADD_VIDEO, {
					payload: {
						...videoPayload,
						metadata: {
							previewUrl: fileUrl,
						},
					},
					options: {
						resourceId: "main",
						scaleMode: "fit",
					},
				});
			} else if (fileType.startsWith('audio/')) {
				dispatch(ADD_AUDIO, {
					payload: {
						id: generateId(),
						type: 'audio',
						details: {
							src: fileUrl,
						},
						metadata: {},
					},
					options: {},
				});
			}
		});
		
		setIsLoading(false);
	};

	return (
		<div ref={containerRef} className="absolute z-50 flex h-full w-full flex-1">
			{!isLoading ? (
				<Droppable
					maxFileCount={4}
					maxSize={100 * 1024 * 1024}
					disabled={false}
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
							{/* Ignite Logo and Brand */}
							<div className="flex flex-col items-center gap-3 mb-4">
								<div className="flex items-center gap-3">
									<LogoIcons.ignite className="h-8 w-8" />
									<h1 className="text-2xl font-bold text-gray-900">Ignite</h1>
								</div>
								<p className="text-sm text-gray-600">AI Video Generator</p>
							</div>
							
							{/* Upload Area */}
							<div className="flex flex-col items-center justify-center gap-4">
								<div className="hover:bg-primary-dark cursor-pointer rounded-md border bg-primary p-2 text-secondary transition-colors duration-200">
									<PlusIcon className="h-5 w-5" aria-hidden="true" />
								</div>
								<div className="flex flex-col gap-px">
									<p className="text-sm text-muted-foreground">Click to upload</p>
									<p className="text-xs text-muted-foreground/70">
										Or drag and drop files here
									</p>
								</div>
							</div>
						</div>
					</DroppableArea>
				</Droppable>
			) : (
				<div className="flex flex-1 items-center justify-center bg-background-subtle text-sm text-muted-foreground">
					Loading...
				</div>
			)}
		</div>
	);
};

export default SceneEmpty;
