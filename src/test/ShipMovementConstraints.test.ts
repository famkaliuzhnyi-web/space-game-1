import { describe, it, expect, beforeEach } from 'vitest';
import { WorldManager } from '../systems/WorldManager';
import { Ship, ShipClass } from '../types/player';
import { createLayeredPosition } from '../utils/coordinates';

describe('Ship Movement Constraints Bug', () => {
  let worldManager: WorldManager;
  let testShip: Ship;

  beforeEach(() => {
    worldManager = new WorldManager();
    
    // Create a test ship
    const shipClass: ShipClass = {
      id: 'test-ship-class',
      name: 'Test Ship',
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
      class: shipClass,
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
        coordinates: createLayeredPosition(100, 100, 'ship'),
        isInTransit: false
      }
    };

    worldManager.setPlayerShip(testShip);
  });

  describe('Movement Limitation Bug', () => {
    it('should demonstrate that distant targets can now be set', () => {
      // Get the Sol system position
      const galaxy = worldManager.getGalaxy();
      const solSystem = galaxy.sectors[0].systems[0]; // Sol system
      const systemX = solSystem.position.x;  // 100
      const systemY = solSystem.position.y;  // 100

      // Find Earth's actual position from the system data
      const earth = solSystem.planets.find(p => p.id === 'earth');
      expect(earth).toBeDefined();
      
      if (earth) {
        // Reset ship position to system center  
        testShip.location.coordinates = createLayeredPosition(systemX, systemY, 'ship');
        
        // Try to move to Earth's position - should now work with expanded constraints
        const success = worldManager.moveShipToCoordinates(earth.position.x, earth.position.y);
        expect(success).toBe(true);
        
        // Ship should now be in transit to Earth (not immediately there due to animation)
        expect(testShip.location.isInTransit).toBe(true);
      }
    });

    it('should show that planets positioned beyond 300 units are unreachable', () => {
      // Get planet positions from the system data
      const galaxy = worldManager.getGalaxy();
      const solSystem = galaxy.sectors[0].systems[0]; // Sol system
      
      // Find Earth, Mars, and Jupiter planets
      const earth = solSystem.planets.find(p => p.id === 'earth');
      const mars = solSystem.planets.find(p => p.id === 'mars'); 
      const jupiter = solSystem.planets.find(p => p.id === 'jupiter');

      expect(earth).toBeDefined();
      expect(mars).toBeDefined();
      expect(jupiter).toBeDefined();

      // Calculate actual distances from system center
      const systemX = solSystem.position.x;
      const systemY = solSystem.position.y;

      if (earth) {
        const earthDistance = Math.sqrt(
          Math.pow(earth.position.x - systemX, 2) + 
          Math.pow(earth.position.y - systemY, 2)
        );
        console.log(`Earth distance from system center: ${earthDistance}`);
        expect(earthDistance).toBeGreaterThan(300); // Earth should be beyond the constraint
      }

      if (mars) {
        const marsDistance = Math.sqrt(
          Math.pow(mars.position.x - systemX, 2) + 
          Math.pow(mars.position.y - systemY, 2)
        );
        console.log(`Mars distance from system center: ${marsDistance}`);
        expect(marsDistance).toBeGreaterThan(300); // Mars should be beyond the constraint
      }

      if (jupiter) {
        const jupiterDistance = Math.sqrt(
          Math.pow(jupiter.position.x - systemX, 2) + 
          Math.pow(jupiter.position.y - systemY, 2)
        );
        console.log(`Jupiter distance from system center: ${jupiterDistance}`);
        expect(jupiterDistance).toBeGreaterThan(300); // Jupiter should be beyond the constraint
      }
    });

    it('should allow movement to planets after constraint is removed', () => {
      // This test should pass after the bug fix
      const galaxy = worldManager.getGalaxy();
      const solSystem = galaxy.sectors[0].systems[0];
      
      // Test with multiple planets that were previously unreachable
      const planetsToTest = [
        solSystem.planets.find(p => p.id === 'earth'),
        solSystem.planets.find(p => p.id === 'mars'),
        solSystem.planets.find(p => p.id === 'jupiter')
      ];

      planetsToTest.forEach(planet => {
        if (planet) {
          // Reset ship to system center
          testShip.location.coordinates = createLayeredPosition(solSystem.position.x, solSystem.position.y, 'ship');
          testShip.location.isInTransit = false;
          
          // Calculate distance from system center
          const distance = Math.sqrt(
            Math.pow(planet.position.x - solSystem.position.x, 2) + 
            Math.pow(planet.position.y - solSystem.position.y, 2)
          );
          
          console.log(`Testing movement to ${planet.name} at distance ${distance}`);
          
          // Attempt to move to planet
          const success = worldManager.moveShipToCoordinates(planet.position.x, planet.position.y);
          expect(success).toBe(true);
          
          // After the bug fix, ship should be able to start moving to this planet
          expect(testShip.location.isInTransit).toBe(true);
        }
      });
    });
  });
});