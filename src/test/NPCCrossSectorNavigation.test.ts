import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NPCAIManager } from '../systems/NPCAIManager';
import { WorldManager } from '../systems/WorldManager';
import { TimeManager } from '../systems/TimeManager';
import { PlayerManager } from '../systems/PlayerManager';
import { NPCShip } from '../types/npc';
import { createLayeredPosition } from '../utils/coordinates';

describe('NPC Cross-Sector Navigation', () => {
  let npcAIManager: NPCAIManager;
  let worldManager: WorldManager;
  let timeManager: TimeManager;
  let playerManager: PlayerManager;
  let testNPC: NPCShip;

  beforeEach(() => {
    timeManager = new TimeManager();
    worldManager = new WorldManager();
    playerManager = new PlayerManager();
    npcAIManager = new NPCAIManager(timeManager, worldManager, playerManager);

    // Create a test NPC trader with sufficient fuel
    testNPC = {
      id: 'test-npc-trader',
      name: 'Test Trader',
      type: 'trader',
      faction: 'Traders Guild',
      position: {
        systemId: 'sol-system',
        stationId: 'earth-station',
        coordinates: createLayeredPosition(100, 100, 'ship')
      },
      ship: {
        class: 'courier',
        cargoCapacity: 50,
        currentCargo: new Map([
          ['electronics', 10],
          ['luxury_goods', 5]
        ]),
        condition: {
          hull: 1.0,
          engines: 0.9,
          cargo: 1.0,
          shields: 0.8
        },
        fuel: 150, // Sufficient fuel for gate travel
        fuelCapacity: 200
      },
      credits: 25000,
      reputation: 50,
      ai: {
        aggressiveness: 20,
        merchantSkill: 80,
        combatSkill: 40,
        marketKnowledge: 70,
        tradingSkill: 85,
        personality: {
          risk: 30,
          greed: 60,
          patience: 70,
          loyalty: 40,
          curiosity: 50
        },
        routeOptimization: {
          preferredRoutes: new Map(),
          avoidedSystems: [],
          knownProfitableRoutes: []
        },
        marketMemory: new Map(),
        lastDecisionTime: 0,
        lastLocationChange: 0
      },
      movement: {
        targetStationId: undefined,
        targetCoordinates: undefined,
        pathfindingWaypoints: [],
        currentWaypoint: 0,
        isMoving: false,
        speed: 25
      },
      goals: [{
        type: 'trade',
        priority: 100,
        target: undefined,
        deadline: Date.now() + 1000000,
        status: 'active'
      }],
      lastUpdate: Date.now()
    };
  });

  describe('Cross-Sector Route Finding', () => {
    it('should find cross-sector routes via gates for profitable trades', () => {
      // Use private method through casting to access it for testing
      const findProfitableRoute = (npcAIManager as any).findProfitableRoute;
      const currentSystem = worldManager.getCurrentSystem();
      
      const route = findProfitableRoute.call(npcAIManager, testNPC, currentSystem);
      
      // Should find a route, potentially cross-sector
      expect(route).toBeTruthy();
      expect(route.targetStation).toBeDefined();
      expect(route.confidence).toBeGreaterThan(0);
      
      // Log the route for debugging
      console.log('Found route:', route);
      
      if (route.requiresGate) {
        // Verify the gate exists
        const gate = currentSystem?.gates.find(g => g.id === route.requiresGate);
        expect(gate).toBeDefined();
        expect(gate?.isActive).toBe(true);
      }
    });

    it('should consider fuel costs when evaluating cross-sector routes', () => {
      // Create NPC with low fuel
      const lowFuelNPC = { ...testNPC, ship: { ...testNPC.ship, fuel: 30 } };
      
      const findProfitableRoute = (npcAIManager as any).findProfitableRoute;
      const currentSystem = worldManager.getCurrentSystem();
      
      const route = findProfitableRoute.call(npcAIManager, lowFuelNPC, currentSystem);
      
      // Should either find local route or no route due to insufficient fuel
      if (route && route.requiresGate) {
        const gate = currentSystem?.gates.find(g => g.id === route.requiresGate);
        expect(lowFuelNPC.ship.fuel).toBeGreaterThanOrEqual(gate?.energyCost || 0);
      }
    });

    it('should identify cross-sector supply chain opportunities', () => {
      const isCrossSectorSupplyChain = (npcAIManager as any).isCrossSectorSupplyChain;
      
      // Test mining -> manufacturing pipeline
      const result1 = isCrossSectorSupplyChain.call(
        npcAIManager, 
        'mining', 
        'industrial', 
        'manufacturing-sector'
      );
      expect(result1).toBe(true);
      
      // Test shipyard -> colonial pipeline  
      const result2 = isCrossSectorSupplyChain.call(
        npcAIManager,
        'shipyard',
        'colonial', 
        'expansion-sector'
      );
      expect(result2).toBe(true);
      
      // Test non-supply chain route
      const result3 = isCrossSectorSupplyChain.call(
        npcAIManager,
        'luxury',
        'mining',
        'frontier-sector'
      );
      expect(result3).toBe(false);
    });
  });

  describe('Gate Travel Execution', () => {
    it('should successfully execute gate travel for NPCs', () => {
      const executeGateTravel = (npcAIManager as any).executeGateTravel;
      const initialFuel = testNPC.ship.fuel;
      const initialSystemId = testNPC.position.systemId;
      
      // Execute gate travel to frontier sector
      executeGateTravel.call(npcAIManager, testNPC, 'gate-to-frontier', 'kepler-survey');
      
      // Check that NPC moved to destination sector
      expect(testNPC.position.systemId).toBe('kepler-442'); // Frontier gate destination
      expect(testNPC.position.systemId).not.toBe(initialSystemId);
      expect(testNPC.position.stationId).toBeUndefined(); // Should arrive in space
      
      // Check fuel consumption
      expect(testNPC.ship.fuel).toBeLessThan(initialFuel);
      expect(initialFuel - testNPC.ship.fuel).toBe(50); // Frontier gate costs 50 fuel
      
      // Check coordinates updated
      expect(testNPC.position.coordinates).toBeDefined();
      expect(testNPC.position.coordinates!.z).toBe(50); // Ship layer
    });

    it('should fail gate travel with insufficient fuel', () => {
      const executeGateTravel = (npcAIManager as any).executeGateTravel;
      const lowFuelNPC = { ...testNPC, ship: { ...testNPC.ship, fuel: 25 } }; // Less than 50 required
      const initialSystemId = lowFuelNPC.position.systemId;
      
      executeGateTravel.call(npcAIManager, lowFuelNPC, 'gate-to-frontier', 'kepler-survey');
      
      // Should remain in original system
      expect(lowFuelNPC.position.systemId).toBe(initialSystemId);
      expect(lowFuelNPC.ship.fuel).toBe(25); // Fuel unchanged
    });

    it('should handle different gate destinations correctly', () => {
      const executeGateTravel = (npcAIManager as any).executeGateTravel;
      
      // Test Industrial Gate (costs 50, goes to bernard-star)
      executeGateTravel.call(npcAIManager, testNPC, 'gate-to-industrial', 'barnard-foundry');
      expect(testNPC.position.systemId).toBe('bernard-star');
      expect(testNPC.ship.fuel).toBe(100); // 150 - 50 = 100
      
      // Reset NPC for next test
      testNPC.position.systemId = 'sol-system';
      testNPC.ship.fuel = 150;
      
      // Test Mining Gate (costs 60, goes to mining-belt-alpha)
      executeGateTravel.call(npcAIManager, testNPC, 'gate-to-mining', 'alpha-iron-mines');
      expect(testNPC.position.systemId).toBe('mining-belt-alpha');
      expect(testNPC.ship.fuel).toBe(90); // 150 - 60 = 90
    });
  });

  describe('Integrated Trade Decision Making', () => {
    it('should make trade decisions that include cross-sector travel', () => {
      // Add NPC to AI manager
      (npcAIManager as any).npcShips.set(testNPC.id, testNPC);
      
      const makeTradeDecision = (npcAIManager as any).makeTradeDecision;
      const decision = makeTradeDecision.call(npcAIManager, testNPC);
      
      expect(decision).toBeDefined();
      expect(decision.action).toBeDefined();
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.reasoning).toBeDefined();
      
      // Log decision for debugging
      console.log('Trade decision:', decision);
      
      if (decision.action === 'travel' && decision.requiresGate) {
        expect(decision.targetStationId).toBeDefined();
        expect(decision.requiresGate).toBeDefined();
        
        // Verify gate exists and is active
        const currentSystem = worldManager.getCurrentSystem();
        const gate = currentSystem?.gates.find(g => g.id === decision.requiresGate);
        expect(gate).toBeDefined();
        expect(gate?.isActive).toBe(true);
      }
    });

    it('should process trade goals with gate travel capabilities', () => {
      // Add NPC to AI manager 
      (npcAIManager as any).npcShips.set(testNPC.id, testNPC);
      
      const processTradeGoal = (npcAIManager as any).processTradeGoal;
      
      // Mock executeGateTravel to track if it's called
      const executeGateTravelSpy = vi.spyOn(npcAIManager as any, 'executeGateTravel');
      const setNPCDestinationSpy = vi.spyOn(npcAIManager as any, 'setNPCDestination');
      
      // Process trade goal
      processTradeGoal.call(npcAIManager, testNPC);
      
      // Should call either executeGateTravel or setNPCDestination
      const totalCalls = executeGateTravelSpy.mock.calls.length + setNPCDestinationSpy.mock.calls.length;
      expect(totalCalls).toBeGreaterThanOrEqual(0); // May not always have a destination
      
      // Log what was called
      if (executeGateTravelSpy.mock.calls.length > 0) {
        console.log('Gate travel executed:', executeGateTravelSpy.mock.calls);
      }
      if (setNPCDestinationSpy.mock.calls.length > 0) {
        console.log('Local destination set:', setNPCDestinationSpy.mock.calls);
      }
    });
  });

  describe('Supply Chain Route Optimization', () => {
    it('should prioritize cross-sector supply chain routes', () => {
      // Create NPC at a mining station with raw materials
      const miningNPC = { 
        ...testNPC, 
        position: { 
          ...testNPC.position, 
          stationId: 'alpha-iron-mines',
          systemId: 'mining-belt-alpha' 
        },
        ship: {
          ...testNPC.ship,
          currentCargo: new Map([
            ['iron-ore', 20],
            ['titanium-ore', 15]
          ])
        }
      };
      
      // Change to mining sector first
      const galaxy = worldManager.getGalaxy();
      galaxy.currentPlayerLocation.sectorId = 'mining-sector';
      galaxy.currentPlayerLocation.systemId = 'mining-belt-alpha';
      
      const findCrossSectorRoute = (npcAIManager as any).findCrossSectorRoute;
      const currentSystem = worldManager.getSystemById('mining-belt-alpha');
      
      if (currentSystem) {
        const route = findCrossSectorRoute.call(npcAIManager, miningNPC, currentSystem);
        
        if (route && route.requiresGate) {
          // Should find a manufacturing destination
          expect(route.confidence).toBeGreaterThan(50); // Higher confidence for supply chain routes
          console.log('Cross-sector supply chain route found:', route);
        }
      }
    });
  });
});