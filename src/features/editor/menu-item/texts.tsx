import { Button, buttonVariants } from "@/components/ui/button";
import { ADD_AUDIO, ADD_IMAGE, ADD_TEXT } from "@designcombo/state";
import { dispatch } from "@designcombo/events";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import Draggable from "@/components/shared/draggable";
import { TEXT_ADD_PAYLOAD } from "../constants/payload";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import { usePlatformStoreClient } from "../platform-preview";

export const Texts = () => {
	const isDraggingOverTimeline = useIsDraggingOverTimeline();
	const { currentPlatform } = usePlatformStoreClient();

	const handleAddText = () => {
		// Create text payload with proper positioning based on current platform
		const textPayload = {
			...TEXT_ADD_PAYLOAD,
			id: nanoid(),
			details: {
				...TEXT_ADD_PAYLOAD.details,
				text: "Add your text here",
			},
		};
		
		dispatch(ADD_TEXT, {
			payload: textPayload,
			options: {},
		});
	};

	const handleAddAudio = () => {
		dispatch(ADD_AUDIO, {
			payload: {
				id: nanoid(),
				details: {
					src: "https://cdn.designcombo.dev/quick-brown.mp3",
				},
			},
			options: {},
		});
	};

	const handleAddImage = () => {
		// Create image payload with proper positioning based on current platform
		const imagePayload = {
			id: nanoid(),
			display: {
				from: 0,
				to: 5000,
			},
			type: "image",
			details: {
				src: "https://example.com/image.jpg",
				width: 400,
				height: 300,
			},
		};
		
		dispatch(ADD_IMAGE, {
			payload: imagePayload,
			options: {},
		});
	};

	return (
		<div className="flex flex-1 flex-col">
			<div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
				Text
			</div>
			<div className="flex flex-col gap-2 px-4">
				<Draggable
					data={TEXT_ADD_PAYLOAD}
					renderCustomPreview={
						<Button variant="secondary" className="w-60">
							Add text
						</Button>
					}
					shouldDisplayPreview={!isDraggingOverTimeline}
				>
					<div
						onClick={handleAddText}
						className={cn(
							buttonVariants({ variant: "default" }),
							"cursor-pointer",
						)}
					>
						Add text
					</div>
				</Draggable>
				{/* <Button variant="secondary" className="w-60" onClick={handleAddAudio}>
					Add audio
				</Button>
				<Button variant="secondary" className="w-60" onClick={handleAddImage}>
					Add image
				</Button> */}
			</div>
		</div>
	);
};
