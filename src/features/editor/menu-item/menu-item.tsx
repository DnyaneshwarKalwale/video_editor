import useLayoutStore from "../store/use-layout-store";
import useStore from "../store/use-store";
import { Texts } from "./texts";
import { Audios } from "./audios";
import { Elements } from "./elements";
import { Images } from "./images";
import { Videos } from "./videos";
import { VoiceOver } from "./voice-over";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { Uploads } from "./uploads";
import VariationsManager from "./variations-manager";
import ProgressBarSettings from "./progress-bar-settings";

const ActiveMenuItem = () => {
	const { activeMenuItem } = useLayoutStore();
	const { trackItemsMap, trackItemIds } = useStore();

	// Convert timeline elements to the format expected by VariationsManager
	const timelineElements = trackItemIds
		.map(id => {
			const item = trackItemsMap[id];
			if (!item) return null;

			// Only include supported element types
			if (!['video', 'text', 'image', 'audio'].includes(item.type)) {
				return null;
			}

			// Get element name based on type
			const getElementName = (item: any, type: string): string => {
				switch (type) {
					case 'text':
						return item.details?.text || 'Text Element';
					case 'video':
						return item.details?.src ? item.details.src.split('/').pop() || 'Video' : 'Video Element';
					case 'image':
						return item.details?.src ? item.details.src.split('/').pop() || 'Image' : 'Image Element';
					case 'audio':
						return item.details?.src ? item.details.src.split('/').pop() || 'Audio' : 'Audio Element';
					default:
						return 'Element';
				}
			};

			// Get element content based on type
			const getElementContent = (item: any, type: string): string => {
				switch (type) {
					case 'text':
						return item.details?.text || '';
					case 'video':
					case 'image':
					case 'audio':
						return item.details?.src || '';
					default:
						return '';
				}
			};

			return {
				id: item.id,
				type: item.type as 'video' | 'text' | 'image' | 'audio',
				name: getElementName(item, item.type),
				content: getElementContent(item, item.type),
				duration: item.duration || 0,
				variations: [] // Start with empty variations
			};
		})
		.filter(Boolean) as any[];

	if (activeMenuItem === "texts") {
		return <Texts />;
	}
	if (activeMenuItem === "shapes") {
		return <Elements />;
	}
	if (activeMenuItem === "videos") {
		return <Videos />;
	}

	if (activeMenuItem === "audios") {
		return <Audios />;
	}

	if (activeMenuItem === "images") {
		return <Images />;
	}

	if (activeMenuItem === "voiceOver") {
		return <VoiceOver />;
	}
	if (activeMenuItem === "elements") {
		return <Elements />;
	}
	if (activeMenuItem === "uploads") {
		return <Uploads />;
	}
	if (activeMenuItem === "variations") {
		return <VariationsManager 
			timelineElements={timelineElements} 
			onTimelineElementsChange={(updatedElements) => {
				// Here you would update the timeline store with the new variations
				// For now, we'll just log the changes
				console.log('Timeline elements updated:', updatedElements);
			}} 
		/>;
	}

	if (activeMenuItem === "progress-bar-settings") {
		return <ProgressBarSettings />;
	}

	return null;
};

export const MenuItem = () => {
	const isLargeScreen = useIsLargeScreen();

	return (
		<div className={`${isLargeScreen ? "w-[300px]" : "w-full"} flex-1 flex`}>
			<ActiveMenuItem />
		</div>
	);
};
