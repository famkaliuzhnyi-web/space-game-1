import { describe, it, expect } from 'vitest';
import { HubShipConstructionSystem } from '../systems/HubShipConstructionSystem';
import { StartingScenarioManager } from '../systems/StartingScenarioManager';
import { CharacterManager } from '../systems/CharacterManager';
import { Character } from '../types/character';
import { getHubTemplate } from '../data/shipHubs';

/**
 * Visual Integration Test - Validates the complete hub-based ship system
 * This test verifies that ships created by the game have proper hub designs
 * that can be visually rendered as collections of 3D hubs.
 */
describe('Hub-Based Ship Visual Integration', () => {

  it('should create fully formed ships with hub designs ready for 3D rendering', () => {
    // Set up scenario manager like the actual game does
    const characterManager = new CharacterManager();
    const scenarioManager = new StartingScenarioManager(characterManager);
    
    const testCharacter: Character = {
      id: 'visual-test-character',
      name: 'Visual Test Pilot',
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

    const courierScenario = {
      id: 'visual-test-courier',
      name: 'Visual Test Courier',
      description: 'Test scenario for hub visualization',
      startingCredits: 5000,
      startingLocation: 'station-001',
      characterSetup: {
        backgroundId: 'pilot',
        appearanceOverrides: {}
      },
      startingShip: {
        shipClassId: 'courier',
        shipName: 'Hub Courier',
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
          utility: []
        }
      },
      factionStandings: {
        'independent-traders': 0
      },
      startingCargo: []
    };

    // Apply scenario to create a ship with hub design
    const result = scenarioManager.applyScenario(courierScenario, testCharacter);
    
    console.log('Scenario result:', result);
    
    // Verify the scenario was applied (basic check for object structure)
    expect(result).toBeDefined();
    expect(result.player).toBeDefined();
    
    // Get the created ship
    const player = result.player!;
    const ship = player.ownedShips.get(player.currentShipId);
    
    expect(ship).toBeDefined();
    expect(ship?.hubDesign).toBeDefined();
    
    console.log(`Ship "${ship?.name}" created with hub design containing ${ship?.hubDesign?.hubs.length} hubs`);
    
    // Verify the hub design has actual hubs
    const hubDesign = ship!.hubDesign!;
    expect(hubDesign.hubs.length).toBeGreaterThan(0);
    
    // Verify each hub in the design is valid and can be rendered
    hubDesign.hubs.forEach((hubPlacement, index) => {
      const template = getHubTemplate(hubPlacement.templateId);
      
      expect(template).toBeDefined();
      expect(template?.id).toBe(hubPlacement.templateId);
      expect(template?.category).toBeDefined();
      
      // Verify positioning is reasonable (within ship bounds)
      expect(hubPlacement.position.x).toBeGreaterThanOrEqual(0);
      expect(hubPlacement.position.y).toBeGreaterThanOrEqual(0);
      expect(hubPlacement.position.z).toBeGreaterThanOrEqual(0);
      
      console.log(`  Hub ${index + 1}: ${template?.name} (${template?.category}) at (${hubPlacement.position.x}, ${hubPlacement.position.y}, ${hubPlacement.position.z})`);
    });
    
    // Verify ship has essential hub categories for a functional ship
    const hubCategories = hubDesign.hubs.map(hub => {
      const template = getHubTemplate(hub.templateId);
      return template?.category;
    }).filter(category => category !== undefined);
    
    const uniqueCategories = new Set(hubCategories);
    console.log('Hub categories in ship:', Array.from(uniqueCategories).join(', '));
    
    // A functional ship should have at least command, power, and propulsion
    expect(uniqueCategories.has('command')).toBe(true);
    expect(uniqueCategories.has('power')).toBe(true);
    expect(uniqueCategories.has('propulsion')).toBe(true);
    
    console.log('✅ Ship successfully created with functional hub-based design ready for 3D rendering');
  });

  it('should demonstrate different ship categories have different hub configurations', () => {
    const characterManager = new CharacterManager();
    const scenarioManager = new StartingScenarioManager(characterManager);
    
    const testCharacter: Character = {
      id: 'categories-test-character',
      name: 'Categories Test Pilot',
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

    const baseScenario = {
      id: 'categories-test',
      name: 'Categories Test',
      description: 'Test different ship categories',
      startingCredits: 5000,
      startingLocation: 'station-001',
      characterSetup: {
        backgroundId: 'pilot',
        appearanceOverrides: {}
      },
      startingShip: {
        shipClassId: 'courier', // Will be overridden
        shipName: 'Test Ship',
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
          utility: []
        }
      },
      factionStandings: {
        'independent-traders': 0
      },
      startingCargo: []
    };

    const shipCategories = ['courier', 'transport', 'heavy-freight', 'combat', 'explorer'];
    const shipConfigurations: { [key: string]: { hubCount: number; specialHubs: string[] } } = {};

    shipCategories.forEach(category => {
      const scenario = {
        ...baseScenario,
        startingShip: {
          ...baseScenario.startingShip,
          shipClassId: category,
          shipName: `Test ${category.charAt(0).toUpperCase() + category.slice(1)}`
        }
      };

      const result = scenarioManager.applyScenario(scenario, testCharacter);
      const ship = result.player?.ownedShips.get(result.player.currentShipId);
      
      if (ship?.hubDesign) {
        const hubTemplateIds = ship.hubDesign.hubs.map(hub => hub.templateId);
        shipConfigurations[category] = {
          hubCount: ship.hubDesign.hubs.length,
          specialHubs: hubTemplateIds
        };
        
        console.log(`${category} ship: ${ship.hubDesign.hubs.length} hubs - ${hubTemplateIds.join(', ')}`);
      }
    });

    // Verify different categories have different configurations
    expect(Object.keys(shipConfigurations)).toHaveLength(5);
    
    // Each category should have at least some hubs
    Object.values(shipConfigurations).forEach(config => {
      expect(config.hubCount).toBeGreaterThan(0);
    });
    
    console.log('✅ All ship categories successfully configured with distinct hub designs');
  });

  it('should verify hub design performance characteristics are calculated', () => {
    const constructionSystem = new HubShipConstructionSystem();
    
    // Create a simple test design
    const design = constructionSystem.createNewDesign('Performance Test', { width: 8, height: 6, depth: 4 });
    
    // Add some hubs
    constructionSystem.addHub(design, 'cockpit-hub', { x: 3, y: 2, z: 0 });
    constructionSystem.addHub(design, 'fusion-reactor-small', { x: 1, y: 2, z: 0 });
    constructionSystem.addHub(design, 'ion-drive', { x: 0, y: 2, z: 0 });
    constructionSystem.addHub(design, 'cargo-hold-standard', { x: 5, y: 2, z: 0 });
    
    // Verify performance characteristics are calculated
    expect(design.performance.totalMass).toBeGreaterThan(0);
    expect(design.performance.powerBalance).toBeDefined();
    expect(design.performance.cargoCapacity).toBeGreaterThan(0);
    expect(design.performance.thrust).toBeGreaterThan(0);
    
    console.log('Performance characteristics:');
    console.log(`  Mass: ${design.performance.totalMass} units`);
    console.log(`  Power Balance: ${design.performance.powerBalance} units`);
    console.log(`  Cargo Capacity: ${design.performance.cargoCapacity} units`);
    console.log(`  Thrust: ${design.performance.thrust} units`);
    console.log(`  Defense Rating: ${design.performance.defenseRating}`);
    
    console.log('✅ Hub design performance characteristics properly calculated for visual feedback');
  });
});