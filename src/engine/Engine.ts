import { GameEngine } from '../types';
import { Camera } from './Renderer';
import { ThreeRenderer } from './ThreeRenderer';
import { GameLoop } from './GameLoop';
import { InputHandler } from './InputHandler';
import { SystemManager } from './SystemManager';
import { SceneManager } from './SceneManager';
import { PoolManager } from './ObjectPool';
import { performanceMonitor } from './PerformanceMonitor';
import { resourceManager } from './ResourceManager';
import { shipTextureManager } from './ShipTextureManager';
import { audioEngine } from './AudioEngine';

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
  private camera: Camera = { x: 0, y: 0, zoom: 1 };
  
  // 3D rendering only
  private renderer3D: ThreeRenderer | null = null;
  
  // Modular components
  private gameLoop: GameLoop;
  private inputHandler: InputHandler;
  private systemManager: SystemManager;
  private sceneManager: SceneManager;
  
  // Modern engine systems
  private poolManager: PoolManager;

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
    
    // For 3D-only mode, ThreeRenderer will handle canvas context creation
    
    // Initialize modular components
    this.gameLoop = new GameLoop();
    this.inputHandler = new InputHandler(canvas);
    this.systemManager = new SystemManager(canvas);
    this.sceneManager = new SceneManager();
    
    // Initialize modern engine systems
    this.poolManager = PoolManager.getInstance();
    
    // Initialize performance monitoring
    performanceMonitor.setupGPUProfiling(canvas);
    
    // Initialize audio engine
    // Ensure singleton is initialized
    audioEngine.getContext(); // Initialize the audio context
    
    // Initialize ship texture manager
    this.initializeTextureManager();
    
    // Connect scene manager to world manager before systems start
    this.systemManager.getWorldManager().setSceneManager(this.sceneManager);
    
    // Connect scene manager to NPC AI manager for actor-based movement
    this.systemManager.getNPCAIManager().setSceneManager(this.sceneManager);
    
    // Connect NPC AI manager to world manager for NPC rendering
    this.systemManager.getWorldManager().setNPCAIManager(this.systemManager.getNPCAIManager());
    
    // Initialize 3D renderer using the provided canvas directly (no dual canvas)
    try {
      this.renderer3D = new ThreeRenderer(canvas);
      console.log('3D renderer initialized successfully');
    } catch (error) {
      console.error('3D renderer initialization failed - this is required for 3D-only mode:', error);
      throw new Error(`Failed to initialize required 3D renderer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Set up game loop callbacks
    this.gameLoop.setUpdateCallback(this.update.bind(this));
    this.gameLoop.setRenderCallback(this.render.bind(this));
    
    // Set up input handler
    this.inputHandler.setClickHandler((worldX, worldY, action) => {
      InputHandler.handleWorldClick(worldX, worldY, this.systemManager.getWorldManager(), action);
    });
  }

  /**
   * Initialize the ship texture manager
   */
  private async initializeTextureManager(): Promise<void> {
    try {
      await shipTextureManager.initialize();
      
      // Preload essential textures for immediate use
      await shipTextureManager.preloadEssentialTextures();
      
      console.log('Ship texture manager initialized successfully');
      console.log('Texture stats:', shipTextureManager.getStats());
    } catch (error) {
      console.warn('Failed to initialize ship texture manager:', error);
      console.log('Ships will render with solid colors instead of textures');
    }
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
    
    // Start performance monitoring
    performanceMonitor.start();
    
    this.systemManager.startSystems();
    
    // Initialize scene with player ship
    this.initializeScene();
    
    this.gameLoop.start();
    
    console.log('Game Engine started with industry-standard optimizations:');
    console.log('- Object Pooling: Enabled');
    console.log('- Performance Monitoring: Enabled');
    console.log('- Resource Management: Enabled');
    console.log('- 3D Audio Engine: Enabled');
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
    performanceMonitor.stop();
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
    // Begin performance frame measurement
    performanceMonitor.beginFrame();
    
    // Update all game systems with profiling
    performanceMonitor.profileSystem('SystemManager', () => {
      this.systemManager.updateSystems(deltaTime);
    });
    
    // Update scene and actors with profiling
    performanceMonitor.profileSystem('SceneManager', () => {
      this.sceneManager.update(deltaTime);
    });
    
    // Handle input and update camera with profiling
    performanceMonitor.profileSystem('InputHandler', () => {
      this.inputHandler.updateCamera(
        this.camera, 
        deltaTime, 
        this.systemManager.getInputManager()
      );
    });
    
    // Update 3D audio listener position based on camera
    audioEngine.updateListener({
      position: { x: this.camera.x, y: this.camera.y, z: 0 },
      orientation: {
        forward: { x: 0, y: 0, z: -1 },
        up: { x: 0, y: 1, z: 0 }
      }
    });
  };

  /**
   * Render the game using the active renderer (2D or 3D).
   * 
   * Called automatically by the game loop. Renders all world objects, UI
   * elements, and effects to the canvas.
   */
  render = (): void => {
    performanceMonitor.profileSystem('Renderer', () => {
      if (this.renderer3D) {
        // Use single 3D canvas for rendering
        this.renderer3D.render(
          this.camera,
          this.systemManager.getWorldManager(),
          this.systemManager.getTimeManager(),
          this.sceneManager
        );
      } else {
        console.error('3D renderer not available - this should not happen in 3D-only mode');
      }
    });
    
    // End performance frame measurement
    performanceMonitor.endFrame();
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



  getQuestManager() {
    return this.systemManager.getQuestManager();
  }

  /**
   * Get the scene manager for actor-based gameplay
   */
  getSceneManager() {
    return this.sceneManager;
  }

  /**
   * Get the object pool manager for performance optimization
   */
  getPoolManager() {
    return this.poolManager;
  }

  /**
   * Get the performance monitor for real-time metrics
   */
  getPerformanceMonitor() {
    return performanceMonitor;
  }

  /**
   * Get the resource manager for asset loading
   */
  getResourceManager() {
    return resourceManager;
  }

  /**
   * Get the audio engine for 3D positional audio
   */
  getAudioEngine() {
    return audioEngine;
  }

  /**
   * Initialize the scene with player ship and actors
   */
  private initializeScene(): void {
    // Scene manager should already be connected and ship should be set
    // This method can be used for any additional scene setup
    const playerShip = this.systemManager.getPlayerManager().getShip();
    if (playerShip && playerShip.location.coordinates) {
      console.log('Player ship initialized in scene:', playerShip.name, 'at', playerShip.location.coordinates);
      
      // Initialize camera to center on player ship for proper coordinate mapping
      const shipPos = playerShip.location.coordinates;
      this.camera.x = shipPos.x;
      this.camera.y = shipPos.y;
      console.log(`Camera initialized to follow ship at (${this.camera.x}, ${this.camera.y})`);
    }
  }

  /**
   * Switch between 2D and 3D rendering modes.
   * Note: In 3D-only mode, this method maintains compatibility but always returns to 3D.
   * 
   * @param mode - The rendering mode to switch to ('2D' or '3D')
   * @returns true if the switch was successful, false otherwise
   */
  setRenderMode(mode: '2D' | '3D'): boolean {
    // Validate mode parameter
    if (mode !== '2D' && mode !== '3D') {
      console.warn('Invalid render mode specified:', mode);
      return false;
    }
    
    if (mode === '2D') {
      console.warn('2D mode is not available in 3D-only mode, staying in 3D');
      return false;
    }
    
    if (mode === '3D' && !this.renderer3D) {
      console.error('3D renderer not available - this should not happen in 3D-only mode');
      return false;
    }
    
    // If canvas has invalid dimensions, trigger a resize
    if (this.canvas.width <= 0 || this.canvas.height <= 0) {
      const containerWidth = this.canvas.parentElement?.clientWidth || this.canvas.clientWidth || this.canvas.width;
      const containerHeight = this.canvas.parentElement?.clientHeight || this.canvas.clientHeight || this.canvas.height;
      
      if (containerWidth > 0 && containerHeight > 0) {
        this.resizeCanvas(containerWidth, containerHeight);
      }
    }
    
    console.log(`Confirmed ${mode} rendering mode (3D-only)`);
    return true;
  }

  /**
   * Get the current rendering mode.
   * Note: In 3D-only mode, this always returns '3D'.
   * 
   * @returns Current rendering mode (always '3D' in 3D-only mode)
   */
  getRenderMode(): '2D' | '3D' {
    return '3D'; // Always 3D in 3D-only mode
  }

  /**
   * Check if 3D rendering is available.
   * Note: In 3D-only mode, this should always return true if properly initialized.
   * 
   * @returns true if 3D renderer is initialized and available, false otherwise
   */
  is3DAvailable(): boolean {
    return this.renderer3D !== null;
  }

  /**
   * Get the ThreeRenderer instance for advanced 3D operations
   * 
   * @returns ThreeRenderer instance if available, null otherwise
   */
  getThreeRenderer(): ThreeRenderer | null {
    return this.renderer3D;
  }

  /**
   * Get the current camera state
   * 
   * @returns Current camera object with x, y, and zoom properties
   */
  getCamera(): Camera {
    return { ...this.camera };
  }

  /**
   * Set the camera position and zoom
   * 
   * @param x - Camera X coordinate
   * @param y - Camera Y coordinate  
   * @param zoom - Camera zoom level (optional, defaults to current zoom)
   */
  setCameraPosition(x: number, y: number, zoom?: number): void {
    this.camera.x = x;
    this.camera.y = y;
    if (zoom !== undefined) {
      this.camera.zoom = Math.max(0.1, Math.min(3, zoom));
    }
  }

  /**
   * Move camera to specific coordinates with smooth transition
   * 
   * @param targetX - Target X coordinate
   * @param targetY - Target Y coordinate
   * @param targetZoom - Target zoom level (optional)
   */
  moveCameraTo(targetX: number, targetY: number, targetZoom?: number): void {
    // For now, implement instant movement. Could be enhanced with smooth interpolation later
    this.setCameraPosition(targetX, targetY, targetZoom);
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
    this.sceneManager.dispose();
    
    // Clean up modern systems
    performanceMonitor.dispose();
    resourceManager.dispose();
    audioEngine.dispose();
    this.poolManager.dispose();
    
    // Clean up 3D renderer if it exists
    if (this.renderer3D) {
      this.renderer3D.dispose();
    }
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
    // Don't resize to 0 dimensions
    if (width <= 0 || height <= 0) {
      console.warn('Ignoring invalid canvas resize dimensions:', width, 'x', height);
      return;
    }
    
    // Resize the main canvas
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Resize 3D renderer if available
    if (this.renderer3D) {
      this.renderer3D.resizeRenderer(width, height);
    }
  }
}