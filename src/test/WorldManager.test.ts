import { describe, it, expect, beforeEach } from 'vitest';
import { WorldManager } from '../../src/systems/WorldManager';

describe('WorldManager', () => {
  let worldManager: WorldManager;

  beforeEach(() => {
    worldManager = new WorldManager();
  });

  describe('Galaxy initialization', () => {
    it('should create a galaxy with sectors', () => {
      const galaxy = worldManager.getGalaxy();
      expect(galaxy).toBeDefined();
      expect(galaxy.sectors).toHaveLength(1);
      expect(galaxy.sectors[0].id).toBe('alpha-sector');
    });

    it('should initialize with Sol System as starting location', () => {
      const galaxy = worldManager.getGalaxy();
      expect(galaxy.currentPlayerLocation.sectorId).toBe('alpha-sector');
      expect(galaxy.currentPlayerLocation.systemId).toBe('sol-system');
      expect(galaxy.currentPlayerLocation.stationId).toBe('earth-station');
    });
  });

  describe('Navigation', () => {
    it('should get current sector', () => {
      const sector = worldManager.getCurrentSector();
      expect(sector).toBeDefined();
      expect(sector?.name).toBe('Alpha Sector');
    });

    it('should get current system', () => {
      const system = worldManager.getCurrentSystem();
      expect(system).toBeDefined();
      expect(system?.name).toBe('Sol System');
    });

    it('should get current station', () => {
      const station = worldManager.getCurrentStation();
      expect(station).toBeDefined();
      expect(station?.name).toBe('Earth Station Alpha');
      expect(station?.type).toBe('trade');
    });

    it('should get available navigation targets', () => {
      const targets = worldManager.getAvailableTargets();
      expect(targets.length).toBeGreaterThan(0);
      
      // Should find other systems in the sector
      const systemTargets = targets.filter(t => t.type === 'system');
      expect(systemTargets.length).toBeGreaterThan(0);
      
      // Distance should be calculated
      targets.forEach(target => {
        expect(target.distance).toBeGreaterThan(0);
        expect(target.estimatedTravelTime).toBeGreaterThan(0);
      });
    });

    it('should navigate to a different system', () => {
      const targets = worldManager.getAvailableTargets();
      const systemTarget = targets.find(t => t.type === 'system');
      
      if (systemTarget) {
        const success = worldManager.navigateToTarget(systemTarget.id);
        expect(success).toBe(true);
        
        const newSystem = worldManager.getCurrentSystem();
        expect(newSystem?.id).toBe(systemTarget.id);
        
        // Should no longer be docked at a station
        const station = worldManager.getCurrentStation();
        expect(station).toBeUndefined();
      }
    });
  });

  describe('World objects', () => {
    it('should return visible objects in current system', () => {
      const objects = worldManager.getAllVisibleObjects();
      expect(objects.length).toBeGreaterThan(0);
      
      // Should have at least a star and stations
      const stars = objects.filter(obj => obj.type === 'star');
      const stations = objects.filter(obj => obj.type === 'station');
      
      expect(stars.length).toBe(1);
      expect(stations.length).toBeGreaterThan(0);
      
      // All objects should have positions
      objects.forEach(obj => {
        expect(obj.position).toBeDefined();
        expect(typeof obj.position.x).toBe('number');
        expect(typeof obj.position.y).toBe('number');
      });
    });

    it('should handle invalid navigation targets', () => {
      const success = worldManager.navigateToTarget('invalid-target-id');
      expect(success).toBe(false);
      
      // Should remain in original location
      const system = worldManager.getCurrentSystem();
      expect(system?.id).toBe('sol-system');
    });
  });

  describe('Distance calculations', () => {
    it('should calculate distances correctly', () => {
      const targets = worldManager.getAvailableTargets();
      
      // Distances should be positive and reasonable
      targets.forEach(target => {
        expect(target.distance).toBeGreaterThan(0);
        expect(target.distance).toBeLessThan(1000); // Reasonable for our test galaxy
      });
      
      // Closer targets should have shorter travel times
      if (targets.length > 1) {
        const sortedTargets = [...targets].sort((a, b) => a.distance - b.distance);
        expect(sortedTargets[0].estimatedTravelTime).toBeLessThanOrEqual(
          sortedTargets[sortedTargets.length - 1].estimatedTravelTime
        );
      }
    });
  });
});