import { Vector2D, Vector3D } from '../types';
import { to3D, to2D, getLayerForObjectType } from '../utils/coordinates';

/**
 * Base Actor class following game engine pattern.
 * Actors are entities that can be updated and rendered in the game world.
 * Now uses unified 3D coordinate system with proper layering.
 */
export abstract class Actor {
  public id: string;
  public position: Vector3D;
  public velocity: Vector2D; // Velocity remains 2D (XY plane movement)
  public rotation: number; // Rotation in radians
  public isActive: boolean;

  constructor(id: string, position: Vector2D | Vector3D, objectType?: string) {
    this.id = id;
    // Convert position to 3D if needed, using object type for layer assignment
    if ('z' in position) {
      this.position = { ...position };
    } else {
      // Convert 2D to 3D using object type or default layer
      const layer = objectType ? getLayerForObjectType(objectType) : 30; // Default to station layer
      this.position = to3D(position, layer);
    }
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
   * Get the actor's world position (3D)
   */
  getPosition(): Vector3D {
    return { ...this.position };
  }

  /**
   * Get the actor's 2D position (XY plane only)
   */
  getPosition2D(): Vector2D {
    return to2D(this.position);
  }

  /**
   * Set the actor's world position
   */
  setPosition(position: Vector2D | Vector3D): void {
    if ('z' in position) {
      this.position = { ...position };
    } else {
      // Preserve current Z layer when setting 2D position
      this.position = { ...position, z: this.position.z };
    }
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
   * Calculate distance to another actor or position (2D distance - ignores Z layer)
   */
  getDistanceTo(target: Vector2D | Vector3D): number {
    const targetPos = 'z' in target ? to2D(target) : target;
    const currentPos = to2D(this.position);
    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate angle to another position
   */
  getAngleTo(target: Vector2D | Vector3D): number {
    const targetPos = 'z' in target ? to2D(target) : target;
    const currentPos = to2D(this.position);
    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    return Math.atan2(dy, dx);
  }

  /**
   * Destroy the actor (cleanup)
   */
  destroy(): void {
    this.isActive = false;
  }
}