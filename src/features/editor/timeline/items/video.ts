import {
	Control,
	Pattern,
	Trimmable,
	TrimmableProps,
	timeMsToUnits,
	unitsToTimeMs,
} from "@designcombo/timeline";
import { Filmstrip, FilmstripBacklogOptions } from "../types";
import ThumbnailCache from "../../utils/thumbnail-cache";
import { IDisplay, IMetadata, ITrim } from "@designcombo/types";
import {
	calculateOffscreenSegments,
	calculateThumbnailSegmentLayout,
} from "../../utils/filmstrip";
import { getFileFromUrl } from "../../utils/file";
import { SECONDARY_FONT } from "../../constants/constants";

// Type declaration for MP4Clip to avoid SSR issues
type MP4ClipType = any;

const EMPTY_FILMSTRIP: Filmstrip = {
	offset: 0,
	startTime: 0,
	thumbnailsCount: 0,
	widthOnScreen: 0,
};

interface VideoProps extends TrimmableProps {
	aspectRatio: number;
	trim: ITrim;
	duration: number;
	src: string;
	metadata: Partial<IMetadata> & {
		previewUrl: string;
	};
}
class Video extends Trimmable {
	static type = "Video";
	public clip?: MP4ClipType | null;
	declare id: string;
	public resourceId = "";
	declare tScale: number;
	public isSelected = false;
	declare display: IDisplay;
	declare trim: ITrim;
	declare playbackRate: number;
	public hasSrc = true;
	declare duration: number;
	public prevDuration: number;
	public itemType = "video";
	public metadata?: Partial<IMetadata>;
	declare src: string;

	public aspectRatio = 1;
	public scrollLeft = 0;
	public filmstripBacklogOptions?: FilmstripBacklogOptions;
	public thumbnailsPerSegment = 0;
	public segmentSize = 0;

	public offscreenSegments = 0;
	public thumbnailWidth = 0;
	public thumbnailHeight = 40;
	public thumbnailsList: { url: string; ts: number }[] = [];
	public isFetchingThumbnails = false;
	public thumbnailCache = new ThumbnailCache();

	public currentFilmstrip: Filmstrip = EMPTY_FILMSTRIP;
	public nextFilmstrip: Filmstrip = { ...EMPTY_FILMSTRIP, segmentIndex: 0 };
	public loadingFilmstrip: Filmstrip = EMPTY_FILMSTRIP;

	private offscreenCanvas: OffscreenCanvas | null = null;
	private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

	private isDirty = true;

	private fallbackSegmentIndex = 0;
	private fallbackSegmentsCount = 0;
	private previewUrl = "";

 
	constructor(props: VideoProps) {
		super(props);
		this.id = props.id;
		this.tScale = props.tScale;
		this.objectCaching = false;
		this.rx = 4;
		this.ry = 4;
		this.display = props.display;
		this.trim = props.trim;
		this.duration = props.duration;
		this.prevDuration = props.duration;
		this.fill = "#27272a";
		this.borderOpacityWhenMoving = 1;
		this.metadata = props.metadata;

		this.aspectRatio = props.aspectRatio;

		this.src = props.src;
		this.strokeWidth = 0;

		this.transparentCorners = false;
		this.hasBorders = false;

		this.previewUrl = props.metadata.previewUrl;
		this.initOffscreenCanvas();
		this.initialize();
	}

	private initOffscreenCanvas() {
		if (!this.offscreenCanvas) {
			this.offscreenCanvas = new OffscreenCanvas(this.width, this.height);
			this.offscreenCtx = this.offscreenCanvas.getContext("2d");
		}

		// Resize if dimensions changed
		if (
			this.offscreenCanvas.width !== this.width ||
			this.offscreenCanvas.height !== this.height
		) {
			this.offscreenCanvas.width = this.width;
			this.offscreenCanvas.height = this.height;
			this.isDirty = true;
		}
	}

	public initDimensions() {
		this.thumbnailWidth = this.thumbnailHeight * this.aspectRatio;

		const segmentOptions = calculateThumbnailSegmentLayout(this.thumbnailWidth);
		this.thumbnailsPerSegment = segmentOptions.thumbnailsPerSegment;
		this.segmentSize = segmentOptions.segmentSize;
	}

	public async initialize() {
		await this.loadFallbackThumbnail();

		this.initDimensions();
		this.onScrollChange({ scrollLeft: 0 });

		this.canvas?.requestRenderAll();

		this.createFallbackPattern();
		await this.prepareAssets();

		this.onScrollChange({ scrollLeft: 0 });
	}

	public async prepareAssets() {
		const file = await getFileFromUrl(this.src);
		const stream = file.stream();

		// Dynamically import MP4Clip only on the client side
		if (typeof window !== "undefined") {
			try {
				const { MP4Clip } = await import("@designcombo/frames");
				this.clip = new MP4Clip(stream);
				
				// Test if the clip is working by trying to get metadata
				try {
					await this.clip.ready;
					console.log("MP4Clip loaded successfully for video:", this.src);
				} catch (clipError) {
					console.warn("MP4Clip ready check failed:", clipError);
					this.clip = null;
				}
			} catch (error) {
				console.warn("Failed to load MP4Clip:", error);
				this.clip = null;
			}
		} else {
			// Server-side rendering - skip MP4Clip initialization
			this.clip = null;
		}
		
		// Ensure fallback thumbnail is loaded even if MP4Clip fails
		if (!this.thumbnailCache.getThumbnail("fallback")) {
			await this.loadFallbackThumbnail();
		}
	}

	private calculateFilmstripDimensions({
		segmentIndex,
		widthOnScreen,
	}: {
		segmentIndex: number;
		widthOnScreen: number;
	}) {
		const filmstripOffset = segmentIndex * this.segmentSize;
		const shouldUseLeftBacklog = segmentIndex > 0;
		const leftBacklogSize = shouldUseLeftBacklog ? this.segmentSize : 0;

		// Use original duration for timeline display - don't apply playback rate to timeline width
		const totalWidth = timeMsToUnits(
			this.duration,
			this.tScale,
		);

		const rightRemainingSize =
			totalWidth - widthOnScreen - leftBacklogSize - filmstripOffset;
		const rightBacklogSize = Math.min(this.segmentSize, rightRemainingSize);

		const filmstripStartTime = unitsToTimeMs(filmstripOffset, this.tScale);
		const filmstrimpThumbnailsCount =
			1 +
			Math.round(
				(widthOnScreen + leftBacklogSize + rightBacklogSize) /
					this.thumbnailWidth,
			);

		return {
			filmstripOffset,
			leftBacklogSize,
			rightBacklogSize,
			filmstripStartTime,
			filmstrimpThumbnailsCount,
		};
	}

	// load fallback thumbnail, resize it and cache it
	private async loadFallbackThumbnail() {
		const fallbackThumbnail = this.previewUrl;
		
		if (!fallbackThumbnail) {
			// Create a default fallback thumbnail if no preview URL is available
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (ctx) {
				canvas.width = 80;
				canvas.height = 40;
				
				// Draw a video-like background
				ctx.fillStyle = "#374151";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				// Draw a play icon
				ctx.fillStyle = "#9CA3AF";
				ctx.beginPath();
				ctx.moveTo(30, 10);
				ctx.lineTo(30, 30);
				ctx.lineTo(50, 20);
				ctx.closePath();
				ctx.fill();
				
				// Create image from canvas
				const img = new Image();
				img.src = canvas.toDataURL();
				img.onload = () => {
					this.aspectRatio = 2; // 80/40 = 2
					this.thumbnailWidth = 80;
					this.thumbnailCache.setThumbnail("fallback", img);
				};
			}
			return;
		}

		return new Promise<void>((resolve) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.src = `${fallbackThumbnail}?t=${Date.now()}`;
			img.onload = () => {
				// Create a temporary canvas to resize the image
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				if (!ctx) return;

				// Calculate new width maintaining aspect ratio
				const aspectRatio = img.width / img.height;
				const targetHeight = 40;
				const targetWidth = Math.round(targetHeight * aspectRatio);
				// Set canvas size and draw resized image
				canvas.height = targetHeight;
				canvas.width = targetWidth;
				ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

				// Create new image from resized canvas
				const resizedImg = new Image();
				resizedImg.src = canvas.toDataURL();
				// Update aspect ratio and cache the resized image
				this.aspectRatio = aspectRatio;
				this.thumbnailWidth = targetWidth;
				this.thumbnailCache.setThumbnail("fallback", resizedImg);
				resolve();
			};
			img.onerror = () => {
				console.warn("Failed to load fallback thumbnail:", fallbackThumbnail);
				// Create a simple fallback if image fails to load
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				if (ctx) {
					canvas.width = 80;
					canvas.height = 40;
					ctx.fillStyle = "#374151";
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.fillStyle = "#9CA3AF";
					ctx.font = "12px Arial";
					ctx.textAlign = "center";
					ctx.fillText("VIDEO", canvas.width / 2, canvas.height / 2 + 4);
					
					const img = new Image();
					img.src = canvas.toDataURL();
					img.onload = () => {
						this.aspectRatio = 2;
						this.thumbnailWidth = 80;
						this.thumbnailCache.setThumbnail("fallback", img);
						resolve();
					};
				}
			};
		});
	}

	private generateTimestamps(startTime: number, count: number): number[] {
		// Calculate time per thumbnail considering playback rate for visual display
		const timePerThumbnail = unitsToTimeMs(
			this.thumbnailWidth,
			this.tScale,
		);

		return Array.from({ length: count }, (_, i) => {
			const timeInFilmstripe = startTime + i * timePerThumbnail;
			return Math.ceil(timeInFilmstripe / 1000);
		});
	}

	private createFallbackPattern() {
		const canvas = this.canvas;
		if (!canvas) return;

		const canvasWidth = canvas.width;
		const maxPatternSize = 12000;
		const fallbackSource = this.thumbnailCache.getThumbnail("fallback");

		if (!fallbackSource) return;

		// Compute the total width and number of segments needed
		const totalWidthNeeded = Math.min(canvasWidth * 20, maxPatternSize);
		const segmentsRequired = Math.ceil(totalWidthNeeded / this.segmentSize);
		this.fallbackSegmentsCount = segmentsRequired;
		const patternWidth = segmentsRequired * this.segmentSize;

		// Setup canvas dimensions
		const offCanvas = document.createElement("canvas");
		offCanvas.height = this.thumbnailHeight;
		offCanvas.width = patternWidth;

		const context = offCanvas.getContext("2d");
		if (!context) return;
		const thumbnailsTotal = segmentsRequired * this.thumbnailsPerSegment;

		// Draw the fallback image across the entirety of the canvas horizontally
		for (let i = 0; i < thumbnailsTotal; i++) {
			const x = i * this.thumbnailWidth;
			context.drawImage(
				fallbackSource,
				x,
				0,
				this.thumbnailWidth,
				this.thumbnailHeight,
			);
		}

		// Create the pattern and apply it
		const fillPattern = new Pattern({
			source: offCanvas,
			repeat: "no-repeat",
			offsetX: 0,
		});

		this.set("fill", fillPattern);
		this.canvas?.requestRenderAll();
	}
	public async loadAndRenderThumbnails() {
		if (this.isFetchingThumbnails) return;
		
		// If no clip is available, use fallback pattern
		if (!this.clip) {
			console.log("No MP4Clip available, using fallback pattern for video:", this.src);
			this.createFallbackPattern();
			return;
		}
		
		// set segmentDrawn to segmentToDraw
		this.loadingFilmstrip = { ...this.nextFilmstrip };
		this.isFetchingThumbnails = true;

		try {
			// Calculate dimensions and offsets
			const { startTime, thumbnailsCount } = this.loadingFilmstrip;

			// Generate required timestamps
			const timestamps = this.generateTimestamps(startTime, thumbnailsCount);

			// Match and prepare thumbnails
			const thumbnailsArr = await this.clip.thumbnailsList(this.thumbnailWidth, {
				timestamps: timestamps.map((timestamp) => timestamp * 1e6),
			});

			const updatedThumbnails = thumbnailsArr.map(
				(thumbnail: { ts: number; img: Blob }) => {
					return {
						ts: Math.round(thumbnail.ts / 1e6),
						img: thumbnail.img,
					};
				},
			);

			// Load all thumbnails in parallel
			await this.loadThumbnailBatch(updatedThumbnails);

			this.isDirty = true; // Mark as dirty after preparing new thumbnails
			this.currentFilmstrip = { ...this.loadingFilmstrip };

			requestAnimationFrame(() => {
				this.canvas?.requestRenderAll();
			});
		} catch (error) {
			console.warn("Failed to load video thumbnails:", error);
			// Fallback to pattern if thumbnail generation fails
			this.createFallbackPattern();
		} finally {
			this.isFetchingThumbnails = false;
		}
	}

	private async loadThumbnailBatch(thumbnails: { ts: number; img: Blob }[]) {
		const loadPromises = thumbnails.map(async (thumbnail) => {
			if (this.thumbnailCache.getThumbnail(thumbnail.ts)) return;

			return new Promise<void>((resolve) => {
				const img = new Image();
				img.src = URL.createObjectURL(thumbnail.img);
				img.onload = () => {
					URL.revokeObjectURL(img.src); // Clean up the blob URL after image loads
					this.thumbnailCache.setThumbnail(thumbnail.ts, img);
					resolve();
				};
			});
		});

		await Promise.all(loadPromises);
	}

	public _render(ctx: CanvasRenderingContext2D) {
		super._render(ctx);

		ctx.save();
		ctx.translate(-this.width / 2, -this.height / 2);

		// Clip the area to prevent drawing outside
		ctx.beginPath();
		ctx.rect(0, 0, this.width, this.height);
		ctx.clip();

		this.renderToOffscreen();
		if (Math.floor(this.width) === 0) return;
		if (!this.offscreenCanvas) return;
		ctx.drawImage(this.offscreenCanvas, 0, 0);

		ctx.restore();
		// this.drawTextIdentity(ctx);
		this.updateSelected(ctx);
	}

	public setDuration(duration: number) {
		this.duration = duration;
		this.prevDuration = duration;
		
		// Recalculate width based on effective duration (considering playback rate)
		this.updateWidthForPlaybackRate();
	}
	
	public setPlaybackRate(playbackRate: number) {
		this.playbackRate = playbackRate;
		// Recalculate width when playback rate changes
		this.updateWidthForPlaybackRate();
	}
	
	private updateWidthForPlaybackRate() {
		// Don't change timeline width based on playback rate
		// The timeline should show the original duration, not the perceived duration
		const newWidth = timeMsToUnits(this.duration, this.tScale);
		this.set({ width: newWidth });
	}

	public async setSrc(src: string) {
		super.setSrc(src);
		this.clip = null;
		await this.initialize();
		await this.prepareAssets();
		this.thumbnailCache.clearCacheButFallback();
		this.onScale();
	}
	public onResizeSnap() {
		this.renderToOffscreen(true);
	}
	public onResize() {
		this.renderToOffscreen(true);
	}

	public renderToOffscreen(force?: boolean) {
		if (!this.offscreenCtx) return;
		if (!this.isDirty && !force) return;

		if (!this.offscreenCanvas) return;
		this.offscreenCanvas.width = this.width;
		const ctx = this.offscreenCtx;
		const { startTime, offset, thumbnailsCount } = this.currentFilmstrip;
		const thumbnailWidth = this.thumbnailWidth;
		const thumbnailHeight = this.thumbnailHeight;
		// Calculate the offset caused by the trimming
		const trimFromSize = timeMsToUnits(
			this.trim.from,
			this.tScale,
		);

		let timeInFilmstripe = startTime;
		const timePerThumbnail = unitsToTimeMs(
			thumbnailWidth,
			this.tScale,
		);

		// Clear the offscreen canvas
		ctx.clearRect(0, 0, this.width, this.height);

		// Clip with rounded corners
		ctx.beginPath();
		ctx.roundRect(0, 0, this.width, this.height, this.rx);
		ctx.clip();
		
		// Draw thumbnails
		let hasThumbnails = false;
		for (let i = 0; i < thumbnailsCount; i++) {
			let img = this.thumbnailCache.getThumbnail(
				Math.ceil(timeInFilmstripe / 1000),
			);

			if (!img) {
				img = this.thumbnailCache.getThumbnail("fallback");
			}

			if (img?.complete) {
				const xPosition = i * thumbnailWidth + offset - trimFromSize;
				ctx.drawImage(img, xPosition, 0, thumbnailWidth, thumbnailHeight);
				timeInFilmstripe += timePerThumbnail;
				hasThumbnails = true;
			}
		}
		
		// If no thumbnails are available, draw a fallback pattern
		if (!hasThumbnails) {
			const fallbackImg = this.thumbnailCache.getThumbnail("fallback");
			if (fallbackImg?.complete) {
				// Draw the fallback image across the entire width
				for (let i = 0; i < Math.ceil(this.width / thumbnailWidth); i++) {
					const xPosition = i * thumbnailWidth;
					ctx.drawImage(fallbackImg, xPosition, 0, thumbnailWidth, thumbnailHeight);
				}
			} else {
				// Draw a simple colored background if no fallback image
				ctx.fillStyle = "#374151"; // Gray background
				ctx.fillRect(0, 0, this.width, this.height);
				
				// Draw a video icon or text
				ctx.fillStyle = "#9CA3AF";
				ctx.font = "12px Arial";
				ctx.textAlign = "center";
				ctx.fillText("VIDEO", this.width / 2, this.height / 2 + 4);
			}
		}

		this.isDirty = false;
	}

	public drawTextIdentity(ctx: CanvasRenderingContext2D) {
		const iconPath = new Path2D(
			"M16.5625 0.925L12.5 3.275V0.625L11.875 0H0.625L0 0.625V9.375L0.625 10H11.875L12.5 9.375V6.875L16.5625 9.2125L17.5 8.625V1.475L16.5625 0.925ZM11.25 8.75H1.25V1.25H11.25V8.75ZM16.25 7.5L12.5 5.375V4.725L16.25 2.5V7.5Z",
		);
		ctx.save();
		ctx.translate(-this.width / 2, -this.height / 2);
		ctx.translate(0, 14);
		ctx.font = `400 12px ${SECONDARY_FONT}`;
		ctx.fillStyle = "#f4f4f5";
		ctx.textAlign = "left";
		ctx.clip();
		ctx.fillText("Video", 36, 10);

		ctx.translate(8, 1);

		ctx.fillStyle = "#f4f4f5";
		ctx.fill(iconPath);
		ctx.restore();
	}

	public setSelected(selected: boolean) {
		this.isSelected = selected;
		this.set({ dirty: true });
	}


	public calulateWidthOnScreen() {
		const canvasEl = document.getElementById("designcombo-timeline-canvas");
		const canvasWidth = canvasEl?.clientWidth;
		const scrollLeft = this.scrollLeft;
		if (!canvasWidth) return 0;
		const timelineWidth = canvasWidth;
		const cutFromBottomEdge = Math.max(
			timelineWidth - (this.width + this.left + scrollLeft),
			0,
		);
		const visibleHeight = Math.min(
			timelineWidth - this.left - scrollLeft,
			timelineWidth,
		);

		return Math.max(visibleHeight - cutFromBottomEdge, 0);
	}

	// Calculate the width that is not visible on the screen measured from the left
	public calculateOffscreenWidth({ scrollLeft }: { scrollLeft: number }) {
		const offscreenWidth = Math.min(this.left + scrollLeft, 0);

		return Math.abs(offscreenWidth);
	}

	public onScrollChange({
		scrollLeft,
		force,
	}: {
		scrollLeft: number;
		force?: boolean;
	}) {
		const offscreenWidth = this.calculateOffscreenWidth({ scrollLeft });
		const trimFromSize = timeMsToUnits(
			this.trim.from,
			this.tScale,
		);

		const offscreenSegments = calculateOffscreenSegments(
			offscreenWidth,
			trimFromSize,
			this.segmentSize,
		);

		this.offscreenSegments = offscreenSegments;

		// calculate start segment to draw
		const segmentToDraw = offscreenSegments;

		if (this.currentFilmstrip.segmentIndex === segmentToDraw) {
			return false;
		}

		if (segmentToDraw !== this.fallbackSegmentIndex) {
			const fillPattern = this.fill as Pattern;
			if (fillPattern instanceof Pattern) {
				fillPattern.offsetX =
					this.segmentSize *
					(segmentToDraw - Math.floor(this.fallbackSegmentsCount / 2));
			}

			this.fallbackSegmentIndex = segmentToDraw;
		}
		if (!this.isFetchingThumbnails || force) {
			this.scrollLeft = scrollLeft;
			const widthOnScreen = this.calulateWidthOnScreen();
			// With these lines:
			const { filmstripOffset, filmstripStartTime, filmstrimpThumbnailsCount } =
				this.calculateFilmstripDimensions({
					widthOnScreen: this.calulateWidthOnScreen(),
					segmentIndex: segmentToDraw,
				});

			this.nextFilmstrip = {
				segmentIndex: segmentToDraw,
				offset: filmstripOffset,
				startTime: filmstripStartTime,
				thumbnailsCount: filmstrimpThumbnailsCount,
				widthOnScreen,
			};

			this.loadAndRenderThumbnails();
		}
	}
	public onScale() {
		this.currentFilmstrip = { ...EMPTY_FILMSTRIP };
		this.nextFilmstrip = { ...EMPTY_FILMSTRIP, segmentIndex: 0 };
		this.loadingFilmstrip = { ...EMPTY_FILMSTRIP };
		this.onScrollChange({ scrollLeft: this.scrollLeft, force: true });
	}
}

export default Video;
