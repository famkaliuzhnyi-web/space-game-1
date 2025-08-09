import { Engine } from '../engine/Engine';
import { Vector2 } from '../engine/Actor';
import { ShipActor } from '../engine/entities/ShipActor';

/**
 * ShipMovementController provides high-level movement commands for ships.
 * Integrates the movement system with the game engine.
 */
export class ShipMovementController {
  private engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  /**
   * Move the player ship to a specific station
   */
  movePlayerShipToStation(stationId: string): boolean {
    try {
      const sceneManager = this.engine.getSceneManager();
      const movementSystem = this.engine.getMovementSystem();
      const worldManager = this.engine.getWorldManager();
      
      // Get player ship actor
      const shipActor = sceneManager.getPlayerShipActor();
      if (!shipActor) {
        console.error('Player ship actor not found');
        return false;
      }

      // Get target station
      const station = worldManager.getStationById(stationId);
      if (!station) {
        console.error('Station not found:', stationId);
        return false;
      }

      // Start movement
      const success = movementSystem.moveShipToStation(shipActor, stationId);
      
      if (success) {
        console.log(`Moving ${shipActor.name} to ${station.name}`);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to move player ship to station:', error);
      return false;
    }
  }

  /**
   * Move the player ship to specific coordinates
   */
  movePlayerShipToCoordinates(x: number, y: number): boolean {
    try {
      const sceneManager = this.engine.getSceneManager();
      const movementSystem = this.engine.getMovementSystem();
      
      // Get player ship actor
      const shipActor = sceneManager.getPlayerShipActor();
      if (!shipActor) {
        console.error('Player ship actor not found');
        return false;
      }

      // Start movement
      const success = movementSystem.moveShipToCoordinates(shipActor, x, y);
      
      if (success) {
        console.log(`Moving ${shipActor.name} to coordinates (${x}, ${y})`);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to move player ship to coordinates:', error);
      return false;
    }
  }

  /**
   * Stop player ship movement
   */
  stopPlayerShipMovement(): boolean {
    try {
      const sceneManager = this.engine.getSceneManager();
      
      // Get player ship actor
      const shipActor = sceneManager.getPlayerShipActor();
      if (!shipActor) {
        return false;
      }

      shipActor.stopMovement();
      console.log(`Stopped movement for ${shipActor.name}`);
      return true;
    } catch (error) {
      console.error('Failed to stop player ship movement:', error);
      return false;
    }
  }

  /**
   * Get player ship movement status
   */
  getPlayerShipMovementStatus(): {
    isMoving: boolean;
    progress: number;
    currentPosition: Vector2;
    name: string;
  } | null {
    try {
      const sceneManager = this.engine.getSceneManager();
      
      // Get player ship actor
      const shipActor = sceneManager.getPlayerShipActor();
      if (!shipActor) {
        return null;
      }

      return {
        isMoving: shipActor.isMoving(),
        progress: shipActor.getMovementProgress(),
        currentPosition: shipActor.getPosition(),
        name: shipActor.name
      };
    } catch (error) {
      console.error('Failed to get player ship movement status:', error);
      return null;
    }
  }

  /**
   * Navigate to a target using the enhanced movement system
   */
  enhancedNavigateToTarget(targetId: string): boolean {
    try {
      const worldManager = this.engine.getWorldManager();
      const targets = worldManager.getAvailableTargets();
      const target = targets.find(t => t.id === targetId);
      
      if (!target) {
        return false;
      }

      if (target.type === 'station') {
        return this.movePlayerShipToStation(targetId);
      } else if (target.type === 'system') {
        // For system navigation, move to the system's center
        const system = worldManager.getSystemById(targetId);
        if (system) {
          return this.movePlayerShipToCoordinates(system.position.x, system.position.y);
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to navigate to target:', error);
      return false;
    }
  }
}