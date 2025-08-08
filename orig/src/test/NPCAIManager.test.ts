import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NPCAIManager } from '../systems/NPCAIManager';
import { TimeManager } from '../systems/TimeManager';
import { WorldManager } from '../systems/WorldManager';
import { PlayerManager } from '../systems/PlayerManager';
import { FactionManager } from '../systems/FactionManager';
import { EconomicSystem } from '../systems/EconomicSystem';
import { NPCShip, NPCPersonality, NPCGoal } from '../types/npc';

// Mock the dependencies
vi.mock('../systems/TimeManager');
vi.mock('../systems/WorldManager');
vi.mock('../systems/PlayerManager');
vi.mock('../systems/FactionManager');
vi.mock('../systems/EconomicSystem');

describe('NPCAIManager', () => {
  let npcAIManager: NPCAIManager;
  let mockTimeManager: TimeManager;
  let mockWorldManager: WorldManager;
  let mockPlayerManager: PlayerManager;
  let mockFactionManager: FactionManager;
  let mockEconomicSystem: EconomicSystem;

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
            star: {
              name: 'Test Star',
              type: 'yellow-dwarf',
              temperature: 5778
            },
            stations: [
              {
                id: 'test-station',
                name: 'Test Station',
                type: 'trade',
                position: { x: 100, y: 100 },
                faction: 'Test Faction',
                dockingCapacity: 10,
                services: ['trade', 'repair'],
                description: 'Test station'
              }
            ],
            planets: [],
            securityLevel: 5
          }
        ],
        description: 'Test sector'
      }
    ],
    currentPlayerLocation: {
      sectorId: 'test-sector',
      systemId: 'test-system',
      stationId: 'test-station'
    }
  });

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock instances
    mockTimeManager = new TimeManager() as any;
    mockWorldManager = new WorldManager() as any;
    mockPlayerManager = new PlayerManager() as any;
    mockFactionManager = new FactionManager() as any;
    mockEconomicSystem = new EconomicSystem() as any;

    // Mock TimeManager
    mockTimeManager.getCurrentTime = vi.fn().mockReturnValue(1000);
    mockTimeManager.getCurrentTimestamp = vi.fn().mockReturnValue(1000);
    mockTimeManager.update = vi.fn();

    // Mock WorldManager
    mockWorldManager.getGalaxy = vi.fn().mockReturnValue(createMockGalaxy());

    // Mock PlayerManager
    const mockPlayer = {
      id: 'player-1',
      name: 'Test Player',
      credits: 10000,
      currentStationId: 'test-station',
      currentShipId: 'ship-1',
      ownedShips: new Map(),
      reputation: new Map(),
      contracts: [],
      achievements: [],
      statistics: {
        totalCreditsEarned: 0,
        totalDistanceTraveled: 0,
        totalCargoDelivered: 0,
        contractsCompleted: 0,
        systemsVisited: 0
      }
    };
    
    mockPlayerManager.getPlayer = vi.fn().mockReturnValue(mockPlayer);
    mockPlayerManager.getFactionManager = vi.fn().mockReturnValue(mockFactionManager);

    // Mock FactionManager
    mockFactionManager.getReputation = vi.fn().mockReturnValue(0);

    // Mock EconomicSystem
    mockEconomicSystem.update = vi.fn();

    // Create NPCAIManager instance
    npcAIManager = new NPCAIManager(
      mockTimeManager,
      mockWorldManager,
      mockPlayerManager
    );
  });

  describe('Initialization', () => {
    it('should initialize with personality templates', () => {
      // The manager should create personality templates during initialization
      expect(mockWorldManager.getGalaxy).toHaveBeenCalled();
    });

    it('should spawn initial NPCs in systems', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      expect(testSystemNPCs.length).toBeGreaterThan(0);
      expect(testSystemNPCs.length).toBeLessThanOrEqual(8); // MAX_NPCS_PER_SYSTEM
    });

    it('should create NPCs with valid types', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      const validTypes = ['trader', 'civilian', 'patrol', 'pirate', 'transport'];
      
      for (const npc of testSystemNPCs) {
        expect(validTypes).toContain(npc.type);
      }
    });
  });

  describe('NPC Creation', () => {
    it('should create NPCs with proper AI data', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      const npc = testSystemNPCs[0];
      
      expect(npc.ai).toBeDefined();
      expect(npc.ai.personality).toBeDefined();
      expect(npc.ai.currentGoal).toBeDefined();
      expect(npc.ai.riskTolerance).toBeGreaterThanOrEqual(25);
      expect(npc.ai.riskTolerance).toBeLessThanOrEqual(75);
      expect(npc.ai.aggressiveness).toBeGreaterThanOrEqual(10);
      expect(npc.ai.tradingSkill).toBeGreaterThanOrEqual(25);
    });

    it('should create NPCs with appropriate ship data', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      const npc = testSystemNPCs[0];
      
      expect(npc.ship).toBeDefined();
      expect(npc.ship.cargoCapacity).toBeGreaterThan(0);
      expect(npc.ship.condition).toBeGreaterThan(0);
      expect(npc.ship.condition).toBeLessThanOrEqual(100);
      expect(npc.ship.fuel).toBeGreaterThan(0);
      expect(npc.ship.fuelCapacity).toBeGreaterThan(0);
    });

    it('should create NPCs with proper movement data', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      const npc = testSystemNPCs[0];
      
      expect(npc.movement).toBeDefined();
      expect(npc.movement.speed).toBeGreaterThan(0);
      expect(npc.movement.currentVelocity).toEqual({ x: 0, y: 0 });
      expect(npc.movement.lastMoveTime).toEqual(1000);
    });

    it('should assign appropriate factions based on NPC type', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      
      for (const npc of testSystemNPCs) {
        if (npc.type === 'patrol') {
          expect(npc.faction).toEqual('Test Faction'); // Station faction
        } else if (npc.type === 'pirate') {
          expect(npc.faction).toEqual('Pirates');
        } else {
          // Traders and civilians can be various factions
          expect(npc.faction).toBeDefined();
          expect(npc.faction.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('NPC Management', () => {
    it('should retrieve NPCs by system ID', () => {
      const systemNPCs = npcAIManager.getNPCsInSystem('test-system');
      expect(Array.isArray(systemNPCs)).toBe(true);
      
      for (const npc of systemNPCs) {
        expect(npc.position.systemId).toEqual('test-system');
      }
    });

    it('should retrieve NPC by ID', () => {
      const systemNPCs = npcAIManager.getNPCsInSystem('test-system');
      if (systemNPCs.length > 0) {
        const npcId = systemNPCs[0].id;
        const retrievedNPC = npcAIManager.getNPCById(npcId);
        
        expect(retrievedNPC).toBeDefined();
        expect(retrievedNPC?.id).toEqual(npcId);
      }
    });

    it('should return null for non-existent NPC ID', () => {
      const nonExistentNPC = npcAIManager.getNPCById('non-existent-id');
      expect(nonExistentNPC).toBeNull();
    });
  });

  describe('AI Goal System', () => {
    it('should create appropriate goals for different NPC types', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      
      for (const npc of testSystemNPCs) {
        const goal = npc.ai.currentGoal;
        
        switch (npc.type) {
          case 'trader':
            expect(goal.type).toEqual('trade');
            expect(goal.priority).toBeGreaterThan(5);
            break;
          case 'pirate':
            expect(goal.type).toEqual('pirate');
            expect(goal.priority).toBeGreaterThan(6);
            break;
          case 'patrol':
            expect(goal.type).toEqual('patrol');
            expect(goal.priority).toBeGreaterThan(4);
            break;
          default:
            expect(['idle', 'trade', 'patrol'].includes(goal.type)).toBe(true);
        }
      }
    });

    it('should create goals with proper timestamps', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      const npc = testSystemNPCs[0];
      
      expect(npc.ai.currentGoal.startTime).toEqual(1000);
    });
  });

  describe('Conversation System', () => {
    it('should start conversation with NPC', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      if (testSystemNPCs.length > 0) {
        const npc = testSystemNPCs[0];
        const conversation = npcAIManager.startConversation(npc.id);
        
        expect(conversation).toBeDefined();
        expect(conversation?.npcId).toEqual(npc.id);
        expect(conversation?.type).toEqual('greeting');
        expect(conversation?.dialogue).toBeDefined();
        expect(conversation?.dialogue.length).toBeGreaterThan(0);
      }
    });

    it('should return null for non-existent NPC conversation', () => {
      const conversation = npcAIManager.startConversation('non-existent-npc');
      expect(conversation).toBeNull();
    });

    it('should create appropriate dialogue nodes', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      if (testSystemNPCs.length > 0) {
        const npc = testSystemNPCs[0];
        const conversation = npcAIManager.startConversation(npc.id);
        
        if (conversation) {
          const greetingNode = conversation.dialogue.find(node => node.id === 'greeting');
          expect(greetingNode).toBeDefined();
          expect(greetingNode?.speakerType).toEqual('npc');
          expect(greetingNode?.choices).toBeDefined();
          expect(greetingNode?.choices?.length).toBeGreaterThan(0);
        }
      }
    });

    it('should generate appropriate greeting text based on NPC type', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      if (testSystemNPCs.length > 0) {
        const npc = testSystemNPCs[0];
        const conversation = npcAIManager.startConversation(npc.id);
        
        if (conversation) {
          const greetingNode = conversation.dialogue.find(node => node.id === 'greeting');
          expect(greetingNode?.text).toBeDefined();
          expect(greetingNode?.text.length).toBeGreaterThan(0);
        }
      }
    });

    it('should track active conversations', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      if (testSystemNPCs.length > 0) {
        const npc = testSystemNPCs[0];
        
        const activeConversationsBefore = npcAIManager.getActiveConversations();
        npcAIManager.startConversation(npc.id);
        const activeConversationsAfter = npcAIManager.getActiveConversations();
        
        expect(activeConversationsAfter.size).toEqual(activeConversationsBefore.size + 1);
        expect(activeConversationsAfter.has(npc.id)).toBe(true);
      }
    });

    it('should end conversations properly', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      if (testSystemNPCs.length > 0) {
        const npc = testSystemNPCs[0];
        npcAIManager.startConversation(npc.id);
        
        const activeConversationsBefore = npcAIManager.getActiveConversations();
        npcAIManager.endConversation(npc.id);
        const activeConversationsAfter = npcAIManager.getActiveConversations();
        
        expect(activeConversationsAfter.size).toEqual(activeConversationsBefore.size - 1);
        expect(activeConversationsAfter.has(npc.id)).toBe(false);
      }
    });
  });

  describe('Update System', () => {
    it('should update without errors', () => {
      expect(() => {
        npcAIManager.update(16.67); // ~60 FPS frame time
      }).not.toThrow();
    });

    it('should call time manager methods during update', () => {
      npcAIManager.update(16.67);
      expect(mockTimeManager.getCurrentTimestamp).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should provide serializable state', () => {
      const state = npcAIManager.getState();
      
      expect(state).toBeDefined();
      expect(state.npcShips).toBeDefined();
      expect(state.marketBehaviors).toBeDefined();
      expect(state.npcFleets).toBeDefined();
      expect(typeof state.lastUpdateTime).toEqual('number');
      expect(typeof state.lastSpawnTime).toEqual('number');
      expect(typeof state.lastMarketUpdateTime).toEqual('number');
    });

    it('should load state properly', () => {
      const originalState = npcAIManager.getState();
      
      const testState = {
        npcShips: [['test-npc', {
          id: 'test-npc',
          name: 'Test NPC',
          type: 'trader',
          position: {
            systemId: 'test-system',
            coordinates: { x: 50, y: 50 }
          },
          movement: {
            speed: 25,
            currentVelocity: { x: 0, y: 0 },
            lastMoveTime: 2000
          },
          ai: {
            personality: { type: 'cautious', traits: [] },
            currentGoal: {
              id: 'goal-1',
              type: 'trade',
              priority: 5,
              startTime: 2000,
              parameters: new Map()
            },
            goalHistory: [],
            decisionCooldown: 0,
            riskTolerance: 50,
            aggressiveness: 20,
            tradingSkill: 60,
            lastInteraction: null
          },
          ship: {
            class: 'transport',
            cargoCapacity: 200,
            currentCargo: new Map(),
            condition: 85,
            fuel: 100,
            fuelCapacity: 100
          },
          faction: 'Traders Guild',
          reputation: 0,
          credits: 25000,
          lastActionTime: 2000
        }]],
        marketBehaviors: [],
        npcFleets: [],
        lastUpdateTime: 2000,
        lastSpawnTime: 2000,
        lastMarketUpdateTime: 2000
      };
      
      npcAIManager.loadState(testState);
      
      const loadedNPC = npcAIManager.getNPCById('test-npc');
      expect(loadedNPC).toBeDefined();
      expect(loadedNPC?.name).toEqual('Test NPC');
    });
  });

  describe('NPC Types and Behavior', () => {
    it('should create traders with trading-focused attributes', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      const traders = testSystemNPCs.filter(npc => npc.type === 'trader');
      
      for (const trader of traders) {
        expect(trader.ai.tradingSkill).toBeGreaterThanOrEqual(40); // 40 base + 0-50 random = 40-90
        expect(trader.ai.currentGoal.type).toEqual('trade');
        expect(trader.ship.cargoCapacity).toBeGreaterThan(100); // Traders have larger cargo holds
      }
    });

    it('should create pirates with aggressive attributes', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      const pirates = testSystemNPCs.filter(npc => npc.type === 'pirate');
      
      for (const pirate of pirates) {
        expect(pirate.ai.aggressiveness).toBeGreaterThanOrEqual(50); // 40 base + 10 min
        expect(pirate.ai.currentGoal.type).toEqual('pirate');
        expect(pirate.faction).toEqual('Pirates');
      }
    });

    it('should create patrols with appropriate security attributes', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      const patrols = testSystemNPCs.filter(npc => npc.type === 'patrol');
      
      for (const patrol of patrols) {
        expect(patrol.ai.currentGoal.type).toEqual('patrol');
        expect(patrol.faction).toEqual('Test Faction'); // Should match station faction
        expect(patrol.ship.condition).toBeGreaterThan(80); // Patrols maintain good ship condition
      }
    });
  });

  describe('Movement System', () => {
    it('should initialize NPCs with proper movement speeds', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      
      for (const npc of testSystemNPCs) {
        expect(npc.movement.speed).toBeGreaterThan(0);
        
        // Check type-specific speeds
        switch (npc.type) {
          case 'pirate':
            expect(npc.movement.speed).toEqual(40);
            break;
          case 'patrol':
            expect(npc.movement.speed).toEqual(35);
            break;
          case 'trader':
            expect(npc.movement.speed).toEqual(25);
            break;
          case 'civilian':
            expect(npc.movement.speed).toEqual(20);
            break;
          case 'transport':
            expect(npc.movement.speed).toEqual(15);
            break;
        }
      }
    });
  });

  describe('Credit and Reputation System', () => {
    it('should initialize NPCs with appropriate credit amounts', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      
      for (const npc of testSystemNPCs) {
        expect(npc.credits).toBeGreaterThan(0);
        
        // Check type-specific credit ranges
        switch (npc.type) {
          case 'transport':
            expect(npc.credits).toBeGreaterThanOrEqual(15000);
            expect(npc.credits).toBeLessThanOrEqual(30000);
            break;
          case 'trader':
            expect(npc.credits).toBeGreaterThanOrEqual(10000);
            expect(npc.credits).toBeLessThanOrEqual(50000);
            break;
          case 'pirate':
            expect(npc.credits).toBeGreaterThanOrEqual(1000);
            expect(npc.credits).toBeLessThanOrEqual(10000);
            break;
        }
      }
    });

    it('should initialize NPCs with reputation values in valid range', () => {
      const testSystemNPCs = npcAIManager.getNPCsInSystem('test-system');
      
      for (const npc of testSystemNPCs) {
        expect(npc.reputation).toBeGreaterThanOrEqual(-10);
        expect(npc.reputation).toBeLessThanOrEqual(10);
      }
    });
  });
});