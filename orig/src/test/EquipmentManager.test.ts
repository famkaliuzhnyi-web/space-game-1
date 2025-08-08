import { describe, it, expect, beforeEach } from 'vitest';
import { EquipmentManager } from '../systems/EquipmentManager';
import { getEquipmentTemplate, createEquipmentItem, EQUIPMENT_TEMPLATES } from '../data/equipment';
import { Ship, ShipClass } from '../types/player';

describe('EquipmentManager', () => {
  let equipmentManager: EquipmentManager;
  let testShip: Ship;

  beforeEach(() => {
    equipmentManager = new EquipmentManager();
    
    // Create a test ship
    const testShipClass: ShipClass = {
      id: 'light-freighter',
      name: 'Light Freighter',
      category: 'transport',
      baseCargoCapacity: 100,
      baseFuelCapacity: 50,
      baseSpeed: 120,
      baseShields: 25,
      equipmentSlots: {
        engines: 1,
        cargo: 2,
        shields: 1,
        weapons: 1,
        utility: 1
      }
    };

    testShip = {
      id: 'test-ship',
      name: 'Test Ship',
      class: testShipClass,
      cargo: {
        capacity: 100,
        used: 0,
        items: new Map()
      },
      equipment: {
        engines: [],
        cargo: [],
        shields: [],
        weapons: [],
        utility: []
      },
      condition: {
        hull: 1.0,
        engines: 1.0,
        cargo: 1.0,
        shields: 1.0,
        lastMaintenance: Date.now()
      },
      location: {
        systemId: 'sol-system',
        stationId: 'earth-station',
        isInTransit: false
      }
    };
  });

  describe('Equipment Templates', () => {
    it('should have valid equipment templates', () => {
      expect(Object.keys(EQUIPMENT_TEMPLATES).length).toBeGreaterThan(0);
      
      const basicEngine = getEquipmentTemplate('basic-ion-drive');
      expect(basicEngine).toBeDefined();
      expect(basicEngine?.name).toBe('Basic Ion Drive');
      expect(basicEngine?.category).toBe('engines');
    });

    it('should create equipment items from templates', () => {
      const equipment = createEquipmentItem('basic-ion-drive', 1.0);
      expect(equipment).toBeDefined();
      expect(equipment?.name).toBe('Basic Ion Drive');
      expect(equipment?.condition).toBe(1.0);
      expect(equipment?.effects.speed).toBe(10);
    });
  });

  describe('Station Market', () => {
    it('should initialize station markets', () => {
      const market = equipmentManager.initializeStationMarket('test-station', 'trade', 2);
      
      expect(market).toBeDefined();
      expect(market.stationId).toBe('test-station');
      expect(market.availableEquipment.length).toBeGreaterThan(0);
    });

    it('should handle equipment purchases', () => {
      const market = equipmentManager.initializeStationMarket('test-station', 'trade', 2);
      const availableItem = market.availableEquipment[0];
      
      if (availableItem) {
        const result = equipmentManager.purchaseEquipment(
          'test-station',
          availableItem.template.id,
          10000 // Sufficient credits
        );
        
        expect(result.success).toBe(true);
        expect(result.equipment).toBeDefined();
        expect(result.cost).toBe(availableItem.price);
      }
    });

    it('should handle insufficient credits', () => {
      const market = equipmentManager.initializeStationMarket('test-station', 'trade', 2);
      const availableItem = market.availableEquipment[0];
      
      if (availableItem) {
        const result = equipmentManager.purchaseEquipment(
          'test-station',
          availableItem.template.id,
          0 // No credits
        );
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Insufficient credits');
      }
    });
  });

  describe('Equipment Installation', () => {
    it('should install equipment on ships', () => {
      const equipment = createEquipmentItem('basic-ion-drive', 1.0);
      if (!equipment) throw new Error('Failed to create equipment');

      const result = equipmentManager.installEquipment(testShip, equipment, 'engines');
      
      expect(result.success).toBe(true);
      expect(testShip.equipment.engines.length).toBe(1);
      expect(testShip.equipment.engines[0].name).toBe('Basic Ion Drive');
    });

    it('should prevent installation when no slots available', () => {
      const equipment1 = createEquipmentItem('basic-ion-drive', 1.0);
      const equipment2 = createEquipmentItem('advanced-fusion-drive', 1.0);
      
      if (!equipment1 || !equipment2) throw new Error('Failed to create equipment');

      // Fill the single engine slot
      equipmentManager.installEquipment(testShip, equipment1, 'engines');
      
      // Try to install a second engine
      const result = equipmentManager.installEquipment(testShip, equipment2, 'engines');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No available engines slots');
    });

    it('should remove equipment from ships', () => {
      const equipment = createEquipmentItem('basic-ion-drive', 1.0);
      if (!equipment) throw new Error('Failed to create equipment');

      equipmentManager.installEquipment(testShip, equipment, 'engines');
      expect(testShip.equipment.engines.length).toBe(1);

      const removedEquipment = equipmentManager.removeEquipment(testShip, 'engines', 0);
      
      expect(removedEquipment).toBeDefined();
      expect(removedEquipment?.name).toBe('Basic Ion Drive');
      expect(testShip.equipment.engines.length).toBe(0);
    });
  });

  describe('Performance Calculations', () => {
    it('should calculate base ship performance', () => {
      const performance = equipmentManager.calculateShipPerformance(testShip);
      
      expect(performance.cargoCapacity).toBe(100);
      expect(performance.speed).toBe(120);
      expect(performance.shieldStrength).toBe(25);
      expect(performance.weaponDamage).toBe(0);
    });

    it('should apply equipment bonuses to performance', () => {
      const cargoExpansion = createEquipmentItem('cargo-expansion-mk1', 1.0);
      const basicEngine = createEquipmentItem('basic-ion-drive', 1.0);
      
      if (!cargoExpansion || !basicEngine) throw new Error('Failed to create equipment');

      equipmentManager.installEquipment(testShip, cargoExpansion, 'cargo');
      equipmentManager.installEquipment(testShip, basicEngine, 'engines');

      const performance = equipmentManager.calculateShipPerformance(testShip);
      
      expect(performance.cargoCapacity).toBe(125); // 100 + 25 from cargo expansion
      expect(performance.speed).toBe(130); // 120 + 10 from basic engine
    });

    it('should account for equipment condition', () => {
      const damagedEngine = createEquipmentItem('basic-ion-drive', 0.5); // 50% condition
      if (!damagedEngine) throw new Error('Failed to create equipment');

      equipmentManager.installEquipment(testShip, damagedEngine, 'engines');

      const performance = equipmentManager.calculateShipPerformance(testShip);
      
      // 120 base + (10 * 0.5) = 125
      expect(performance.speed).toBe(125);
    });
  });

  describe('Equipment Market Selling', () => {
    it('should calculate sell value based on condition', () => {
      const equipment = createEquipmentItem('basic-ion-drive', 0.8);
      if (!equipment) throw new Error('Failed to create equipment');

      const result = equipmentManager.sellEquipment(equipment);
      
      expect(result.success).toBe(true);
      expect(result.value).toBeDefined();
      
      // Should be 60% of base price (2500) * condition (0.8) = 1200
      if (result.success) {
        expect(result.value).toBe(1200);
      }
    });
  });

  describe('Installation Preview', () => {
    it('should provide installation preview', () => {
      const equipment = createEquipmentItem('basic-ion-drive', 1.0);
      if (!equipment) throw new Error('Failed to create equipment');

      const preview = equipmentManager.getInstallationPreview(testShip, equipment, 'engines');
      
      expect(preview.canInstall).toBe(true);
      expect(preview.performanceBefore.speed).toBe(120);
      expect(preview.performanceAfter.speed).toBe(130);
    });

    it('should prevent installation when no slots available', () => {
      const equipment1 = createEquipmentItem('basic-ion-drive', 1.0);
      const equipment2 = createEquipmentItem('advanced-fusion-drive', 1.0);
      
      if (!equipment1 || !equipment2) throw new Error('Failed to create equipment');

      // Fill the engine slot first
      equipmentManager.installEquipment(testShip, equipment1, 'engines');
      
      // Try to preview installing a second engine
      const preview = equipmentManager.getInstallationPreview(testShip, equipment2, 'engines');
      
      expect(preview.canInstall).toBe(false);
      expect(preview.error).toBe('No available engines slots');
    });
  });
});