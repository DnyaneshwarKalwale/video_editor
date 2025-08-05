import { SequenceItem } from "./sequence-item";
import { useEffect, useState, useCallback, useRef } from "react";
import { dispatch, filter, subject } from "@designcombo/events";
import {
	EDIT_OBJECT,
	EDIT_TEMPLATE_ITEM,
	ENTER_EDIT_MODE,
} from "@designcombo/state";
import { groupTrackItems } from "../utils/track-items";
import { calculateTextHeight } from "../utils/text";
import { useCurrentFrame } from "remotion";
import useStore from "../store/use-store";

const Composition = () => {
	const [editableTextId, setEditableTextId] = useState<string | null>(null);
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const {
		trackItemIds,
		trackItemsMap,
		fps,
		sceneMoveableRef,
		size,
		transitionsMap,
		structure,
		activeIds,
	} = useStore();
	const frame = useCurrentFrame();

	const groupedItems = groupTrackItems({
		trackItemIds,
		transitionsMap,
		trackItemsMap: trackItemsMap,
	});

	// Filter items to only show those that are currently visible at the current frame
	const currentTimeInMs = (frame / fps) * 1000; // Convert frame to milliseconds
	const visibleGroupedItems = groupedItems.filter(group => {
		return group.some(item => {
			// Check if the item is currently visible at the current time
			// Only track items have display property, transitions don't
			if ('display' in item) {
				return item.display.from <= currentTimeInMs && item.display.to >= currentTimeInMs;
			}
			return false; // Transitions don't have timing, so filter them out
		});
	});
	const mediaItems = Object.values(trackItemsMap).filter((item) => {
		return item.type === "video" || item.type === "audio";
	});

	// Debounced text saving function
	const saveTextToState = useCallback((id: string, text: string) => {
		// Clear any existing timeout
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		// Set a new timeout to save the text
		saveTimeoutRef.current = setTimeout(() => {
			dispatch(EDIT_OBJECT, {
				payload: {
					[id]: {
						details: {
							text: text,
						},
					},
				},
			});
		}, 100); // 100ms delay
	}, []);

	const handleTextChange = useCallback((id: string, text: string) => {
		// Save text immediately to state
		dispatch(EDIT_OBJECT, {
			payload: {
				[id]: {
					details: {
						text: text,
					},
				},
			},
		});

		// Also save with debounce for additional safety
		saveTextToState(id, text);

		const elRef = document.querySelector(`.id-${id}`) as HTMLDivElement;
		const textDiv = elRef?.firstElementChild?.firstElementChild
			?.firstElementChild as HTMLDivElement;

		// Check if textDiv exists before accessing its style
		if (!textDiv || !elRef) return;

		const {
			fontFamily,
			fontSize,
			fontWeight,
			letterSpacing,
			lineHeight,
			textShadow,
			webkitTextStroke,
			textTransform,
		} = textDiv.style;
		const { width } = elRef.style;
		if (!text) return;
		const newHeight = calculateTextHeight({
			family: fontFamily,
			fontSize,
			fontWeight,
			letterSpacing,
			lineHeight,
			text: text,
			textShadow: textShadow,
			webkitTextStroke,
			width,
			id: id,
			textTransform,
		});
		elRef.style.height = `${newHeight}px`;
		sceneMoveableRef?.current?.moveable.updateRect();
		sceneMoveableRef?.current?.moveable.forceUpdate();
	}, [sceneMoveableRef, saveTextToState]);

	const onTextBlur = useCallback((id: string, text: string) => {
		// Clear any pending save timeout
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		// Save the text content immediately on blur
		dispatch(EDIT_OBJECT, {
			payload: {
				[id]: {
					details: {
						text: text,
					},
				},
			},
		});

		const elRef = document.querySelector(`.id-${id}`) as HTMLDivElement;
		const textDiv = elRef?.firstElementChild?.firstElementChild
			?.firstElementChild as HTMLDivElement;
		
		// Check if textDiv exists before accessing its style
		if (!textDiv || !elRef) return;

		const {
			fontFamily,
			fontSize,
			fontWeight,
			letterSpacing,
			lineHeight,
			textShadow,
			webkitTextStroke,
			textTransform,
		} = textDiv.style;
		const { width } = elRef.style;
		if (!text) return;
		const newHeight = calculateTextHeight({
			family: fontFamily,
			fontSize,
			fontWeight,
			letterSpacing,
			lineHeight,
			text: text,
			textShadow: textShadow,
			webkitTextStroke,
			width,
			id: id,
			textTransform,
		});
		dispatch(EDIT_OBJECT, {
			payload: {
				[id]: {
					details: {
						height: newHeight,
					},
				},
			},
		});
	}, []);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	//   handle track and track item events - updates
	useEffect(() => {
		const stateEvents = subject.pipe(
			filter(({ key }) => key.startsWith(ENTER_EDIT_MODE)),
		);

		const subscription = stateEvents.subscribe((obj) => {
			if (obj.key === ENTER_EDIT_MODE) {
				if (editableTextId) {
					// Save the current text before switching to edit mode for another element
					const element = document.querySelector(
						`[data-text-id="${editableTextId}"]`,
					);
					if (element) {
						// Get text from textarea if editing, otherwise from div
						const textContent = element instanceof HTMLTextAreaElement 
							? element.value 
							: (element as HTMLElement).textContent || (element as HTMLElement).innerText || "";
						
						if (trackItemIds.includes(editableTextId)) {
							dispatch(EDIT_OBJECT, {
								payload: {
									[editableTextId]: {
										details: {
											text: textContent,
										},
									},
								},
							});
						} else {
							dispatch(EDIT_TEMPLATE_ITEM, {
								payload: {
									[editableTextId]: {
										details: {
											text: textContent,
										},
									},
								},
							});
						}
					}
				}
				setEditableTextId(obj.value?.payload.id);
			}
		});
		return () => subscription.unsubscribe();
	}, [editableTextId, trackItemIds]);

	// Global click handler to save text when clicking outside
	useEffect(() => {
		const handleGlobalClick = (event: MouseEvent) => {
			if (editableTextId) {
				const target = event.target as HTMLElement;
				const textElement = document.querySelector(`[data-text-id="${editableTextId}"]`);
				
				// If clicking outside the text element, save and exit edit mode
				if (textElement && !textElement.contains(target)) {
					const textContent = textElement instanceof HTMLTextAreaElement 
						? textElement.value 
						: (textElement as HTMLElement).textContent || (textElement as HTMLElement).innerText || "";
					
					if (trackItemIds.includes(editableTextId)) {
						dispatch(EDIT_OBJECT, {
							payload: {
								[editableTextId]: {
									details: {
										text: textContent,
									},
								},
							},
						});
					} else {
						dispatch(EDIT_TEMPLATE_ITEM, {
							payload: {
								[editableTextId]: {
									details: {
										text: textContent,
									},
								},
							},
						});
					}
					
					// Exit edit mode
					dispatch(ENTER_EDIT_MODE, {
						payload: {
							id: null,
						},
					});
				}
			}
		};

		document.addEventListener('mousedown', handleGlobalClick);
		return () => {
			document.removeEventListener('mousedown', handleGlobalClick);
		};
	}, [editableTextId, trackItemIds]);

	return (
		<>
			{visibleGroupedItems.map((group, index) => {
				if (group.length === 1) {
					const item = trackItemsMap[group[0].id];
					return SequenceItem[item.type](item, {
						fps,
						handleTextChange,
						onTextBlur,
						editableTextId,
						frame,
						size,
						isTransition: false,
					});
				}
				return null;
			})}
		</>
	);
};

export default Composition;
