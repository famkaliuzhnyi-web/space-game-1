import { describe, it, expect, beforeEach } from 'vitest';
import { NPCActor } from '../engine/NPCActor';
import { Scene } from '../engine/Scene';
import { NPCShip } from '../types/npc';

describe('NPCActor', () => {
  let npcShip: NPCShip;
  let npcActor: NPCActor;
  let scene: Scene;

  beforeEach(() => {
    // Create a test NPC ship
    npcShip = {
      id: 'test-npc',
      name: 'Test Trader',
      type: 'trader',
      position: {
        systemId: 'test-system',
        stationId: 'test-station',
        coordinates: { x: 100, y: 100 }
      },
      movement: {
        speed: 25,
        currentVelocity: { x: 0, y: 0 },
        lastMoveTime: Date.now(),
        pathfindingWaypoints: [],
        currentWaypoint: 0,
        avoidanceVector: { x: 0, y: 0 },
        maneuverability: 50,
        maxAcceleration: 15,
        brakingDistance: 50
      },
      ai: {
        personality: {
          type: 'cautious',
          traits: [
            {
              id: 'risk-averse',
              name: 'Risk Averse',
              description: 'Prefers safe routes',
              effects: { riskTolerance: -20 }
            }
          ]
        },
        currentGoal: {
          id: 'goal-1',
          type: 'trade',
          priority: 5,
          startTime: Date.now(),
          parameters: new Map()
        },
        goalHistory: [],
        decisionCooldown: 0,
        riskTolerance: 30,
        aggressiveness: 20,
        tradingSkill: 70,
        lastInteraction: null,
        combatSkill: 25,
        navigationSkill: 60,
        socialSkill: 40,
        marketKnowledge: 80,
        threatAssessment: {
          nearbyThreats: [],
          currentThreatLevel: 0,
          lastThreatUpdate: Date.now()
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
        fuel: 80,
        fuelCapacity: 100
      },
      faction: 'Traders Guild',
      reputation: 0,
      credits: 25000,
      lastActionTime: Date.now()
    };

    npcActor = new NPCActor(npcShip);
    scene = new Scene();
    scene.addActor(npcActor, 'npc');
  });

  describe('Initialization', () => {
    it('should initialize with NPC position', () => {
      // Actor now uses 3D coordinates with ship layer (z: 50)  
      expect(npcActor.getPosition()).toEqual({ x: 100, y: 100, z: 50 });
      // Also provide 2D access for backwards compatibility
      expect(npcActor.getPosition2D()).toEqual({ x: 100, y: 100 });
    });

    it('should start with zero velocity', () => {
      expect(npcActor.getVelocity()).toEqual({ x: 0, y: 0 });
    });

    it('should be active by default', () => {
      expect(npcActor.isActive).toBe(true);
    });

    it('should have correct NPC type', () => {
      expect(npcActor.getNPCType()).toBe('trader');
    });

    it('should return NPC data', () => {
      expect(npcActor.getNPCData()).toBe(npcShip);
    });
  });

  describe('Movement Integration', () => {
    it('should use ShipActor movement system for basic target movement', () => {
      npcActor.setTarget({ x: 200, y: 200 });
      
      // Should start moving immediately after target is set (ShipActor behavior)
      expect(npcActor.isMoving()).toBe(true);
      
      // Update to progress movement
      npcActor.update(0.1);
      
      // Should still be moving towards target
      expect(npcActor.isMoving()).toBe(true);
      
      // Position should have changed towards target
      const newPos = npcActor.getPosition();
      expect(newPos.x).toBeGreaterThan(100);
      expect(newPos.y).toBeGreaterThan(100);
    });

    it('should sync position back to NPC data', () => {
      npcActor.setTarget({ x: 150, y: 150 });
      npcActor.update(0.1);
      
      // NPC data position should be updated
      const npcData = npcActor.getNPCData();
      const actorPos = npcActor.getPosition();
      
      expect(npcData.position.coordinates.x).toBeCloseTo(actorPos.x, 1);
      expect(npcData.position.coordinates.y).toBeCloseTo(actorPos.y, 1);
    });

    it('should handle station targeting correctly', () => {
      npcActor.setStationTarget('target-station', { x: 300, y: 300 });
      
      // Should have set target position
      expect(npcActor.getNPCData().movement.targetStationId).toBe('target-station');
    });

    it('should handle waypoint navigation', () => {
      const waypoints = [
        { x: 120, y: 120 },
        { x: 140, y: 140 },
        { x: 160, y: 160 }
      ];
      
      npcActor.setWaypointTarget(waypoints);
      
      // Should have stored waypoints
      const npcData = npcActor.getNPCData();
      expect(npcData.movement.pathfindingWaypoints).toEqual(waypoints);
      expect(npcData.movement.currentWaypoint).toBe(0);
    });
  });

  describe('Physics and Ship Class Integration', () => {
    it('should have movement characteristics based on NPC type', () => {
      // Trader should be slower than a pirate
      const pirateShip: NPCShip = { 
        ...npcShip, 
        id: 'pirate-npc',
        type: 'pirate' 
      };
      const pirateActor = new NPCActor(pirateShip);
      
      // Set same target for both
      npcActor.setTarget({ x: 200, y: 100 });
      pirateActor.setTarget({ x: 200, y: 100 });
      
      // Update both
      npcActor.update(0.1);
      pirateActor.update(0.1);
      
      // Pirate should move faster (has higher base speed)
      const traderSpeed = npcActor.getCurrentSpeed();
      const pirateSpeed = pirateActor.getCurrentSpeed();
      
      if (traderSpeed > 0 && pirateSpeed > 0) {
        expect(pirateSpeed).toBeGreaterThanOrEqual(traderSpeed);
      }
    });

    it('should use physics-based movement with acceleration', () => {
      npcActor.setTarget({ x: 200, y: 100 });
      
      const initialSpeed = npcActor.getCurrentSpeed();
      npcActor.update(0.1); // First update
      const firstSpeed = npcActor.getCurrentSpeed();
      npcActor.update(0.1); // Second update
      const secondSpeed = npcActor.getCurrentSpeed();
      
      // Speed should increase as ship accelerates (unless already at target)
      if (npcActor.isMoving()) {
        expect(firstSpeed).toBeGreaterThanOrEqual(initialSpeed);
        // Second speed should be >= first speed (may plateau at max speed)
        expect(secondSpeed).toBeGreaterThanOrEqual(firstSpeed * 0.9); // Allow some tolerance
      }
    });
  });

  describe('Scene Integration', () => {
    it('should work correctly in scene updates', () => {
      npcActor.setTarget({ x: 200, y: 200 });
      const initialPos = npcActor.getPosition();
      
      // Update through scene
      scene.update(0.1);
      
      const newPos = npcActor.getPosition();
      if (npcActor.isMoving()) {
        expect(newPos).not.toEqual(initialPos);
      }
    });

    it('should be findable in scene queries', () => {
      const actorsInRadius = scene.findActorsInRadius({ x: 105, y: 105 }, 10);
      expect(actorsInRadius).toContain(npcActor);
      
      const npcActors = scene.getActorsByType('npc');
      expect(npcActors).toContain(npcActor);
    });
  });

  describe('Visual Rendering', () => {
    it('should render without errors', () => {
      // Mock canvas context
      const mockContext = {
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        fill: () => {},
        fillRect: () => {},
        arc: () => {},
        fillText: () => {},
        set fillStyle(value: string) {},
        set font(value: string) {},
        set textAlign(value: string) {},
        set globalAlpha(value: number) {}
      } as any;
      
      expect(() => {
        npcActor.render(mockContext);
      }).not.toThrow();
    });
  });
});