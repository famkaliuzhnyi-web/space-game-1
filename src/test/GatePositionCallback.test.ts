import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorldManager } from '../systems/WorldManager';
import { SceneManager } from '../engine/SceneManager';
import { Ship } from '../types/player';
import { createShipCoords } from '../utils/coordinates';

describe('Gate Position Update Integration', () => {
  let worldManager: WorldManager;
  let sceneManager: SceneManager;
  let mockShip: Ship;

  beforeEach(() => {
    worldManager = new WorldManager();
    sceneManager = new SceneManager();

    // Create a mock ship
    mockShip = {
      id: 'test-ship',
      name: 'Test Ship',
      class: {
        id: 'courier',
        name: 'Courier',
        category: 'courier',
        description: 'Fast messenger ship',
        baseSpeed: 120,
        baseCargo: 10,
        baseHull: 50,
        baseShield: 25,
        baseFuel: 100,
        cost: 50000,
        requiredLicense: 'basic'
      },
      location: {
        systemId: 'sol-system',
        coordinates: createShipCoords(100, 100),
        isInTransit: false
      },
      equipment: {
        weapons: [],
        shields: [],
        engines: [],
        cargoHolds: [],
        utilities: []
      },
      condition: {
        hull: 1.0,
        shield: 1.0,
        engines: 1.0,
        weapons: 1.0,
        utilities: 1.0
      },
      cargo: [],
      fuel: 100
    } as Ship;
  });

  describe('Position Update Callback Setup', () => {
    it('should set up position update callback when scene manager is connected', () => {
      // First set the ship
      worldManager.setPlayerShip(mockShip);
      
      // Then connect scene manager - this should set up the callback
      worldManager.setSceneManager(sceneManager);
      
      // Verify that the callback was set by checking if the scene manager has a ship actor
      const shipActor = sceneManager.getPlayerShipActor();
      expect(shipActor).toBeDefined();
      
      // Mock the checkGateCollisions method to verify it gets called
      let callbackTriggered = false;
      const checkGateCollisionsSpy = vi.spyOn(worldManager as any, 'checkGateCollisions')
        .mockImplementation(() => {
          callbackTriggered = true;
        });
      
      // Start ship movement
      const success = sceneManager.moveShipTo(200, 200);
      expect(success).toBe(true);
      
      // Simulate movement updates
      for (let i = 0; i < 5; i++) {
        sceneManager.update(0.016); // 60fps
        
        if (!sceneManager.isPlayerShipMoving()) {
          break;
        }
      }
      
      // Verify callback was triggered during movement
      expect(callbackTriggered).toBe(true);
    });

    it('should properly connect position callback when ship is set after scene manager', () => {
      // Connect scene manager first
      worldManager.setSceneManager(sceneManager);
      
      // Then set the ship - this should also set up the callback
      worldManager.setPlayerShip(mockShip);
      
      // Verify ship actor is created
      const shipActor = sceneManager.getPlayerShipActor();
      expect(shipActor).toBeDefined();
      
      // Test callback functionality
      let callbackTriggered = false;
      const checkGateCollisionsSpy = vi.spyOn(worldManager as any, 'checkGateCollisions')
        .mockImplementation(() => {
          callbackTriggered = true;
        });
      
      // Start movement
      sceneManager.moveShipTo(200, 200);
      
      // Simulate updates
      for (let i = 0; i < 5; i++) {
        sceneManager.update(0.016);
        if (!sceneManager.isPlayerShipMoving()) break;
      }
      
      expect(callbackTriggered).toBe(true);
    });

    it('should detect gate collision when ship moves to gate position', () => {
      // Set up the world and ship
      worldManager.setSceneManager(sceneManager);
      worldManager.setPlayerShip(mockShip);
      
      // Get a gate from the current system
      const currentSystem = worldManager.getCurrentSystem();
      expect(currentSystem).toBeDefined();
      expect(currentSystem!.gates.length).toBeGreaterThan(0);
      
      const gate = currentSystem!.gates[0];
      console.log('Testing collision with gate:', gate.name, 'at position', gate.position);
      
      // Position ship very close to gate but not colliding yet
      mockShip.location.coordinates = createShipCoords(gate.position.x - 30, gate.position.y - 30);
      worldManager.setPlayerShip(mockShip); // Update position in world manager
      
      // Track position update callback calls
      let positionUpdateCalls = 0;
      let gateUsed = false;
      
      // Mock the checkGateCollisions method to see if it's called
      const checkGateCollisionsSpy = vi.spyOn(worldManager as any, 'checkGateCollisions')
        .mockImplementation(() => {
          positionUpdateCalls++;
          console.log(`checkGateCollisions called ${positionUpdateCalls} times`);
          
          // Call the original method to do actual collision detection
          const originalMethod = WorldManager.prototype['checkGateCollisions'];
          originalMethod.call(worldManager);
        });
      
      // Mock useGate method to track calls
      const useGateSpy = vi.spyOn(worldManager as any, 'useGate')
        .mockImplementation((gateId: string) => {
          gateUsed = true;
          console.log(`Gate ${gateId} usage triggered`);
          return true;
        });
      
      // Start movement directly to gate position
      console.log(`Moving ship from (${mockShip.location.coordinates!.x}, ${mockShip.location.coordinates!.y}) to gate at (${gate.position.x}, ${gate.position.y})`);
      const success = sceneManager.moveShipTo(gate.position.x, gate.position.y);
      expect(success).toBe(true);
      
      // Simulate movement with more updates and longer time steps
      let updateCount = 0;
      const maxUpdates = 200; // More updates
      
      while (sceneManager.isPlayerShipMoving() && updateCount < maxUpdates && !gateUsed) {
        sceneManager.update(0.1); // Larger time step for faster movement
        updateCount++;
        
        // Check current position every 10 updates
        if (updateCount % 10 === 0) {
          const currentPos = mockShip.location.coordinates;
          if (currentPos) {
            const distance = Math.sqrt(
              Math.pow(currentPos.x - gate.position.x, 2) + 
              Math.pow(currentPos.y - gate.position.y, 2)
            );
            
            console.log(`Update ${updateCount}: Ship at (${currentPos.x.toFixed(1)}, ${currentPos.y.toFixed(1)}), distance to gate: ${distance.toFixed(1)}`);
            
            // If we're close enough, collision should happen
            if (distance <= 25) {
              console.log(`Ship within collision radius! Distance: ${distance.toFixed(2)}, Gate used: ${gateUsed}`);
            }
          }
        }
      }
      
      console.log(`Movement simulation complete after ${updateCount} updates`);
      console.log('Final ship moving state:', sceneManager.isPlayerShipMoving());
      console.log('Position update calls:', positionUpdateCalls);
      console.log('Gate used:', gateUsed);
      
      // At minimum, the position update callback should have been called
      expect(positionUpdateCalls).toBeGreaterThan(0);
      
      // The gate should have been used during movement if position updates are working
      if (positionUpdateCalls > 0) {
        expect(gateUsed).toBe(true);
        expect(useGateSpy).toHaveBeenCalledWith(gate.id);
      }
    });
  });
});