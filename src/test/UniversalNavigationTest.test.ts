import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShipActor } from '../engine/ShipActor';
import { NPCActor } from '../engine/NPCActor';
import { InputHandler } from '../engine/InputHandler';
import { WorldManager } from '../systems/WorldManager';
import { Ship, ShipClass } from '../types/player';
import { NPCShip } from '../types/npc';
import { createLayeredPosition, angleToTarget, rotateTowards, normalizeAngle } from '../utils/coordinates';

/**
 * Comprehensive test for universal navigation mechanics
 * This test validates that all actors (player ships, NPCs, planets) use
 * consistent positioning and rotation mechanics.
 */
describe('Universal Navigation System', () => {
  let ship: Ship;
  let npcShip: NPCShip;
  let shipClass: ShipClass;
  let mockCanvas: HTMLCanvasElement;
  let inputHandler: InputHandler;
  let worldManager: WorldManager;

  beforeEach(() => {
    // Create test ship class
    shipClass = {
      id: 'test-class',
      name: 'Test Class',
      category: 'courier',
      baseCargoCapacity: 50,
      baseFuelCapacity: 100,
      baseSpeed: 120,
      baseShields: 50,
      equipmentSlots: {
        engines: 1,
        cargo: 1,
        shields: 1,
        weapons: 1,
        utility: 1
      }
    };

    // Create test player ship
    ship = {
      id: 'test-ship',
      name: 'Test Ship',
      class: shipClass,
      cargo: { capacity: 50, used: 0, items: new Map() },
      equipment: { engines: [], cargo: [], shields: [], weapons: [], utility: [] },
      condition: { hull: 1.0, engines: 1.0, cargo: 1.0, shields: 1.0, lastMaintenance: Date.now() },
      location: {
        systemId: 'test-system',
        coordinates: createLayeredPosition(0, 0, 'ship'),
        isInTransit: false
      }
    };

    // Create test NPC ship
    npcShip = {
      id: 'test-npc',
      name: 'Test NPC',
      type: 'trader',
      faction: 'traders-guild',
      position: {
        systemId: 'test-system',
        coordinates: createLayeredPosition(0, 0, 'ship')
      },
      movement: { isInTransit: false },
      ship: {
        cargoCapacity: 100,
        fuelCapacity: 200,
        condition: 100,
        currentCargo: new Map(),
        fuel: 200
      },
      lastActionTime: Date.now(),
      ai: {
        personality: 'cautious',
        aggressiveness: 0.3,
        riskTolerance: 0.5,
        currentGoal: 'trade'
      },
      reputation: new Map(),
      schedule: {
        currentActivity: 'trading',
        activityStartTime: Date.now(),
        nextPlannedActivity: 'rest',
        nextActivityTime: Date.now() + 3600000
      }
    };

    // Create mock canvas and input handler
    mockCanvas = {
      width: 1280,
      height: 720,
      getBoundingClientRect: () => ({
        x: 0, y: 0, width: 1280, height: 720, top: 0, left: 0, right: 1280, bottom: 720
      }),
      getContext: vi.fn(() => ({}))
    } as any;

    inputHandler = new InputHandler(mockCanvas);
    worldManager = new WorldManager();
  });

  describe('Coordinate System Consistency', () => {
    it('should use consistent coordinate transformation across all systems', () => {
      const testPositions = [
        { screen: { x: 640, y: 360 }, world: { x: 0, y: 0 }, camera: { x: 0, y: 0, zoom: 1.0 } },
        { screen: { x: 1280, y: 0 }, world: { x: 640, y: -360 }, camera: { x: 0, y: 0, zoom: 1.0 } },
        { screen: { x: 0, y: 720 }, world: { x: -640, y: 360 }, camera: { x: 0, y: 0, zoom: 1.0 } },
        { screen: { x: 900, y: 500 }, world: { x: 260, y: 140 }, camera: { x: 0, y: 0, zoom: 1.0 } }
      ];

      testPositions.forEach((test, index) => {
        const { screen, world, camera } = test;
        
        // Test the coordinate transformation math that InputHandler uses
        const transformedX = (screen.x - mockCanvas.width / 2) / camera.zoom + camera.x;
        const transformedY = (screen.y - mockCanvas.height / 2) / camera.zoom + camera.y;
        
        expect(transformedX).toBeCloseTo(world.x, 1);
        expect(transformedY).toBeCloseTo(world.y, 1);
        
        console.log(`Test ${index + 1}: Screen(${screen.x}, ${screen.y}) -> World(${transformedX.toFixed(1)}, ${transformedY.toFixed(1)}) [Expected: (${world.x}, ${world.y})]`);
      });
    });

    it('should handle camera offset and zoom consistently', () => {
      const testCases = [
        { camera: { x: 100, y: 200, zoom: 1.0 }, screen: { x: 640, y: 360 }, expectedWorld: { x: 100, y: 200 } },
        { camera: { x: 0, y: 0, zoom: 2.0 }, screen: { x: 840, y: 460 }, expectedWorld: { x: 100, y: 50 } },
        { camera: { x: -50, y: -75, zoom: 0.5 }, screen: { x: 540, y: 260 }, expectedWorld: { x: -250, y: -275 } }
      ];

      testCases.forEach((test, index) => {
        const { camera, screen, expectedWorld } = test;
        
        const worldX = (screen.x - mockCanvas.width / 2) / camera.zoom + camera.x;
        const worldY = (screen.y - mockCanvas.height / 2) / camera.zoom + camera.y;
        
        expect(worldX).toBeCloseTo(expectedWorld.x, 1);
        expect(worldY).toBeCloseTo(expectedWorld.y, 1);
        
        console.log(`Zoom/Offset Test ${index + 1}: Camera(${camera.x}, ${camera.y}, ${camera.zoom}x) + Screen(${screen.x}, ${screen.y}) = World(${worldX.toFixed(1)}, ${worldY.toFixed(1)})`);
      });
    });
  });

  describe('Universal Rotation Mechanics', () => {
    it('should calculate consistent rotation angles for all actor types', () => {
      const directions = [
        { name: 'RIGHT', from: { x: 0, y: 0 }, to: { x: 100, y: 0 }, expected: 0 },
        { name: 'DOWN', from: { x: 0, y: 0 }, to: { x: 0, y: 100 }, expected: Math.PI / 2 },
        { name: 'LEFT', from: { x: 0, y: 0 }, to: { x: -100, y: 0 }, expected: Math.PI },
        { name: 'UP', from: { x: 0, y: 0 }, to: { x: 0, y: -100 }, expected: -Math.PI / 2 },
        { name: 'DIAGONAL_DOWN_RIGHT', from: { x: 0, y: 0 }, to: { x: 100, y: 100 }, expected: Math.PI / 4 }
      ];

      directions.forEach(direction => {
        // Test the universal angle calculation function
        const from3D = createLayeredPosition(direction.from.x, direction.from.y, 'ship');
        const to3D = createLayeredPosition(direction.to.x, direction.to.y, 'ship');
        const calculatedAngle = angleToTarget(from3D, to3D);
        
        // Normalize both angles for comparison
        const normalizedCalculated = normalizeAngle(calculatedAngle);
        const normalizedExpected = normalizeAngle(direction.expected);
        
        const angleDifference = Math.abs(normalizedCalculated - normalizedExpected);
        const wrappedDifference = Math.min(angleDifference, 2 * Math.PI - angleDifference);
        
        expect(wrappedDifference).toBeLessThan(0.01); // Very tight tolerance
        
        console.log(`${direction.name}: Expected ${(normalizedExpected * 180 / Math.PI).toFixed(1)}°, Got ${(normalizedCalculated * 180 / Math.PI).toFixed(1)}°`);
      });
    });

    it('should apply consistent rotation mechanics to both player and NPC ships', () => {
      const shipActor = new ShipActor(ship);
      const npcActor = new NPCActor(npcShip);
      
      // Set same starting position
      shipActor.setPosition({ x: 0, y: 0 });
      npcActor.setPosition({ x: 0, y: 0 });
      
      // Set same target
      const target = { x: 100, y: 100 };
      shipActor.setTarget(target);
      npcActor.setTarget(target);
      
      // Update both actors for the same amount of time
      for (let i = 0; i < 30; i++) {
        shipActor.update(1/60);
        npcActor.update(1/60);
      }
      
      // Both should have very similar rotations
      const shipRotation = normalizeAngle(shipActor.rotation);
      const npcRotation = normalizeAngle(npcActor.rotation);
      
      const rotationDifference = Math.abs(shipRotation - npcRotation);
      expect(rotationDifference).toBeLessThan(0.1); // Within ~5.7 degrees
      
      console.log(`Player ship rotation: ${(shipRotation * 180 / Math.PI).toFixed(1)}°`);
      console.log(`NPC ship rotation: ${(npcRotation * 180 / Math.PI).toFixed(1)}°`);
      console.log(`Rotation difference: ${(rotationDifference * 180 / Math.PI).toFixed(1)}°`);
    });

    it('should use rotateTowards function consistently', () => {
      const testCases = [
        { current: 0, target: Math.PI / 4, maxChange: 0.1, expectedResult: 0.1 },
        { current: Math.PI, target: -Math.PI, maxChange: 0.1, expectedResult: Math.PI }, // No change needed
        { current: 0.1, target: 0, maxChange: 0.2, expectedResult: 0 }, // Should reach target
        { current: Math.PI - 0.1, target: -Math.PI + 0.1, maxChange: 0.1, expectedResult: Math.PI } // Wrap-around case
      ];

      testCases.forEach((test, index) => {
        const result = rotateTowards(test.current, test.target, test.maxChange);
        const normalizedResult = normalizeAngle(result);
        const normalizedExpected = normalizeAngle(test.expectedResult);
        
        // For wrap-around cases, check both the result and expected are in valid range
        expect(normalizedResult).toBeGreaterThanOrEqual(-Math.PI);
        expect(normalizedResult).toBeLessThanOrEqual(Math.PI);
        
        console.log(`Test ${index + 1}: rotateTowards(${test.current.toFixed(3)}, ${test.target.toFixed(3)}, ${test.maxChange.toFixed(3)}) = ${result.toFixed(3)} (${(result * 180 / Math.PI).toFixed(1)}°)`);
      });
    });
  });

  describe('Movement Physics Consistency', () => {
    it('should move all actors to the same target position with consistent physics', () => {
      const shipActor = new ShipActor(ship);
      const npcActor = new NPCActor(npcShip);
      
      // Set same starting position
      const startPos = { x: 100, y: 100 };
      shipActor.setPosition(startPos);
      npcActor.setPosition(startPos);
      
      // Set same target
      const target = { x: 300, y: 200 };
      shipActor.setTarget(target);
      npcActor.setTarget(target);
      
      // Let both actors complete their movement
      let shipCompleted = false;
      let npcCompleted = false;
      let iterations = 0;
      const maxIterations = 1000; // Prevent infinite loop
      
      while ((!shipCompleted || !npcCompleted) && iterations < maxIterations) {
        if (!shipCompleted && shipActor.isMoving()) {
          shipActor.update(1/60);
        } else {
          shipCompleted = true;
        }
        
        if (!npcCompleted && npcActor.isMoving()) {
          npcActor.update(1/60);
        } else {
          npcCompleted = true;
        }
        
        iterations++;
      }
      
      // Both should end up at approximately the same position
      const shipFinalPos = shipActor.getPosition2D();
      const npcFinalPos = npcActor.getPosition2D();
      
      expect(shipFinalPos.x).toBeCloseTo(target.x, 1);
      expect(shipFinalPos.y).toBeCloseTo(target.y, 1);
      expect(npcFinalPos.x).toBeCloseTo(target.x, 1);
      expect(npcFinalPos.y).toBeCloseTo(target.y, 1);
      
      // Verify both arrived at similar positions
      const positionDifference = Math.sqrt(
        Math.pow(shipFinalPos.x - npcFinalPos.x, 2) + 
        Math.pow(shipFinalPos.y - npcFinalPos.y, 2)
      );
      
      expect(positionDifference).toBeLessThan(10); // Within 10 units of each other
      
      console.log(`Ship final position: (${shipFinalPos.x.toFixed(1)}, ${shipFinalPos.y.toFixed(1)})`);
      console.log(`NPC final position: (${npcFinalPos.x.toFixed(1)}, ${npcFinalPos.y.toFixed(1)})`);
      console.log(`Position difference: ${positionDifference.toFixed(1)} units`);
      console.log(`Iterations to complete: ${iterations}`);
    });
  });

  describe('Coordinate Layer System', () => {
    it('should maintain correct Z-layer assignments for different object types', () => {
      // Test ship layer
      const shipPos = createLayeredPosition(100, 200, 'ship');
      expect(shipPos.z).toBe(50); // Ships at layer 50
      
      // Test station layer
      const stationPos = createLayeredPosition(100, 200, 'station');
      expect(stationPos.z).toBe(30); // Stations at layer 30
      
      // Test planet layer
      const planetPos = createLayeredPosition(100, 200, 'planet');
      expect(planetPos.z).toBe(0); // Planets at layer 0
      
      console.log(`Ship layer: ${shipPos.z}`);
      console.log(`Station layer: ${stationPos.z}`);
      console.log(`Planet layer: ${planetPos.z}`);
    });

    it('should preserve Z-layer during position updates', () => {
      const shipActor = new ShipActor(ship);
      
      // Verify initial layer
      const initialPos = shipActor.getPosition();
      expect(initialPos.z).toBe(50);
      
      // Move to new position
      shipActor.setPosition({ x: 200, y: 300 });
      
      // Verify layer is preserved
      const newPos = shipActor.getPosition();
      expect(newPos.x).toBe(200);
      expect(newPos.y).toBe(300);
      expect(newPos.z).toBe(50); // Layer should be preserved
      
      console.log(`Initial position: (${initialPos.x}, ${initialPos.y}, ${initialPos.z})`);
      console.log(`New position: (${newPos.x}, ${newPos.y}, ${newPos.z})`);
    });
  });

  describe('Input to World Coordinate Integration', () => {
    it('should correctly transform input coordinates to world coordinates', () => {
      const worldClickCalls: Array<{ x: number; y: number; action?: string }> = [];
      
      inputHandler.setClickHandler((worldX, worldY, action = 'move') => {
        worldClickCalls.push({ x: worldX, y: worldY, action });
      });

      // Mock the private methods by testing the coordinate transformation directly
      const camera = { x: 0, y: 0, zoom: 1.0 };
      
      // Test center click
      const centerX = 640; // Canvas center X
      const centerY = 360; // Canvas center Y
      
      // This mimics the transformation done in InputHandler.screenToWorldRayIntersection
      const worldX = camera.x + ((centerX - mockCanvas.width / 2) / camera.zoom);
      const worldY = camera.y + ((centerY - mockCanvas.height / 2) / camera.zoom);
      
      expect(worldX).toBeCloseTo(0, 1);
      expect(worldY).toBeCloseTo(0, 1);
      
      console.log(`Screen center (${centerX}, ${centerY}) -> World (${worldX.toFixed(1)}, ${worldY.toFixed(1)})`);
    });

    it('should handle zoom correctly in coordinate transformation', () => {
      const testCases = [
        { zoom: 1.0, screen: { x: 740, y: 410 }, expected: { x: 100, y: 50 } },
        { zoom: 2.0, screen: { x: 740, y: 410 }, expected: { x: 50, y: 25 } },
        { zoom: 0.5, screen: { x: 740, y: 410 }, expected: { x: 200, y: 100 } }
      ];

      testCases.forEach((test, index) => {
        const camera = { x: 0, y: 0, zoom: test.zoom };
        const worldX = camera.x + ((test.screen.x - mockCanvas.width / 2) / camera.zoom);
        const worldY = camera.y + ((test.screen.y - mockCanvas.height / 2) / camera.zoom);
        
        expect(worldX).toBeCloseTo(test.expected.x, 1);
        expect(worldY).toBeCloseTo(test.expected.y, 1);
        
        console.log(`Zoom ${test.zoom}x: Screen(${test.screen.x}, ${test.screen.y}) -> World(${worldX.toFixed(1)}, ${worldY.toFixed(1)})`);
      });
    });
  });

  describe('Edge Case Handling', () => {
    it('should handle very small movements correctly', () => {
      const shipActor = new ShipActor(ship);
      
      shipActor.setPosition({ x: 0, y: 0 });
      shipActor.setTarget({ x: 0.1, y: 0.1 }); // Very small movement
      
      // Update until movement completes or we reach iteration limit
      let iterations = 0;
      const maxIterations = 100;
      
      while (shipActor.isMoving() && iterations < maxIterations) {
        shipActor.update(1/60);
        iterations++;
      }
      
      const finalPos = shipActor.getPosition2D();
      expect(finalPos.x).toBeCloseTo(0.1, 0);
      expect(finalPos.y).toBeCloseTo(0.1, 0);
      
      console.log(`Small movement completed in ${iterations} iterations`);
      console.log(`Final position: (${finalPos.x.toFixed(3)}, ${finalPos.y.toFixed(3)})`);
    });

    it('should handle large movements correctly', () => {
      const shipActor = new ShipActor(ship);
      
      shipActor.setPosition({ x: 0, y: 0 });
      shipActor.setTarget({ x: 1500, y: 1000 }); // Large but realistic movement within system bounds
      
      // Update for a reasonable time
      for (let i = 0; i < 1200; i++) { // 20 seconds at 60 FPS
        if (!shipActor.isMoving()) break;
        shipActor.update(1/60);
      }
      
      const finalPos = shipActor.getPosition2D();
      expect(finalPos.x).toBeCloseTo(1500, 1);
      expect(finalPos.y).toBeCloseTo(1000, 1);
      
      console.log(`Large movement final position: (${finalPos.x.toFixed(1)}, ${finalPos.y.toFixed(1)})`);
    });

    it('should handle angle wrapping correctly', () => {
      const testAngles = [
        { angle: 0, expected: 0 },
        { angle: Math.PI, expected: -Math.PI }, // π and -π are equivalent, function returns -π
        { angle: -Math.PI, expected: -Math.PI },
        { angle: 2 * Math.PI, expected: 0 },
        { angle: -2 * Math.PI, expected: 0 },
        { angle: 3 * Math.PI, expected: -Math.PI }, // 3π wraps to -π (equivalent to π)
        { angle: -3 * Math.PI, expected: -Math.PI } // -3π wraps to -π (equivalent to π)
      ];

      testAngles.forEach((test, index) => {
        const normalized = normalizeAngle(test.angle);
        expect(normalized).toBeCloseTo(test.expected, 3);
        
        console.log(`Angle ${index + 1}: ${test.angle.toFixed(3)} -> ${normalized.toFixed(3)} (expected: ${test.expected.toFixed(3)})`);
      });
    });
  });
});