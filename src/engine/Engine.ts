import { GameEngine } from '../types';
import { InputManager } from '../systems';

export class Engine implements GameEngine {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  isRunning: boolean = false;
  lastFrameTime: number = 0;
  private inputManager: InputManager;
  private animationFrameId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas. This may occur on older devices or browsers that don\'t support HTML5 Canvas.');
    }
    this.context = context;
    
    this.inputManager = new InputManager(canvas);
    
    // Set up canvas for crisp pixel art
    this.context.imageSmoothingEnabled = false;
    
    // Ensure canvas has a dark background
    this.context.fillStyle = '#0a0a0a';
    this.context.fillRect(0, 0, canvas.width, canvas.height);
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  update(deltaTime: number): void {
    // Override in subclasses or extend for game-specific logic
    // Basic update logic here
    // deltaTime can be used for frame-rate independent animations
    void deltaTime; // Suppress unused parameter warning
  }

  render(): void {
    // Clear the canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set a dark space background
    this.context.fillStyle = '#0a0a0a';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add some stars
    this.renderStars();
  }

  private renderStars(): void {
    this.context.fillStyle = '#ffffff';
    
    // Simple star field - we'll make this more sophisticated later
    for (let i = 0; i < 100; i++) {
      const x = (i * 17) % this.canvas.width;
      const y = (i * 31) % this.canvas.height;
      const size = (i % 3) + 1;
      
      this.context.fillRect(x, y, size, size);
    }
  }

  getInputManager(): InputManager {
    return this.inputManager;
  }

  dispose(): void {
    this.stop();
    this.inputManager.dispose();
  }

  // Utility methods
  resizeCanvas(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.imageSmoothingEnabled = false;
    
    // Ensure canvas maintains dark background after resize
    this.context.fillStyle = '#0a0a0a';
    this.context.fillRect(0, 0, width, height);
  }
}