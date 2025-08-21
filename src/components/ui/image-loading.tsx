import { Loader2 } from "lucide-react";
import ScalezLoader from "@/components/ui/scalez-loader";

interface ImageLoadingProps {
	message?: string;
}

export function ImageLoading({
	message = "Loading images...",
}: ImageLoadingProps) {
	return (
		<div className="flex flex-col items-center justify-center p-8 text-center">
			<ScalezLoader />
			<p className="text-sm text-muted-foreground mt-4">{message}</p>
		</div>
	);
}
