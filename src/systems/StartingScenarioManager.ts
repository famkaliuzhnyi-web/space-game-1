/**
 * StartingScenarioManager
 * Manages the application of starting scenarios to initialize the game state
 */

import { StartingScenario } from '../types/startingScenarios';
import { Player, Ship, CargoItem, FactionReputation } from '../types/player';
import { CharacterManager } from './CharacterManager';
import { Character } from '../types/character';

export class StartingScenarioManager {
  private characterManager: CharacterManager;

  constructor(characterManager: CharacterManager) {
    this.characterManager = characterManager;
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
      }
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
}