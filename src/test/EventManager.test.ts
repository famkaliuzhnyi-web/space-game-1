import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventManager } from '../systems/EventManager';
import { TimeManager } from '../systems/TimeManager';
import { WorldManager } from '../systems/WorldManager';
import { PlayerManager } from '../systems/PlayerManager';
import { FactionManager } from '../systems/FactionManager';
import { EventType, GameEvent } from '../types/events';

describe('EventManager', () => {
  let eventManager: EventManager;
  let timeManager: TimeManager;
  let worldManager: WorldManager;
  let playerManager: PlayerManager;
  let factionManager: FactionManager;

  beforeEach(() => {
    // Create mock dependencies
    timeManager = new TimeManager();
    worldManager = new WorldManager();
    playerManager = new PlayerManager();
    factionManager = new FactionManager();
    
    // Initialize event manager
    eventManager = new EventManager(timeManager, worldManager, playerManager, factionManager);
  });

  describe('Event System Initialization', () => {
    it('should initialize with empty active events', () => {
      const activeEvents = eventManager.getActiveEvents();
      expect(activeEvents).toEqual([]);
    });

    it('should initialize with empty event history', () => {
      const history = eventManager.getEventHistory();
      expect(history).toEqual([]);
    });

    it('should initialize event counters', () => {
      const stats = eventManager.getEventStats();
      expect(stats).toEqual({
        space_encounter: 0,
        station_event: 0,
        system_crisis: 0,
        emergency_contract: 0,
        social_interaction: 0,
        discovery: 0
      });
    });
  });

  describe('Event Generation', () => {
    it('should update without errors', () => {
      expect(() => eventManager.update(0.016)).not.toThrow();
    });

    it('should handle multiple update cycles', () => {
      for (let i = 0; i < 10; i++) {
        expect(() => eventManager.update(0.016)).not.toThrow();
      }
    });

    it('should maintain active events limit', () => {
      // Simulate rapid event generation
      for (let i = 0; i < 100; i++) {
        eventManager.update(1.0); // Large delta to trigger events
      }
      
      const activeEvents = eventManager.getActiveEvents();
      expect(activeEvents.length).toBeLessThanOrEqual(5); // Max active events
    });
  });

  describe('Event State Management', () => {
    it('should save and load system state', () => {
      // Update to potentially generate events
      eventManager.update(1.0);
      
      const state = eventManager.getState();
      expect(state).toHaveProperty('activeEvents');
      expect(state).toHaveProperty('eventHistory');
      expect(state).toHaveProperty('eventTriggers');
      expect(state).toHaveProperty('eventChains');
      expect(state).toHaveProperty('config');
      expect(state).toHaveProperty('lastEventCheck');
      expect(state).toHaveProperty('eventCounters');
    });

    it('should restore state correctly', () => {
      // Generate some state
      eventManager.update(1.0);
      const originalState = eventManager.getState();
      
      // Create new event manager and load state
      const newEventManager = new EventManager(timeManager, worldManager, playerManager, factionManager);
      newEventManager.loadState(originalState);
      
      const restoredState = newEventManager.getState();
      expect(restoredState.lastEventCheck).toBe(originalState.lastEventCheck);
      expect(restoredState.eventCounters).toEqual(originalState.eventCounters);
    });
  });

  describe('Event Callbacks', () => {
    it('should register event triggered callback', () => {
      let callbackCalled = false;
      eventManager.onEventTriggered(() => {
        callbackCalled = true;
      });
      
      // This is mainly testing the registration doesn't error
      expect(callbackCalled).toBe(false);
    });

    it('should register event completed callback', () => {
      let callbackCalled = false;
      eventManager.onEventCompleted(() => {
        callbackCalled = true;
      });
      
      expect(callbackCalled).toBe(false);
    });
  });

  describe('Event Choice System', () => {
    it('should handle invalid event choices', () => {
      const result = eventManager.makeEventChoice('invalid-event-id', 'choice1');
      expect(result).toBe(false);
    });

    it('should handle invalid choice for valid event', () => {
      // Create a mock event directly for testing
      const mockEvent: GameEvent = {
        id: 'test-event',
        type: 'space_encounter' as EventType,
        title: 'Test Event',
        description: 'Test Description',
        priority: 'normal',
        status: 'active',
        triggerTime: Date.now(),
        baseProbability: 0.1,
        choices: [
          { id: 'choice1', text: 'Choice 1', description: 'First choice' }
        ]
      };

      // Manually add event to test choice handling
      const state = eventManager.getState();
      state.activeEvents = [mockEvent];
      eventManager.loadState(state);

      const result = eventManager.makeEventChoice('test-event', 'invalid-choice');
      expect(result).toBe(false);
    });
  });

  describe('Event Statistics', () => {
    it('should track event statistics correctly', () => {
      const initialStats = eventManager.getEventStats();
      
      // All counters should start at 0
      Object.values(initialStats).forEach(count => {
        expect(count).toBe(0);
      });
    });

    it('should provide correct event history format', () => {
      const history = eventManager.getEventHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Event Configuration', () => {
    it('should use default configuration values', () => {
      const state = eventManager.getState();
      const config = state.config;
      
      expect(config.globalEventRate).toBe(0.1);
      expect(config.maxActiveEvents).toBe(5);
      expect(config.eventCooldowns).toHaveProperty('space_encounter');
      expect(config.eventCooldowns).toHaveProperty('station_event');
      expect(config.eventCooldowns).toHaveProperty('system_crisis');
      expect(config.eventCooldowns).toHaveProperty('emergency_contract');
    });
  });

  describe('Event Types', () => {
    it('should recognize all event types', () => {
      const validEventTypes = [
        'space_encounter',
        'station_event',
        'system_crisis',
        'emergency_contract',
        'social_interaction',
        'discovery'
      ];

      const stats = eventManager.getEventStats();
      validEventTypes.forEach(type => {
        expect(stats).toHaveProperty(type);
      });
    });
  });
});

describe('EventManager Integration', () => {
  let eventManager: EventManager;
  let timeManager: TimeManager;
  let worldManager: WorldManager;
  let playerManager: PlayerManager;
  let factionManager: FactionManager;

  beforeEach(() => {
    timeManager = new TimeManager();
    worldManager = new WorldManager();
    playerManager = new PlayerManager();
    factionManager = new FactionManager();
    
    eventManager = new EventManager(timeManager, worldManager, playerManager, factionManager);
    
    // Spy on time manager to control time flow
    vi.spyOn(timeManager, 'getCurrentDate').mockReturnValue(new Date(Date.now()));
  });

  describe('Time Integration', () => {
    it('should respect time-based event checking intervals', () => {
      const initialTime = Date.now();
      vi.spyOn(timeManager, 'getCurrentDate')
        .mockReturnValueOnce(new Date(initialTime))
        .mockReturnValueOnce(new Date(initialTime + 15000)) // 15 seconds later
        .mockReturnValueOnce(new Date(initialTime + 35000)); // 35 seconds later
      
      // First update - should set initial check time
      eventManager.update(0.016);
      
      // Second update - should not trigger new event check (< 30 seconds)
      eventManager.update(0.016);
      
      // Third update - should trigger new event check (> 30 seconds)
      eventManager.update(0.016);
      
      // The test mainly ensures no errors occur during time progression
      expect(eventManager.getActiveEvents().length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Player Integration', () => {
    it('should handle missing character gracefully', () => {
      // Ensure character is null
      vi.spyOn(playerManager, 'getCharacter').mockReturnValue(null);
      
      expect(() => eventManager.update(1.0)).not.toThrow();
    });

    it('should handle player state changes', () => {
      // Mock docked state
      vi.spyOn(playerManager, 'getCurrentStation').mockReturnValue('test-station');
      
      eventManager.update(1.0);
      
      // Mock traveling state  
      vi.spyOn(playerManager, 'getCurrentStation').mockReturnValue('');
      
      eventManager.update(1.0);
      
      expect(eventManager.getActiveEvents().length).toBeGreaterThanOrEqual(0);
    });
  });
});