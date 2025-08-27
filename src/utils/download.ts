export const download = (url: string, filename: string) => {
	fetch(url)
		.then((response) => response.blob())
		.then((blob) => {
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			// Check if filename already has .mp4 extension to avoid double extension
			const downloadFilename = filename.endsWith('.mp4') ? filename : `${filename}.mp4`;
			link.setAttribute("download", downloadFilename);
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
			window.URL.revokeObjectURL(url);
		})
		.catch((error) => console.error("Download error:", error));
};
