import { GameEngine } from '../types';
import { Renderer, Camera } from './Renderer';
import { GameLoop } from './GameLoop';
import { InputHandler } from './InputHandler';
import { SystemManager } from './SystemManager';
import { Scene } from './Scene';
import { ShipMovementController } from '../utils/ShipMovementController';

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
  
  // Scene management
  private currentScene: Scene | null = null;
  private _shipMovementController: ShipMovementController | null = null;

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
      this.handleWorldClick(worldX, worldY);
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
    
    // Initialize current scene and player ship
    const sceneManager = this.systemManager.getSceneManager();
    const scene = sceneManager.getCurrentSystemScene();
    this.setScene(scene);
    console.log('Scene initialized:', scene.id, scene.name);
    
    // Create player ship actor
    const shipActor = sceneManager.createPlayerShipActor();
    console.log('Player ship actor created:', shipActor?.id, shipActor?.getPosition());
    
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
    
    // Update current scene
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
    
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
      this.systemManager.getTimeManager(),
      this.currentScene
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

  getHackingManager() {
    return this.systemManager.getHackingManager();
  }

  getCombatManager() {
    return this.systemManager.getCombatManager();
  }

  getInvestmentManager() {
    return this.systemManager.getInvestmentManager();
  }

  getCharacterProgressionSystem() {
    return this.systemManager.getCharacterProgressionSystem();
  }

  getTutorialManager() {
    return this.systemManager.getTutorialManager();
  }

  getQuestManager() {
    return this.systemManager.getQuestManager();
  }

  getMovementSystem() {
    return this.systemManager.getMovementSystem();
  }

  getSceneManager() {
    return this.systemManager.getSceneManager();
  }

  /**
   * Get ship movement controller for easy movement commands
   */
  getShipMovementController(): ShipMovementController {
    if (!this._shipMovementController) {
      this._shipMovementController = new ShipMovementController(this);
    }
    return this._shipMovementController;
  }

  /**
   * Handle world click events with enhanced movement system
   */
  private handleWorldClick(worldX: number, worldY: number): void {
    console.log('World click at:', worldX, worldY);
    const worldManager = this.systemManager.getWorldManager();
    const movementController = this.getShipMovementController();
    
    // Check if click is on any navigable object
    const objects = worldManager.getAllVisibleObjects();
    
    for (const obj of objects) {
      const distance = Math.sqrt(
        Math.pow(worldX - obj.position.x, 2) + 
        Math.pow(worldY - obj.position.y, 2)
      );

      // Check if click is within object bounds
      let clickRadius = 20; // Default click radius
      if (obj.type === 'station') clickRadius = 15;
      if (obj.type === 'planet' && 'radius' in obj.object) clickRadius = (obj.object as any).radius || 25;
      if (obj.type === 'star') clickRadius = 30;

      if (distance <= clickRadius) {
        if (obj.type === 'station' && 'id' in obj.object) {
          // Use enhanced movement system for station navigation
          const stationId = (obj.object as any).id;
          console.log('Clicking on station:', stationId);
          const success = movementController.movePlayerShipToStation(stationId);
          
          if (success) {
            // Update player location for backward compatibility
            worldManager.navigateToTarget(stationId);
          }
        }
        break;
      }
    }
    
    // If no object was clicked, move to the clicked coordinates
    // This allows free movement in space
    if (!this.isClickOnObject(worldX, worldY, objects)) {
      console.log('Moving to coordinates:', worldX, worldY);
      movementController.movePlayerShipToCoordinates(worldX, worldY);
    }
  }

  /**
   * Check if a click is on any object
   */
  private isClickOnObject(worldX: number, worldY: number, objects: any[]): boolean {
    for (const obj of objects) {
      const distance = Math.sqrt(
        Math.pow(worldX - obj.position.x, 2) + 
        Math.pow(worldY - obj.position.y, 2)
      );

      let clickRadius = 20;
      if (obj.type === 'station') clickRadius = 15;
      if (obj.type === 'planet' && 'radius' in obj.object) clickRadius = (obj.object as any).radius || 25;
      if (obj.type === 'star') clickRadius = 30;

      if (distance <= clickRadius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Set the current scene
   */
  setScene(scene: Scene): void {
    this.currentScene = scene;
  }

  /**
   * Get the current scene
   */
  getCurrentScene(): Scene | null {
    return this.currentScene;
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