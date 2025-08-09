import { Scene } from '../engine/Scene';
import { ShipActor } from '../engine/entities/ShipActor';
import { WorldManager } from './WorldManager';
import { PlayerManager } from './PlayerManager';

/**
 * SceneManager handles scene creation and management.
 * Creates scenes based on current game state and manages actors.
 */
export class SceneManager {
  private worldManager: WorldManager;
  private playerManager: PlayerManager;
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;

  constructor(worldManager: WorldManager, playerManager: PlayerManager) {
    this.worldManager = worldManager;
    this.playerManager = playerManager;
  }

  /**
   * Create or get a scene for the current system
   */
  getCurrentSystemScene(): Scene {
    const currentSystem = this.worldManager.getCurrentSystem();
    if (!currentSystem) {
      throw new Error('No current system available');
    }

    const sceneId = `system-${currentSystem.id}`;
    
    let scene = this.scenes.get(sceneId);
    if (!scene) {
      scene = new Scene(sceneId, `${currentSystem.name} System`);
      this.scenes.set(sceneId, scene);
    }

    this.currentScene = scene;
    return scene;
  }

  /**
   * Create player ship actor in the current scene
   */
  createPlayerShipActor(): ShipActor | null {
    try {
      const playerWithShip = this.playerManager.getPlayerWithCurrentShip();
      const ship = playerWithShip.ship;
      
      // Create ship actor
      const shipActor = new ShipActor(ship);
      
      // Set initial position based on current station or coordinates
      if (ship.location.stationId) {
        const station = this.worldManager.getStationById(ship.location.stationId);
        if (station) {
          // Position ship slightly offset from station for visibility when docked
          const offsetX = 20; // Offset to make ship visible next to station
          const offsetY = 10;
          shipActor.setPosition(station.position.x + offsetX, station.position.y + offsetY);
          console.log(`Ship positioned near station ${station.name} at (${station.position.x + offsetX}, ${station.position.y + offsetY})`);
        }
      } else if (ship.location.coordinates) {
        shipActor.setPosition(ship.location.coordinates.x, ship.location.coordinates.y);
        console.log(`Ship positioned at coordinates (${ship.location.coordinates.x}, ${ship.location.coordinates.y})`);
      }

      // Add to current scene
      const scene = this.getCurrentSystemScene();
      scene.addActor(shipActor);
      console.log(`Ship actor added to scene. Scene now has ${scene.getAllActors().length} actors`);

      return shipActor;
    } catch (error) {
      console.error('Failed to create player ship actor:', error);
      return null;
    }
  }

  /**
   * Get current scene
   */
  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  /**
   * Update all scenes
   */
  update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  /**
   * Switch to a different system scene
   */
  switchToSystemScene(systemId: string): Scene | null {
    const system = this.worldManager.getSystemById(systemId);
    if (!system) return null;

    const sceneId = `system-${systemId}`;
    let scene = this.scenes.get(sceneId);
    
    if (!scene) {
      scene = new Scene(sceneId, `${system.name} System`);
      this.scenes.set(sceneId, scene);
    }

    this.currentScene = scene;
    return scene;
  }

  /**
   * Get all scenes
   */
  getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Get player ship actor from current scene
   */
  getPlayerShipActor(): ShipActor | null {
    if (!this.currentScene) return null;

    const playerWithShip = this.playerManager.getPlayerWithCurrentShip();
    const shipActor = this.currentScene.getActor(playerWithShip.ship.id);
    
    return shipActor instanceof ShipActor ? shipActor : null;
  }
}