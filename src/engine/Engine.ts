import { GameEngine } from '../types';
import { Renderer, Camera } from './Renderer';
import { GameLoop } from './GameLoop';
import { InputHandler } from './InputHandler';
import { SystemManager } from './SystemManager';

/**
 * Main game engine class with modular architecture.
 * Orchestrates the game systems, rendering, and input handling.
 * Refactored for better maintainability and testability.
 */
export class Engine implements GameEngine {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  private camera: Camera = { x: 0, y: 0, zoom: 1 };
  
  // Modular components
  private renderer: Renderer;
  private gameLoop: GameLoop;
  private inputHandler: InputHandler;
  private systemManager: SystemManager;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas. This may occur on older devices or browsers that don\'t support HTML5 Canvas.');
    }
    this.context = context;
    
    // Initialize modular components
    this.renderer = new Renderer(canvas);
    this.gameLoop = new GameLoop();
    this.inputHandler = new InputHandler(canvas);
    this.systemManager = new SystemManager(canvas);
    
    // Set up game loop callbacks
    this.gameLoop.setUpdateCallback(this.update.bind(this));
    this.gameLoop.setRenderCallback(this.render.bind(this));
    
    // Set up input handler
    this.inputHandler.setClickHandler((worldX, worldY) => {
      InputHandler.handleWorldClick(worldX, worldY, this.systemManager.getWorldManager());
    });
    
    // Ensure canvas has a dark background
    this.context.fillStyle = '#0a0a0a';
    this.context.fillRect(0, 0, canvas.width, canvas.height);
  }

  start(): void {
    if (this.gameLoop.getIsRunning()) return;
    
    this.systemManager.startSystems();
    this.gameLoop.start();
  }

  stop(): void {
    this.systemManager.stopSystems();
    this.gameLoop.stop();
  }

  get isRunning(): boolean {
    return this.gameLoop.getIsRunning();
  }

  get lastFrameTime(): number {
    return performance.now();
  }

  /**
   * Update all game systems and handle input
   */
  update = (deltaTime: number): void => {
    // Update all game systems
    this.systemManager.updateSystems(deltaTime);
    
    // Handle input and update camera
    this.inputHandler.updateCamera(
      this.camera, 
      deltaTime, 
      this.systemManager.getInputManager()
    );
  };

  /**
   * Render the game using the dedicated renderer
   */
  render = (): void => {
    this.renderer.render(
      this.camera,
      this.systemManager.getWorldManager(),
      this.systemManager.getTimeManager()
    );
  };

  // Public getter methods for compatibility with existing code
  getInputManager() {
    return this.systemManager.getInputManager();
  }

  getWorldManager() {
    return this.systemManager.getWorldManager();
  }

  getEconomicSystem() {
    return this.systemManager.getEconomicSystem();
  }

  getTimeManager() {
    return this.systemManager.getTimeManager();
  }

  getSaveManager() {
    return this.systemManager.getSaveManager();
  }

  getContractManager() {
    return this.systemManager.getContractManager();
  }

  getRouteAnalyzer() {
    return this.systemManager.getRouteAnalyzer();
  }

  getPlayerManager() {
    return this.systemManager.getPlayerManager();
  }

  getCharacterManager() {
    return this.systemManager.getCharacterManager();
  }

  getMaintenanceManager() {
    return this.systemManager.getMaintenanceManager();
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.gameLoop.dispose();
    this.systemManager.dispose();
  }

  /**
   * Resize canvas and maintain quality settings
   */
  resizeCanvas(width: number, height: number): void {
    this.renderer.resizeCanvas(width, height);
  }
}