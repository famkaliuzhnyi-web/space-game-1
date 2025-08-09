import { Scene } from './Scene';
import { ShipActor } from './ShipActor';
import { Ship } from '../types/player';

/**
 * Scene Manager handles scene lifecycle and actor management.
 * Provides high-level interface for managing game scenes and actors.
 */
export class SceneManager {
  private currentScene: Scene;
  private shipActor: ShipActor | null = null;

  constructor() {
    this.currentScene = new Scene();
  }

  /**
   * Set the current scene
   */
  setScene(scene: Scene): void {
    // Clean up current scene
    this.currentScene.clear();
    this.currentScene = scene;
    this.shipActor = null;
  }

  /**
   * Get the current scene
   */
  getCurrentScene(): Scene {
    return this.currentScene;
  }

  /**
   * Set or update the player ship actor
   */
  setPlayerShip(ship: Ship): void {
    // Remove existing ship actor if present
    if (this.shipActor) {
      this.currentScene.removeActor(this.shipActor.id);
    }
    
    // Create new ship actor
    this.shipActor = new ShipActor(ship);
    this.currentScene.addActor(this.shipActor, 'ship');
  }

  /**
   * Get the player ship actor
   */
  getPlayerShipActor(): ShipActor | null {
    return this.shipActor;
  }

  /**
   * Move ship to target coordinates
   */
  moveShipTo(worldX: number, worldY: number, onComplete?: () => void): boolean {
    if (!this.shipActor) return false;
    
    this.shipActor.setTarget({ x: worldX, y: worldY });
    
    // Store the completion callback
    if (onComplete) {
      this.shipActor.setMovementCompleteCallback(onComplete);
    }
    
    return true;
  }

  /**
   * Stop ship movement
   */
  stopShipMovement(): void {
    if (this.shipActor) {
      this.shipActor.stopMovement();
    }
  }

  /**
   * Update the current scene
   */
  update(deltaTime: number): void {
    this.currentScene.update(deltaTime);
  }

  /**
   * Render the current scene
   */
  render(context: CanvasRenderingContext2D): void {
    this.currentScene.render(context);
  }

  /**
   * Get all ship actors in the scene
   */
  getAllShips(): ShipActor[] {
    return this.currentScene.getActorsByType('ship') as ShipActor[];
  }

  /**
   * Check if player ship is moving
   */
  isPlayerShipMoving(): boolean {
    return this.shipActor ? this.shipActor.isMoving() : false;
  }

  /**
   * Get player ship current speed
   */
  getPlayerShipSpeed(): number {
    return this.shipActor ? this.shipActor.getCurrentSpeed() : 0;
  }

  /**
   * Dispose of the scene manager
   */
  dispose(): void {
    this.currentScene.clear();
    this.shipActor = null;
  }
}