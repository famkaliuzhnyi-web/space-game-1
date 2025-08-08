import { describe, test, expect, beforeEach } from 'vitest';
import { ShipConstructionSystem, ShipConstructionConfig } from '../systems/ShipConstructionSystem';

describe('ShipConstructionSystem', () => {
  let constructionSystem: ShipConstructionSystem;

  beforeEach(() => {
    constructionSystem = new ShipConstructionSystem();
  });

  describe('Ship Class Availability', () => {
    test('should return available ship classes for trade stations', () => {
      const shipClasses = constructionSystem.getAvailableShipClasses('trade', 1);
      expect(shipClasses.length).toBeGreaterThan(0);
      
      // Trade stations shouldn't have combat ships
      const combatShips = shipClasses.filter(ship => ship.category === 'combat');
      expect(combatShips.length).toBe(0);
    });

    test('should return all ship classes for military stations', () => {
      const tradeShips = constructionSystem.getAvailableShipClasses('trade', 1);
      const militaryShips = constructionSystem.getAvailableShipClasses('military', 1);
      
      expect(militaryShips.length).toBeGreaterThanOrEqual(tradeShips.length);
    });

    test('should return industrial ships for industrial stations', () => {
      const shipClasses = constructionSystem.getAvailableShipClasses('industrial', 1);
      expect(shipClasses.length).toBeGreaterThan(0);
      
      const validCategories = shipClasses.every(ship => 
        ship.category === 'transport' || ship.category === 'heavy-freight'
      );
      expect(validCategories).toBe(true);
    });
  });

  describe('Equipment Compatibility', () => {
    test('should return compatible equipment for ship slots', () => {
      const equipment = constructionSystem.getCompatibleEquipment(
        'light-freighter', 
        'engines', 
        'trade', 
        1
      );
      
      expect(equipment.length).toBeGreaterThan(0);
      equipment.forEach(eq => {
        expect(eq.category).toBe('engines');
      });
    });

    test('should return cargo equipment for cargo slots', () => {
      const equipment = constructionSystem.getCompatibleEquipment(
        'light-freighter', 
        'cargo', 
        'trade', 
        1
      );
      
      equipment.forEach(eq => {
        expect(eq.category).toBe('cargo');
      });
    });

    test('should return empty array for invalid ship class', () => {
      const equipment = constructionSystem.getCompatibleEquipment(
        'invalid-ship', 
        'engines', 
        'trade', 
        1
      );
      
      expect(equipment).toEqual([]);
    });
  });

  describe('Construction Cost Calculation', () => {
    test('should calculate basic construction cost', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'Test Ship',
        selectedEquipment: {
          engines: [],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const cost = constructionSystem.calculateConstructionCost(config);
      
      expect(cost.totalCredits).toBeGreaterThan(0);
      expect(cost.baseShipCost).toBeGreaterThan(0);
      expect(cost.equipmentCost).toBe(0); // No equipment selected
      expect(cost.constructionFee).toBeGreaterThan(0);
      expect(cost.totalCredits).toBe(cost.baseShipCost + cost.equipmentCost + cost.constructionFee);
    });

    test('should include equipment cost in total', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'Test Ship',
        selectedEquipment: {
          engines: ['basic-ion-drive'],
          cargo: ['cargo-expansion-mk1'],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const cost = constructionSystem.calculateConstructionCost(config);
      
      expect(cost.equipmentCost).toBeGreaterThan(0);
      expect(cost.totalCredits).toBeGreaterThan(cost.baseShipCost);
    });

    test('should throw error for invalid ship class', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'invalid-ship',
        shipName: 'Test Ship',
        selectedEquipment: {
          engines: [],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      expect(() => constructionSystem.calculateConstructionCost(config)).toThrow();
    });
  });

  describe('Configuration Validation', () => {
    test('should validate valid configuration', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'Valid Ship Name',
        selectedEquipment: {
          engines: ['basic-ion-drive'],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const validation = constructionSystem.validateConfiguration(config);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should reject empty ship name', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: '',
        selectedEquipment: {
          engines: [],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const validation = constructionSystem.validateConfiguration(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('name'))).toBe(true);
    });

    test('should reject overly long ship name', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'A'.repeat(51), // 51 characters
        selectedEquipment: {
          engines: [],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const validation = constructionSystem.validateConfiguration(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('50 characters'))).toBe(true);
    });

    test('should reject too many equipment items in slot', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'Test Ship',
        selectedEquipment: {
          engines: ['basic-ion-drive', 'advanced-fusion-drive'], // Light freighter only has 1 engine slot
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const validation = constructionSystem.validateConfiguration(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('engines'))).toBe(true);
    });

    test('should reject invalid ship class', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'invalid-ship',
        shipName: 'Test Ship',
        selectedEquipment: {
          engines: [],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const validation = constructionSystem.validateConfiguration(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Invalid ship class'))).toBe(true);
    });

    test('should reject invalid equipment', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'Test Ship',
        selectedEquipment: {
          engines: ['invalid-equipment'],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const validation = constructionSystem.validateConfiguration(config);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Unknown equipment'))).toBe(true);
    });
  });

  describe('Performance Statistics', () => {
    test('should calculate base ship stats without equipment', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'Test Ship',
        selectedEquipment: {
          engines: [],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const stats = constructionSystem.calculatePerformanceStats(config);
      
      expect(stats.cargoCapacity).toBe(100); // Light freighter base cargo
      expect(stats.speed).toBe(120); // Light freighter base speed
      expect(stats.shields).toBe(25); // Light freighter base shields
      expect(stats.fuelEfficiency).toBe(1.0); // Base efficiency
      expect(stats.weaponDamage).toBe(0); // No weapons
      expect(stats.scannerRange).toBe(100); // Base range
    });

    test('should add equipment bonuses to base stats', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'Test Ship',
        selectedEquipment: {
          engines: ['basic-ion-drive'], // +10 speed, +0.1 fuel efficiency
          cargo: ['cargo-expansion-mk1'], // +25 cargo
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const stats = constructionSystem.calculatePerformanceStats(config);
      
      expect(stats.cargoCapacity).toBe(125); // 100 + 25
      expect(stats.speed).toBe(130); // 120 + 10
      expect(stats.fuelEfficiency).toBe(1.1); // 1.0 + 0.1
    });

    test('should throw error for invalid ship class', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'invalid-ship',
        shipName: 'Test Ship',
        selectedEquipment: {
          engines: [],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      expect(() => constructionSystem.calculatePerformanceStats(config)).toThrow();
    });
  });

  describe('Ship Construction', () => {
    test('should construct a valid ship', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'My New Ship',
        selectedEquipment: {
          engines: ['basic-ion-drive'],
          cargo: ['cargo-expansion-mk1'],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const ship = constructionSystem.constructShip(config, 'station-001');
      
      expect(ship.id).toBeDefined();
      expect(ship.name).toBe('My New Ship');
      expect(ship.class.id).toBe('light-freighter');
      expect(ship.location.stationId).toBe('station-001');
      expect(ship.location.isInTransit).toBe(false);
      expect(ship.condition.hull).toBe(1.0);
      expect(ship.equipment.engines.length).toBe(1);
      expect(ship.equipment.cargo.length).toBe(1);
      expect(ship.cargo.capacity).toBe(125); // 100 + 25 from cargo expansion
    });

    test('should throw error for invalid configuration', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: '', // Invalid empty name
        selectedEquipment: {
          engines: [],
          cargo: [],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      expect(() => constructionSystem.constructShip(config, 'station-001')).toThrow();
    });

    test('should create ship with proper equipment instances', () => {
      const config: ShipConstructionConfig = {
        shipClassId: 'light-freighter',
        shipName: 'Equipped Ship',
        selectedEquipment: {
          engines: ['basic-ion-drive'],
          cargo: ['cargo-expansion-mk1'],
          shields: [],
          weapons: [],
          utility: []
        }
      };

      const ship = constructionSystem.constructShip(config, 'station-001');
      
      expect(ship.equipment.engines[0].id).toBeDefined();
      expect(ship.equipment.engines[0].name).toBe('Basic Ion Drive');
      expect(ship.equipment.engines[0].condition).toBe(1.0);
      
      expect(ship.equipment.cargo[0].name).toBe('Cargo Expansion Mk I');
      expect(ship.equipment.cargo[0].effects.cargoCapacity).toBe(25);
    });
  });
});