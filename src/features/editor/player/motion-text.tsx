import { useEffect, useRef, useState, useCallback } from "react";
import { ITextDetails } from "@designcombo/types";

const TextLayer: React.FC<{
	id: string;
	content: string;
	onChange?: (id: string, content: string) => void;
	onBlur?: (id: string, content: string) => void;
	style?: React.CSSProperties;
	editable?: boolean;
}> = ({ id, content, editable, style = {}, onChange, onBlur }) => {
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const [localContent, setLocalContent] = useState(content);

	// Update local content when content prop changes
	useEffect(() => {
		setLocalContent(content);
	}, [content]);

	useEffect(() => {
		if (editable && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.setSelectionRange(localContent.length, localContent.length);
		}
	}, [editable, localContent]);

	const handleChange = useCallback((ev: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = ev.target.value;
		setLocalContent(newValue);
		onChange?.(id, newValue);
	}, [id, onChange]);

	const handleBlur = useCallback((ev: React.FocusEvent<HTMLTextAreaElement>) => {
		const finalValue = ev.target.value;
		setLocalContent(finalValue);
		onBlur?.(id, finalValue);
	}, [id, onBlur]);

	// Check if background color should be applied
	const hasBackgroundColor = style.backgroundColor && style.backgroundColor !== "transparent";

	return (
		<>
			{editable ? (
				<textarea
					ref={inputRef}
					data-text-id={id}
					value={localContent}
					onChange={handleChange}
					onBlur={handleBlur}
					style={{
						height: "100%",
						boxShadow: "none",
						outline: "none",
						border: "none",
						background: "transparent",
						resize: "none",
						overflow: "hidden",
						...style,
						width: "100%",
						fontSize: style.fontSize || "16px",
						fontFamily: style.fontFamily || "Arial",
						fontWeight: style.fontWeight || "normal",
						color: style.color || "black",
						textAlign: style.textAlign || "left",
						lineHeight: style.lineHeight || "normal",
						// Keep textarea background transparent
						backgroundColor: "transparent",
					}}
					className="designcombo_textLayer"
				/>
			) : (
				<div
					data-text-id={id}
					style={{
						height: "100%",
						...style,
						pointerEvents: "none",
						whiteSpace: "normal",
						width: "100%",
						// Keep container background transparent
						backgroundColor: "transparent",
					}}
					className="designcombo_textLayer"
				>
					{/* Apply background color only to text characters using span */}
					{hasBackgroundColor ? (
						<span
							style={{
								backgroundColor: style.backgroundColor,
								padding: "2px 4px",
								borderRadius: style.borderRadius || "0px",
								display: "inline",
								lineHeight: "inherit",
								// Preserve other text styles
								fontFamily: style.fontFamily,
								fontSize: style.fontSize,
								fontWeight: style.fontWeight,
								color: style.color,
								textAlign: style.textAlign,
								letterSpacing: style.letterSpacing,
								wordSpacing: style.wordSpacing,
								textTransform: style.textTransform,
								textDecoration: style.textDecoration,
								WebkitTextStroke: style.WebkitTextStroke,
								textShadow: style.textShadow,
							}}
						>
							{localContent}
						</span>
					) : (
						localContent
					)}
				</div>
			)}
		</>
	);
};

export default TextLayer;
