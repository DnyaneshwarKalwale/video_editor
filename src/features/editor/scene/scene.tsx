import { Player } from "../player";
import { useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import useStore from "../store/use-store";
import StateManager from "@designcombo/state";
import SceneEmpty from "./empty";
import Board from "./board";
import useZoom from "../hooks/use-zoom";
import { SceneInteractions } from "./interactions";
import { SceneRef } from "./scene.types";
import { PlatformOverlay, usePlatformStoreClient } from "../platform-preview";

const Scene = forwardRef<
	SceneRef,
	{
		stateManager: StateManager;
	}
>(({ stateManager }, ref) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { size, trackItemIds } = useStore();
	const { zoom, handlePinch, recalculateZoom } = useZoom(
		containerRef as React.RefObject<HTMLDivElement>,
		size,
	);
	const { currentPlatform, showOverlay } = usePlatformStoreClient();

	// Expose the recalculateZoom function to parent
	useImperativeHandle(ref, () => ({
		recalculateZoom,
	}));

	// Recalculate zoom when size changes
	useEffect(() => {
		recalculateZoom();
	}, [size.width, size.height, recalculateZoom]);

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				position: "relative",
				flex: 1,
				overflow: "hidden",
				background: "transparent",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
			}}
			ref={containerRef}
		>
			{trackItemIds.length === 0 && <SceneEmpty />}
			<div
				style={{
					width: size.width,
					height: size.height,
					background: "#000000",
					transform: `scale(${zoom})`,
					position: "absolute",
				}}
				className="player-container bg-black"
			>
				<div
					style={{
						position: "absolute",
						zIndex: 100,
						pointerEvents: "none",
						width: size.width,
						height: size.height,
						background: "transparent",
						boxShadow: "0 0 0 5000px #f5f5f5",
					}}
				/>
				<Board size={size}>
					<Player />
					<SceneInteractions
						stateManager={stateManager}
						containerRef={containerRef as React.RefObject<HTMLDivElement>}
						zoom={zoom}
						size={size}
					/>
					{showOverlay && (
						<PlatformOverlay 
							platform={currentPlatform} 
							size={size} 
						/>
					)}
				</Board>
			</div>
		</div>
	);
});

Scene.displayName = "Scene";

export default Scene;
