import { ISize, ITrackItem } from "@designcombo/types";
import { AbsoluteFill, Sequence } from "remotion";
import { calculateFrames } from "../utils/frames";
import { calculateContainerStyles } from "./styles";

export interface SequenceItemOptions {
	handleTextChange?: (id: string, text: string) => void;
	fps: number;
	editableTextId?: string | null;
	currentTime?: number;
	zIndex?: number;
	onTextBlur?: (id: string, text: string) => void;
	size?: ISize;
	frame?: number;
	isTransition?: boolean;
	playbackRate?: number;
}

export const BaseSequence = ({
	item,
	options,
	children,
}: {
	item: ITrackItem;
	options: SequenceItemOptions;
	children: React.ReactNode;
}) => {
	const { details } = item as ITrackItem;
	const { fps, isTransition, playbackRate } = options;
	const { from, durationInFrames: originalDurationInFrames } = calculateFrames(
		{
			from: item.display.from,
			to: item.display.to,
		},
		fps,
	);
	
	// Adjust duration based on playback rate for slow-motion videos
	const durationInFrames = playbackRate && playbackRate < 1.0 
		? Math.ceil(originalDurationInFrames / playbackRate)
		: originalDurationInFrames;
	
	// Debug logging for speed variations
	if (playbackRate && playbackRate < 1.0) {
		console.log(`🎬 BaseSequence: Video ${item.id} - playbackRate: ${playbackRate}x, originalDuration: ${originalDurationInFrames} frames, extendedDuration: ${durationInFrames} frames`);
	}
	const crop = details.crop || {
		x: 0,
		y: 0,
		width: item.details.width,
		height: item.details.height,
	};

	return (
		<Sequence
			key={item.id}
			from={from}
			durationInFrames={durationInFrames || 1 / fps}
			style={{
				pointerEvents: "none",
			}}
		>
			<AbsoluteFill
				id={item.id}
				data-track-item="transition-element"
				className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
				style={calculateContainerStyles(details, crop, {
					pointerEvents: item.type === "audio" ? "none" : "auto",
				})}
			>
				{children}
			</AbsoluteFill>
		</Sequence>
	);
};
