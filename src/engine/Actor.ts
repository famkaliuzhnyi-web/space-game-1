import { Vector2D } from '../types';

/**
 * Base Actor class following game engine pattern.
 * Actors are entities that can be updated and rendered in the game world.
 */
export abstract class Actor {
  public id: string;
  public position: Vector2D;
  public velocity: Vector2D;
  public rotation: number; // Rotation in radians
  public isActive: boolean;

  constructor(id: string, position: Vector2D) {
    this.id = id;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.isActive = true;
  }

  /**
   * Update the actor's state
   */
  abstract update(deltaTime: number): void;

  /**
   * Render the actor using 2D context
   */
  abstract render(context: CanvasRenderingContext2D): void;

  /**
   * Get the actor's world position
   */
  getPosition(): Vector2D {
    return { ...this.position };
  }

  /**
   * Set the actor's world position
   */
  setPosition(position: Vector2D): void {
    this.position = { ...position };
  }

  /**
   * Get the actor's velocity
   */
  getVelocity(): Vector2D {
    return { ...this.velocity };
  }

  /**
   * Set the actor's velocity
   */
  setVelocity(velocity: Vector2D): void {
    this.velocity = { ...velocity };
  }

  /**
   * Calculate distance to another actor or position
   */
  getDistanceTo(target: Vector2D): number {
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate angle to another position
   */
  getAngleTo(target: Vector2D): number {
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    return Math.atan2(dy, dx);
  }

  /**
   * Destroy the actor (cleanup)
   */
  destroy(): void {
    this.isActive = false;
  }
}