import { useRef, useState } from "react";
import useDataState from "../../store/use-data-state";
import { SearchIcon, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Draggable from "react-draggable";
import useLayoutStore from "../../store/use-layout-store";
import useClickOutside from "../../hooks/useClickOutside";
import { ICompactFont, IFont } from "../../interfaces/editor";
import { loadFonts } from "../../utils/fonts";
import { dispatch } from "@designcombo/events";
import { EDIT_OBJECT } from "@designcombo/state";
import { ITrackItem } from "@designcombo/types";

export const onChangeFontFamily = async (
	font: ICompactFont,
	trackItem: ITrackItem,
) => {
	if (!trackItem?.id) return;
	
	const fontName = font.default.postScriptName;
	const fontUrl = font.default.url;

	await loadFonts([
		{
			name: fontName,
			url: fontUrl,
		},
	]);

	dispatch(EDIT_OBJECT, {
		payload: {
			[trackItem.id]: {
				details: {
					fontFamily: fontName,
					fontUrl: fontUrl,
				},
			},
		},
	});
};
export default function FontFamilyPicker() {
	const { compactFonts } = useDataState();
	const [search, setSearch] = useState("");
	const { setFloatingControl, trackItem } = useLayoutStore();

	const filteredFonts = compactFonts.filter((font) =>
		font.family.toLowerCase().includes(search.toLowerCase()),
	);

	const floatingRef = useRef<HTMLDivElement>(null);
	useClickOutside(floatingRef as React.RefObject<HTMLElement>, () =>
		setFloatingControl(""),
	);

	return (
		<div
			ref={floatingRef}
			className="absolute right-2 top-2 z-[500] w-56 border bg-white p-0 shadow-lg rounded-lg overflow-hidden"
		>
			<div className="handle flex cursor-grab justify-between px-2 py-4 border-b">
				<p className="text-sm font-bold text-gray-900">Fonts</p>
				<div className="h-4 w-4" onClick={() => setFloatingControl("")}>
					<X className="h-4 w-4 cursor-pointer font-extrabold text-gray-500" />
				</div>
			</div>
			<div className="flex items-center p-2 border-b">
				<SearchIcon className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search font..."
					className="w-full rounded-md bg-transparent p-1 text-sm text-gray-900 outline-none placeholder:text-gray-500"
				/>
			</div>
			<ScrollArea className="h-[400px] w-full py-2 max-h-[60vh]">
				{filteredFonts.length > 0 ? (
					filteredFonts.map((font, index) => (
						<div
							key={index}
							onClick={() => {
								if (trackItem) {
									onChangeFontFamily(font, trackItem);
								}
							}}
							className="cursor-pointer px-2 py-1 hover:bg-gray-100 transition-colors"
						>
							<img
								src={font.default.preview}
								alt={font.family}
							/>
						</div>
					))
				) : (
					<p className="py-2 text-center text-sm text-gray-600">
						No font found
					</p>
				)}
			</ScrollArea>
		</div>
	);
}
