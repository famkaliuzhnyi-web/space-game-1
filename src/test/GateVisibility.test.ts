import { describe, it, expect, beforeEach } from 'vitest';
import { WorldManager } from '../systems/WorldManager';

describe('Gate Visibility Fix', () => {
  let worldManager: WorldManager;

  beforeEach(() => {
    worldManager = new WorldManager();
  });

  describe('getAllVisibleObjects', () => {
    it('should include gates from the current system', () => {
      const objects = worldManager.getAllVisibleObjects();
      
      // Sol system should have gates
      const currentSystem = worldManager.getCurrentSystem();
      expect(currentSystem?.id).toBe('sol-system');
      expect(currentSystem?.gates).toBeDefined();
      expect(currentSystem?.gates.length).toBeGreaterThan(0);
      
      // Check that gates are included in visible objects
      const gateObjects = objects.filter(obj => obj.type === 'gate');
      expect(gateObjects.length).toBe(currentSystem?.gates.length);
      
      // Verify each gate object has the expected structure
      gateObjects.forEach(gateObj => {
        expect(gateObj.type).toBe('gate');
        expect(gateObj.object).toHaveProperty('id');
        expect(gateObj.object).toHaveProperty('name');
        expect(gateObj.object).toHaveProperty('isActive');
        expect(gateObj.position).toBeDefined();
        expect(gateObj.position.x).toBeDefined();
        expect(gateObj.position.y).toBeDefined();
      });
    });

    it('should include gates alongside other objects', () => {
      const objects = worldManager.getAllVisibleObjects();
      
      // Should have multiple object types
      const objectTypes = objects.map(obj => obj.type);
      const uniqueTypes = [...new Set(objectTypes)];
      
      // Should include gates along with other object types
      expect(uniqueTypes).toContain('gate');
      expect(uniqueTypes).toContain('star');
      expect(uniqueTypes).toContain('station');
      
      // Total objects should be greater than just gates
      expect(objects.length).toBeGreaterThan(3); // gates + star + stations
    });

    it('should have proper gate visibility for navigation', () => {
      // Get navigation targets (this was working before)
      const navigationTargets = worldManager.getAvailableTargets();
      const gateTargets = navigationTargets.filter(target => target.type === 'gate');
      
      // Get visible objects (this should now work too)
      const visibleObjects = worldManager.getAllVisibleObjects();
      const visibleGates = visibleObjects.filter(obj => obj.type === 'gate');
      
      // Should have the same number of gates in both
      expect(visibleGates.length).toBe(gateTargets.length);
      
      // Each gate should appear in both lists
      gateTargets.forEach(navGate => {
        const visibleGate = visibleGates.find(vg => (vg.object as any).id === navGate.id);
        expect(visibleGate).toBeDefined();
        expect((visibleGate!.object as any).name).toBe(navGate.name);
      });
    });
  });
});