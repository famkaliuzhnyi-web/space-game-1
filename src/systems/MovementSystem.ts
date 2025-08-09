import { Vector2 } from '../engine/Actor';
import { ShipActor } from '../engine/entities/ShipActor';
import { WorldManager } from './WorldManager';
import { TimeManager } from './TimeManager';

/**
 * Movement command for ships
 */
export interface MovementCommand {
  shipId: string;
  targetPosition: Vector2;
  targetStationId?: string; // If moving to dock at a station
  estimatedTime?: number; // In seconds
}

/**
 * MovementSystem handles all ship movement logic in the game.
 * Integrates with existing systems while providing smooth movement.
 */
export class MovementSystem {
  private worldManager: WorldManager;
  private timeManager: TimeManager;
  private activeMovements: Map<string, MovementCommand> = new Map();

  constructor(worldManager: WorldManager, timeManager: TimeManager) {
    this.worldManager = worldManager;
    this.timeManager = timeManager;
  }

  /**
   * Move a ship to a target position
   */
  moveShipTo(shipActor: ShipActor, targetPosition: Vector2, targetStationId?: string): boolean {
    const distance = shipActor.distanceToPoint(targetPosition);
    const baseSpeed = shipActor.getSpeed();
    
    // Calculate movement time based on ship speed and distance
    const estimatedTime = distance / baseSpeed;

    const command: MovementCommand = {
      shipId: shipActor.id,
      targetPosition,
      targetStationId,
      estimatedTime
    };

    // Store the movement command
    this.activeMovements.set(shipActor.id, command);

    // Start the actor's movement
    shipActor.moveTo(targetPosition, estimatedTime);

    return true;
  }

  /**
   * Move ship to a specific station
   */
  moveShipToStation(shipActor: ShipActor, stationId: string): boolean {
    const station = this.worldManager.getStationById(stationId);
    if (!station) return false;

    return this.moveShipTo(shipActor, station.position, stationId);
  }

  /**
   * Move ship to coordinates in space
   */
  moveShipToCoordinates(shipActor: ShipActor, x: number, y: number): boolean {
    return this.moveShipTo(shipActor, { x, y });
  }

  /**
   * Stop ship movement
   */
  stopShipMovement(shipId: string): boolean {
    const command = this.activeMovements.get(shipId);
    if (!command) return false;

    this.activeMovements.delete(shipId);
    return true;
  }

  /**
   * Get movement status for a ship
   */
  getMovementStatus(shipId: string): MovementCommand | undefined {
    return this.activeMovements.get(shipId);
  }

  /**
   * Check if a ship is currently moving
   */
  isShipMoving(shipId: string): boolean {
    return this.activeMovements.has(shipId);
  }

  /**
   * Update movement system
   */
  update(deltaTime: number): void {
    // Clean up completed movements
    const completedMovements: string[] = [];

    for (const [shipId, command] of this.activeMovements) {
      // Check if movement is complete (this could be improved by checking the ship actor directly)
      // For now, we'll let the ship actors handle their own movement completion
    }

    // Remove completed movements
    for (const shipId of completedMovements) {
      this.activeMovements.delete(shipId);
    }
  }

  /**
   * Get all active movements
   */
  getActiveMovements(): MovementCommand[] {
    return Array.from(this.activeMovements.values());
  }

  /**
   * Cancel all movements
   */
  cancelAllMovements(): void {
    this.activeMovements.clear();
  }

  /**
   * Calculate travel time between two points
   */
  calculateTravelTime(from: Vector2, to: Vector2, shipSpeed: number = 100): number {
    const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    return distance / shipSpeed;
  }

  /**
   * Get estimated arrival time for a movement
   */
  getEstimatedArrival(shipId: string): number | null {
    const command = this.activeMovements.get(shipId);
    if (!command || !command.estimatedTime) return null;

    return this.timeManager.getCurrentTime() + command.estimatedTime * 1000; // Convert to milliseconds
  }
}