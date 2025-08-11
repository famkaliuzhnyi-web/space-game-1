import { describe, test, expect } from 'vitest';
import { ShipActor } from '../engine/ShipActor';
import { Ship } from '../types/player';
import { Vector3D } from '../types';
import { createLayeredPosition } from '../utils/coordinates';

// Mock ship data for testing
const createTestShip = (id: string, x: number = 0, y: number = 0): Ship => ({
  id,
  name: `Test Ship ${id}`,
  class: {
    id: 'test-class',
    name: 'Test Class',
    category: 'courier',
    description: 'Test ship class',
    baseSpeed: 100,
    baseCargo: 50,
    baseShielding: 10,
    baseFuel: 100,
    baseMass: 1000,
    equipment: {
      requiredWeapons: 0,
      requiredShields: 0,
      requiredEngines: 1,
      maxWeapons: 2,
      maxShields: 2,
      maxEngines: 2,
      maxUtilities: 2,
      maxCargo: 100
    }
  },
  equipment: {
    weapons: [],
    shields: [],
    engines: [{
      id: 'test-engine',
      name: 'Test Engine',
      type: 'engine',
      description: 'Test engine',
      mass: 100,
      value: 1000,
      effects: { speed: 0 },
      category: 'propulsion'
    }],
    utilities: []
  },
  cargo: [],
  location: {
    sector: 'test',
    system: 'test',
    isInTransit: false,
    coordinates: createLayeredPosition(x, y, 'ship')
  },
  fuel: 100,
  condition: { hull: 100, systems: 100 },
  reputation: {}
});

describe('Ship Rotation Behavior Fix', () => {
  test('should verify the fix prevents "flies side forward" issue', () => {
    console.log('\n=== Testing Ship Movement Behavior (After Fix) ===');
    
    // Create a ship at origin facing right (default rotation = 0)
    const ship = createTestShip('test-ship', 0, 0);
    const shipActor = new ShipActor(ship);
    
    // Slow down rotation to make the behavior visible
    (shipActor as any).rotationSpeed = 1.0; // Much slower rotation (1 rad/sec instead of 30)
    
    // Set the ship to face a specific direction first (upward, -90 degrees)
    // This creates a situation where the ship faces one way but needs to move another
    (shipActor as any).rotation = -Math.PI / 2; // Force ship to face UP
    
    // Set target to the LEFT (180 degrees from current facing direction)
    // After fix: ship should move LEFT toward target, not UP in facing direction
    const target: Vector3D = { x: -100, y: 0, z: 50 }; // Go LEFT while facing UP
    shipActor.setTarget(target);
    
    console.log('Initial ship position:', { x: shipActor.position.x, y: shipActor.position.y });
    console.log('Initial ship rotation (degrees):', (shipActor.rotation * 180 / Math.PI).toFixed(1));
    console.log('Target position:', target);
    
    // Simulate movement for several frames
    const deltaTime = 1/60; // 60 FPS
    const frames = 10;
    let perfectMovementCount = 0;
    
    for (let frame = 0; frame < frames; frame++) {
      const oldPosition = { x: shipActor.position.x, y: shipActor.position.y };
      const oldRotation = shipActor.rotation;
      
      shipActor.update(deltaTime);
      
      const newPosition = { x: shipActor.position.x, y: shipActor.position.y };
      const newRotation = shipActor.rotation;
      
      // Calculate movement direction
      const movementX = newPosition.x - oldPosition.x;
      const movementY = newPosition.y - oldPosition.y;
      
      if (Math.abs(movementX) > 0.01 || Math.abs(movementY) > 0.01) {
        const movementAngle = Math.atan2(movementY, movementX);
        
        // Calculate angle to target
        const targetAngle = Math.atan2(target.y - oldPosition.y, target.x - oldPosition.x);
        
        const rotationDegrees = (newRotation * 180 / Math.PI).toFixed(1);
        const movementDegrees = (movementAngle * 180 / Math.PI).toFixed(1);
        const targetDegrees = (targetAngle * 180 / Math.PI).toFixed(1);
        
        console.log(`Frame ${frame + 1}:`);
        console.log(`  Position: (${newPosition.x.toFixed(1)}, ${newPosition.y.toFixed(1)})`);
        console.log(`  Ship facing: ${rotationDegrees}°`);
        console.log(`  Movement direction: ${movementDegrees}°`);
        console.log(`  Target direction: ${targetDegrees}°`);
        
        // Check if ship is moving toward target (should be close to perfect after fix)
        const targetAngleDiff = Math.abs(movementAngle - targetAngle);
        const normalizedTargetDiff = Math.min(targetAngleDiff, 2 * Math.PI - targetAngleDiff);
        
        // After fix, movement should align with target direction (within 5 degrees)
        if (normalizedTargetDiff < Math.PI / 36) { // Within 5 degrees of target
          console.log(`  ✅ Ship is moving perfectly toward target (${(normalizedTargetDiff * 180 / Math.PI).toFixed(1)}° difference)`);
          perfectMovementCount++;
        } else {
          console.log(`  ⚠️ Ship movement is slightly off target by ${(normalizedTargetDiff * 180 / Math.PI).toFixed(1)}°`);
        }
        
        console.log();
      }
      
      // Stop if we've reached the target
      if (!shipActor.isMoving()) {
        console.log('Ship reached target.');
        break;
      }
    }
    
    // After fix, ship should move directly toward target most/all of the time
    console.log(`Perfect movement frames: ${perfectMovementCount} out of ${frames}`);
    expect(perfectMovementCount).toBeGreaterThan(5); // Most frames should have perfect movement
    console.log('✅ Fix verified: Ship now moves toward target instead of in facing direction');
  });

  test('should demonstrate expected behavior after fix', () => {
    console.log('\n=== Expected Behavior After Fix ===');
    console.log('The ship should always move toward the target, even while rotating.');
    console.log('Movement direction should match target direction, not facing direction.');
    console.log('This provides better arcade-style space game controls.');
  });
});