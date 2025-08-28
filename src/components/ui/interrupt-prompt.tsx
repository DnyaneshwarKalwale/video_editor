"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface InterruptPromptProps {
	isOpen: boolean;
	closeAction: () => void;
}

export function InterruptPrompt({ isOpen, closeAction }: InterruptPromptProps) {
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ top: 0, filter: "blur(5px)" }}
					animate={{
						top: -40,
						filter: "blur(0px)",
						transition: {
							type: "spring",
							filter: { type: "tween" },
						},
					}}
					exit={{ top: 0, filter: "blur(5px)" }}
					style={{
						position: "absolute",
						left: "50%",
						transform: "translateX(-50%)",
						overflow: "hidden",
						whiteSpace: "nowrap",
						borderRadius: "9999px",
						border: "1px solid",
						backgroundColor: "hsl(var(--background))",
						padding: "0.25rem 0",
						textAlign: "center",
						fontSize: "0.875rem",
						color: "hsl(var(--muted-foreground))",
						display: "flex"
					}}
				>
					<span className="ml-2.5">Press Enter again to interrupt</span>
					<button
						className="ml-1 mr-2.5 flex items-center"
						type="button"
						onClick={closeAction}
						aria-label="Close"
					>
						<X className="h-3 w-3" />
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
