import { GameEngine } from '../types';
import { Renderer, Camera } from './Renderer';
import { GameLoop } from './GameLoop';
import { InputHandler } from './InputHandler';
import { SystemManager } from './SystemManager';

/**
 * Main game engine class with modular architecture.
 * 
 * This is the core orchestrator for the space game. It coordinates between the
 * different subsystems (rendering, input, game logic) and provides a clean
 * interface for external consumers.
 * 
 * **Architecture:**
 * - `Renderer`: Handles all visual rendering including world objects and UI
 * - `GameLoop`: Manages frame timing and loop execution 
 * - `InputHandler`: Processes keyboard/mouse/touch input and camera controls
 * - `SystemManager`: Dependency injection container for all game systems
 * 
 * **Key Design Principles:**
 * - Single Responsibility: Each component has one focused job
 * - Dependency Injection: Systems are loosely coupled through interfaces
 * - Testability: Each module can be unit tested in isolation
 * - Performance: Optimized rendering and update loops
 * 
 * @example
 * ```typescript
 * const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
 * const engine = new Engine(canvas);
 * 
 * // Start the game loop
 * engine.start();
 * 
 * // Access game systems
 * const playerManager = engine.getPlayerManager();
 * const worldManager = engine.getWorldManager();
 * 
 * // Clean up when done
 * engine.dispose();
 * ```
 * 
 * @author Space Game Development Team
 * @version 1.0.0
 * @since 2024-01-01
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

  /**
   * Initialize the game engine with a canvas element.
   * 
   * Sets up all core systems and prepares the engine for gameplay.
   * The canvas will be configured for optimal pixel art rendering.
   * 
   * @param canvas - HTML canvas element for rendering the game
   * @throws {Error} If the canvas doesn't support 2D context
   * 
   * @example
   * ```typescript
   * const canvas = document.getElementById('game') as HTMLCanvasElement;
   * const engine = new Engine(canvas);
   * ```
   */
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

  /**
   * Start the game engine.
   * 
   * Begins the main game loop, activates all systems, and starts accepting
   * input. The game will continue running until stop() is called.
   * 
   * @example
   * ```typescript
   * engine.start();
   * // Game is now running...
   * ```
   */
  start(): void {
    if (this.gameLoop.getIsRunning()) return;
    
    this.systemManager.startSystems();
    this.gameLoop.start();
  }

  /**
   * Stop the game engine.
   * 
   * Halts the main game loop and pauses all systems. The engine can be
   * restarted later with start().
   * 
   * @example
   * ```typescript
   * engine.stop();
   * // Game is now paused...
   * engine.start(); // Resume
   * ```
   */
  stop(): void {
    this.systemManager.stopSystems();
    this.gameLoop.stop();
  }

  /**
   * Check if the game engine is currently running.
   * 
   * @returns true if the game loop is active, false otherwise
   */
  get isRunning(): boolean {
    return this.gameLoop.getIsRunning();
  }

  /**
   * Get the timestamp of the last frame.
   * 
   * @returns Current performance timestamp in milliseconds
   */
  get lastFrameTime(): number {
    return performance.now();
  }

  /**
   * Update all game systems and handle input.
   * 
   * Called automatically by the game loop. Updates all game systems and
   * processes input for camera movement and world interaction.
   * 
   * @param deltaTime - Time elapsed since last update in seconds
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
   * Render the game using the dedicated renderer.
   * 
   * Called automatically by the game loop. Renders all world objects, UI
   * elements, and effects to the canvas.
   */
  render = (): void => {
    this.renderer.render(
      this.camera,
      this.systemManager.getWorldManager(),
      this.systemManager.getTimeManager()
    );
  };

  // System accessor methods for backward compatibility and external access
  
  /**
   * Get the input management system.
   * 
   * @returns InputManager instance for handling keyboard, mouse, and touch input
   */
  getInputManager() {
    return this.systemManager.getInputManager();
  }

  /**
   * Get the world management system.
   * 
   * @returns WorldManager instance for handling galaxy, systems, and navigation
   */
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

  getSkillSpecializationManager() {
    return this.systemManager.getSkillSpecializationManager();
  }

  getMaintenanceManager() {
    return this.systemManager.getMaintenanceManager();
  }

  getAchievementManager() {
    return this.systemManager.getAchievementManager();
  }

  getEventManager() {
    return this.systemManager.getEventManager();
  }

  getNPCAIManager() {
    return this.systemManager.getNPCAIManager();
  }

  getSecurityManager() {
    return this.systemManager.getSecurityManager();
  }

  getCharacterProgressionSystem() {
    return this.systemManager.getCharacterProgressionSystem();
  }

  /**
   * Clean up all resources and stop the engine.
   * 
   * Should be called when the engine is no longer needed to prevent
   * memory leaks and properly dispose of all systems.
   * 
   * @example
   * ```typescript
   * // When done with the game
   * engine.dispose();
   * ```
   */
  dispose(): void {
    this.gameLoop.dispose();
    this.systemManager.dispose();
  }

  /**
   * Resize the canvas and maintain quality settings.
   * 
   * Should be called when the canvas container is resized to maintain
   * proper aspect ratio and rendering quality.
   * 
   * @param width - New canvas width in pixels
   * @param height - New canvas height in pixels
   * 
   * @example
   * ```typescript
   * // Handle window resize
   * window.addEventListener('resize', () => {
   *   engine.resizeCanvas(window.innerWidth, window.innerHeight);
   * });
   * ```
   */
  resizeCanvas(width: number, height: number): void {
    this.renderer.resizeCanvas(width, height);
  }
}