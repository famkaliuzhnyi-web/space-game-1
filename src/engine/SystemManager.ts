import { InputManager, TimeManager, SaveManager, EconomicSystem, ContractManager, RouteAnalyzer, PlayerManager } from '../systems';
import { MaintenanceManager } from '../systems/MaintenanceManager';
import { CharacterManager } from '../systems/CharacterManager';
import { WorldManager } from '../systems/WorldManager';

/**
 * System manager for dependency injection and system lifecycle management.
 * Centralizes system creation, initialization, and provides clean access patterns.
 * Makes the engine more testable and maintainable.
 */
export class SystemManager {
  private inputManager: InputManager;
  private worldManager: WorldManager;
  private timeManager: TimeManager;
  private saveManager: SaveManager;
  private economicSystem: EconomicSystem;
  private contractManager: ContractManager;
  private routeAnalyzer: RouteAnalyzer;
  private playerManager: PlayerManager;
  private characterManager: CharacterManager;
  private maintenanceManager: MaintenanceManager;

  constructor(canvas: HTMLCanvasElement) {
    // Initialize all systems
    this.inputManager = new InputManager(canvas);
    this.worldManager = new WorldManager();
    this.timeManager = new TimeManager();
    this.saveManager = new SaveManager();
    this.economicSystem = new EconomicSystem();
    this.contractManager = new ContractManager();
    this.routeAnalyzer = new RouteAnalyzer();
    this.playerManager = new PlayerManager();
    this.characterManager = new CharacterManager();
    this.maintenanceManager = new MaintenanceManager(this.timeManager);
    
    // Initialize economics for existing stations
    this.initializeEconomics();
  }

  /**
   * Update all systems that need regular updates
   */
  updateSystems(deltaTime: number): void {
    // Update time system
    this.timeManager.update(deltaTime);
    
    // Update economic system
    this.economicSystem.update(deltaTime * 1000); // Convert to milliseconds for economic system
    
    // Update contract system
    this.contractManager.update(deltaTime * 1000);
  }

  /**
   * Start all systems that need to be started
   */
  startSystems(): void {
    this.timeManager.start();
  }

  /**
   * Stop all systems that need to be stopped
   */
  stopSystems(): void {
    this.timeManager.pause();
  }

  /**
   * Dispose all systems that need cleanup
   */
  dispose(): void {
    this.inputManager.dispose();
  }

  // System getters for clean access
  getInputManager(): InputManager {
    return this.inputManager;
  }

  getWorldManager(): WorldManager {
    return this.worldManager;
  }

  getEconomicSystem(): EconomicSystem {
    return this.economicSystem;
  }

  getTimeManager(): TimeManager {
    return this.timeManager;
  }

  getSaveManager(): SaveManager {
    return this.saveManager;
  }

  getContractManager(): ContractManager {
    return this.contractManager;
  }

  getRouteAnalyzer(): RouteAnalyzer {
    return this.routeAnalyzer;
  }

  getPlayerManager(): PlayerManager {
    return this.playerManager;
  }

  getCharacterManager(): CharacterManager {
    return this.characterManager;
  }

  getMaintenanceManager(): MaintenanceManager {
    return this.maintenanceManager;
  }

  /**
   * Initialize economics for all existing stations
   */
  private initializeEconomics(): void {
    const allStations = this.worldManager.getAllStations();
    for (const station of allStations) {
      // Find the system this station belongs to
      const system = this.findSystemForStation(station.id);
      this.economicSystem.initializeStationEconomics(station, system);
    }
  }

  /**
   * Find system containing a specific station
   */
  private findSystemForStation(stationId: string): {securityLevel: number} | undefined {
    const galaxy = this.worldManager.getGalaxy();
    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        if (system.stations.some(station => station.id === stationId)) {
          return { securityLevel: system.securityLevel };
        }
      }
    }
    return undefined;
  }
}