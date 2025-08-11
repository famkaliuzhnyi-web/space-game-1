import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorldManager } from '../systems/WorldManager';
import { PlayerManager } from '../systems/PlayerManager';
import { Ship } from '../types/player';
import { createShipCoords } from '../utils/coordinates';

describe('Gate Teleportation', () => {
  let worldManager: WorldManager;
  let playerManager: PlayerManager;
  let mockShip: Ship;

  beforeEach(() => {
    worldManager = new WorldManager();
    playerManager = new PlayerManager();
    
    // Create a mock ship for testing
    mockShip = {
      id: 'test-ship-1',
      name: 'Test Ship',
      class: {
        id: 'courier',
        name: 'Light Courier',
        category: 'courier',
        baseCargoCapacity: 20,
        baseFuelCapacity: 100,
        baseSpeed: 25,
        baseShields: 50,
        equipmentSlots: { engines: 1, cargo: 1, shields: 1, weapons: 1, utility: 1 }
      },
      cargo: {
        capacity: 20,
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
        coordinates: createShipCoords(100, 100),
        isInTransit: false
      }
    };

    // Set up player manager with sufficient credits
    vi.spyOn(playerManager, 'getPlayer').mockReturnValue({
      id: 'test-player',
      name: 'Test Player',
      credits: 1000,
      currentStationId: 'earth-station',
      currentShipId: 'test-ship-1',
      ownedShips: new Map([['test-ship-1', mockShip]]),
      reputation: new Map(),
      contracts: [],
      achievements: [],
      statistics: {
        totalCreditsEarned: 0,
        totalDistanceTraveled: 0,
        totalCargoTransported: 0,
        missionsCompleted: 0,
        combatVictories: 0,
        systemsVisited: new Set(),
        stationsVisited: new Set(),
        timePlayed: 0
      }
    });
    
    vi.spyOn(playerManager, 'spendCredits').mockImplementation(() => true);
    vi.spyOn(playerManager, 'setCurrentStation').mockImplementation(() => {});

    worldManager.setPlayerShip(mockShip);
    worldManager.setPlayerManager(playerManager);
  });

  describe('Gate Usage', () => {
    it('should successfully teleport through a gate with sufficient fuel', () => {
      // Use the Frontier Gate in Sol system
      const success = worldManager.navigateToTarget('gate-to-frontier');
      
      expect(success).toBe(true);
      
      // Check that player location was updated
      const galaxy = worldManager.getGalaxy();
      expect(galaxy.currentPlayerLocation.sectorId).toBe('frontier-sector');
      expect(galaxy.currentPlayerLocation.systemId).toBe('kepler-442');
      expect(galaxy.currentPlayerLocation.stationId).toBeUndefined(); // Should arrive in space
      
      // Check that fuel cost was deducted (50 credits)
      expect(playerManager.spendCredits).toHaveBeenCalledWith(50);
      
      // Check that ship location was updated
      expect(mockShip.location.systemId).toBe('kepler-442');
      expect(mockShip.location.stationId).toBeUndefined();
      expect(mockShip.location.isInTransit).toBe(false);
      expect(mockShip.location.coordinates).toBeDefined();
    });

    it('should fail to use gate with insufficient fuel', () => {
      // Mock insufficient credits
      vi.spyOn(playerManager, 'getPlayer').mockReturnValue({
        id: 'test-player',
        name: 'Test Player',
        credits: 25, // Less than required 50
        currentStationId: 'earth-station',
        currentShipId: 'test-ship-1',
        ownedShips: new Map([['test-ship-1', mockShip]]),
        reputation: new Map(),
        contracts: [],
        achievements: [],
        statistics: {
          totalCreditsEarned: 0,
          totalDistanceTraveled: 0,
          totalCargoTransported: 0,
          missionsCompleted: 0,
          combatVictories: 0,
          systemsVisited: new Set(),
          stationsVisited: new Set(),
          timePlayed: 0
        }
      });

      const success = worldManager.navigateToTarget('gate-to-frontier');
      
      expect(success).toBe(false);
      
      // Check that player location was NOT updated
      const galaxy = worldManager.getGalaxy();
      expect(galaxy.currentPlayerLocation.sectorId).toBe('core-sector'); // Should remain in original sector
      expect(galaxy.currentPlayerLocation.systemId).toBe('sol-system');
      
      // Check that fuel cost was NOT deducted
      expect(playerManager.spendCredits).not.toHaveBeenCalled();
    });

    it('should handle different gate destinations correctly', () => {
      // Test Industrial Gate
      let success = worldManager.navigateToTarget('gate-to-industrial');
      expect(success).toBe(true);
      
      let galaxy = worldManager.getGalaxy();
      expect(galaxy.currentPlayerLocation.sectorId).toBe('industrial-sector');
      expect(galaxy.currentPlayerLocation.systemId).toBe('bernard-star');

      // Reset to Sol system for next test
      galaxy.currentPlayerLocation.sectorId = 'core-sector';
      galaxy.currentPlayerLocation.systemId = 'sol-system';
      
      // Test Mining Gate
      success = worldManager.navigateToTarget('gate-to-mining');
      expect(success).toBe(true);
      
      galaxy = worldManager.getGalaxy();
      expect(galaxy.currentPlayerLocation.sectorId).toBe('mining-sector');
      expect(galaxy.currentPlayerLocation.systemId).toBe('mining-belt-alpha');
    });

    it('should fail for invalid gate IDs', () => {
      const success = worldManager.navigateToTarget('invalid-gate-id');
      expect(success).toBe(false);
      
      // Check that player location was NOT updated
      const galaxy = worldManager.getGalaxy();
      expect(galaxy.currentPlayerLocation.sectorId).toBe('core-sector');
      expect(galaxy.currentPlayerLocation.systemId).toBe('sol-system');
    });

    it('should handle gates with different energy costs', () => {
      // Mining gate has higher energy cost (60)
      const success = worldManager.navigateToTarget('gate-to-mining');
      expect(success).toBe(true);
      
      // Should deduct 60 credits
      expect(playerManager.spendCredits).toHaveBeenCalledWith(60);
    });
  });

  describe('Gate Availability', () => {
    it('should show gates in available targets', () => {
      const targets = worldManager.getAvailableTargets();
      const gateTargets = targets.filter(t => t.type === 'gate');
      
      expect(gateTargets.length).toBeGreaterThan(0);
      
      // Check that gates have proper properties
      gateTargets.forEach(gate => {
        expect(gate.type).toBe('gate');
        expect(gate.id).toBeDefined();
        expect(gate.name).toBeDefined();
        expect(gate.position).toBeDefined();
        expect(gate.distance).toBeDefined();
        expect(gate.estimatedTravelTime).toBeDefined();
      });
    });

    it('should include gates in reachable targets', () => {
      const gateTargets = worldManager.getAllReachableGates();
      
      expect(gateTargets.length).toBeGreaterThan(0);
      
      // Verify gates are from current system only (Sol system)
      const currentSystem = worldManager.getCurrentSystem();
      expect(currentSystem?.id).toBe('sol-system');
      
      gateTargets.forEach(gate => {
        expect(gate.type).toBe('gate');
        // Verify the gate exists in current system
        const systemGate = currentSystem!.gates.find(g => g.id === gate.id);
        expect(systemGate).toBeDefined();
      });
    });
  });
});