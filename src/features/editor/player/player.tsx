import { useEffect, useRef, useMemo } from "react";
import Composition from "./composition";
import { Player as RemotionPlayer, PlayerRef } from "@remotion/player";
import useStore from "../store/use-store";

const Player = () => {
	const playerRef = useRef<PlayerRef>(null);
	const { setPlayerRef, duration, fps, size, background, trackItemsMap } = useStore();

	// Use original duration - Remotion handles playbackRate automatically
	const effectiveDuration = duration;

	useEffect(() => {
		setPlayerRef(playerRef as React.RefObject<PlayerRef>);
	}, []);

	return (
		<RemotionPlayer
			ref={playerRef}
			component={Composition}
			durationInFrames={Math.round((effectiveDuration / 1000) * fps) || 1}
			compositionWidth={size.width}
			compositionHeight={size.height}
			className={`h-full w-full bg-[${background.value}]`}
			fps={30}
			overflowVisible
		/>
	);
};
export default Player;
