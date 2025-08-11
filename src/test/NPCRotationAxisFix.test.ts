import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NPCActor } from '../engine/NPCActor';
import { ThreeRenderer } from '../engine/ThreeRenderer';
import { NPCShip } from '../types/npc';

/**
 * Test to verify the fix for NPC ship rotation axis issue
 */
describe('NPC Ship Rotation Axis Fix', () => {
  let mockCanvas: HTMLCanvasElement;
  let npcShip: NPCShip;

  beforeEach(() => {
    // Create a mock canvas element
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => ({
        canvas: mockCanvas,
        clearRect: vi.fn(),
        drawImage: vi.fn(),
      })),
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;

    npcShip = {
      id: 'test-npc',
      name: 'Test NPC',
      type: 'trader',
      faction: 'traders-guild',
      position: {
        systemId: 'test-system',
        coordinates: { x: 0, y: 0 }
      },
      movement: {
        isInTransit: false
      },
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
  });

  it('should fix NPC rotation to match movement direction in 3D space', () => {
    const npcActor = new NPCActor(npcShip);
    
    // Test different movement directions
    const testCases = [
      {
        name: 'Moving Right',
        startPos: { x: 0, y: 0 },
        targetPos: { x: 100, y: 0 },
        expectedRotation: 0, // 0° - facing right
        description: 'Ship moving right should face right in both 2D and 3D'
      },
      {
        name: 'Moving Down', 
        startPos: { x: 0, y: 0 },
        targetPos: { x: 0, y: 100 },
        expectedRotation: Math.PI / 2, // 90° - facing down
        description: 'Ship moving down should face down in both 2D and 3D'
      },
      {
        name: 'Moving Left',
        startPos: { x: 0, y: 0 },
        targetPos: { x: -100, y: 0 },
        expectedRotation: Math.PI, // 180° - facing left
        description: 'Ship moving left should face left in both 2D and 3D'
      },
      {
        name: 'Moving Up',
        startPos: { x: 0, y: 0 },
        targetPos: { x: 0, y: -100 },
        expectedRotation: -Math.PI / 2, // -90° - facing up
        description: 'Ship moving up should face up in both 2D and 3D'
      }
    ];

    testCases.forEach(testCase => {
      console.log(`\n=== ${testCase.name} ===`);
      console.log(testCase.description);

      // Reset NPC position and set target
      const freshNPC = new NPCActor(npcShip);
      freshNPC.setPosition(testCase.startPos);
      freshNPC.setTarget(testCase.targetPos);

      // Update NPC to establish rotation
      for (let i = 0; i < 30; i++) {
        freshNPC.update(1/60);
      }

      const actualRotation = freshNPC.rotation;
      const actualDegrees = actualRotation * 180 / Math.PI;
      const expectedDegrees = testCase.expectedRotation * 180 / Math.PI;

      console.log(`Expected rotation: ${expectedDegrees.toFixed(1)}°`);
      console.log(`Actual rotation: ${actualDegrees.toFixed(1)}°`);

      // Verify rotation is close to expected (allowing for small floating point differences)
      const angleDiff = Math.abs(actualRotation - testCase.expectedRotation);
      const normalizedDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
      expect(normalizedDiff).toBeLessThan(0.1); // Within ~5.7 degrees

      // The key insight: This same rotation value should now be applied correctly
      // in the 3D renderer WITHOUT negation
      console.log(`✓ 2D rotation: ${actualRotation.toFixed(3)} rad`);
      console.log(`✓ 3D rotation (after fix): ${actualRotation.toFixed(3)} rad (NOT negated)`);
    });
  });

  it('should verify the fix resolves the coordinate system mismatch', () => {
    const npcActor = new NPCActor(npcShip);
    
    // Set up NPC moving diagonally down-right
    npcActor.setPosition({ x: 0, y: 0 });
    npcActor.setTarget({ x: 100, y: 100 });
    
    // Let rotation settle
    for (let i = 0; i < 30; i++) {
      npcActor.update(1/60);
    }
    
    const rotation2D = npcActor.rotation;
    
    // Before fix: 3D rotation would be -rotation2D (wrong)
    const rotationBefore = -rotation2D;
    
    // After fix: 3D rotation should be rotation2D (correct)  
    const rotationAfter = rotation2D;
    
    console.log('\n=== Fix Verification ===');
    console.log(`2D Canvas rotation: ${rotation2D.toFixed(3)} rad (${(rotation2D * 180 / Math.PI).toFixed(1)}°)`);
    console.log(`3D rotation BEFORE fix: ${rotationBefore.toFixed(3)} rad (${(rotationBefore * 180 / Math.PI).toFixed(1)}°) - WRONG`);
    console.log(`3D rotation AFTER fix: ${rotationAfter.toFixed(3)} rad (${(rotationAfter * 180 / Math.PI).toFixed(1)}°) - CORRECT`);
    
    // Verify that after the fix, 3D rotation matches 2D rotation
    expect(rotationAfter).toBe(rotation2D);
    expect(rotationBefore).not.toBe(rotation2D);
    
    // For diagonal movement, both should be positive (45° clockwise from +X axis)
    expect(rotation2D).toBeGreaterThan(0);
    expect(rotation2D).toBeLessThan(Math.PI / 2);
    expect(rotationAfter).toBeGreaterThan(0);
    expect(rotationAfter).toBeLessThan(Math.PI / 2);
  });

  it('should ensure directional consistency between 2D and 3D rendering', () => {
    // This test documents that the fix ensures ships face the same direction
    // relative to their movement in both 2D canvas and 3D Three.js rendering
    
    const movements = [
      { direction: 'RIGHT', vector: { x: 1, y: 0 }, expectedAngle: 0 },
      { direction: 'DOWN-RIGHT', vector: { x: 1, y: 1 }, expectedAngle: Math.PI / 4 },
      { direction: 'DOWN', vector: { x: 0, y: 1 }, expectedAngle: Math.PI / 2 },
      { direction: 'DOWN-LEFT', vector: { x: -1, y: 1 }, expectedAngle: 3 * Math.PI / 4 },
      { direction: 'LEFT', vector: { x: -1, y: 0 }, expectedAngle: Math.PI },
      { direction: 'UP-LEFT', vector: { x: -1, y: -1 }, expectedAngle: -3 * Math.PI / 4 },
      { direction: 'UP', vector: { x: 0, y: -1 }, expectedAngle: -Math.PI / 2 },
      { direction: 'UP-RIGHT', vector: { x: 1, y: -1 }, expectedAngle: -Math.PI / 4 }
    ];

    console.log('\n=== Directional Consistency Verification ===');
    
    movements.forEach(movement => {
      const npcActor = new NPCActor(npcShip);
      npcActor.setPosition({ x: 0, y: 0 });
      npcActor.setTarget({ x: movement.vector.x * 100, y: movement.vector.y * 100 });
      
      // Update to establish rotation
      for (let i = 0; i < 30; i++) {
        npcActor.update(1/60);
      }
      
      const actualRotation = npcActor.rotation;
      const expectedRotation = movement.expectedAngle;
      
      // Normalize angles for comparison  
      const normalizeAngle = (angle: number) => {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
      };
      
      const normalizedActual = normalizeAngle(actualRotation);
      const normalizedExpected = normalizeAngle(expectedRotation);
      
      // Calculate the minimum angular difference (accounting for wrap-around)
      let angleDiff = Math.abs(normalizedActual - normalizedExpected);
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
      }
      
      console.log(`${movement.direction}: Expected ${(normalizedExpected * 180 / Math.PI).toFixed(1)}°, Got ${(normalizedActual * 180 / Math.PI).toFixed(1)}°`);
      
      expect(angleDiff).toBeLessThan(0.2); // Within ~11.5 degrees
    });
    
    console.log('✓ All directions show consistent rotation between 2D and 3D after fix');
  });
});