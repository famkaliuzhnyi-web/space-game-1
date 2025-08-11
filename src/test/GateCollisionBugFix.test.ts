import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorldManager } from '../systems/WorldManager';
import { SceneManager } from '../engine/SceneManager';
import { Ship } from '../types/player';
import { createShipCoords } from '../utils/coordinates';

describe('Gate Collision Bug Reproduction', () => {
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

  it('should fix the gate collision bug when SceneManager is set before PlayerShip', () => {
    /**
     * This test reproduces the exact bug scenario:
     * 1. Engine creates SceneManager and sets it in WorldManager
     * 2. Position callback is set but no ship actor exists yet - THIS WAS THE BUG
     * 3. Later, PlayerShip is set and ship actor is created
     * 4. The position callback should work during movement
     */

    // STEP 1: Set scene manager first (like Engine does)
    console.log('Step 1: Setting SceneManager first (mimics Engine initialization)');
    worldManager.setSceneManager(sceneManager);

    // STEP 2: Set player ship later (like Engine does after initialization)
    console.log('Step 2: Setting PlayerShip after SceneManager (mimics Engine ship setup)');
    
    // Position ship near a gate for faster testing
    const currentSystem = worldManager.getCurrentSystem();
    expect(currentSystem).toBeDefined();
    expect(currentSystem!.gates.length).toBeGreaterThan(0);
    
    const gate = currentSystem!.gates[0];
    mockShip.location.coordinates = createShipCoords(gate.position.x - 30, gate.position.y - 30);
    
    worldManager.setPlayerShip(mockShip);

    // STEP 3: Verify that position update callback is working
    let callbackTriggered = false;
    let gateUsed = false;

    // Mock checkGateCollisions to verify it gets called during movement
    const checkGateCollisionsSpy = vi.spyOn(worldManager as any, 'checkGateCollisions')
      .mockImplementation(() => {
        callbackTriggered = true;
        console.log('Position update callback triggered - gate collision check called');
        
        // Call the original method for actual collision detection
        const originalMethod = WorldManager.prototype['checkGateCollisions'];
        originalMethod.call(worldManager);
      });

    // Mock useGate method
    const useGateSpy = vi.spyOn(worldManager as any, 'useGate')
      .mockImplementation((gateId: string) => {
        gateUsed = true;
        console.log(`Gate ${gateId} usage triggered`);
        return true;
      });

    // STEP 4: Test ship movement and gate collision
    console.log(`Step 4: Moving ship to gate position to test collision`);
    console.log(`Ship at (${mockShip.location.coordinates!.x}, ${mockShip.location.coordinates!.y}), Gate at (${gate.position.x}, ${gate.position.y})`);
    
    const success = sceneManager.moveShipTo(gate.position.x, gate.position.y);
    expect(success).toBe(true);

    // Simulate movement
    let updateCount = 0;
    while (sceneManager.isPlayerShipMoving() && updateCount < 50 && !gateUsed) {
      sceneManager.update(0.1); // Larger time step for faster movement
      updateCount++;
    }

    console.log(`Movement complete after ${updateCount} updates`);
    console.log('Callback triggered:', callbackTriggered);
    console.log('Gate used:', gateUsed);

    // VERIFICATION: The bug fix should ensure that:
    // 1. Position update callback is triggered during movement
    expect(callbackTriggered).toBe(true);
    
    // 2. Gate collision is detected and gate usage is triggered
    expect(gateUsed).toBe(true);
    expect(useGateSpy).toHaveBeenCalledWith(gate.id);

    // 3. checkGateCollisions was called due to position updates
    expect(checkGateCollisionsSpy).toHaveBeenCalled();

    console.log('✅ Bug fix verified: Gate collision works when SceneManager is set before PlayerShip');
  });

  it('should also work when PlayerShip is set before SceneManager', () => {
    // Test the reverse order to ensure both scenarios work
    
    // Position ship near gate
    const gate = worldManager.getCurrentSystem()!.gates[0];
    mockShip.location.coordinates = createShipCoords(gate.position.x - 30, gate.position.y - 30);

    // Set ship first
    worldManager.setPlayerShip(mockShip);
    
    // Then set scene manager
    worldManager.setSceneManager(sceneManager);

    // Test collision
    let gateUsed = false;
    vi.spyOn(worldManager as any, 'useGate').mockImplementation(() => {
      gateUsed = true;
      return true;
    });

    sceneManager.moveShipTo(gate.position.x, gate.position.y);
    
    // Simulate movement
    for (let i = 0; i < 20; i++) {
      sceneManager.update(0.1);
      if (!sceneManager.isPlayerShipMoving() || gateUsed) break;
    }

    expect(gateUsed).toBe(true);
    console.log('✅ Both initialization orders work correctly');
  });
});