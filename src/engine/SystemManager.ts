import { InputManager, TimeManager, SaveManager, EconomicSystem, ContractManager, RouteAnalyzer, PlayerManager, EventManager, NPCAIManager, SecurityManager } from '../systems';
import { MaintenanceManager } from '../systems/MaintenanceManager';
import { CharacterManager } from '../systems/CharacterManager';
import { CharacterProgressionSystem } from '../systems/CharacterProgressionSystem';
import { SkillSpecializationManager } from '../systems/SkillSpecializationManager';
import { AchievementManager } from '../systems/AchievementManager';
import { WorldManager } from '../systems/WorldManager';
import { HackingManager } from '../systems/HackingManager';
import { CombatManager } from '../systems/CombatManager';
import { InvestmentManager } from '../systems/InvestmentManager';
import { TutorialManager } from '../systems/TutorialManager';
import { QuestManager } from '../systems/QuestManager';
import { NavigationManager } from '../systems/NavigationManager';

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
  private characterProgressionSystem: CharacterProgressionSystem;
  private skillSpecializationManager: SkillSpecializationManager;
  private achievementManager: AchievementManager;
  private maintenanceManager: MaintenanceManager;
  private eventManager: EventManager;
  private npcAIManager: NPCAIManager;
  private securityManager: SecurityManager;
  private hackingManager: HackingManager;
  private combatManager: CombatManager;
  private investmentManager: InvestmentManager;
  private tutorialManager: TutorialManager;
  private questManager: QuestManager;
  private navigationManager: NavigationManager;

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
    this.characterProgressionSystem = new CharacterProgressionSystem(this.characterManager);
    this.skillSpecializationManager = new SkillSpecializationManager();
    this.achievementManager = new AchievementManager();
    this.maintenanceManager = new MaintenanceManager(this.timeManager);
    
    // Initialize event manager with required dependencies
    this.eventManager = new EventManager(
      this.timeManager,
      this.worldManager,
      this.playerManager,
      this.playerManager.getFactionManager()
    );
    
    // Initialize NPC AI manager with required dependencies
    this.npcAIManager = new NPCAIManager(
      this.timeManager,
      this.worldManager,
      this.playerManager
    );
    
    // Initialize security manager with required dependencies
    this.securityManager = new SecurityManager(
      this.timeManager,
      this.worldManager,
      this.playerManager,
      this.playerManager.getFactionManager(),
      this.npcAIManager
    );
    
    // Initialize hacking manager with required dependencies
    this.hackingManager = new HackingManager(
      this.timeManager,
      this.worldManager,
      this.playerManager,
      this.playerManager.getFactionManager(),
      this.securityManager,
      this.characterManager
    );
    
    // Initialize combat manager with required dependencies
    this.combatManager = new CombatManager(
      this.timeManager,
      this.worldManager,
      this.playerManager,
      this.playerManager.getFactionManager(),
      this.securityManager,
      this.npcAIManager,
      this.eventManager
    );
    
    // Initialize investment manager with required dependencies
    this.investmentManager = new InvestmentManager(
      this.timeManager,
      this.worldManager,
      this.playerManager,
      this.playerManager.getFactionManager(),
      this.economicSystem
    );
    
    // Initialize tutorial manager with required dependencies
    this.tutorialManager = new TutorialManager(
      this.playerManager,
      this.characterManager
    );
    
    // Initialize quest manager with required dependencies
    this.questManager = new QuestManager(
      this.playerManager.getFactionManager(),
      this.characterManager,
      this.playerManager,
      this.timeManager,
      this.eventManager
    );
    
    // Initialize navigation manager with required dependencies
    this.navigationManager = new NavigationManager(this.timeManager);
    
    // Link systems that need to communicate
    this.playerManager.setProgressionSystem(this.characterProgressionSystem);
    this.playerManager.setNavigationManager(this.navigationManager);
    this.playerManager.setWorldManager(this.worldManager);
    this.contractManager.setProgressionSystem(this.characterProgressionSystem);
    this.maintenanceManager.setProgressionSystem(this.characterProgressionSystem);
    
    // Link achievement manager to progression system for achievement unlocks
    if ('setAchievementManager' in this.characterProgressionSystem) {
      (this.characterProgressionSystem as any).setAchievementManager(this.achievementManager);
    }
    
    // Get faction manager from player manager and link it
    const factionManager = this.playerManager.getFactionManager();
    if (factionManager && 'setProgressionSystem' in factionManager) {
      (factionManager as any).setProgressionSystem(this.characterProgressionSystem);
    }
    
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
    
    // Update event system
    this.eventManager.update(deltaTime);
    
    // Update NPC AI system
    this.npcAIManager.update(deltaTime);
    
    // Update security system
    this.securityManager.update();
    
    // Update hacking system
    this.hackingManager.update();
    
    // Update combat system
    this.combatManager.update();
    
    // Update investment system
    this.investmentManager.updateInvestments();
    
    // Update quest system
    this.questManager.update(deltaTime);
    
    // Update navigation system
    this.navigationManager.update();
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

  getCharacterProgressionSystem(): CharacterProgressionSystem {
    return this.characterProgressionSystem;
  }

  getSkillSpecializationManager(): SkillSpecializationManager {
    return this.skillSpecializationManager;
  }

  getMaintenanceManager(): MaintenanceManager {
    return this.maintenanceManager;
  }

  getAchievementManager(): AchievementManager {
    return this.achievementManager;
  }

  getEventManager(): EventManager {
    return this.eventManager;
  }

  getNPCAIManager(): NPCAIManager {
    return this.npcAIManager;
  }

  getSecurityManager(): SecurityManager {
    return this.securityManager;
  }

  getHackingManager(): HackingManager {
    return this.hackingManager;
  }

  getCombatManager(): CombatManager {
    return this.combatManager;
  }

  getInvestmentManager(): InvestmentManager {
    return this.investmentManager;
  }

  getTutorialManager(): TutorialManager {
    return this.tutorialManager;
  }

  getQuestManager(): QuestManager {
    return this.questManager;
  }

  getNavigationManager(): NavigationManager {
    return this.navigationManager;
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