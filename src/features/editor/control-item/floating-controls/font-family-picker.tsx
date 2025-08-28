import { useRef, useState } from "react";
import useDataState from "../../store/use-data-state";
import { SearchIcon, X, Plus, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Draggable from "react-draggable";
import useLayoutStore from "../../store/use-layout-store";
import useClickOutside from "../../hooks/useClickOutside";
import { ICompactFont, IFont } from "../../interfaces/editor";
import { loadFonts } from "../../utils/fonts";
import { dispatch } from "@designcombo/events";
import { EDIT_OBJECT } from "@designcombo/state";
import { ITrackItem } from "@designcombo/types";
import { useCustomFonts } from "@/hooks/use-custom-fonts";
import CustomFontUpload from "@/components/custom-font-upload";

export const onChangeFontFamily = async (
	font: ICompactFont | IFont,
	trackItem: ITrackItem,
) => {
	if (!trackItem?.id) return;
	
	let fontName: string;
	let fontUrl: string;

	// Handle both compact fonts and custom fonts
	if ('default' in font) {
		// This is a compact font
		fontName = font.default.postScriptName;
		fontUrl = font.default.url;
	} else {
		// This is a custom font
		fontName = font.postScriptName;
		fontUrl = font.url;
	}

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
	const { customFonts, refreshFonts } = useCustomFonts();
	const [search, setSearch] = useState("");
	const [activeTab, setActiveTab] = useState<'available' | 'custom'>('available');
	const { setFloatingControl, trackItem } = useLayoutStore();

	// Filter fonts based on search
	const filteredAvailableFonts = compactFonts.filter((font) =>
		font.family.toLowerCase().includes(search.toLowerCase()),
	);

	const filteredCustomFonts = customFonts.filter((font) =>
		font.family.toLowerCase().includes(search.toLowerCase()),
	);

	const floatingRef = useRef<HTMLDivElement>(null);
	useClickOutside(floatingRef as React.RefObject<HTMLElement>, () => {
		// Don't close if we're in the custom tab and the upload dialog might be open
		if (activeTab === 'custom') {
			// Check if there's a dialog open by looking for elements with high z-index
			const dialogs = document.querySelectorAll('[class*="z-[1000]"]');
			if (dialogs.length > 0) {
				return; // Don't close if there's a dialog open
			}
		}
		setFloatingControl("");
	});

	const handleFontSelect = (font: ICompactFont | IFont) => {
		if (trackItem) {
			onChangeFontFamily(font, trackItem);
		}
	};

	return (
		<div
			ref={floatingRef}
			className="absolute right-2 top-2 z-[600] w-80 border bg-white p-0 shadow-lg rounded-lg overflow-hidden"
		>
			<div className="handle flex cursor-grab justify-between px-2 py-4 border-b">
				<p className="text-sm font-bold text-gray-900">Fonts</p>
				<div className="h-4 w-4" onClick={() => setFloatingControl("")}>
					<X className="h-4 w-4 cursor-pointer font-extrabold text-gray-500" />
				</div>
			</div>

			{/* Tab Navigation */}
			<div className="flex border-b">
				<button
					onClick={() => setActiveTab('available')}
					className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
						activeTab === 'available'
							? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
							: 'text-gray-600 hover:text-gray-900'
					}`}
				>
					Available Fonts
				</button>
				<button
					onClick={() => setActiveTab('custom')}
					className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
						activeTab === 'custom'
							? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
							: 'text-gray-600 hover:text-gray-900'
					}`}
				>
					Custom Fonts
				</button>
			</div>

			{/* Search Bar */}
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

			{/* Custom Font Upload Button */}
			{activeTab === 'custom' && (
				<div className="p-2 border-b bg-gray-50" onClick={(e) => e.stopPropagation()}>
					<CustomFontUpload onFontUploaded={refreshFonts} />
				</div>
			)}

			<ScrollArea className="h-[400px] w-full py-2 max-h-[60vh]">
				{activeTab === 'available' ? (
					// Available Fonts
					filteredAvailableFonts.length > 0 ? (
						filteredAvailableFonts.map((font, index) => (
							<div
								key={index}
								onClick={() => handleFontSelect(font)}
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
					)
				) : (
					// Custom Fonts
					filteredCustomFonts.length > 0 ? (
						filteredCustomFonts.map((font, index) => (
							<div
								key={index}
								onClick={() => handleFontSelect(font)}
								className="cursor-pointer px-2 py-1 hover:bg-gray-100 transition-colors border-l-4 border-blue-500"
							>
								<div className="flex items-center gap-2">
									<FolderOpen className="h-4 w-4 text-blue-500" />
									<div className="flex-1">
										<div className="text-sm font-medium text-gray-900">
											{font.family}
										</div>
										<div className="text-xs text-gray-500">
											{font.fullName}
										</div>
									</div>
								</div>
							</div>
						))
					) : (
						<div className="py-8 text-center">
							<FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
							<p className="text-sm text-gray-600 mb-2">
								No custom fonts yet
							</p>
							<p className="text-xs text-gray-500">
								Upload your first custom font to get started
							</p>
						</div>
					)
				)}
			</ScrollArea>
		</div>
	);
}
