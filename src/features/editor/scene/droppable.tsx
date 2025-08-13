import { useCallback, useState } from "react";
import { ADD_AUDIO, ADD_IMAGE, ADD_VIDEO } from "@designcombo/state";
import { dispatch } from "@designcombo/events";
import { generateId } from "@designcombo/timeline";

import { usePlatformStoreClient } from "../platform-preview";
import { calculateVideoPositioning, getDefaultVideoSize } from "../utils/platform-positioning";

enum AcceptedDropTypes {
	IMAGE = "image",
	VIDEO = "video",
	AUDIO = "audio",
}

interface DraggedData {
	type: AcceptedDropTypes;
	[key: string]: any;
}

interface DroppableAreaProps {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
	onDragStateChange?: (isDragging: boolean) => void;
	id?: string;
}

const useDragAndDrop = (onDragStateChange?: (isDragging: boolean) => void) => {
	const [isPointerInside, setIsPointerInside] = useState(false);
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const { currentPlatform } = usePlatformStoreClient();

	const handleDrop = useCallback((draggedData: DraggedData) => {
		switch (draggedData.type) {
			case AcceptedDropTypes.IMAGE:
				// Create image payload with proper positioning based on current platform
				const defaultImageSize = getDefaultVideoSize(currentPlatform); // Use same logic as video
				const imagePayload = {
					id: generateId(),
					display: {
						from: 0,
						to: 5000,
					},
					type: "image",
					details: {
						src: draggedData.src || "https://cdn.designcombo.dev/rect-gray.png",
						left: 0,
						top: 0,
						width: defaultImageSize.width,
						height: defaultImageSize.height,
					},
				};
				dispatch(ADD_IMAGE, { 
					payload: imagePayload
				});
				break;
			case AcceptedDropTypes.VIDEO:
				// Create video payload with proper positioning based on current platform
				const defaultVideoSize = getDefaultVideoSize(currentPlatform);
				const videoPayload = {
					id: generateId(),
					display: {
						from: 0,
						to: 5000,
					},
					type: "video",
					details: {
						src: draggedData.src || "",
						left: 0,
						top: 0,
						width: defaultVideoSize.width,
						height: defaultVideoSize.height,
					},
				};
				dispatch(ADD_VIDEO, { 
					payload: videoPayload
				});
				break;
			case AcceptedDropTypes.AUDIO:
				dispatch(ADD_AUDIO, { 
					payload: { ...draggedData, id: generateId() }
				});
				break;
		}
	}, [currentPlatform]);

	const onDragEnter = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			try {
				// Check if we have application/json data
				if (!e.dataTransfer.types.includes("application/json")) return;
				
				const draggedDataString = e.dataTransfer.getData("application/json");
				if (!draggedDataString) return;
				
				const draggedData: DraggedData = JSON.parse(draggedDataString);

				if (!Object.values(AcceptedDropTypes).includes(draggedData.type))
					return;
				setIsDraggingOver(true);
				setIsPointerInside(true);
				onDragStateChange?.(true);
			} catch (error) {
				console.error("Error parsing dragged data:", error);
			}
		},
		[onDragStateChange],
	);

	const onDragOver = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			if (isPointerInside) {
				setIsDraggingOver(true);
				onDragStateChange?.(true);
			}
		},
		[isPointerInside, onDragStateChange],
	);

	const onDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			if (!isDraggingOver) return;
			e.preventDefault();
			setIsDraggingOver(false);
			onDragStateChange?.(false);

			try {
				// Check if we have application/json data
				if (!e.dataTransfer.types.includes("application/json")) return;
				
				const draggedDataString = e.dataTransfer.getData("application/json");
				if (!draggedDataString) return;
				
				const draggedData = JSON.parse(draggedDataString);
				handleDrop(draggedData);
			} catch (error) {
				console.error("Error parsing dropped data:", error);
			}
		},
		[isDraggingOver, onDragStateChange, handleDrop],
	);

	const onDragLeave = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			if (!e.currentTarget.contains(e.relatedTarget as Node)) {
				setIsDraggingOver(false);
				setIsPointerInside(false);
				onDragStateChange?.(false);
			}
		},
		[onDragStateChange],
	);

	return { onDragEnter, onDragOver, onDrop, onDragLeave, isDraggingOver };
};

export const DroppableArea: React.FC<DroppableAreaProps> = ({
	children,
	className,
	style,
	onDragStateChange,
	id,
}) => {
	const { onDragEnter, onDragOver, onDrop, onDragLeave } =
		useDragAndDrop(onDragStateChange);

	return (
		<div
			id={id}
			onDragEnter={onDragEnter}
			onDrop={onDrop}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			className={className}
			style={style}
			role="region"
			aria-label="Droppable area for images, videos, and audio"
		>
			{children}
		</div>
	);
};
