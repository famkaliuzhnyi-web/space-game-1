/**
 * Gate Navigation Tests
 * Validates that clicking on gates properly triggers inter-sector teleportation
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { WorldManager } from '../systems/WorldManager';
import { InputHandler } from '../engine/InputHandler';
import { Ship } from '../types/player';
import { PlayerManager } from '../systems/PlayerManager';

describe('Gate Navigation', () => {
  let worldManager: WorldManager;
  let playerManager: PlayerManager;
  let testShip: Ship;

  beforeEach(() => {
    worldManager = new WorldManager();
    playerManager = new PlayerManager();
    
    // Create a test ship
    testShip = {
      id: 'test-ship-1',
      name: 'Test Ship',
      class: { name: 'Courier', baseSpeed: 100 },
      location: {
        systemId: 'sol-system',
        stationId: 'earth-station',
        coordinates: { x: 100, y: 100, z: 50 },
        isInTransit: false
      },
      equipment: {
        weapons: [],
        shields: [],
        engines: [],
        sensors: [],
        cargo: []
      },
      condition: {
        hull: 1.0,
        engines: 1.0,
        weapons: 1.0,
        shields: 1.0
      },
      cargo: {
        capacity: 100,
        items: new Map()
      }
    } as Ship;

    // Set up the world manager with test ship and player manager
    worldManager.setPlayerShip(testShip);
    worldManager.setPlayerManager(playerManager);
    
    // Give the player enough credits for gate travel
    const player = playerManager.getPlayer();
    player.credits = 1000;
  });

  test('should find gates in current system', () => {
    // Get visible objects in Sol system
    const objects = worldManager.getAllVisibleObjects();
    
    // Sol system should have gates to other sectors
    const gates = objects.filter(obj => obj.type === 'gate');
    expect(gates.length).toBeGreaterThan(0);
    
    // Check that gates have proper properties
    const firstGate = gates[0];
    expect(firstGate.object).toHaveProperty('id');
    expect(firstGate.object).toHaveProperty('name');
    expect(firstGate.position).toHaveProperty('x');
    expect(firstGate.position).toHaveProperty('y');
  });

  test('should navigate to gate when clicked', () => {
    // Get available targets (should include gates)
    const targets = worldManager.getAvailableTargets();
    const gateTargets = targets.filter(t => t.type === 'gate');
    
    expect(gateTargets.length).toBeGreaterThan(0);
    
    const firstGate = gateTargets[0];
    const originalSector = worldManager.getGalaxy().currentPlayerLocation.sectorId;
    
    // Navigate to the gate (this should trigger teleportation)
    const success = worldManager.navigateToTarget(firstGate.id);
    
    expect(success).toBe(true);
    
    // Check if we moved to a different sector
    const newSector = worldManager.getGalaxy().currentPlayerLocation.sectorId;
    expect(newSector).not.toBe(originalSector);
  });

  test('should handle gate click through InputHandler', () => {
    // Get a gate from visible objects
    const objects = worldManager.getAllVisibleObjects();
    const gateObject = objects.find(obj => obj.type === 'gate');
    
    expect(gateObject).toBeDefined();
    
    if (gateObject) {
      const originalSector = worldManager.getGalaxy().currentPlayerLocation.sectorId;
      
      // Simulate clicking on the gate coordinates
      InputHandler.handleWorldClick(
        gateObject.position.x, 
        gateObject.position.y, 
        worldManager, 
        'command'
      );
      
      // Check if we moved to a different sector
      const newSector = worldManager.getGalaxy().currentPlayerLocation.sectorId;
      expect(newSector).not.toBe(originalSector);
    }
  });

  test('should deduct energy cost when using gate', () => {
    const player = playerManager.getPlayer();
    const initialCredits = player.credits;
    
    // Find a gate and use it
    const targets = worldManager.getAvailableTargets();
    const gateTarget = targets.find(t => t.type === 'gate');
    
    expect(gateTarget).toBeDefined();
    
    if (gateTarget) {
      worldManager.navigateToTarget(gateTarget.id);
      
      // Credits should be reduced by gate energy cost
      expect(player.credits).toBeLessThan(initialCredits);
    }
  });

  test('should fail gate navigation with insufficient credits', () => {
    const player = playerManager.getPlayer();
    player.credits = 10; // Very low credits
    
    // Try to use a gate
    const targets = worldManager.getAvailableTargets();
    const gateTarget = targets.find(t => t.type === 'gate');
    
    expect(gateTarget).toBeDefined();
    
    if (gateTarget) {
      const originalSector = worldManager.getGalaxy().currentPlayerLocation.sectorId;
      const success = worldManager.navigateToTarget(gateTarget.id);
      
      // Navigation should fail
      expect(success).toBe(false);
      
      // Should still be in the same sector
      const newSector = worldManager.getGalaxy().currentPlayerLocation.sectorId;
      expect(newSector).toBe(originalSector);
    }
  });

  test('should update ship coordinates after gate travel', () => {
    const targets = worldManager.getAvailableTargets();
    const gateTarget = targets.find(t => t.type === 'gate');
    
    expect(gateTarget).toBeDefined();
    
    if (gateTarget) {
      const originalCoordinates = { ...testShip.location.coordinates };
      
      worldManager.navigateToTarget(gateTarget.id);
      
      // Ship coordinates should be updated to destination system
      expect(testShip.location.coordinates).not.toEqual(originalCoordinates);
      expect(testShip.location.isInTransit).toBe(false);
      expect(testShip.location.stationId).toBeUndefined(); // Should arrive in space
    }
  });

  test('should clear station docking status when using gate', () => {
    // Start docked at a station
    testShip.location.stationId = 'earth-station';
    playerManager.setCurrentStation('earth-station');
    
    expect(playerManager.getCurrentStation()).toBe('earth-station');
    
    // Use a gate
    const targets = worldManager.getAvailableTargets();
    const gateTarget = targets.find(t => t.type === 'gate');
    
    if (gateTarget) {
      worldManager.navigateToTarget(gateTarget.id);
      
      // Should no longer be docked
      expect(testShip.location.stationId).toBeUndefined();
      expect(playerManager.getCurrentStation()).toBeFalsy(); // Can be null or empty string
    }
  });
});