import { describe, it, expect, beforeEach } from 'vitest';
import { NavigationManager } from '../systems/NavigationManager';
import { PlayerManager } from '../systems/PlayerManager';
import { WorldManager } from '../systems/WorldManager';
import { TimeManager } from '../systems/TimeManager';
import { NavigationTarget } from '../types/world';

describe('Navigation Integration', () => {
  let navigationManager: NavigationManager;
  let playerManager: PlayerManager;
  let worldManager: WorldManager;
  let timeManager: TimeManager;

  beforeEach(() => {
    timeManager = new TimeManager();
    navigationManager = new NavigationManager(timeManager);
    playerManager = new PlayerManager();
    worldManager = new WorldManager();
    
    // Set up dependencies
    playerManager.setNavigationManager(navigationManager);
    playerManager.setWorldManager(worldManager);
    worldManager.setPlayerManager(playerManager);
  });

  describe('handleNavigate Integration', () => {
    it('should start travel using PlayerManager.startTravel', () => {
      // Get available targets
      const targets = worldManager.getAvailableTargets();
      expect(targets.length).toBeGreaterThan(0);
      
      const target = targets[0];
      
      // Verify ship is not initially in transit
      expect(playerManager.isInTransit()).toBe(false);
      
      // Start travel
      const result = playerManager.startTravel(target);
      
      // Debug: Log the result to see what's happening
      if (!result.success) {
        console.log('Travel failed:', result.error);
      }
      
      expect(result.success).toBe(true);
      expect(result.travelPlan).toBeDefined();
      expect(result.travelPlan?.destination).toEqual(target);
      
      // Verify ship is now in transit
      expect(playerManager.isInTransit()).toBe(true);
    });

    it('should prevent starting travel when already in transit', () => {
      const targets = worldManager.getAvailableTargets();
      const target = targets[0];
      
      // Start first travel
      const firstResult = playerManager.startTravel(target);
      expect(firstResult.success).toBe(true);
      
      // Try to start second travel
      const secondResult = playerManager.startTravel(target);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already in transit');
    });

    it('should estimate travel time correctly', () => {
      const targets = worldManager.getAvailableTargets();
      const target = targets[0];
      
      const estimatedTime = playerManager.estimateTravelTime(target);
      expect(estimatedTime).toBeGreaterThan(0);
      expect(typeof estimatedTime).toBe('number');
    });

    it('should track travel progress', () => {
      const targets = worldManager.getAvailableTargets();
      const target = targets[0];
      
      // Start travel
      playerManager.startTravel(target);
      
      // Check travel progress
      const progress = playerManager.getTravelProgress();
      expect(progress).not.toBeNull();
      expect(progress?.currentProgress).toBe(0);
      expect(progress?.travelPlan.destination).toEqual(target);
    });

    it('should handle navigation to different target types', () => {
      const targets = worldManager.getAvailableTargets();
      
      // Find different types of targets
      const systemTarget = targets.find(t => t.type === 'system');
      const stationTarget = targets.find(t => t.type === 'station');
      
      if (systemTarget) {
        const systemResult = playerManager.startTravel(systemTarget);
        expect(systemResult.success).toBe(true);
        
        // Cancel travel and verify cancellation worked
        const cancelResult = playerManager.cancelTravel();
        expect(cancelResult.success).toBe(true);
        expect(playerManager.isInTransit()).toBe(false);
      }
      
      if (stationTarget) {
        const stationResult = playerManager.startTravel(stationTarget);
        expect(stationResult.success).toBe(true);
      }
    });
  });

  describe('Navigation Target Enhancement', () => {
    it('should provide accurate travel time estimates', () => {
      const targets = worldManager.getAvailableTargets();
      
      targets.forEach(target => {
        const managerEstimate = playerManager.estimateTravelTime(target);
        const worldManagerEstimate = target.estimatedTravelTime;
        
        // NavigationManager should provide more accurate estimates
        expect(managerEstimate).toBeGreaterThan(0);
        expect(typeof managerEstimate).toBe('number');
        
        // The estimates might differ, but both should be positive
        expect(worldManagerEstimate).toBeGreaterThan(0);
      });
    });

    it('should handle travel time conversion from milliseconds to hours', () => {
      const targets = worldManager.getAvailableTargets();
      const target = targets[0];
      
      const timeInMs = playerManager.estimateTravelTime(target);
      const timeInHours = timeInMs / (60 * 60 * 1000);
      
      expect(timeInHours).toBeGreaterThan(0);
      expect(timeInHours).toBeLessThan(24); // Should be reasonable travel time
    });
  });
});