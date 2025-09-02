"use client";
import Timeline from "./timeline";
import useStore from "./store/use-store";
import Navbar from "./navbar";
import useTimelineEvents from "./hooks/use-timeline-events";
import Scene from "./scene";
import { SceneRef } from "./scene/scene.types";
import StateManager, { DESIGN_LOAD } from "@designcombo/state";
import { useEffect, useRef, useState } from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";
import { getCompactFontData, loadFonts } from "./utils/fonts";
import { SECONDARY_FONT, SECONDARY_FONT_URL } from "./constants/constants";
import MenuList from "./menu-list";
import { MenuItem } from "./menu-item";
import { ControlItem } from "./control-item";
import CropModal from "./crop-modal/crop-modal";
import useDataState from "./store/use-data-state";
import { FONTS } from "./data/fonts";
import FloatingControl from "./control-item/floating-controls/floating-control";
import { useSceneStore } from "@/store/use-scene-store";
import { dispatch } from "@designcombo/events";
import MenuListHorizontal from "./menu-list-horizontal";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { ITrackItem } from "@designcombo/types";
import useLayoutStore from "./store/use-layout-store";
import ControlItemHorizontal from "./control-item-horizontal";
import { PlatformPreview, usePlatformStoreClient, PLATFORM_CONFIGS } from "./platform-preview";
import { DownloadManager } from './components/DownloadManager';

// Create stateManager instance for components that need it
const stateManager = new StateManager({
	size: {
		width: 1080,
		height: 1920,
	},
});

const Editor = ({ tempId, id }: { tempId?: string; id?: string }) => {
	const [projectName, setProjectName] = useState<string>("Untitled video");
	const { scene } = useSceneStore();
	const timelinePanelRef = useRef<ImperativePanelHandle>(null);
	const sceneRef = useRef<SceneRef>(null);
	const { timeline, playerRef, setSize } = useStore();
	const { activeIds, trackItemsMap, transitionsMap } = useStore();
	const [loaded, setLoaded] = useState(false);
	const [trackItem, setTrackItem] = useState<ITrackItem | null>(null);
	const [trackItems, setTrackItems] = useState<any[]>([]);
	const [size, setSizeState] = useState({ width: 1080, height: 1920 });
	const {
		setTrackItem: setLayoutTrackItem,
		setFloatingControl,
		setLabelControlItem,
		setTypeControlItem,
	} = useLayoutStore();
	const isLargeScreen = useIsLargeScreen();
	const { currentPlatform, setCurrentPlatform } = usePlatformStoreClient();

	useTimelineEvents();

	const { setCompactFonts, setFonts } = useDataState();

	useEffect(() => {
		if (tempId) {
			const fetchVideoJson = async () => {
				try {
					const response = await fetch(
						`https://scheme.combo.sh/video-json/${id}`,
					);
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();

					const payload = data.videoJson.json;
					if (payload) {
						dispatch(DESIGN_LOAD, { payload });
					}
				} catch (error) {
					console.error("Error fetching video JSON:", error);
				}
			};
			fetchVideoJson();
		}

		if (id) {
			const fetchSceneById = async () => {
				try {
					const response = await fetch(`/api/scene/${id}`);
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();

					if (data.success && data.scene) {
						// Set project name if available
						console.log('Scene data fetched:', data);
						if (data.project?.name) {
							console.log('Setting project name to:', data.project.name);
							setProjectName(data.project.name);
						} else {
							console.log('No project name found, using default');
							// Keep default name if no project name is available
							setProjectName("Untitled video");
						}

						// Load the scene content into the editor
						if (data.scene.content && data.scene.content.trackItems) {
							// Convert trackItems array to trackItemsMap object
							const trackItemsMap: Record<string, any> = {};
							const trackItemIds: string[] = [];
							
							// Process track items to ensure proper z-index and layer order
							data.scene.content.trackItems.forEach((item: any, index: number) => {
								// Ensure z-index is preserved or assigned properly
								const processedItem = {
									...item,
									zIndex: item.zIndex || (data.scene.content.trackItems.length - index),
									layerOrder: item.layerOrder || index,
								};
								
								trackItemsMap[item.id] = processedItem;
								trackItemIds.push(item.id);
							});
							
							// Sort track items by z-index to maintain layer order
							trackItemIds.sort((a, b) => {
								const itemA = trackItemsMap[a];
								const itemB = trackItemsMap[b];
								return (itemB.zIndex || 0) - (itemA.zIndex || 0);
							});
							
							// Group track items by type for tracks array
							const tracksByType: Record<string, string[]> = {};
							data.scene.content.trackItems.forEach((item: any) => {
								if (!tracksByType[item.type]) {
									tracksByType[item.type] = [];
								}
								tracksByType[item.type].push(item.id);
							});
							
							// Create tracks array
							const tracks = Object.entries(tracksByType).map(([type, items]) => ({
								id: `track-${type}-${Date.now()}`,
								type: type,
								items: items
							}));
							
							// Ensure we have valid data before dispatching
							const validContent = {
								trackItemsMap: trackItemsMap,
								trackItemIds: trackItemIds,
								tracks: tracks,
								transitionIds: [],
								transitionsMap: {},
								size: data.scene.content.size || { width: 1080, height: 1920 },
								metadata: data.scene.content.metadata || {},
							};
							
							// Update the trackItems state
							setTrackItems(data.scene.content.trackItems);
							
							// Load scene data immediately when available
							try {
								// Ensure validContent is not null/undefined
								if (validContent && validContent.trackItemsMap) {
									// Dispatch data immediately
									dispatch(DESIGN_LOAD, { payload: validContent });
									
									// Trigger a custom event to notify that project is loaded
									window.dispatchEvent(new CustomEvent('projectLoaded', { 
										detail: { 
											projectId: id,
											trackItems: data.scene.content.trackItems 
										} 
									}));
								}
							} catch (error) {
								console.error('Error loading scene data:', error);
							}
						} else {
							console.log('No valid scene content found, using default state');
							// Initialize with empty state
							const emptyContent = {
								trackItemsMap: {},
								trackItemIds: [],
								tracks: [],
								transitionIds: [],
								transitionsMap: {},
								size: { width: 1080, height: 1920 },
								metadata: {},
							};
							setTrackItems([]);
							
							// Load empty scene immediately
							dispatch(DESIGN_LOAD, { payload: emptyContent });
						}
					} else {
						console.error("Failed to fetch scene:", data.error);
						// Initialize with empty state on error
						const emptyContent = {
							trackItemsMap: {},
							trackItemIds: [],
							tracks: [],
							transitionIds: [],
							transitionsMap: {},
							size: { width: 1080, height: 1920 },
							metadata: {},
						};
						setTrackItems([]);
						
						// Load empty scene immediately
						dispatch(DESIGN_LOAD, { payload: emptyContent });
					}
				} catch (error) {
					console.error("Error fetching scene by ID:", error);
					// Initialize with empty scene on error
					const emptyContent = {
						trackItemsMap: {},
						trackItemIds: [],
						tracks: [],
						transitionIds: [],
						transitionsMap: {},
						size: { width: 1080, height: 1920 },
						metadata: {},
					};
					setTrackItems([]);
					
					// Load empty scene immediately
					dispatch(DESIGN_LOAD, { payload: emptyContent });
				}
			};
			fetchSceneById();
		}
	}, [id, tempId, loaded]);

	useEffect(() => {
		console.log("scene", scene);
		console.log("timeline", timeline);
	}, [scene, timeline]);

	useEffect(() => {
		setCompactFonts(getCompactFontData(FONTS));
		setFonts(FONTS);
	}, []);

	useEffect(() => {
		loadFonts([
			{
				name: SECONDARY_FONT,
				url: SECONDARY_FONT_URL,
			},
		]);
	}, []);

	useEffect(() => {
		const screenHeight = window.innerHeight;
		const desiredHeight = 300;
		const percentage = (desiredHeight / screenHeight) * 100;
		timelinePanelRef.current?.resize(percentage);
	}, []);

	const handleTimelineResize = () => {
		const timelineContainer = document.getElementById("timeline-container");
		if (!timelineContainer) return;

		timeline?.resize(
			{
				height: timelineContainer.clientHeight - 90,
				width: timelineContainer.clientWidth - 40,
			},
			{
				force: true,
			},
		);

		// Trigger zoom recalculation when timeline is resized
		setTimeout(() => {
			sceneRef.current?.recalculateZoom();
		}, 100);
	};

	useEffect(() => {
		const onResize = () => handleTimelineResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [timeline]);

	useEffect(() => {
		if (activeIds.length === 1) {
			const [id] = activeIds;
			const trackItem = trackItemsMap[id];
			if (trackItem) {
				setTrackItem(trackItem);
				setLayoutTrackItem(trackItem);
			} else console.log(transitionsMap[id]);
		} else {
			setTrackItem(null);
			setLayoutTrackItem(null);
		}
	}, [activeIds, trackItemsMap]);

	// Update trackItems state when trackItemsMap changes
	useEffect(() => {
		const currentTrackItems = Object.values(trackItemsMap || {});
		setTrackItems(currentTrackItems);
		
		// Trigger state change event when trackItemsMap changes
		if (currentTrackItems.length > 0) {
			window.dispatchEvent(new CustomEvent('stateChanged'));
		}
	}, [trackItemsMap]);

	useEffect(() => {
		setFloatingControl("");
		setLabelControlItem("");
		setTypeControlItem("");
	}, [isLargeScreen]);

	useEffect(() => {
		setLoaded(true);
	}, []);

	// Effect to handle size changes and recalculate zoom
	useEffect(() => {
		if (loaded) {
			setTimeout(() => {
				sceneRef.current?.recalculateZoom();
			}, 100);
		}
	}, [currentPlatform, loaded]);

	// Effect to handle platform changes and update canvas size
	useEffect(() => {
		if (currentPlatform) {
			const newSize = {
				width: currentPlatform.width,
				height: currentPlatform.height,
			};
			setSize(newSize);
			setSizeState(newSize);
			// Recalculate zoom after size change
			setTimeout(() => {
				sceneRef.current?.recalculateZoom();
			}, 100);
		}
	}, [currentPlatform, setSize]);

	// Auto-save scene data to backend
	useEffect(() => {
		if (id) {
			const saveSceneData = async () => {
				try {
					// Get current state from the timeline
					const currentTrackItems = Object.values(trackItemsMap || {});
					const currentSize = size;
					
					// Ensure z-index/layer information is preserved
					const trackItemsWithZIndex = currentTrackItems.map((item, index) => ({
						...item,
						// Preserve z-index if it exists, otherwise assign based on order
						zIndex: (item as any).zIndex || (currentTrackItems.length - index),
						// Ensure layer order is maintained
						layerOrder: (item as any).layerOrder || index,
					}));
					
					console.log('Auto-saving - Track items to save:', trackItemsWithZIndex.length);
					console.log('Auto-saving - Track items:', trackItemsWithZIndex);
					
					const response = await fetch(`/api/scene/${id}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							trackItems: trackItemsWithZIndex,
							size: currentSize,
							metadata: {
								lastSaved: new Date().toISOString(),
								platform: currentPlatform?.id,
							},
						}),
					});

					if (response.ok) {
						console.log('Scene data auto-saved to backend');
					} else {
						console.error('Failed to auto-save scene data');
					}
				} catch (error) {
					console.error('Error auto-saving scene data:', error);
				}
			};

			// Save immediately when project is loaded
			if (trackItems.length > 0) {
				saveSceneData();
			}

			// Debounce the save to avoid too many requests
			const timeoutId = setTimeout(saveSceneData, 5000);
			return () => clearTimeout(timeoutId);
		}
	}, [id, trackItems, size, currentPlatform]);

	// Listen for state changes and save to backend
	useEffect(() => {
		if (id) {
			let saveTimeout: NodeJS.Timeout;
			
			const handleStateChange = () => {
				// Clear previous timeout
				clearTimeout(saveTimeout);
				
				// Debounced save when state changes
				saveTimeout = setTimeout(async () => {
					try {
						const currentTrackItems = Object.values(trackItemsMap || {});
						const currentSize = size;
						
						// Ensure z-index/layer information is preserved
						const trackItemsWithZIndex = currentTrackItems.map((item, index) => ({
							...item,
							// Preserve z-index if it exists, otherwise assign based on order
							zIndex: (item as any).zIndex || (currentTrackItems.length - index),
							// Ensure layer order is maintained
							layerOrder: (item as any).layerOrder || index,
						}));
						
						console.log('Saving state changes to backend:', trackItemsWithZIndex.length, 'items');
						
						const response = await fetch(`/api/scene/${id}`, {
							method: 'PUT',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								trackItems: trackItemsWithZIndex,
								size: currentSize,
								metadata: {
									lastSaved: new Date().toISOString(),
									platform: currentPlatform?.id,
								},
							}),
						});

						if (response.ok) {
							console.log('State changes saved to backend');
						} else {
							console.error('Failed to save state changes');
						}
					} catch (error) {
						console.error('Error saving state changes:', error);
					}
				}, 3000); // 3 second debounce
			};

			// Listen for custom events from state changes
			const handleCustomEvent = () => handleStateChange();
			window.addEventListener('stateChanged', handleCustomEvent);
			
			return () => {
				clearTimeout(saveTimeout);
				window.removeEventListener('stateChanged', handleCustomEvent);
			};
		}
	}, [id, trackItemsMap, size, currentPlatform]);

	// Immediate save when track items change
	useEffect(() => {
		if (id && trackItems.length > 0) {
			const saveImmediately = async () => {
				try {
					const currentTrackItems = Object.values(trackItemsMap || {});
					const currentSize = size;
					
					// Ensure z-index/layer information is preserved
					const trackItemsWithZIndex = currentTrackItems.map((item, index) => ({
						...item,
						// Preserve z-index if it exists, otherwise assign based on order
						zIndex: (item as any).zIndex || (currentTrackItems.length - index),
						// Ensure layer order is maintained
						layerOrder: (item as any).layerOrder || index,
					}));
					
					const response = await fetch(`/api/scene/${id}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							trackItems: trackItemsWithZIndex,
							size: currentSize,
							metadata: {
								lastSaved: new Date().toISOString(),
								platform: currentPlatform?.id,
							},
						}),
					});

					if (response.ok) {
						console.log('Scene data saved immediately');
					} else {
						console.error('Failed to save scene data immediately');
					}
				} catch (error) {
					console.error('Error saving scene data immediately:', error);
				}
			};

			// Save immediately when track items change
			saveImmediately();
		}
	}, [trackItems, id, trackItemsMap, size, currentPlatform]);


	return (
		<div className="flex h-screen w-screen flex-col">
			<Navbar
				projectName={projectName}
				user={null}
				stateManager={stateManager}
				setProjectName={setProjectName}
			/>
			<div className="flex flex-1">
				{isLargeScreen && (
					<div className="bg-gray-50 flex flex-none border-r border-gray-200 h-[calc(100vh-44px)]">
						<MenuList />
						<MenuItem />
					</div>
				)}
				<ResizablePanelGroup style={{ flex: 1 }} direction="vertical">
					<ResizablePanel className="relative" defaultSize={70}>
						<FloatingControl />
						<div className="flex h-full flex-1">
							{/* Sidebar only on large screens - conditionally mounted */}

							<div
								style={{
									width: "100%",
									height: "100%",
									position: "relative",
									flex: 1,
									overflow: "hidden",
								}}
							>
								<CropModal />
								<Scene ref={sceneRef} stateManager={stateManager} />
							</div>
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel
						className="min-h-[50px]"
						ref={timelinePanelRef}
						defaultSize={30}
						onResize={handleTimelineResize}
					>
						<Timeline stateManager={stateManager} />
					</ResizablePanel>
					{!isLargeScreen && !trackItem && loaded && <MenuListHorizontal />}
					{!isLargeScreen && trackItem && <ControlItemHorizontal />}
				</ResizablePanelGroup>
				<ControlItem />
			</div>
			{/* Download Manager */}
			<DownloadManager />
		</div>
	);
};

export default Editor;
