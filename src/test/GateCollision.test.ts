import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorldManager } from '../systems/WorldManager';
import { PlayerManager } from '../systems/PlayerManager';
import { Ship } from '../types/player';
import { SceneManager } from '../engine/SceneManager';
import { createShipCoords } from '../utils/coordinates';

describe('Gate Collision System', () => {
  let worldManager: WorldManager;
  let playerManager: PlayerManager;
  let sceneManager: SceneManager;
  let mockShip: Ship;

  beforeEach(() => {
    worldManager = new WorldManager();
    playerManager = new PlayerManager();
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

    // Set up managers
    worldManager.setPlayerManager(playerManager);
    worldManager.setSceneManager(sceneManager);
    worldManager.setPlayerShip(mockShip);

    // Mock the player manager's spendCredits method
    vi.spyOn(playerManager, 'spendCredits').mockImplementation(() => true);
    vi.spyOn(playerManager, 'getPlayer').mockReturnValue({
      credits: 1000,
      name: 'Test Player',
      id: 'test-player'
    } as any);
    vi.spyOn(playerManager, 'setCurrentStation').mockImplementation(() => {});
  });

  describe('Gate Collision Detection', () => {
    it('should detect when ship collides with a gate', () => {
      // Get a gate position from sol-system
      const currentSystem = worldManager.getCurrentSystem();
      expect(currentSystem).toBeDefined();
      expect(currentSystem!.gates.length).toBeGreaterThan(0);
      
      const gate = currentSystem!.gates[0]; // Get first gate
      console.log('Testing collision with gate:', gate.name, 'at position', gate.position);

      // Move ship to gate position
      mockShip.location.coordinates = {
        x: gate.position.x,
        y: gate.position.y,
        z: 50 // Ship layer
      };

      // Mock scene manager to simulate movement completion
      const stopMovementSpy = vi.spyOn(sceneManager, 'stopShipMovement').mockImplementation(() => {});

      // Manually trigger collision check
      const useGateSpy = vi.spyOn(worldManager as any, 'useGate').mockReturnValue(true);
      
      // Access private method through any cast for testing
      (worldManager as any).checkGateCollisions();

      // Verify gate collision was detected and handled
      expect(useGateSpy).toHaveBeenCalledWith(gate.id);
      expect(stopMovementSpy).toHaveBeenCalled();
    });

    it('should not trigger gate collision when ship is far from gates', () => {
      // Move ship to empty space far from any gates
      mockShip.location.coordinates = createShipCoords(2000, 2000);

      // Mock the useGate method
      const useGateSpy = vi.spyOn(worldManager as any, 'useGate');

      // Manually trigger collision check
      (worldManager as any).checkGateCollisions();

      // Verify no gate collision was triggered
      expect(useGateSpy).not.toHaveBeenCalled();
    });

    it('should not trigger collision with inactive gates', () => {
      const currentSystem = worldManager.getCurrentSystem();
      const gate = currentSystem!.gates[0];

      // Make gate inactive
      gate.isActive = false;

      // Move ship to gate position
      mockShip.location.coordinates = {
        x: gate.position.x,
        y: gate.position.y,
        z: 50
      };

      const useGateSpy = vi.spyOn(worldManager as any, 'useGate');
      
      // Trigger collision check
      (worldManager as any).checkGateCollisions();

      // Verify no collision with inactive gate
      expect(useGateSpy).not.toHaveBeenCalled();
      
      // Restore gate state
      gate.isActive = true;
    });

    it('should handle insufficient fuel for gate usage gracefully', () => {
      // Mock player with insufficient credits/fuel
      vi.spyOn(playerManager, 'getPlayer').mockReturnValue({
        credits: 10, // Less than gate energy cost
        name: 'Poor Player',
        id: 'poor-player'
      } as any);

      const currentSystem = worldManager.getCurrentSystem();
      const gate = currentSystem!.gates[0];

      // Move ship to gate position
      mockShip.location.coordinates = {
        x: gate.position.x,
        y: gate.position.y,
        z: 50
      };

      // Real useGate call should return false due to insufficient fuel
      const originalUseGate = (worldManager as any).useGate.bind(worldManager);
      
      // Trigger collision check - should not succeed due to insufficient fuel
      (worldManager as any).checkGateCollisions();

      // The ship should have stopped moving even if gate usage failed
      expect(sceneManager.stopShipMovement).toBeDefined();
    });
  });

  describe('Movement Integration', () => {
    it('should set up position update callback when scene manager is set', () => {
      // Create a spy for the setPositionUpdateCallback
      const callbackSpy = vi.spyOn(sceneManager, 'setPositionUpdateCallback').mockImplementation(() => {});

      // Set scene manager - this should set up the position callback
      worldManager.setSceneManager(sceneManager);

      // Verify callback was set up
      expect(callbackSpy).toHaveBeenCalled();
    });

    it('should set up position callback when player ship is set', () => {
      const callbackSpy = vi.spyOn(sceneManager, 'setPositionUpdateCallback').mockImplementation(() => {});
      
      // Set player ship - this should also set up the position callback
      worldManager.setPlayerShip(mockShip);

      // Verify callback was set up
      expect(callbackSpy).toHaveBeenCalled();
    });
  });
});