import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

const Brightness = ({
	value,
	onChange,
}: {
	value: number;
	onChange: (v: number) => void;
}) => {
	// Create local state to manage opacity
	const [localValue, setLocalValue] = useState(value);

	// Update local state when prop value changes
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	return (
		<div className="flex gap-2 min-w-0">
			<div className="flex flex-1 items-center text-sm text-muted-foreground min-w-0">
				Brightness
			</div>
			<div className="flex items-center gap-2 min-w-0 flex-shrink-0">
				<Input
					max={100}
					className="h-8 w-20 px-2 text-center text-sm min-w-0"
					type="number"
					onChange={(e) => {
						const newValue = Number(e.target.value);
						if (newValue >= 0 && newValue <= 100) {
							setLocalValue(newValue); // Update local state
							onChange(newValue); // Optionally propagate immediately, or adjust as needed
						}
					}}
					value={localValue} // Use local state for input value
				/>
				<div className="w-20 flex-shrink-0">
					<Slider
						id="brightness"
						value={[localValue]} // Use local state for slider value
						onValueChange={(e) => {
							setLocalValue(e[0]); // Update local state
						}}
						onValueCommit={() => {
							onChange(localValue); // Propagate value to parent when user commits change
						}}
						min={0}
						max={100}
						step={1}
						aria-label="Brightness"
					/>
				</div>
			</div>
		</div>
	);
};

export default Brightness;
