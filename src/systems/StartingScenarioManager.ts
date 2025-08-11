/**
 * StartingScenarioManager
 * Manages the application of starting scenarios to initialize the game state
 */

import { StartingScenario } from '../types/startingScenarios';
import { Player, Ship, CargoItem, FactionReputation } from '../types/player';
import { CharacterManager } from './CharacterManager';
import { Character } from '../types/character';
import { HubShipConstructionSystem } from './HubShipConstructionSystem';
import { ShipHubDesign } from '../types/shipHubs';

export class StartingScenarioManager {
  private characterManager: CharacterManager;
  private hubConstructionSystem: HubShipConstructionSystem;

  constructor(characterManager: CharacterManager) {
    this.characterManager = characterManager;
    this.hubConstructionSystem = new HubShipConstructionSystem();
  }

  /**
   * Apply a starting scenario to create the initial game state
   */
  applyScenario(
    scenario: StartingScenario,
    characterName: string,
    appearance: any // CharacterAppearance type
  ): { character: Character; player: Player } {
    // Create character with scenario settings
    const character = this.createScenarioCharacter(scenario, characterName, appearance);
    
    // Create player with scenario settings
    const player = this.createScenarioPlayer(scenario, character.id);
    
    return { character, player };
  }

  /**
   * Create character based on scenario configuration
   */
  private createScenarioCharacter(
    scenario: StartingScenario,
    characterName: string,
    appearance: any
  ): Character {
    const backgroundId = scenario.characterSetup.backgroundId || 'merchant';
    
    // Apply scenario-specific appearance overrides
    const finalAppearance = {
      ...appearance,
      ...scenario.characterSetup.forcedAppearance
    };

    // Create character with background
    const character = this.characterManager.createCharacter(
      `char_${Date.now()}`,
      characterName,
      finalAppearance,
      backgroundId,
      scenario.characterSetup.attributeModifiers,
      scenario.characterSetup.skillModifiers
    );

    return character;
  }

  /**
   * Create player with scenario configuration
   */
  private createScenarioPlayer(scenario: StartingScenario, characterId: string): Player {
    const playerId = `player_${Date.now()}`;
    
    // Create starting ship
    const startingShip = this.createScenarioShip(scenario);
    
    // Create faction reputation map
    const reputation = new Map<string, FactionReputation>();
    Object.entries(scenario.factionStandings).forEach(([factionId, standing]) => {
      reputation.set(factionId, {
        faction: factionId,
        standing: standing,
        rank: this.getRepRank(standing),
        missions: 0,
        lastUpdated: Date.now()
      });
    });

    // Create player object
    const player: Player = {
      id: playerId,
      name: characterId, // Link to character
      credits: scenario.startingCredits,
      currentStationId: scenario.startingLocation,
      currentShipId: startingShip.id,
      ownedShips: new Map([[startingShip.id, startingShip]]),
      reputation: reputation,
      contracts: [],
      achievements: [],
      statistics: {
        totalTradeValue: 0,
        missionsCompleted: 0,
        distanceTraveled: 0,
        timeInGame: 0,
        profitEarned: 0,
        lossesIncurred: 0,
        stationsVisited: new Set([scenario.startingLocation]),
        commoditiesTraded: new Set(),
        contractsCompleted: 0,
        contractsFailed: 0
      },
      characterId: characterId
    };

    return player;
  }

  /**
   * Create ship based on scenario configuration
   */
  private createScenarioShip(scenario: StartingScenario): Ship {
    const shipId = `ship_${Date.now()}`;
    const shipSetup = scenario.startingShip;
    
    // Get base ship class data (simplified - real implementation would query ship data)
    const shipClassData = this.getShipClassData(shipSetup.shipClassId);
    
    // Create cargo hold with starting cargo
    const cargo = this.createStartingCargo(scenario, shipClassData.baseCargoCapacity);
    
    const ship: Ship = {
      id: shipId,
      name: shipSetup.shipName,
      class: shipClassData,
      cargo: cargo,
      equipment: {
        engines: shipSetup.equipment.engines.map(id => this.createEquipmentItem(id)),
        cargo: shipSetup.equipment.cargo.map(id => this.createEquipmentItem(id)),
        shields: shipSetup.equipment.shields.map(id => this.createEquipmentItem(id)),
        weapons: shipSetup.equipment.weapons.map(id => this.createEquipmentItem(id)),
        utility: shipSetup.equipment.utility.map(id => this.createEquipmentItem(id))
      },
      condition: {
        ...shipSetup.condition,
        lastMaintenance: Date.now() // Add current timestamp for maintenance
      },
      location: {
        systemId: this.getSystemIdFromStation(scenario.startingLocation),
        stationId: scenario.startingLocation,
        isInTransit: false
      },
      hubDesign: this.createDefaultHubDesign(shipClassData.category, shipSetup.shipName)
    };

    return ship;
  }

  /**
   * Create starting cargo based on scenario
   */
  private createStartingCargo(scenario: StartingScenario, maxCapacity: number): any {
    const cargo = new Map<string, CargoItem>();
    let usedCapacity = 0;

    if (scenario.startingCargo) {
      Object.entries(scenario.startingCargo).forEach(([commodityId, quantity]) => {
        if (usedCapacity + quantity <= maxCapacity) {
          cargo.set(commodityId, {
            commodityId: commodityId,
            quantity: quantity,
            averagePurchasePrice: 100, // Default price
            acquiredAt: Date.now()
          });
          usedCapacity += quantity;
        }
      });
    }

    return {
      capacity: maxCapacity,
      used: usedCapacity,
      items: cargo
    };
  }

  /**
   * Get reputation rank from standing value
   */
  private getRepRank(standing: number): string {
    if (standing >= 50) return 'Allied';
    if (standing >= 25) return 'Friendly';
    if (standing >= 10) return 'Positive';
    if (standing >= -10) return 'Neutral';
    if (standing >= -25) return 'Negative';
    if (standing >= -50) return 'Hostile';
    return 'Enemy';
  }

  /**
   * Get ship class data by ID (simplified implementation)
   */
  private getShipClassData(shipClassId: string): any {
    const shipClasses: Record<string, any> = {
      'courier-ship': {
        id: 'courier-ship',
        name: 'Courier Ship',
        category: 'courier',
        baseCargoCapacity: 50,
        baseFuelCapacity: 40,
        baseSpeed: 200,
        baseShields: 15,
        equipmentSlots: { engines: 1, cargo: 1, shields: 1, weapons: 1, utility: 1 }
      },
      'light-freighter': {
        id: 'light-freighter',
        name: 'Light Freighter',
        category: 'transport',
        baseCargoCapacity: 100,
        baseFuelCapacity: 50,
        baseSpeed: 120,
        baseShields: 25,
        equipmentSlots: { engines: 1, cargo: 2, shields: 1, weapons: 1, utility: 1 }
      },
      'heavy-freighter': {
        id: 'heavy-freighter',
        name: 'Heavy Freighter',
        category: 'heavy-freight',
        baseCargoCapacity: 250,
        baseFuelCapacity: 80,
        baseSpeed: 80,
        baseShields: 40,
        equipmentSlots: { engines: 2, cargo: 4, shields: 2, weapons: 2, utility: 2 }
      }
    };

    return shipClasses[shipClassId] || shipClasses['light-freighter'];
  }

  /**
   * Create equipment item by ID (simplified implementation)
   */
  private createEquipmentItem(equipmentId: string): any {
    const baseEquipment: Record<string, any> = {
      'standard-engine': { id: 'standard-engine', name: 'Standard Engine', type: 'engine', effects: { speed: 100 }, condition: 1.0 },
      'high-performance-engine': { id: 'high-performance-engine', name: 'High Performance Engine', type: 'engine', effects: { speed: 150 }, condition: 1.0 },
      'premium-engine': { id: 'premium-engine', name: 'Premium Engine', type: 'engine', effects: { speed: 180 }, condition: 1.0 },
      'efficient-engine': { id: 'efficient-engine', name: 'Efficient Engine', type: 'engine', effects: { speed: 110, fuelEfficiency: 0.8 }, condition: 1.0 },
      'damaged-engine': { id: 'damaged-engine', name: 'Damaged Engine', type: 'engine', effects: { speed: 70 }, condition: 0.5 },
      'basic-cargo-hold': { id: 'basic-cargo-hold', name: 'Basic Cargo Hold', type: 'cargo', effects: { cargoCapacity: 0 }, condition: 1.0 },
      'expanded-cargo-hold': { id: 'expanded-cargo-hold', name: 'Expanded Cargo Hold', type: 'cargo', effects: { cargoCapacity: 25 }, condition: 1.0 },
      'reinforced-cargo-hold': { id: 'reinforced-cargo-hold', name: 'Reinforced Cargo Hold', type: 'cargo', effects: { cargoCapacity: 20 }, condition: 1.0 },
      'secure-cargo-hold': { id: 'secure-cargo-hold', name: 'Secure Cargo Hold', type: 'cargo', effects: { cargoCapacity: 15 }, condition: 1.0 },
      'automated-cargo-system': { id: 'automated-cargo-system', name: 'Automated Cargo System', type: 'cargo', effects: { cargoCapacity: 30 }, condition: 1.0 },
      'salvage-processor': { id: 'salvage-processor', name: 'Salvage Processor', type: 'cargo', effects: { cargoCapacity: 10 }, condition: 1.0 },
      'cargo-scanner': { id: 'cargo-scanner', name: 'Cargo Scanner', type: 'cargo', effects: { scannerRange: 500 }, condition: 1.0 },
      'basic-shields': { id: 'basic-shields', name: 'Basic Shields', type: 'shield', effects: { shieldStrength: 100 }, condition: 1.0 },
      'light-shields': { id: 'light-shields', name: 'Light Shields', type: 'shield', effects: { shieldStrength: 50 }, condition: 1.0 },
      'premium-shields': { id: 'premium-shields', name: 'Premium Shields', type: 'shield', effects: { shieldStrength: 200 }, condition: 1.0 },
      'reinforced-shields': { id: 'reinforced-shields', name: 'Reinforced Shields', type: 'shield', effects: { shieldStrength: 150 }, condition: 1.0 },
      'light-laser': { id: 'light-laser', name: 'Light Laser', type: 'weapon', effects: { weaponDamage: 50 }, condition: 1.0 },
      'mining-laser': { id: 'mining-laser', name: 'Mining Laser', type: 'weapon', effects: { weaponDamage: 30 }, condition: 1.0 },
      'security-turret': { id: 'security-turret', name: 'Security Turret', type: 'weapon', effects: { weaponDamage: 80 }, condition: 1.0 },
      'salvaged-weapon': { id: 'salvaged-weapon', name: 'Salvaged Weapon', type: 'weapon', effects: { weaponDamage: 35 }, condition: 0.6 },
      'nav-computer': { id: 'nav-computer', name: 'Navigation Computer', type: 'utility', effects: { scannerRange: 1000 }, condition: 1.0 },
      'basic-nav-computer': { id: 'basic-nav-computer', name: 'Basic Nav Computer', type: 'utility', effects: { scannerRange: 500 }, condition: 1.0 },
      'advanced-nav-computer': { id: 'advanced-nav-computer', name: 'Advanced Nav Computer', type: 'utility', effects: { scannerRange: 2000 }, condition: 1.0 },
      'communication-array': { id: 'communication-array', name: 'Communication Array', type: 'utility', effects: { scannerRange: 800 }, condition: 1.0 },
      'deep-scanner': { id: 'deep-scanner', name: 'Deep Space Scanner', type: 'utility', effects: { scannerRange: 3000 }, condition: 1.0 },
      'tractor-beam': { id: 'tractor-beam', name: 'Tractor Beam', type: 'utility', effects: { cargoCapacity: 5 }, condition: 1.0 }
    };

    return baseEquipment[equipmentId] || baseEquipment['basic-cargo-hold'];
  }

  /**
   * Get system ID from station ID (simplified implementation)
   */
  private getSystemIdFromStation(stationId: string): string {
    const stationSystems: Record<string, string> = {
      'terra-prime-station': 'sol-system',
      'pilot-academy-station': 'academy-system',
      'frontier-outpost': 'frontier-system',
      'salvage-depot': 'outer-rim-system',
      'corporate-headquarters': 'core-system'
    };

    return stationSystems[stationId] || 'sol-system';
  }

  /**
   * Check if scenario application was successful
   */
  validateScenarioApplication(scenario: StartingScenario, character: Character, player: Player): boolean {
    // Basic validation checks
    if (!character || !player) return false;
    if (player.credits !== scenario.startingCredits) return false;
    if (player.currentStationId !== scenario.startingLocation) return false;
    if (player.characterId !== character.id) return false;
    
    return true;
  }

  /**
   * Create a default hub design for ships based on their category
   */
  private createDefaultHubDesign(category: string, shipName: string): ShipHubDesign {
    // Create a basic hub design appropriate for the ship category
    const design = this.hubConstructionSystem.createNewDesign(
      `${shipName} Design`,
      { width: 10, height: 6, depth: 8 } // Standard ship size
    );

    // Define default hub layouts based on ship category
    switch (category) {
      case 'courier':
        this.addCourierHubs(design);
        break;
      case 'transport':
        this.addTransportHubs(design);
        break;
      case 'heavy-freight':
        this.addFreightHubs(design);
        break;
      case 'combat':
        this.addCombatHubs(design);
        break;
      case 'explorer':
        this.addExplorerHubs(design);
        break;
      default:
        this.addBasicHubs(design);
        break;
    }

    return design;
  }

  /**
   * Add hub configuration for courier ships (fast, minimal cargo)
   */
  private addCourierHubs(design: ShipHubDesign): void {
    // Cockpit
    this.hubConstructionSystem.addHub(design, 'cockpit-hub', { x: 4, y: 2, z: 0 });
    // Small reactor
    this.hubConstructionSystem.addHub(design, 'fusion-reactor-small', { x: 1, y: 2, z: 0 });
    // Ion drive for efficiency
    this.hubConstructionSystem.addHub(design, 'ion-drive', { x: 0, y: 2, z: 0 });
    // Minimal cargo
    this.hubConstructionSystem.addHub(design, 'cargo-hold-standard', { x: 6, y: 2, z: 0 });
    // Life support
    this.hubConstructionSystem.addHub(design, 'life-support-basic', { x: 4, y: 1, z: 0 });
    // Sensors
    this.hubConstructionSystem.addHub(design, 'sensor-array-basic', { x: 4, y: 3, z: 0 });
  }

  /**
   * Add hub configuration for transport ships (balanced)
   */
  private addTransportHubs(design: ShipHubDesign): void {
    // Bridge for larger crew
    this.hubConstructionSystem.addHub(design, 'bridge-block', { x: 3, y: 2, z: 0 });
    // Medium reactor
    this.hubConstructionSystem.addHub(design, 'fusion-reactor-small', { x: 1, y: 2, z: 0 });
    // Chemical thruster for power
    this.hubConstructionSystem.addHub(design, 'chemical-thruster', { x: 0, y: 2, z: 0 });
    // Multiple cargo holds
    this.hubConstructionSystem.addHub(design, 'cargo-hold-standard', { x: 6, y: 1, z: 0 });
    this.hubConstructionSystem.addHub(design, 'cargo-hold-standard', { x: 6, y: 3, z: 0 });
    // Life support
    this.hubConstructionSystem.addHub(design, 'life-support-advanced', { x: 1, y: 0, z: 0 });
    // Basic shields
    this.hubConstructionSystem.addHub(design, 'shield-generator-light', { x: 3, y: 1, z: 0 });
  }

  /**
   * Add hub configuration for freight ships (maximum cargo)
   */
  private addFreightHubs(design: ShipHubDesign): void {
    // Bridge
    this.hubConstructionSystem.addHub(design, 'bridge-block', { x: 2, y: 2, z: 0 });
    // Large reactor
    this.hubConstructionSystem.addHub(design, 'fusion-reactor-large', { x: 0, y: 1, z: 0 });
    // Fusion drive for power
    this.hubConstructionSystem.addHub(design, 'fusion-drive', { x: 0, y: 4, z: 0 });
    // Maximum cargo
    this.hubConstructionSystem.addHub(design, 'bulk-storage', { x: 5, y: 1, z: 0 });
    this.hubConstructionSystem.addHub(design, 'cargo-hold-automated', { x: 5, y: 4, z: 0 });
    this.hubConstructionSystem.addHub(design, 'cargo-hold-standard', { x: 8, y: 2, z: 0 });
    // Life support
    this.hubConstructionSystem.addHub(design, 'life-support-advanced', { x: 2, y: 0, z: 0 });
  }

  /**
   * Add hub configuration for combat ships (heavy weapons/shields)
   */
  private addCombatHubs(design: ShipHubDesign): void {
    // Bridge with tactical systems
    this.hubConstructionSystem.addHub(design, 'bridge-block', { x: 3, y: 2, z: 0 });
    // Powerful reactor
    this.hubConstructionSystem.addHub(design, 'fusion-reactor-small', { x: 1, y: 2, z: 0 });
    // Fusion drive for maneuverability  
    this.hubConstructionSystem.addHub(design, 'fusion-drive', { x: 0, y: 1, z: 0 });
    // Heavy shields
    this.hubConstructionSystem.addHub(design, 'shield-generator-heavy', { x: 5, y: 2, z: 0 });
    // Armor
    this.hubConstructionSystem.addHub(design, 'armor-plating-heavy', { x: 3, y: 1, z: 0 });
    this.hubConstructionSystem.addHub(design, 'armor-plating-heavy', { x: 3, y: 3, z: 0 });
    // Minimal cargo
    this.hubConstructionSystem.addHub(design, 'cargo-hold-standard', { x: 7, y: 2, z: 0 });
    // Advanced life support
    this.hubConstructionSystem.addHub(design, 'life-support-advanced', { x: 1, y: 0, z: 0 });
    // RCS for maneuverability
    this.hubConstructionSystem.addHub(design, 'rcs-thrusters', { x: 2, y: 4, z: 0 });
    this.hubConstructionSystem.addHub(design, 'gyroscope', { x: 4, y: 4, z: 0 });
  }

  /**
   * Add hub configuration for explorer ships (sensors, range)
   */
  private addExplorerHubs(design: ShipHubDesign): void {
    // Command center for analysis
    this.hubConstructionSystem.addHub(design, 'command-center', { x: 2, y: 2, z: 0 });
    // Efficient reactor
    this.hubConstructionSystem.addHub(design, 'fusion-reactor-small', { x: 0, y: 2, z: 0 });
    // Ion drive for efficiency
    this.hubConstructionSystem.addHub(design, 'ion-drive', { x: 0, y: 0, z: 0 });
    // Advanced sensors
    this.hubConstructionSystem.addHub(design, 'sensor-array-advanced', { x: 5, y: 2, z: 0 });
    // Long range communication
    this.hubConstructionSystem.addHub(design, 'long-range-transmitter', { x: 2, y: 0, z: 0 });
    // Moderate cargo for supplies
    this.hubConstructionSystem.addHub(design, 'cargo-hold-standard', { x: 6, y: 2, z: 0 });
    this.hubConstructionSystem.addHub(design, 'specialized-container', { x: 8, y: 2, z: 0 });
    // Extended life support
    this.hubConstructionSystem.addHub(design, 'life-support-advanced', { x: 2, y: 4, z: 0 });
    this.hubConstructionSystem.addHub(design, 'crew-quarters', { x: 4, y: 4, z: 0 });
  }

  /**
   * Add basic hub configuration for unknown ship types
   */
  private addBasicHubs(design: ShipHubDesign): void {
    // Basic cockpit
    this.hubConstructionSystem.addHub(design, 'cockpit-hub', { x: 4, y: 2, z: 0 });
    // Small reactor
    this.hubConstructionSystem.addHub(design, 'fusion-reactor-small', { x: 1, y: 2, z: 0 });
    // Basic thruster
    this.hubConstructionSystem.addHub(design, 'chemical-thruster', { x: 0, y: 2, z: 0 });
    // Standard cargo
    this.hubConstructionSystem.addHub(design, 'cargo-hold-standard', { x: 6, y: 2, z: 0 });
    // Basic life support
    this.hubConstructionSystem.addHub(design, 'life-support-basic', { x: 4, y: 1, z: 0 });
  }
}