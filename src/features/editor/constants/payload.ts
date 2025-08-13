import { generateId } from "@designcombo/timeline";
import { DEFAULT_FONT } from "./font";

export const TEXT_ADD_PAYLOAD = {
	id: generateId(),
	display: {
		from: 0,
		to: 5000,
	},
	type: "text",
	details: {
		text: "Add your text here",
		fontSize: 120,
		width: 600,
		fontUrl: DEFAULT_FONT.url,
		fontFamily: DEFAULT_FONT.postScriptName,
		color: "rgba(255, 255, 255, 0.8)",
		wordWrap: "break-word",
		textAlign: "center",
		borderWidth: 0,
		borderColor: "rgba(255, 255, 255, 0.8)",
		boxShadow: {
			color: "rgba(255, 255, 255, 0.8)",
			x: 0,
			y: 0,
			blur: 0,
		},
	},
};
