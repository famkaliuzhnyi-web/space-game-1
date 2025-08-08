import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationManager, TravelPlan } from '../systems/NavigationManager';
import { TimeManager } from '../systems/TimeManager';
import { Ship, ShipClass } from '../types/player';
import { NavigationTarget } from '../types/world';

describe('NavigationManager', () => {
  let navigationManager: NavigationManager;
  let timeManager: TimeManager;
  let mockShip: Ship;
  let testDestination: NavigationTarget;
  let testOrigin: NavigationTarget;

  beforeEach(() => {
    timeManager = new TimeManager();
    navigationManager = new NavigationManager(timeManager);
    
    const shipClass: ShipClass = {
      id: 'test-class',
      name: 'Test Ship',
      category: 'transport',
      baseCargoCapacity: 100,
      baseFuelCapacity: 50,
      baseSpeed: 100,
      baseShields: 25,
      equipmentSlots: {
        engines: 1,
        cargo: 2,
        shields: 1,
        weapons: 1,
        utility: 1
      }
    };

    mockShip = {
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
        systemId: 'test-system',
        stationId: 'origin-station',
        isInTransit: false
      }
    };

    testOrigin = {
      type: 'station',
      id: 'origin-station',
      name: 'Origin Station',
      position: { x: 0, y: 0 },
      distance: 0,
      estimatedTravelTime: 0
    };

    testDestination = {
      type: 'station',
      id: 'destination-station',
      name: 'Destination Station',
      position: { x: 100, y: 100 },
      distance: 0,
      estimatedTravelTime: 0
    };
  });

  describe('Travel Planning', () => {
    it('should create a travel plan successfully', () => {
      const result = navigationManager.startTravel(mockShip, testDestination, testOrigin);
      
      expect(result.success).toBe(true);
      expect(result.travelPlan).toBeDefined();
      expect(result.travelPlan?.origin).toEqual(testOrigin);
      expect(result.travelPlan?.destination).toEqual(testDestination);
    });

    it('should prevent travel when ship is already in transit', () => {
      mockShip.location.isInTransit = true;
      
      const result = navigationManager.startTravel(mockShip, testDestination, testOrigin);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already in transit');
    });

    it('should update ship location when travel starts', () => {
      navigationManager.startTravel(mockShip, testDestination, testOrigin);
      
      expect(mockShip.location.isInTransit).toBe(true);
      expect(mockShip.location.destination).toBe(testDestination.id);
      expect(mockShip.location.arrivalTime).toBeDefined();
    });
  });

  describe('Travel Progress', () => {
    it('should track travel progress correctly', () => {
      const result = navigationManager.startTravel(mockShip, testDestination, testOrigin);
      expect(result.success).toBe(true);

      const progress = navigationManager.getTravelProgress(mockShip.id);
      expect(progress).toBeDefined();
      expect(progress?.currentProgress).toBe(0);
      expect(progress?.travelPlan).toEqual(result.travelPlan);
    });

    it('should return null for ships not in transit', () => {
      const progress = navigationManager.getTravelProgress(mockShip.id);
      expect(progress).toBeNull();
    });

    it('should calculate remaining time correctly', () => {
      navigationManager.startTravel(mockShip, testDestination, testOrigin);
      
      const progress = navigationManager.getTravelProgress(mockShip.id);
      expect(progress?.remainingTime).toBeGreaterThan(0);
    });
  });

  describe('Travel Completion', () => {
    it('should handle travel completion', () => {
      const result = navigationManager.startTravel(mockShip, testDestination, testOrigin);
      expect(result.success).toBe(true);

      // Fast-forward time to completion
      if (result.travelPlan) {
        const travelTime = result.travelPlan.estimatedArrivalTime.getTime() - Date.now();
        timeManager.addTime(travelTime + 1000); // Add a bit extra to ensure completion
      }

      navigationManager.update();

      // The travel should no longer be active
      const activeTravels = navigationManager.getActiveTravels();
      expect(activeTravels.length).toBe(0);
    });

    it('should maintain travel history', () => {
      const result = navigationManager.startTravel(mockShip, testDestination, testOrigin);
      expect(result.success).toBe(true);

      // Complete the travel
      if (result.travelPlan) {
        const travelTime = result.travelPlan.estimatedArrivalTime.getTime() - Date.now();
        timeManager.addTime(travelTime + 1000);
      }

      navigationManager.update();

      const history = navigationManager.getTravelHistory(mockShip.id);
      expect(history.length).toBe(1);
      expect(history[0].status).toBe('completed');
    });
  });

  describe('Travel Cancellation', () => {
    it('should cancel active travel successfully', () => {
      navigationManager.startTravel(mockShip, testDestination, testOrigin);
      
      const result = navigationManager.cancelTravel(mockShip.id);
      expect(result.success).toBe(true);
      
      const activeTravels = navigationManager.getActiveTravels();
      expect(activeTravels.length).toBe(0);
    });

    it('should handle cancelling non-existent travel', () => {
      const result = navigationManager.cancelTravel('non-existent-ship');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No active travel found');
    });
  });

  describe('Distance and Time Calculations', () => {
    it('should calculate travel time correctly', () => {
      const estimatedTime = navigationManager.estimateTravelTime(testOrigin, testDestination);
      expect(estimatedTime).toBeGreaterThan(0);
    });

    it('should consider ship speed in calculations', () => {
      // Test with different ship speeds
      const baseTime = navigationManager.estimateTravelTime(testOrigin, testDestination, 100);
      const fasterTime = navigationManager.estimateTravelTime(testOrigin, testDestination, 200);
      
      expect(fasterTime).toBeLessThan(baseTime);
    });

    it('should handle 3D coordinates', () => {
      const origin3D: NavigationTarget = {
        ...testOrigin,
        position: { x: 0, y: 0, z: 0 }
      };
      
      const destination3D: NavigationTarget = {
        ...testDestination,
        position: { x: 100, y: 100, z: 100 }
      };

      const estimatedTime = navigationManager.estimateTravelTime(origin3D, destination3D);
      expect(estimatedTime).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should save and restore state correctly', () => {
      navigationManager.startTravel(mockShip, testDestination, testOrigin);
      
      const state = navigationManager.getState();
      expect(state.activeTravels.length).toBe(1);
      
      const newNavigationManager = new NavigationManager(timeManager);
      newNavigationManager.setState(state);
      
      const restoredTravels = newNavigationManager.getActiveTravels();
      expect(restoredTravels.length).toBe(1);
      expect(restoredTravels[0].shipId).toBe(mockShip.id);
    });
  });

  describe('Equipment Integration', () => {
    it('should consider engine equipment in speed calculations', () => {
      // Add engine equipment
      mockShip.equipment.engines.push({
        id: 'enhanced-engine',
        name: 'Enhanced Engine',
        type: 'engine',
        effects: {
          speed: 50
        },
        condition: 1.0
      });

      const result = navigationManager.startTravel(mockShip, testDestination, testOrigin);
      expect(result.success).toBe(true);
      
      // Travel should be faster with enhanced engines
      expect(result.travelPlan?.travelSpeed).toBeGreaterThan(100);
    });

    it('should consider ship condition in speed calculations', () => {
      mockShip.condition.engines = 0.5; // 50% engine condition
      
      const result = navigationManager.startTravel(mockShip, testDestination, testOrigin);
      expect(result.success).toBe(true);
      
      // Travel should be slower with damaged engines
      expect(result.travelPlan?.travelSpeed).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero distance travel', () => {
      const sameLocation = { ...testOrigin };
      const result = navigationManager.startTravel(mockShip, sameLocation, testOrigin);
      
      // Should still create a travel plan but with minimal time
      expect(result.success).toBe(true);
      expect(result.travelPlan?.actualTravelTime).toBeGreaterThan(0);
    });

    it('should enforce minimum travel speed', () => {
      mockShip.condition.engines = 0.01; // Nearly destroyed engines
      
      const result = navigationManager.startTravel(mockShip, testDestination, testOrigin);
      expect(result.success).toBe(true);
      
      // Should enforce minimum speed
      expect(result.travelPlan?.travelSpeed).toBeGreaterThanOrEqual(10);
    });
  });
});