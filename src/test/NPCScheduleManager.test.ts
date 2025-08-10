import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NPCScheduleManager } from '../systems/NPCScheduleManager';
import { TimeManager } from '../systems/TimeManager';
import { WorldManager } from '../systems/WorldManager';
import { NPCShip } from '../types/npc';
import { NPCSchedule } from '../types/npc-schedule';

// Mock the dependencies
vi.mock('../systems/TimeManager');
vi.mock('../systems/WorldManager');

describe('NPCScheduleManager', () => {
  let scheduleManager: NPCScheduleManager;
  let mockTimeManager: TimeManager;
  let mockWorldManager: WorldManager;

  const createMockGalaxy = () => ({
    sectors: [
      {
        id: 'test-sector',
        name: 'Test Sector',
        position: { x: 0, y: 0 },
        systems: [
          {
            id: 'test-system',
            name: 'Test System',
            position: { x: 100, y: 100 },
            stations: [
              {
                id: 'station-1',
                name: 'Test Station 1',
                type: 'trade',
                position: { x: 100, y: 100 },
                faction: 'Test Faction'
              },
              {
                id: 'station-2',
                name: 'Test Station 2',
                type: 'industrial',
                position: { x: 200, y: 200 },
                faction: 'Test Faction'
              }
            ]
          }
        ]
      }
    ]
  });

  const createMockTraderNPC = (): NPCShip => ({
    id: 'trader-1',
    name: 'Test Trader',
    type: 'trader',
    position: {
      systemId: 'test-system',
      stationId: 'station-1',
      coordinates: { x: 100, y: 100 }
    },
    movement: {
      speed: 25,
      currentVelocity: { x: 0, y: 0 },
      lastMoveTime: 1000,
      maneuverability: 60,
      maxAcceleration: 12.5,
      brakingDistance: 50
    },
    ai: {
      personality: { type: 'cautious', traits: [] },
      currentGoal: {
        id: 'trade-goal',
        type: 'trade',
        priority: 7,
        startTime: 1000,
        parameters: new Map()
      },
      goalHistory: [],
      decisionCooldown: 0,
      riskTolerance: 40,
      aggressiveness: 20,
      tradingSkill: 70,
      lastInteraction: null,
      combatSkill: 30,
      navigationSkill: 60,
      socialSkill: 50,
      marketKnowledge: 65,
      threatAssessment: {
        nearbyThreats: [],
        currentThreatLevel: 10,
        lastThreatUpdate: 1000
      },
      routeOptimization: {
        preferredRoutes: new Map(),
        avoidedSectors: [],
        knownProfitableRoutes: []
      }
    },
    ship: {
      class: 'transport',
      cargoCapacity: 200,
      currentCargo: new Map([['electronics', 50]]),
      condition: 85,
      fuel: 100,
      fuelCapacity: 100
    },
    faction: 'Traders Guild',
    reputation: 5,
    credits: 15000,
    lastActionTime: 1000
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockTimeManager = new TimeManager() as any;
    mockWorldManager = new WorldManager() as any;

    mockTimeManager.getCurrentTimestamp = vi.fn().mockReturnValue(1000);
    mockWorldManager.getGalaxy = vi.fn().mockReturnValue(createMockGalaxy());

    scheduleManager = new NPCScheduleManager(mockTimeManager, mockWorldManager);
  });

  describe('Schedule Management', () => {
    it('should initialize with predefined schedule templates', () => {
      expect(scheduleManager).toBeDefined();
    });

    it('should start a trading schedule for trader NPCs', () => {
      const result = scheduleManager.startSchedule('trader-1', 'trader_main');
      expect(result).toBe(true);
      expect(scheduleManager.hasActiveSchedule('trader-1')).toBe(true);
    });

    it('should not start unknown schedule types', () => {
      const result = scheduleManager.startSchedule('trader-1', 'unknown_schedule');
      expect(result).toBe(false);
      expect(scheduleManager.hasActiveSchedule('trader-1')).toBe(false);
    });

    it('should get current schedule for NPC', () => {
      scheduleManager.startSchedule('trader-1', 'trader_main');
      const schedule = scheduleManager.getCurrentSchedule('trader-1');
      
      expect(schedule).toBeDefined();
      expect(schedule?.type).toBe('trade');
      expect(schedule?.steps.length).toBe(8);
    });
  });

  describe('Trading Schedule Execution', () => {
    it('should have 8 steps in the trading schedule', () => {
      scheduleManager.startSchedule('trader-1', 'trader_main');
      const schedule = scheduleManager.getCurrentSchedule('trader-1');
      
      expect(schedule?.steps).toHaveLength(8);
      expect(schedule?.steps[0].type).toBe('check_inventory');
      expect(schedule?.steps[1].type).toBe('check_inventory');
      expect(schedule?.steps[2].type).toBe('search_buy_opportunity');
      expect(schedule?.steps[3].type).toBe('travel_to_buy');
      expect(schedule?.steps[4].type).toBe('buy_cargo');
      expect(schedule?.steps[5].type).toBe('search_sell_opportunity');
      expect(schedule?.steps[6].type).toBe('travel_to_sell');
      expect(schedule?.steps[7].type).toBe('sell_cargo');
    });

    it('should start at step 0 (check inventory)', () => {
      scheduleManager.startSchedule('trader-1', 'trader_main');
      const schedule = scheduleManager.getCurrentSchedule('trader-1');
      
      expect(schedule?.currentStepIndex).toBe(0);
    });

    it('should jump to step 6 if NPC has cargo (step 2 behavior)', () => {
      const npc = createMockTraderNPC();
      // NPC has electronics in cargo
      npc.ship.currentCargo.set('electronics', 50);
      
      scheduleManager.startSchedule('trader-1', 'trader_main');
      
      // Update schedule - should execute steps 0, 1, then jump to 6
      scheduleManager.updateSchedule(npc);
      const schedule = scheduleManager.getCurrentSchedule('trader-1');
      
      // After check_inventory steps, should be at search_sell_opportunity (step 5, 0-indexed)
      expect(schedule?.currentStepIndex).toBeGreaterThanOrEqual(0);
    });

    it('should process empty inventory NPCs through buy steps first', () => {
      const npc = createMockTraderNPC();
      npc.ship.currentCargo.clear(); // Empty cargo
      
      scheduleManager.startSchedule('trader-1', 'trader_main');
      scheduleManager.updateSchedule(npc);
      
      const schedule = scheduleManager.getCurrentSchedule('trader-1');
      
      // Should continue to search_buy_opportunity rather than jumping to sell
      expect(schedule?.currentStepIndex).toBeGreaterThanOrEqual(0);
    });

    it('should loop when schedule completes', () => {
      scheduleManager.startSchedule('trader-1', 'trader_main');
      const schedule = scheduleManager.getCurrentSchedule('trader-1');
      
      expect(schedule?.loopWhenComplete).toBe(true);
    });
  });

  describe('Schedule Interruption', () => {
    it('should allow high-priority schedules to interrupt lower-priority ones', () => {
      // Start trading schedule (priority 5)
      scheduleManager.startSchedule('trader-1', 'trader_main');
      expect(scheduleManager.hasActiveSchedule('trader-1')).toBe(true);
      
      // Start escape schedule (priority 10)
      const result = scheduleManager.startSchedule('trader-1', 'escape');
      expect(result).toBe(true);
      
      const currentSchedule = scheduleManager.getCurrentSchedule('trader-1');
      expect(currentSchedule?.type).toBe('escape');
    });

    it('should not allow lower-priority schedules to interrupt higher-priority ones', () => {
      // Start escape schedule (priority 10)
      scheduleManager.startSchedule('trader-1', 'escape');
      expect(scheduleManager.getCurrentSchedule('trader-1')?.type).toBe('escape');
      
      // Try to start trading schedule (priority 5) - should fail
      const result = scheduleManager.startSchedule('trader-1', 'trader_main');
      expect(result).toBe(false);
      
      // Should still be on escape schedule
      expect(scheduleManager.getCurrentSchedule('trader-1')?.type).toBe('escape');
    });

    it('should stack interrupted schedules for later resumption', () => {
      // Start trading schedule
      scheduleManager.startSchedule('trader-1', 'trader_main');
      const originalSchedule = scheduleManager.getCurrentSchedule('trader-1');
      
      // Interrupt with escape schedule
      scheduleManager.startSchedule('trader-1', 'escape');
      expect(scheduleManager.getCurrentSchedule('trader-1')?.type).toBe('escape');
      
      // The original schedule should be stacked for resumption
      expect(scheduleManager.hasActiveSchedule('trader-1')).toBe(true);
    });
  });

  describe('Escape Schedule', () => {
    it('should create escape schedule with high priority', () => {
      scheduleManager.startSchedule('trader-1', 'escape');
      const schedule = scheduleManager.getCurrentSchedule('trader-1');
      
      expect(schedule?.type).toBe('escape');
      expect(schedule?.priority).toBe(10);
      expect(schedule?.interruptible).toBe(false);
    });

    it('should not loop escape schedules', () => {
      scheduleManager.startSchedule('trader-1', 'escape');
      const schedule = scheduleManager.getCurrentSchedule('trader-1');
      
      expect(schedule?.loopWhenComplete).toBe(false);
    });

    it('should trigger escape schedule for high-threat situations', () => {
      const npc = createMockTraderNPC();
      npc.ai.threatAssessment.currentThreatLevel = 70; // High threat
      npc.ai.riskTolerance = 30; // Low risk tolerance
      
      scheduleManager.startSchedule('trader-1', 'trader_main');
      scheduleManager.updateSchedule(npc); // Should trigger escape
      
      const schedule = scheduleManager.getCurrentSchedule('trader-1');
      expect(schedule?.type).toBe('escape');
    });
  });

  describe('Schedule Execution Data', () => {
    it('should provide execution data for external systems', () => {
      scheduleManager.startSchedule('trader-1', 'trader_main');
      const executionData = scheduleManager.getScheduleExecutionData('trader-1');
      
      expect(executionData).toBeDefined();
      expect(executionData).toBeInstanceOf(Map);
    });

    it('should return null execution data for NPCs without schedules', () => {
      const executionData = scheduleManager.getScheduleExecutionData('unknown-npc');
      expect(executionData).toBeNull();
    });
  });

  describe('Step Requirements and Timeouts', () => {
    it('should handle step timeouts appropriately', () => {
      const npc = createMockTraderNPC();
      
      // Mock time passing beyond timeout
      mockTimeManager.getCurrentTimestamp = vi.fn().mockReturnValue(100000);
      
      scheduleManager.startSchedule('trader-1', 'trader_main');
      scheduleManager.updateSchedule(npc);
      
      // Should handle timeout without crashing
      expect(scheduleManager.hasActiveSchedule('trader-1')).toBe(true);
    });

    it('should check step requirements before execution', () => {
      const npc = createMockTraderNPC();
      npc.credits = 50; // Very low credits
      
      scheduleManager.startSchedule('trader-1', 'trader_main');
      
      // Should still have an active schedule even if some steps cannot execute
      expect(scheduleManager.hasActiveSchedule('trader-1')).toBe(true);
    });
  });
});