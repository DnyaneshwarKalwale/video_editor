

export interface RenderVideoOptions {
  variation: any;
  textOverlays: any[];
  platformConfig: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  duration: number;
  videoTrackItems: any[];
  audioTrackItems: any[];
}

export class RemotionRendererService {
  static async renderVideo(options: RenderVideoOptions): Promise<Blob> {
    try {
      const response = await fetch('/api/render-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to render video');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error rendering video:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to render video');
    }
  }

  static downloadVideo(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
} 