import { describe, it, expect, beforeEach } from 'vitest';
import { NPCActor } from '../engine/NPCActor';
import { NPCShip } from '../types/npc';

/**
 * Diagnosis test for NPC ship rotation issues
 * This test helps identify what "rotate along wrong axis" means
 */
describe('NPC Rotation Diagnosis', () => {
  let npcShip: NPCShip;

  beforeEach(() => {
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

  describe('Coordinate System Analysis', () => {
    it('should verify coordinate system orientation', () => {
      const npcActor = new NPCActor(npcShip);
      
      // Set origin position
      npcActor.setPosition({ x: 0, y: 0 });
      
      console.log('=== Coordinate System Test ===');
      console.log(`Initial position: (${npcActor.getPosition().x}, ${npcActor.getPosition().y})`);
      console.log(`Initial rotation: ${npcActor.rotation} rad (${(npcActor.rotation * 180 / Math.PI).toFixed(1)}°)`);
      
      // Test movement directions and expected rotations
      const directions = [
        { name: 'RIGHT', target: { x: 100, y: 0 }, expectedRotation: 0, description: '+X direction should be 0° (right)' },
        { name: 'DOWN', target: { x: 0, y: 100 }, expectedRotation: Math.PI/2, description: '+Y direction should be 90° (down)' },
        { name: 'LEFT', target: { x: -100, y: 0 }, expectedRotation: Math.PI, description: '-X direction should be 180° (left)' },
        { name: 'UP', target: { x: 0, y: -100 }, expectedRotation: -Math.PI/2, description: '-Y direction should be -90° (up)' },
        { name: 'DIAGONAL_SE', target: { x: 100, y: 100 }, expectedRotation: Math.PI/4, description: 'SE diagonal should be 45°' },
        { name: 'DIAGONAL_NW', target: { x: -100, y: -100 }, expectedRotation: -3*Math.PI/4, description: 'NW diagonal should be -135°' }
      ];

      directions.forEach((dir) => {
        // Reset position and rotation
        const freshNPC = new NPCActor(npcShip);
        freshNPC.setPosition({ x: 0, y: 0 });
        freshNPC.setTarget(dir.target);

        // Update multiple times to allow rotation to settle
        for (let i = 0; i < 50; i++) {
          freshNPC.update(1/60);
        }

        const actualRotation = freshNPC.rotation;
        const actualDegrees = actualRotation * 180 / Math.PI;
        const expectedDegrees = dir.expectedRotation * 180 / Math.PI;
        
        console.log(`${dir.name}: Expected ${expectedDegrees.toFixed(1)}°, Got ${actualDegrees.toFixed(1)}° (${dir.description})`);
        
        // Normalize angles for comparison (handle wrap-around)
        const normalizedActual = ((actualRotation % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        const normalizedExpected = ((dir.expectedRotation % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        
        // Use a tolerance for floating point comparison
        const angleDiff = Math.abs(normalizedActual - normalizedExpected);
        const minDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff); // Handle wrap-around
        
        expect(minDiff).toBeLessThan(0.1); // Within ~5.7 degrees
      });
    });

    it('should verify rotation direction matches movement direction', () => {
      const npcActor = new NPCActor(npcShip);
      
      // Start at origin
      npcActor.setPosition({ x: 0, y: 0 });
      
      // Set target to the right
      npcActor.setTarget({ x: 100, y: 0 });
      
      // Update several times
      for (let i = 0; i < 20; i++) {
        npcActor.update(1/60);
      }
      
      const position = npcActor.getPosition();
      const rotation = npcActor.rotation;
      
      console.log(`After moving right: Position (${position.x.toFixed(2)}, ${position.y.toFixed(2)}), Rotation ${rotation.toFixed(3)} rad`);
      
      // The ship should have moved towards the target
      expect(position.x).toBeGreaterThan(0);
      
      // The rotation should be close to 0 (pointing right)
      expect(Math.abs(rotation)).toBeLessThan(0.2);
    });

    it('should analyze rotation behavior during diagonal movement', () => {
      const npcActor = new NPCActor(npcShip);
      
      npcActor.setPosition({ x: 0, y: 0 });
      npcActor.setTarget({ x: 100, y: 100 }); // 45-degree diagonal
      
      const rotationHistory: number[] = [];
      const positionHistory: { x: number, y: number }[] = [];
      
      for (let i = 0; i < 30; i++) {
        npcActor.update(1/60);
        rotationHistory.push(npcActor.rotation);
        const pos = npcActor.getPosition();
        positionHistory.push({ x: pos.x, y: pos.y });
      }
      
      const finalRotation = rotationHistory[rotationHistory.length - 1];
      const expectedRotation = Math.PI / 4; // 45 degrees
      
      console.log(`Diagonal movement rotation: ${finalRotation.toFixed(3)} rad (${(finalRotation * 180 / Math.PI).toFixed(1)}°)`);
      console.log(`Expected: ${expectedRotation.toFixed(3)} rad (${(expectedRotation * 180 / Math.PI).toFixed(1)}°)`);
      
      // The final rotation should be approximately 45 degrees
      expect(Math.abs(finalRotation - expectedRotation)).toBeLessThan(0.3);
    });
  });

  describe('Canvas Rotation Application', () => {
    it('should verify rotation is applied correctly in canvas context', () => {
      const npcActor = new NPCActor(npcShip);
      
      // Mock canvas context to track rotation calls - include all methods used by rendering
      const mockContext = {
        save: vitest.fn(),
        restore: vitest.fn(),
        translate: vitest.fn(),
        rotate: vitest.fn(),
        fillStyle: '',
        fillRect: vitest.fn(),
        beginPath: vitest.fn(),
        moveTo: vitest.fn(),
        lineTo: vitest.fn(),
        closePath: vitest.fn(),
        fill: vitest.fn(),
        font: '',
        textAlign: 'center' as CanvasTextAlign,
        fillText: vitest.fn(),
        globalAlpha: 1,
        drawImage: vitest.fn(),
        arc: vitest.fn() // Add missing arc method
      } as unknown as CanvasRenderingContext2D;

      // Set up rotation
      npcActor.setPosition({ x: 50, y: 50 });
      npcActor.setTarget({ x: 150, y: 50 }); // Move right
      
      for (let i = 0; i < 10; i++) {
        npcActor.update(1/60);
      }
      
      const expectedRotation = npcActor.rotation;
      
      // Render the NPC
      npcActor.render(mockContext);
      
      // Check that rotate was called with the correct angle
      expect(mockContext.rotate).toHaveBeenCalledWith(expectedRotation);
      
      console.log(`Canvas rotate called with: ${expectedRotation.toFixed(3)} rad`);
    });
  });

  describe('Potential Issue Detection', () => {
    it('should detect if Y-axis is flipped', () => {
      const npcActor = new NPCActor(npcShip);
      
      npcActor.setPosition({ x: 0, y: 0 });
      
      // Move "down" in screen coordinates (+Y)
      npcActor.setTarget({ x: 0, y: 100 });
      
      for (let i = 0; i < 30; i++) {
        npcActor.update(1/60);
      }
      
      const position = npcActor.getPosition();
      const rotation = npcActor.rotation;
      
      console.log(`Moving down (+Y): Final position (${position.x.toFixed(2)}, ${position.y.toFixed(2)}), Rotation ${rotation.toFixed(3)} rad (${(rotation * 180 / Math.PI).toFixed(1)}°)`);
      
      // In screen coordinates, +Y is down, so rotation should be π/2 (90°)
      // If Y-axis is flipped, this might be wrong
      expect(position.y).toBeGreaterThan(0); // Should move down
      expect(Math.abs(rotation - Math.PI/2)).toBeLessThan(0.2); // Should face down
    });

    it('should detect if rotation direction is reversed', () => {
      const npcActor = new NPCActor(npcShip);
      
      npcActor.setPosition({ x: 0, y: 0 });
      
      // Test clockwise vs counterclockwise
      // Move to bottom-right (should be positive rotation from 0)
      npcActor.setTarget({ x: 100, y: 100 });
      
      for (let i = 0; i < 30; i++) {
        npcActor.update(1/60);
      }
      
      const rotation = npcActor.rotation;
      
      console.log(`SE diagonal rotation: ${rotation.toFixed(3)} rad (${(rotation * 180 / Math.PI).toFixed(1)}°)`);
      
      // Should be positive (clockwise from +X axis)
      expect(rotation).toBeGreaterThan(0);
      expect(rotation).toBeLessThan(Math.PI/2);
    });
  });
});