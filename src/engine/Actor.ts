import { IScene } from './Scene';

/**
 * Vector2 represents a 2D position or velocity
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Transform represents position, rotation, and scale in 2D space
 */
export interface Transform {
  position: Vector2;
  rotation: number; // in radians
  scale: Vector2;
}

/**
 * Base Actor class following game engine patterns.
 * All game objects that exist in the world should extend this.
 */
export abstract class Actor {
  id: string;
  name: string;
  transform: Transform;
  isActive: boolean = true;
  isVisible: boolean = true;
  renderOrder: number = 0; // Lower values render first

  private scene: IScene | null = null;

  constructor(id: string, name: string, initialPosition: Vector2 = { x: 0, y: 0 }) {
    this.id = id;
    this.name = name;
    this.transform = {
      position: { ...initialPosition },
      rotation: 0,
      scale: { x: 1, y: 1 }
    };
  }

  /**
   * Set the scene this actor belongs to
   */
  setScene(scene: IScene | null): void {
    this.scene = scene;
  }

  /**
   * Get the scene this actor belongs to
   */
  getScene(): IScene | null {
    return this.scene;
  }

  /**
   * Update the actor (called each frame)
   */
  update(deltaTime: number): void {
    // Base implementation does nothing
    // Override in subclasses for custom behavior
  }

  /**
   * Render the actor (called each frame)
   */
  abstract render(context: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }): void;

  /**
   * Set the actor's position
   */
  setPosition(x: number, y: number): void {
    this.transform.position.x = x;
    this.transform.position.y = y;
  }

  /**
   * Get the actor's position
   */
  getPosition(): Vector2 {
    return { ...this.transform.position };
  }

  /**
   * Move the actor by a delta amount
   */
  translate(dx: number, dy: number): void {
    this.transform.position.x += dx;
    this.transform.position.y += dy;
  }

  /**
   * Set the actor's rotation in radians
   */
  setRotation(rotation: number): void {
    this.transform.rotation = rotation;
  }

  /**
   * Get the actor's rotation in radians
   */
  getRotation(): number {
    return this.transform.rotation;
  }

  /**
   * Calculate distance to another actor
   */
  distanceTo(other: Actor): number {
    const dx = this.transform.position.x - other.transform.position.x;
    const dy = this.transform.position.y - other.transform.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate distance to a point
   */
  distanceToPoint(point: Vector2): number {
    const dx = this.transform.position.x - point.x;
    const dy = this.transform.position.y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Destroy the actor (remove from scene)
   */
  destroy(): void {
    if (this.scene) {
      this.scene.removeActor(this.id);
    }
  }
}