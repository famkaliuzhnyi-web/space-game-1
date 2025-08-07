/**
 * Dedicated game loop system for the space game engine.
 * Handles frame timing, delta time calculation, and loop management.
 * Separated from Engine class for better testability and control.
 */
export class GameLoop {
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number = 0;
  private updateCallback?: (deltaTime: number) => void;
  private renderCallback?: () => void;

  /**
   * Set the callback function for game updates
   */
  setUpdateCallback(callback: (deltaTime: number) => void): void {
    this.updateCallback = callback;
  }

  /**
   * Set the callback function for rendering
   */
  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  /**
   * Check if the game loop is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the last calculated delta time in seconds
   */
  getLastDeltaTime(): number {
    return (performance.now() - this.lastFrameTime) / 1000;
  }

  /**
   * Main game loop implementation
   */
  private loop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    // Call update callback
    if (this.updateCallback) {
      this.updateCallback(deltaTime);
    }

    // Call render callback
    if (this.renderCallback) {
      this.renderCallback();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.updateCallback = undefined;
    this.renderCallback = undefined;
  }
}