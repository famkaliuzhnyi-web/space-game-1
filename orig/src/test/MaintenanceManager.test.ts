import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { MaintenanceManager, MaintenanceScheduleItem } from '../systems/MaintenanceManager';
import { TimeManager } from '../systems/TimeManager';
import { Ship } from '../types/player';

describe('MaintenanceManager', () => {
  let maintenanceManager: MaintenanceManager;
  let timeManager: TimeManager;
  let mockShip: Ship;

  beforeEach(() => {
    timeManager = new TimeManager();
    maintenanceManager = new MaintenanceManager(timeManager);
    
    mockShip = {
      id: 'test-ship-1',
      name: 'Test Ship',
      class: {
        id: 'courier',
        name: 'Light Courier',
        category: 'courier',
        baseCargoCapacity: 50,
        baseFuelCapacity: 100,
        baseSpeed: 120,
        baseShields: 50,
        equipmentSlots: {
          engines: 1,
          cargo: 2,
          shields: 1,
          weapons: 0,
          utility: 2
        }
      },
      cargo: {
        capacity: 50,
        used: 0,
        items: new Map()
      },
      equipment: {
        engines: [
          {
            id: 'engine-1',
            name: 'Basic Ion Drive',
            type: 'engine',
            effects: { speed: 20 },
            condition: 0.8
          }
        ],
        cargo: [],
        shields: [
          {
            id: 'shield-1',
            name: 'Light Shield Generator',
            type: 'shield',
            effects: { shieldStrength: 25 },
            condition: 0.6
          }
        ],
        weapons: [],
        utility: []
      },
      condition: {
        hull: 0.9,
        engines: 0.7,
        cargo: 0.85,
        shields: 0.5,
        lastMaintenance: Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
      },
      location: {
        systemId: 'sol',
        stationId: 'earth-station-alpha',
        isInTransit: false
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Condition Degradation', () => {
    test('should degrade ship condition over time', () => {
      // Set equal initial conditions to fairly test degradation rates
      mockShip.condition.hull = 1.0;
      mockShip.condition.engines = 1.0;
      
      const initialHull = mockShip.condition.hull;
      const initialEngines = mockShip.condition.engines;

      // Mock the time manager to return a specific current time
      const currentTime = Date.now();
      const longTimeAgo = currentTime - (100 * 60 * 60 * 1000); // 100 hours ago
      mockShip.condition.lastMaintenance = longTimeAgo;
      
      // Mock getCurrentDate to return the expected current time
      vi.spyOn(timeManager, 'getCurrentDate').mockReturnValue(new Date(currentTime));

      maintenanceManager.updateConditions(mockShip);

      // Condition should have decreased
      expect(mockShip.condition.hull).toBeLessThan(initialHull);
      expect(mockShip.condition.engines).toBeLessThan(initialEngines);
      
      // Check degradation amounts
      const hullDegradation = initialHull - mockShip.condition.hull;
      const engineDegradation = initialEngines - mockShip.condition.engines;
      
      // Both should have degraded significantly after 100 hours
      expect(hullDegradation).toBeGreaterThan(0.05); // At least 5% degradation
      expect(engineDegradation).toBeGreaterThan(0.05); // At least 5% degradation
      
      // Engine degradation rate (0.002) should be higher than hull (0.001)
      expect(engineDegradation).toBeGreaterThan(hullDegradation);
    });

    test('should degrade equipment condition over time', () => {
      const engine = mockShip.equipment.engines[0];
      const shield = mockShip.equipment.shields[0];
      const initialEngineCondition = engine.condition;
      const initialShieldCondition = shield.condition;

      // Simulate 24 hours of time passage
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      mockShip.condition.lastMaintenance = twentyFourHoursAgo;

      maintenanceManager.updateConditions(mockShip);

      // Equipment condition should have decreased
      expect(engine.condition).toBeLessThan(initialEngineCondition);
      expect(shield.condition).toBeLessThan(initialShieldCondition);
      
      // Engine should degrade faster than shield (based on type multipliers)
      const engineDegradation = initialEngineCondition - engine.condition;
      const shieldDegradation = initialShieldCondition - shield.condition;
      expect(engineDegradation).toBeGreaterThan(shieldDegradation);
    });

    test('should not allow condition to go below 0', () => {
      // Set very low condition
      mockShip.condition.hull = 0.01;
      mockShip.equipment.engines[0].condition = 0.01;

      // Simulate very long time passage
      const longTimeAgo = Date.now() - (1000 * 60 * 60 * 1000); // 1000 hours
      mockShip.condition.lastMaintenance = longTimeAgo;

      maintenanceManager.updateConditions(mockShip);

      // Condition should not go below 0
      expect(mockShip.condition.hull).toBeGreaterThanOrEqual(0);
      expect(mockShip.equipment.engines[0].condition).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Maintenance Schedule Generation', () => {
    test('should generate maintenance schedule for ship components', () => {
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);

      // Should include all components that need maintenance
      const componentTypes = schedule.map(item => item.type);
      expect(componentTypes).toContain('engines'); // 0.7 condition
      expect(componentTypes).toContain('shields'); // 0.5 condition
      
      // Should not include hull if it's in good condition (0.9)
      // But might include it if degradation happened
    });

    test('should include equipment in maintenance schedule', () => {
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);

      // Should include equipment that needs maintenance
      const equipmentItems = schedule.filter(item => item.type === 'equipment');
      expect(equipmentItems.length).toBeGreaterThan(0);
      
      // Should include both engine and shield equipment
      const equipmentIds = equipmentItems.map(item => item.equipmentId);
      expect(equipmentIds).toContain('engine-1');
      expect(equipmentIds).toContain('shield-1');
    });

    test('should prioritize items by condition', () => {
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);

      // Should sort by priority (critical > high > medium > low)
      // and then by condition (lower condition first)
      for (let i = 1; i < schedule.length; i++) {
        const prev = schedule[i - 1];
        const curr = schedule[i];
        
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        
        if (priorityOrder[prev.priority] === priorityOrder[curr.priority]) {
          // Same priority, should be ordered by condition
          expect(prev.condition).toBeLessThanOrEqual(curr.condition);
        } else {
          // Different priority, should be ordered by priority
          expect(priorityOrder[prev.priority]).toBeGreaterThanOrEqual(priorityOrder[curr.priority]);
        }
      }
    });

    test('should assign correct priority based on condition', () => {
      // Test critical condition
      mockShip.condition.hull = 0.1;
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);
      const hullItem = schedule.find(item => item.type === 'hull');
      expect(hullItem?.priority).toBe('critical');

      // Test high condition
      mockShip.condition.engines = 0.3;
      const schedule2 = maintenanceManager.generateMaintenanceSchedule(mockShip);
      const engineItem = schedule2.find(item => item.type === 'engines');
      expect(engineItem?.priority).toBe('high');
    });
  });

  describe('Maintenance Quote Generation', () => {
    test('should generate accurate maintenance quote', () => {
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);
      const selectedItems = schedule.slice(0, 2); // Select first 2 items
      
      const quote = maintenanceManager.generateMaintenanceQuote(mockShip, selectedItems);

      expect(quote.items).toHaveLength(2);
      expect(quote.totalCost).toBeGreaterThan(0);
      expect(quote.estimatedTime).toBeGreaterThan(0);
      
      // Quote items should have all required fields
      quote.items.forEach(item => {
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('currentCondition');
        expect(item).toHaveProperty('targetCondition');
        expect(item).toHaveProperty('cost');
        expect(item).toHaveProperty('timeRequired');
        expect(item).toHaveProperty('priority');
        
        // Target condition should be 1.0 (full repair)
        expect(item.targetCondition).toBe(1.0);
        
        // Cost should be proportional to repair needed
        expect(item.cost).toBeGreaterThan(0);
      });
    });

    test('should calculate costs correctly based on repair needed', () => {
      // Create items with different conditions
      const lowConditionItem: MaintenanceScheduleItem = {
        type: 'hull',
        condition: 0.2,
        degradationRate: 0.001,
        nextMaintenanceRecommended: Date.now(),
        maintenanceCost: 1000,
        priority: 'critical'
      };

      const highConditionItem: MaintenanceScheduleItem = {
        type: 'hull',
        condition: 0.8,
        degradationRate: 0.001,
        nextMaintenanceRecommended: Date.now(),
        maintenanceCost: 1000,
        priority: 'low'
      };

      const quote = maintenanceManager.generateMaintenanceQuote(mockShip, [lowConditionItem, highConditionItem]);

      // Low condition item should cost more to repair
      const lowConditionQuote = quote.items.find(item => item.currentCondition === 0.2);
      const highConditionQuote = quote.items.find(item => item.currentCondition === 0.8);

      expect(lowConditionQuote?.cost).toBeGreaterThan(highConditionQuote?.cost || 0);
    });
  });

  describe('Maintenance Performance', () => {
    test('should successfully perform maintenance', () => {
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);
      const quote = maintenanceManager.generateMaintenanceQuote(mockShip, schedule.slice(0, 1));
      
      const initialCondition = mockShip.condition.engines;
      
      const records = maintenanceManager.performMaintenance(mockShip, quote.items, 'earth-station-alpha');

      expect(records).toHaveLength(1);
      expect(records[0]).toHaveProperty('type');
      expect(records[0]).toHaveProperty('performedAt');
      expect(records[0]).toHaveProperty('cost');
      expect(records[0]).toHaveProperty('stationId', 'earth-station-alpha');
      expect(records[0]).toHaveProperty('description');

      // Condition should be improved
      if (schedule[0].type === 'engines') {
        expect(mockShip.condition.engines).toBeGreaterThan(initialCondition);
      }
    });

    test('should repair equipment to target condition', () => {
      const equipmentToRepair = mockShip.equipment.engines[0];
      const initialCondition = equipmentToRepair.condition;

      const scheduleItem: MaintenanceScheduleItem = {
        type: 'equipment',
        equipmentId: equipmentToRepair.id,
        condition: initialCondition,
        degradationRate: 0.001,
        nextMaintenanceRecommended: Date.now(),
        maintenanceCost: 300,
        priority: 'medium'
      };

      const quote = maintenanceManager.generateMaintenanceQuote(mockShip, [scheduleItem]);
      maintenanceManager.performMaintenance(mockShip, quote.items, 'earth-station-alpha');

      // Equipment should be repaired to full condition
      expect(equipmentToRepair.condition).toBe(1.0);
    });

    test('should update last maintenance time', () => {
      const initialMaintenanceTime = mockShip.condition.lastMaintenance;
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);
      const quote = maintenanceManager.generateMaintenanceQuote(mockShip, schedule.slice(0, 1));

      maintenanceManager.performMaintenance(mockShip, quote.items, 'earth-station-alpha');

      expect(mockShip.condition.lastMaintenance).toBeGreaterThan(initialMaintenanceTime);
    });

    test('should store maintenance records', () => {
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);
      const quote = maintenanceManager.generateMaintenanceQuote(mockShip, schedule.slice(0, 1));

      maintenanceManager.performMaintenance(mockShip, quote.items, 'earth-station-alpha');

      const history = maintenanceManager.getMaintenanceHistory(mockShip.id);
      expect(history).toHaveLength(1);
      expect(history[0].stationId).toBe('earth-station-alpha');
    });
  });

  describe('Condition Effects on Performance', () => {
    test('should calculate performance multipliers based on condition', () => {
      const effects = maintenanceManager.getConditionEffects(mockShip);

      expect(effects).toHaveProperty('cargoCapacityMultiplier');
      expect(effects).toHaveProperty('speedMultiplier');
      expect(effects).toHaveProperty('shieldMultiplier');
      expect(effects).toHaveProperty('fuelEfficiencyMultiplier');

      // All multipliers should be between 0 and 1
      Object.values(effects).forEach(multiplier => {
        expect(multiplier).toBeGreaterThan(0);
        expect(multiplier).toBeLessThanOrEqual(1);
      });

      // Cargo multiplier should be based on cargo condition
      expect(effects.cargoCapacityMultiplier).toBeCloseTo(Math.max(0.5, mockShip.condition.cargo), 2);
    });

    test('should provide minimum performance even with terrible condition', () => {
      // Set all conditions to 0
      mockShip.condition.hull = 0;
      mockShip.condition.engines = 0;
      mockShip.condition.cargo = 0;
      mockShip.condition.shields = 0;

      const effects = maintenanceManager.getConditionEffects(mockShip);

      // Should still provide minimum performance
      expect(effects.cargoCapacityMultiplier).toBeGreaterThanOrEqual(0.5);
      expect(effects.speedMultiplier).toBeGreaterThanOrEqual(0.3);
      expect(effects.shieldMultiplier).toBeGreaterThanOrEqual(0.2);
      expect(effects.fuelEfficiencyMultiplier).toBeGreaterThanOrEqual(0.4);
    });
  });

  describe('Maintenance History', () => {
    test('should retrieve maintenance history', () => {
      // Perform some maintenance
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);
      const quote = maintenanceManager.generateMaintenanceQuote(mockShip, schedule.slice(0, 2));
      
      maintenanceManager.performMaintenance(mockShip, quote.items, 'earth-station-alpha');

      const history = maintenanceManager.getMaintenanceHistory(mockShip.id);
      expect(history).toHaveLength(2);

      // Should be sorted by most recent first
      expect(history[0].performedAt).toBeGreaterThanOrEqual(history[1].performedAt);
    });

    test('should limit history results', () => {
      // Perform multiple maintenance operations
      for (let i = 0; i < 15; i++) {
        const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);
        if (schedule.length > 0) {
          const quote = maintenanceManager.generateMaintenanceQuote(mockShip, schedule.slice(0, 1));
          maintenanceManager.performMaintenance(mockShip, quote.items, 'earth-station-alpha');
        }
      }

      const history = maintenanceManager.getMaintenanceHistory(mockShip.id, 5);
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Serialization', () => {
    test('should serialize and deserialize maintenance data', () => {
      // Perform some maintenance to create history
      const schedule = maintenanceManager.generateMaintenanceSchedule(mockShip);
      const quote = maintenanceManager.generateMaintenanceQuote(mockShip, schedule.slice(0, 1));
      maintenanceManager.performMaintenance(mockShip, quote.items, 'earth-station-alpha');

      // Serialize
      const serialized = maintenanceManager.serialize();
      expect(serialized).toHaveProperty('maintenanceHistory');

      // Create new manager and deserialize
      const newMaintenanceManager = new MaintenanceManager(timeManager);
      newMaintenanceManager.deserialize(serialized);

      // Should have same history
      const originalHistory = maintenanceManager.getMaintenanceHistory(mockShip.id);
      const restoredHistory = newMaintenanceManager.getMaintenanceHistory(mockShip.id);
      
      expect(restoredHistory).toHaveLength(originalHistory.length);
      expect(restoredHistory[0].stationId).toBe(originalHistory[0].stationId);
    });
  });
});