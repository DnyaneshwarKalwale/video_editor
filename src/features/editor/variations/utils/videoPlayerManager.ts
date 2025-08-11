class VideoPlayerManager {
  private static instance: VideoPlayerManager;
  private activePlayers: Set<string> = new Set();
  private maxConcurrentPlayers = 10; // Limit to 5 concurrent players
  private playerQueue: Array<{ id: string; callback: () => void }> = [];

  public static getInstance(): VideoPlayerManager {
    if (!VideoPlayerManager.instance) {
      VideoPlayerManager.instance = new VideoPlayerManager();
    }
    return VideoPlayerManager.instance;
  }

  public requestPlayer(id: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.activePlayers.size < this.maxConcurrentPlayers) {
        this.activePlayers.add(id);
        resolve();
      } else {
        // Queue the request
        this.playerQueue.push({ id, callback: resolve });
      }
    });
  }

  public releasePlayer(id: string): void {
    this.activePlayers.delete(id);
    
    // Process queue if there are waiting players
    if (this.playerQueue.length > 0) {
      const nextPlayer = this.playerQueue.shift();
      if (nextPlayer) {
        this.activePlayers.add(nextPlayer.id);
        nextPlayer.callback();
      }
    }
  }

  public clearAll(): void {
    this.activePlayers.clear();
    this.playerQueue = [];
  }

  public getActiveCount(): number {
    return this.activePlayers.size;
  }

  public getQueueLength(): number {
    return this.playerQueue.length;
  }
}

export default VideoPlayerManager;
