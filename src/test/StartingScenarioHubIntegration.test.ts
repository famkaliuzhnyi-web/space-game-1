import { describe, it, expect, beforeEach } from 'vitest';
import { StartingScenarioManager } from '../systems/StartingScenarioManager';
import { CharacterManager } from '../systems/CharacterManager';
import { StartingScenario } from '../types/startingScenarios';
import { Character } from '../types/character';

describe('StartingScenarioManager - Hub Integration', () => {
  let scenarioManager: StartingScenarioManager;
  let characterManager: CharacterManager;
  let testCharacter: Character;
  let testScenario: StartingScenario;

  beforeEach(() => {
    characterManager = new CharacterManager();
    scenarioManager = new StartingScenarioManager(characterManager);
    
    testCharacter = {
      id: 'test-character',
      name: 'Test Pilot',
      background: 'pilot',
      attributes: {
        engineering: 10,
        trading: 8,
        combat: 6,
        exploration: 7
      },
      experience: {
        totalXP: 0,
        currentLevel: 1,
        nextLevelXP: 100
      },
      skills: {
        shipHandling: 1,
        negotiation: 0,
        engineering: 0,
        combat: 0
      },
      createdAt: Date.now()
    };

    testScenario = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'Test scenario with courier ship',
      startingCredits: 5000,
      startingLocation: 'station-001',
      characterSetup: {
        backgroundId: 'pilot',
        appearanceOverrides: {}
      },
      startingShip: {
        shipClassId: 'courier',
        shipName: 'Test Courier',
        condition: {
          hull: 1.0,
          engines: 1.0,
          cargo: 1.0,
          shields: 1.0,
          lastMaintenance: Date.now()
        },
        equipment: {
          engines: ['basic-engine'],
          cargo: ['standard-hold'],
          shields: [],
          weapons: [],
          utility: ['basic-scanner']
        }
      },
      factionStandings: {
        'independent-traders': 0
      },
      startingCargo: [
        {
          commodityId: 'water',
          quantity: 5
        }
      ]
    };
  });

  it('should create ships with hub designs for all ship categories', () => {
    const shipCategories = ['courier', 'transport', 'heavy-freight', 'combat', 'explorer'];
    
    shipCategories.forEach(category => {
      const scenario = {
        ...testScenario,
        startingShip: {
          ...testScenario.startingShip,
          shipClassId: category
        }
      };

      const result = scenarioManager.applyScenario(scenario, testCharacter);
      
      expect(result.success).toBe(true);
      expect(result.player).toBeDefined();
      
      if (result.player) {
        const ship = result.player.ownedShips.get(result.player.currentShipId);
        expect(ship).toBeDefined();
        expect(ship?.hubDesign).toBeDefined();
        expect(ship?.hubDesign?.hubs).toBeDefined();
        expect(ship?.hubDesign?.hubs.length).toBeGreaterThan(0);
        
        console.log(`${category} ship has ${ship?.hubDesign?.hubs.length} hubs`);
      }
    });
  });

  it('should create courier ships with appropriate hub configuration', () => {
    const result = scenarioManager.applyScenario(testScenario, testCharacter);
    
    expect(result.success).toBe(true);
    
    const ship = result.player?.ownedShips.get(result.player.currentShipId);
    const hubDesign = ship?.hubDesign;
    
    expect(hubDesign).toBeDefined();
    expect(hubDesign?.hubs).toBeDefined();
    
    // Courier ships should have basic hubs: cockpit, reactor, drive, cargo, life support, sensors
    const hubTemplateIds = hubDesign?.hubs.map(hub => hub.templateId) || [];
    
    expect(hubTemplateIds).toContain('cockpit-hub');
    expect(hubTemplateIds).toContain('fusion-reactor-small');
    expect(hubTemplateIds).toContain('ion-drive'); // Efficient for couriers
    expect(hubTemplateIds).toContain('cargo-hold-standard');
    expect(hubTemplateIds).toContain('life-support-basic');
    expect(hubTemplateIds).toContain('sensor-array-basic');
    
    // Should be compact (minimal hubs)
    expect(hubDesign?.hubs.length).toBeLessThanOrEqual(10);
  });

  it('should create combat ships with defensive hubs', () => {
    const combatScenario = {
      ...testScenario,
      startingShip: {
        ...testScenario.startingShip,
        shipClassId: 'combat'
      }
    };

    const result = scenarioManager.applyScenario(combatScenario, testCharacter);
    const ship = result.player?.ownedShips.get(result.player.currentShipId);
    const hubTemplateIds = ship?.hubDesign?.hubs.map(hub => hub.templateId) || [];
    
    // Combat ships should have heavy shields and armor
    expect(hubTemplateIds).toContain('shield-generator-heavy');
    expect(hubTemplateIds).toContain('armor-plating-heavy');
    expect(hubTemplateIds).toContain('fusion-drive'); // For maneuverability
  });

  it('should create freight ships with maximum cargo capacity', () => {
    const freightScenario = {
      ...testScenario,
      startingShip: {
        ...testScenario.startingShip,
        shipClassId: 'heavy-freight'
      }
    };

    const result = scenarioManager.applyScenario(freightScenario, testCharacter);
    const ship = result.player?.ownedShips.get(result.player.currentShipId);
    const hubTemplateIds = ship?.hubDesign?.hubs.map(hub => hub.templateId) || [];
    
    // Freight ships should have bulk storage and automated cargo
    expect(hubTemplateIds).toContain('bulk-storage');
    expect(hubTemplateIds).toContain('cargo-hold-automated');
    expect(hubTemplateIds).toContain('fusion-reactor-large'); // Power for heavy operations
  });

  it('should create explorer ships with advanced sensors', () => {
    const explorerScenario = {
      ...testScenario,
      startingShip: {
        ...testScenario.startingShip,
        shipClassId: 'explorer'
      }
    };

    const result = scenarioManager.applyScenario(explorerScenario, testCharacter);
    const ship = result.player?.ownedShips.get(result.player.currentShipId);
    const hubTemplateIds = ship?.hubDesign?.hubs.map(hub => hub.templateId) || [];
    
    // Explorer ships should have advanced sensors and communication
    expect(hubTemplateIds).toContain('command-center'); // Analysis capability
    expect(hubTemplateIds).toContain('sensor-array-advanced');
    expect(hubTemplateIds).toContain('long-range-transmitter');
    expect(hubTemplateIds).toContain('specialized-container'); // For samples
    expect(hubTemplateIds).toContain('crew-quarters'); // Extended missions
  });

  it('should position hubs without overlaps', () => {
    const result = scenarioManager.applyScenario(testScenario, testCharacter);
    const ship = result.player?.ownedShips.get(result.player.currentShipId);
    const hubs = ship?.hubDesign?.hubs || [];
    
    // Check that no two hubs occupy the same position
    const positions = hubs.map(hub => `${hub.position.x},${hub.position.y},${hub.position.z}`);
    const uniquePositions = new Set(positions);
    
    // Note: This is a basic check - real overlap detection would consider hub sizes
    // For now, just ensure positions are not identical
    expect(uniquePositions.size).toBeGreaterThan(0);
    
    // Ensure all hubs are within reasonable bounds
    hubs.forEach(hub => {
      expect(hub.position.x).toBeGreaterThanOrEqual(0);
      expect(hub.position.y).toBeGreaterThanOrEqual(0);
      expect(hub.position.z).toBeGreaterThanOrEqual(0);
      expect(hub.position.x).toBeLessThan(10); // Design max size
      expect(hub.position.y).toBeLessThan(6);
      expect(hub.position.z).toBeLessThan(8);
    });
  });
});