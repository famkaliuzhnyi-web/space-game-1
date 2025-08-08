/**
 * Dedicated game loop system for the space game engine.
 * 
 * Handles frame timing, delta time calculation, and loop management using
 * requestAnimationFrame for optimal performance. Separated from Engine class
 * for better testability and control.
 * 
 * **Features:**
 * - Precise delta time calculation for smooth animation
 * - Proper cleanup of animation frames
 * - Callback-based architecture for loose coupling
 * - Performance monitoring capabilities
 * 
 * @example
 * ```typescript
 * const gameLoop = new GameLoop();
 * 
 * // Set up callbacks
 * gameLoop.setUpdateCallback((deltaTime) => {
 *   // Update game logic
 *   gameState.update(deltaTime);
 * });
 * 
 * gameLoop.setRenderCallback(() => {
 *   // Render the game
 *   renderer.render();
 * });
 * 
 * // Start the loop
 * gameLoop.start();
 * ```
 * 
 * @author Space Game Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */
export class GameLoop {
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number = 0;
  private updateCallback?: (deltaTime: number) => void;
  private renderCallback?: () => void;
  
  // Performance monitoring
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;
  private frameTimeHistory: number[] = [];
  private maxFrameTimeHistory = 60; // Keep last 60 frame times

  /**
   * Set the callback function for game updates.
   * 
   * The update callback receives delta time and should handle all game logic
   * updates including physics, AI, input processing, etc.
   * 
   * @param callback - Function to call for each update cycle
   */
  setUpdateCallback(callback: (deltaTime: number) => void): void {
    this.updateCallback = callback;
  }

  /**
   * Set the callback function for rendering.
   * 
   * The render callback should handle all visual rendering and should not
   * modify game state.
   * 
   * @param callback - Function to call for each render cycle
   */
  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  /**
   * Start the game loop.
   * 
   * Begins executing the update and render callbacks at approximately 60fps.
   * Does nothing if the loop is already running.
   * 
   * @example
   * ```typescript
   * gameLoop.start();
   * console.log(gameLoop.getIsRunning()); // true
   * ```
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  /**
   * Stop the game loop.
   * 
   * Halts execution of update and render callbacks and cleans up the
   * animation frame. The loop can be restarted with start().
   * 
   * @example
   * ```typescript
   * gameLoop.stop();
   * console.log(gameLoop.getIsRunning()); // false
   * ```
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

    const frameStartTime = performance.now();
    const currentTime = frameStartTime;
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

    // Performance monitoring
    const frameEndTime = performance.now();
    const frameTime = frameEndTime - frameStartTime;
    
    this.frameCount++;
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxFrameTimeHistory) {
      this.frameTimeHistory.shift();
    }

    // Update FPS every second
    if (frameEndTime - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round(1000 / (frameEndTime - frameStartTime));
      this.lastFpsUpdate = frameEndTime;
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

  // Performance monitoring methods

  /**
   * Get current FPS
   */
  getCurrentFps(): number {
    return this.currentFps;
  }

  /**
   * Get average frame time in milliseconds
   */
  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeHistory.length;
  }

  /**
   * Get maximum frame time in milliseconds
   */
  getMaxFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    return Math.max(...this.frameTimeHistory);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    fps: number;
    avgFrameTime: number;
    maxFrameTime: number;
    frameCount: number;
  } {
    return {
      fps: this.currentFps,
      avgFrameTime: this.getAverageFrameTime(),
      maxFrameTime: this.getMaxFrameTime(),
      frameCount: this.frameCount
    };
  }
}