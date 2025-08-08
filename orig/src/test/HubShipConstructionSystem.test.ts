import { describe, test, expect, beforeEach } from 'vitest';
import { HubShipConstructionSystem } from '../systems/HubShipConstructionSystem';
import { ShipHubDesign, HubConstructionConstraints } from '../types/shipHubs';

describe('HubShipConstructionSystem', () => {
  let constructionSystem: HubShipConstructionSystem;
  let basicConstraints: HubConstructionConstraints;

  beforeEach(() => {
    constructionSystem = new HubShipConstructionSystem();
    basicConstraints = {
      maxShipSize: { width: 10, height: 10, depth: 10 },
      availableTechLevel: 3,
      availableMaterials: {
        'electronics': 1000,
        'steel': 1000,
        'composites': 1000,
        'fusion-cores': 100
      },
      requirePowerBalance: true,
      requireBasicSystems: true,
      requireLifeSupport: true,
      maxMassStructural: 1000
    };
  });

  describe('Design Creation', () => {
    test('should create new empty ship design', () => {
      const design = constructionSystem.createNewDesign(
        'Test Ship',
        { width: 5, height: 5, depth: 5 }
      );

      expect(design.id).toBeDefined();
      expect(design.name).toBe('Test Ship');
      expect(design.maxSize).toEqual({ width: 5, height: 5, depth: 5 });
      expect(design.hubs).toHaveLength(0);
      expect(design.isValid).toBe(false);
      expect(design.performance.totalMass).toBe(0);
    });
  });

  describe('Available Hub Templates', () => {
    test('should return available hubs based on tech level', () => {
      const hubs = constructionSystem.getAvailableHubTemplates(basicConstraints);
      expect(hubs.length).toBeGreaterThan(0);
      
      // All returned hubs should meet tech level requirement
      hubs.forEach(hub => {
        expect(hub.techLevel).toBeLessThanOrEqual(basicConstraints.availableTechLevel);
      });
    });

    test('should filter hubs by material availability', () => {
      const limitedConstraints = {
        ...basicConstraints,
        availableMaterials: {
          'electronics': 1, // Very limited
          'steel': 1000,
          'composites': 1000
        }
      };

      const hubs = constructionSystem.getAvailableHubTemplates(limitedConstraints);
      
      // Should have fewer hubs available due to material constraints
      const allHubs = constructionSystem.getAvailableHubTemplates(basicConstraints);
      expect(hubs.length).toBeLessThan(allHubs.length);
    });
  });

  describe('Hub Placement', () => {
    let design: ShipHubDesign;

    beforeEach(() => {
      design = constructionSystem.createNewDesign(
        'Test Ship',
        { width: 5, height: 5, depth: 5 }
      );
    });

    test('should allow placing hub in valid position', () => {
      const canPlace = constructionSystem.canPlaceHub(
        design,
        'cockpit-hub',
        { x: 0, y: 0, z: 0 }
      );

      expect(canPlace.canPlace).toBe(true);
    });

    test('should reject placement outside bounds', () => {
      const canPlace = constructionSystem.canPlaceHub(
        design,
        'cockpit-hub',
        { x: 5, y: 0, z: 0 } // Outside 5x5x5 grid
      );

      expect(canPlace.canPlace).toBe(false);
      expect(canPlace.reason).toContain('size limits');
    });

    test('should reject placement with negative coordinates', () => {
      const canPlace = constructionSystem.canPlaceHub(
        design,
        'cockpit-hub',
        { x: -1, y: 0, z: 0 }
      );

      expect(canPlace.canPlace).toBe(false);
      expect(canPlace.reason).toContain('out of bounds');
    });

    test('should reject overlapping hub placement', () => {
      // Place first hub
      const firstPlacement = constructionSystem.addHub(
        design,
        'cockpit-hub',
        { x: 0, y: 0, z: 0 }
      );
      expect(firstPlacement.success).toBe(true);

      // Try to place overlapping hub
      const canPlace = constructionSystem.canPlaceHub(
        design,
        'cockpit-hub',
        { x: 0, y: 0, z: 0 }
      );

      expect(canPlace.canPlace).toBe(false);
      expect(canPlace.reason).toContain('occupied');
    });
  });

  describe('Hub Management', () => {
    let design: ShipHubDesign;

    beforeEach(() => {
      design = constructionSystem.createNewDesign(
        'Test Ship',
        { width: 10, height: 10, depth: 10 }
      );
    });

    test('should add hub successfully', () => {
      const result = constructionSystem.addHub(
        design,
        'cockpit-hub',
        { x: 0, y: 0, z: 0 }
      );

      expect(result.success).toBe(true);
      expect(design.hubs).toHaveLength(1);
      expect(design.hubs[0].templateId).toBe('cockpit-hub');
      expect(design.hubs[0].position).toEqual({ x: 0, y: 0, z: 0 });
    });

    test('should update design metrics when adding hub', () => {
      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 });

      expect(design.performance.totalMass).toBeGreaterThan(0);
      expect(design.performance.powerBalance).toBeLessThan(0); // Cockpit consumes power
    });

    test('should remove hub successfully', () => {
      const addResult = constructionSystem.addHub(
        design,
        'cockpit-hub',
        { x: 0, y: 0, z: 0 }
      );
      expect(addResult.success).toBe(true);

      const hubId = design.hubs[0].hubId;
      const removed = constructionSystem.removeHub(design, hubId);

      expect(removed).toBe(true);
      expect(design.hubs).toHaveLength(0);
      expect(design.performance.totalMass).toBe(0);
    });

    test('should move hub to new position', () => {
      const addResult = constructionSystem.addHub(
        design,
        'cockpit-hub',
        { x: 0, y: 0, z: 0 }
      );
      expect(addResult.success).toBe(true);

      const hubId = design.hubs[0].hubId;
      const moveResult = constructionSystem.moveHub(
        design,
        hubId,
        { x: 2, y: 2, z: 2 }
      );

      expect(moveResult.success).toBe(true);
      expect(design.hubs[0].position).toEqual({ x: 2, y: 2, z: 2 });
    });

    test('should reject moving hub to invalid position', () => {
      const addResult = constructionSystem.addHub(
        design,
        'cockpit-hub',
        { x: 0, y: 0, z: 0 }
      );
      expect(addResult.success).toBe(true);

      const hubId = design.hubs[0].hubId;
      const moveResult = constructionSystem.moveHub(
        design,
        hubId,
        { x: 15, y: 0, z: 0 } // Outside bounds
      );

      expect(moveResult.success).toBe(false);
    });
  });

  describe('Design Validation', () => {
    let design: ShipHubDesign;

    beforeEach(() => {
      design = constructionSystem.createNewDesign(
        'Test Ship',
        { width: 10, height: 10, depth: 10 }
      );
    });

    test('should require basic systems', () => {
      const validation = constructionSystem.validateDesign(design, basicConstraints);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Ship requires a command hub');
      expect(validation.errors).toContain('Ship requires a power generation hub');
      expect(validation.errors).toContain('Ship requires a propulsion hub');
    });

    test('should validate complete basic ship', () => {
      // Add required systems
      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 });
      constructionSystem.addHub(design, 'fusion-reactor-small', { x: 2, y: 0, z: 0 });
      constructionSystem.addHub(design, 'ion-drive', { x: 4, y: 0, z: 0 });
      constructionSystem.addHub(design, 'life-support-basic', { x: 1, y: 1, z: 0 }); // Add life support

      const validation = constructionSystem.validateDesign(design, basicConstraints);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect power imbalance', () => {
      // Add high-power consuming hubs without enough generation
      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 });
      constructionSystem.addHub(design, 'battery-pack', { x: 1, y: 0, z: 0 }); // No generation
      constructionSystem.addHub(design, 'shield-generator-heavy', { x: 2, y: 0, z: 0 }); // High consumption

      const validation = constructionSystem.validateDesign(design, basicConstraints);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Power consumption exceeds generation');
    });

    test('should detect insufficient life support', () => {
      // Add crew capacity without life support
      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 }); // 1 crew
      constructionSystem.addHub(design, 'fusion-reactor-small', { x: 2, y: 0, z: 0 });
      constructionSystem.addHub(design, 'ion-drive', { x: 4, y: 0, z: 0 });
      constructionSystem.addHub(design, 'crew-quarters', { x: 6, y: 0, z: 0 }); // 4 more crew
      // Total: 5 crew, no life support

      const validation = constructionSystem.validateDesign(design, basicConstraints);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Insufficient life support for crew capacity');
    });

    test('should provide performance warnings', () => {
      // Create ship with poor performance characteristics - just basic setup to get warnings
      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 });
      constructionSystem.addHub(design, 'fusion-reactor-small', { x: 2, y: 0, z: 0 });
      constructionSystem.addHub(design, 'chemical-thruster', { x: 4, y: 0, z: 0 }); // No ion drive for less thrust
      constructionSystem.addHub(design, 'life-support-basic', { x: 1, y: 1, z: 0 });
      // This ship has no cargo and no maneuvering, so should generate warnings

      const validation = constructionSystem.validateDesign(design, basicConstraints);

      expect(validation.warnings.length).toBeGreaterThan(0);
      // Should have warnings about poor maneuverability and no cargo
      expect(validation.warnings.some(w => w.includes('maneuverability'))).toBe(true);
    });
  });

  describe('Construction Cost Calculation', () => {
    let design: ShipHubDesign;

    beforeEach(() => {
      design = constructionSystem.createNewDesign(
        'Test Ship',
        { width: 10, height: 10, depth: 10 }
      );
    });

    test('should calculate cost for empty design', () => {
      const cost = constructionSystem.calculateConstructionCost(design);

      expect(cost.totalCredits).toBe(0);
      expect(Object.keys(cost.materials)).toHaveLength(0);
      expect(cost.constructionTime).toBe(0);
    });

    test('should calculate cost for simple ship', () => {
      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 });
      constructionSystem.addHub(design, 'fusion-reactor-small', { x: 2, y: 0, z: 0 });

      const cost = constructionSystem.calculateConstructionCost(design);

      expect(cost.totalCredits).toBeGreaterThan(0);
      expect(cost.materials['electronics']).toBeGreaterThan(0);
      expect(cost.materials['steel']).toBeGreaterThan(0);
      expect(cost.constructionTime).toBeGreaterThan(0);
    });

    test('should increase cost with complexity', () => {
      // Simple ship
      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 });
      const simpleCost = constructionSystem.calculateConstructionCost(design);

      // Complex ship
      constructionSystem.addHub(design, 'fusion-reactor-small', { x: 2, y: 0, z: 0 });
      constructionSystem.addHub(design, 'ion-drive', { x: 4, y: 0, z: 0 });
      constructionSystem.addHub(design, 'cargo-hold-standard', { x: 6, y: 0, z: 0 });
      const complexCost = constructionSystem.calculateConstructionCost(design);

      expect(complexCost.totalCredits).toBeGreaterThan(simpleCost.totalCredits);
      expect(complexCost.constructionTime).toBeGreaterThan(simpleCost.constructionTime);
    });
  });

  describe('Ship Construction', () => {
    let design: ShipHubDesign;

    beforeEach(() => {
      design = constructionSystem.createNewDesign(
        'Test Ship',
        { width: 10, height: 10, depth: 10 }
      );
      
      // Create valid ship design
      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 });
      constructionSystem.addHub(design, 'fusion-reactor-small', { x: 2, y: 0, z: 0 });
      constructionSystem.addHub(design, 'ion-drive', { x: 4, y: 0, z: 0 });
      constructionSystem.addHub(design, 'life-support-basic', { x: 1, y: 1, z: 0 });
    });

    test('should construct ship from valid design', () => {
      const ship = constructionSystem.constructShipFromHubDesign(
        design,
        'My Hub Ship',
        'station-001',
        basicConstraints
      );

      expect(ship.id).toBeDefined();
      expect(ship.name).toBe('My Hub Ship');
      expect(ship.location.stationId).toBe('station-001');
      expect(ship.class.category).toBeDefined();
      expect(ship.cargo.capacity).toBe(design.performance.cargoCapacity);
    });

    test('should reject invalid design', () => {
      // Remove required hub to make design invalid
      constructionSystem.removeHub(design, design.hubs[0].hubId);

      expect(() => {
        constructionSystem.constructShipFromHubDesign(
          design,
          'Invalid Ship',
          'station-001',
          basicConstraints
        );
      }).toThrow();
    });

    test('should determine appropriate ship category', () => {
      // Add cargo hubs to make it a transport
      constructionSystem.addHub(design, 'cargo-hold-standard', { x: 6, y: 0, z: 0 });
      constructionSystem.addHub(design, 'cargo-hold-standard', { x: 8, y: 0, z: 0 });

      const ship = constructionSystem.constructShipFromHubDesign(
        design,
        'Transport Ship',
        'station-001',
        basicConstraints
      );

      expect(ship.class.category).toBe('transport');
    });
  });

  describe('Grid Management', () => {
    let design: ShipHubDesign;

    beforeEach(() => {
      design = constructionSystem.createNewDesign(
        'Test Ship',
        { width: 5, height: 5, depth: 5 }
      );
    });

    test('should handle multi-cell hub placement', () => {
      // Fusion reactor is 2x2x2
      const result = constructionSystem.addHub(
        design,
        'fusion-reactor-small',
        { x: 0, y: 0, z: 0 }
      );

      expect(result.success).toBe(true);

      // Should not be able to place anything in the 2x2x2 space
      const canPlace = constructionSystem.canPlaceHub(
        design,
        'cockpit-hub',
        { x: 1, y: 1, z: 1 } // Inside the reactor
      );

      expect(canPlace.canPlace).toBe(false);
    });

    test('should allow adjacent hub placement', () => {
      // Place reactor at origin
      constructionSystem.addHub(design, 'fusion-reactor-small', { x: 0, y: 0, z: 0 });

      // Should be able to place adjacent hub
      const canPlace = constructionSystem.canPlaceHub(
        design,
        'cockpit-hub',
        { x: 2, y: 0, z: 0 } // Adjacent to 2x2x2 reactor
      );

      expect(canPlace.canPlace).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    let design: ShipHubDesign;

    beforeEach(() => {
      design = constructionSystem.createNewDesign(
        'Test Ship',
        { width: 10, height: 10, depth: 10 }
      );
    });

    test('should calculate mass correctly', () => {
      const initialMass = design.performance.totalMass;
      expect(initialMass).toBe(0);

      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 }); // Mass: 2

      expect(design.performance.totalMass).toBe(2);
    });

    test('should calculate power balance', () => {
      constructionSystem.addHub(design, 'cockpit-hub', { x: 0, y: 0, z: 0 }); // -5 power
      expect(design.performance.powerBalance).toBe(-5);

      constructionSystem.addHub(design, 'fusion-reactor-small', { x: 2, y: 0, z: 0 }); // +50 power
      expect(design.performance.powerBalance).toBe(45); // 50 - 5
    });

    test('should aggregate cargo capacity', () => {
      constructionSystem.addHub(design, 'cargo-hold-standard', { x: 0, y: 0, z: 0 }); // +10 cargo
      expect(design.performance.cargoCapacity).toBe(10);

      constructionSystem.addHub(design, 'cargo-hold-standard', { x: 3, y: 0, z: 0 }); // +10 cargo
      expect(design.performance.cargoCapacity).toBe(20);
    });

    test('should calculate thrust and maneuverability', () => {
      constructionSystem.addHub(design, 'ion-drive', { x: 0, y: 0, z: 0 }); // +20 thrust
      constructionSystem.addHub(design, 'rcs-thrusters', { x: 2, y: 0, z: 0 }); // +10 maneuverability

      expect(design.performance.thrust).toBe(20);
      expect(design.performance.maneuverability).toBe(10);
    });

    test('should calculate defense rating', () => {
      constructionSystem.addHub(design, 'shield-generator-light', { x: 0, y: 0, z: 0 }); // +100 shields
      constructionSystem.addHub(design, 'armor-plating-light', { x: 1, y: 0, z: 0 }); // +50 armor

      // Defense rating = shields + (armor * 0.5)
      expect(design.performance.defenseRating).toBe(125); // 100 + (50 * 0.5)
    });
  });
});