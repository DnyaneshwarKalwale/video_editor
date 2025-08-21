import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { dispatch } from "@designcombo/events";
import { HISTORY_UNDO, HISTORY_REDO, DESIGN_RESIZE } from "@designcombo/state";
import { Icons } from "@/components/shared/icons";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	ChevronDown,
	Download,
	ProportionsIcon,
	ShareIcon,
	Eye,
	EyeOff,
	Monitor,
	Facebook,
	Instagram,
	Youtube,
	Smartphone,
	Tablet,
	Sparkles,
	Loader2,
	Video,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { usePlatformStoreClient, PLATFORM_CONFIGS, getPlatformIcon } from "./platform-preview";
import VariationModal from "./variations/components/VariationModal";
import { useVariationProject } from "./variations/hooks/useVariationProject";
import { VideoVariation } from "./variations/types/variation-types";

import { useVariationStore } from "./variations/store/use-variation-store";

import type StateManager from "@designcombo/state";
import { generateId } from "@designcombo/timeline";
import type { IDesign } from "@designcombo/types";
import { useDownloadState } from "./store/use-download-state";
// Removed DownloadProgressModal import since we're not using it anymore

import AutosizeInput from "@/components/ui/autosize-input";
import { debounce } from "lodash";
import {
	useIsLargeScreen,
	useIsMediumScreen,
	useIsSmallScreen,
} from "@/hooks/use-media-query";

import { LogoIcons } from "@/components/shared/logos";
import { useDownloadManager } from './store/use-download-manager';

export default function Navbar({
	user,
	stateManager,
	setProjectName,
	projectName,
}: {
	user: any | null;
	stateManager: StateManager;
	setProjectName: (name: string) => void;
	projectName: string;
}) {
	const [title, setTitle] = useState(projectName);
	const isLargeScreen = useIsLargeScreen();
	const isMediumScreen = useIsMediumScreen();
	const isSmallScreen = useIsSmallScreen();
	const { showOverlay, toggleOverlay, currentPlatform, setCurrentPlatform } = usePlatformStoreClient();
	const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);

	const variationProject = useVariationProject();
	const { totalCombinations, generateAllVideos } = useVariationStore();

	const handleUndo = () => {
		dispatch(HISTORY_UNDO);
	};

	const handleRedo = () => {
		dispatch(HISTORY_REDO);
	};

	const handleCreateProject = async () => {};

	// Create a debounced function for setting the project name
	const debouncedSetProjectName = useCallback(
		debounce((name: string) => {
			console.log("Debounced setProjectName:", name);
			setProjectName(name);
		}, 2000), // 2 seconds delay
		[],
	);

	// Update the debounced function whenever the title changes
	useEffect(() => {
		debouncedSetProjectName(title);
	}, [title, debouncedSetProjectName]);

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
	};

	const handlePlatformChange = (platform: any) => {
		setCurrentPlatform(platform);
		// Dispatch DESIGN_RESIZE to update canvas size like in old code
		dispatch(DESIGN_RESIZE, {
			payload: {
				width: platform.width,
				height: platform.height,
				name: platform.aspectRatio,
			},
		});
	};

	const handleOpenVariations = () => {
		// Always open variation modal to show videos
		setIsVariationModalOpen(true);
	};

	const handleSaveVariations = (variations: VideoVariation[]) => {
		console.log('Saving variations:', variations);
		// Here you could implement saving variations to the main editor
		// For now, just close the modal
		setIsVariationModalOpen(false);
	};


	// Check for selected variations from sidebar and apply them
	useEffect(() => {
		const checkForSelectedVariation = () => {
			const selectedVariationStr = localStorage.getItem('selectedVariation');
			if (selectedVariationStr) {
				try {
					const selectedVariation = JSON.parse(selectedVariationStr);
					
					// Apply the selected variation
					if (selectedVariation && !selectedVariation.isOriginal && selectedVariation.originalTextId) {
						// Get the current track item
						const currentState = stateManager.getState();
						const trackItem = currentState.trackItemsMap[selectedVariation.originalTextId];
						
						if (trackItem && trackItem.type === 'text') {
							// Create updated track item with the new text
							const updatedTrackItem = {
								...trackItem,
								details: {
									...trackItem.details,
									text: selectedVariation.text
								}
							};
							
							// Update the track items map
							const updatedTrackItemsMap = {
								...currentState.trackItemsMap,
								[selectedVariation.originalTextId]: updatedTrackItem
							};
							
							// Update state with the new track items map
							stateManager.updateState({
								trackItemsMap: updatedTrackItemsMap
							});
						}
					}
					
					// Clear the selected variation from localStorage
					localStorage.removeItem('selectedVariation');
				} catch (error) {
					console.error('Error parsing selected variation:', error);
					localStorage.removeItem('selectedVariation');
				}
			}
		};

		// Check immediately
		checkForSelectedVariation();

		// Set up interval to check periodically
		const interval = setInterval(checkForSelectedVariation, 1000);

		return () => clearInterval(interval);
	}, [stateManager]);

	const { setOpen, downloads } = useDownloadManager();
	
	const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'pending').length;

	return (
		<>
		<div
			style={{
				display: "grid",
				gridTemplateColumns: isLargeScreen ? "280px 1fr 200px" : "1fr 1fr 1fr",
			}}
			className="bg-white pointer-events-none flex h-11 items-center border-b border-gray-200 px-2"
		>
			{/* Removed old DownloadProgressModal - now using DownloadManager */}

			<div className="flex items-center gap-2">
				<div className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-md text-gray-900">
					<LogoIcons.scalez />
				</div>

				<div className=" pointer-events-auto flex h-10 items-center px-1.5">
					<Button
						onClick={handleUndo}
						className="text-gray-600 hover:text-gray-900"
						variant="ghost"
						size="icon"
					>
						<Icons.undo width={20} />
					</Button>
					<Button
						onClick={handleRedo}
						className="text-gray-600 hover:text-gray-900"
						variant="ghost"
						size="icon"
					>
						<Icons.redo width={20} />
					</Button>
				</div>
			</div>

			<div className="flex h-11 items-center justify-center gap-2">
				{!isSmallScreen && (
					<div className=" pointer-events-auto flex h-10 items-center gap-2 rounded-md px-2.5 text-gray-600">
						<AutosizeInput
							name="title"
							value={title}
							onChange={handleTitleChange}
							width={200}
							inputClassName="border-none outline-none px-1 bg-background text-sm font-medium text-gray-900"
						/>
					</div>
				)}
				<div className="pointer-events-auto flex h-10 items-center gap-2 rounded-md px-2.5">
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" className="flex items-center gap-2">
								{getPlatformIcon(currentPlatform.icon)}
								<span className="font-medium hidden sm:inline">{currentPlatform.name}</span>
								<span className="text-xs text-gray-500 hidden md:inline">({currentPlatform.description})</span>
								<ChevronDown className="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80 p-0" align="center">
							<div className="p-4">
								<h3 className="text-sm font-medium text-gray-900 mb-3">Platform Preview</h3>
								<div className="grid grid-cols-2 gap-2">
									{PLATFORM_CONFIGS.map((platform) => (
										<Button
											key={platform.id}
											variant={currentPlatform.id === platform.id ? "default" : "outline"}
											size="sm"
											onClick={() => handlePlatformChange(platform)}
											className="h-auto p-3 flex flex-col items-center gap-2 text-xs"
										>
											<div className="flex items-center gap-2">
												{getPlatformIcon(platform.icon)}
												<span className="font-medium">{platform.name}</span>
											</div>
											<div className="flex flex-col items-center gap-1">
												<span className="text-xs font-medium text-gray-700">{platform.label}</span>
												<span className="text-xs text-gray-500">{platform.description}</span>
											</div>
										</Button>
									))}
								</div>
							</div>
						</PopoverContent>
					</Popover>
					<Button
						onClick={toggleOverlay}
						className="text-gray-600 hover:text-gray-900"
						variant="ghost"
						size="icon"
						title={showOverlay ? "Hide Platform Overlay" : "Show Platform Overlay"}
					>
						{showOverlay ? <EyeOff width={20} /> : <Eye width={20} />}
						</Button>
					<Button
						onClick={handleOpenVariations}
						className="text-gray-600 hover:text-gray-900 relative"
						variant="ghost"
						size="icon"
						title="Create AI Variations"
					>
						<Sparkles width={20} />
						{/* Download count indicator */}
						{activeDownloads > 0 && (
							<span className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: 'rgb(80, 118, 178)' }}>
								{activeDownloads}
							</span>
						)}
					</Button>

				</div>
			</div>

			<div className="flex h-11 items-center justify-end gap-2">
				<div className=" pointer-events-auto flex h-10 items-center gap-2 rounded-md px-4">
					<Button
						onClick={() => setOpen(true)}
						className="text-gray-600 hover:text-gray-900 relative"
						variant="ghost"
						size="icon"
						title="Download Manager"
					>
						<Download className="w-5 h-5" />
						{activeDownloads > 0 && (
							<span className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: 'rgb(80, 118, 178)' }}>
								{activeDownloads}
							</span>
						)}
					</Button>
					<NewExportButton stateManager={stateManager} projectName={projectName} />
				</div>
			</div>
		</div>
		
		{/* Variation Modal */}
		{variationProject && (
			<VariationModal
				isOpen={isVariationModalOpen}
				onClose={() => setIsVariationModalOpen(false)}
				project={variationProject}
				onSave={handleSaveVariations}
			/>
		)}

		</>
	);
}

const NewExportButton = ({ stateManager, projectName }: { stateManager: StateManager; projectName: string }) => {
	const { exportVideo, setExporting, exporting, progress, output, setOutput } = useDownloadState();
	const { currentPlatform } = usePlatformStoreClient();

	const handleExport = async () => {
		try {
			// Start the export process with progress popup
			await exportVideo(stateManager, projectName);
		} catch (error) {
			console.error('Export failed:', error);
		}
	};

	return (
		<Button
			onClick={handleExport}
			className="h-7 gap-1 px-3"
			variant="default"
			disabled={exporting}
		>
			{exporting ? (
				<>
					<div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgb(80, 118, 178)' }} />
					<span className="hidden lg:block">Exporting...</span>
				</>
			) : (
				<>
					<Download width={18} />
					<span className="hidden lg:block">Export</span>
				</>
			)}
		</Button>
	);
};

interface ResizeOptionProps {
	label: string;
	icon: string;
	value: ResizeValue;
	description: string;
}

interface ResizeValue {
	width: number;
	height: number;
	name: string;
}

const RESIZE_OPTIONS: ResizeOptionProps[] = [
	{
		label: "16:9",
		icon: "landscape",
		description: "YouTube ads",
		value: {
			width: 1920,
			height: 1080,
			name: "16:9",
		},
	},
	{
		label: "9:16",
		icon: "portrait",
		description: "TikTok, YouTube Shorts",
		value: {
			width: 1080,
			height: 1920,
			name: "9:16",
		},
	},
	{
		label: "1:1",
		icon: "square",
		description: "Instagram, Facebook posts",
		value: {
			width: 1080,
			height: 1080,
			name: "1:1",
		},
	},
];

const ResizeVideo = () => {
	const handleResize = (options: ResizeValue) => {
		dispatch(DESIGN_RESIZE, {
			payload: {
				...options,
			},
		});
	};
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button className="z-10 h-7 gap-2" variant="outline" size={"sm"}>
					<ProportionsIcon className="h-4 w-4" />
					<div>Resize</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="z-[250] w-60 px-2.5 py-3">
				<div className="text-sm">
					{RESIZE_OPTIONS.map((option, index) => (
						<ResizeOption
							key={index}
							label={option.label}
							icon={option.icon}
							value={option.value}
							handleResize={handleResize}
							description={option.description}
						/>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
};

const ResizeOption = ({
	label,
	icon,
	value,
	description,
	handleResize,
}: ResizeOptionProps & { handleResize: (payload: ResizeValue) => void }) => {
	const Icon = Icons[icon as "text"];
	return (
		<div
			onClick={() => handleResize(value)}
			className="flex cursor-pointer items-center rounded-md p-2 hover:bg-zinc-50/10"
		>
			<div className="w-8 text-muted-foreground">
				<Icon size={20} />
			</div>
			<div>
				<div>{label}</div>
				<div className="text-xs text-muted-foreground">{description}</div>
			</div>
		</div>
	);
};
