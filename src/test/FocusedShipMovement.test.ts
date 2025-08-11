import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShipActor } from '../engine/ShipActor';
import { Ship } from '../types/player';
import { createMockShip } from './testUtils/mockShip';

/**
 * Focused unit test for ship movement and orientation mechanics
 * Validates the core requirement: ship flies to target coordinates and orients correctly
 */
describe('Focused Ship Movement and Orientation', () => {
  let ship: Ship;
  let shipActor: ShipActor;

  beforeEach(() => {
    // Create a test ship with known characteristics
    ship = createMockShip('test-ship-123', {
      x: 100, 
      y: 100,
      z: 0
    });
    
    shipActor = new ShipActor(ship);
  });

  it('should move ship to target coordinates when setTarget is called', () => {
    // Initial position
    expect(shipActor.position.x).toBe(100);
    expect(shipActor.position.y).toBe(100);
    
    // Set target position (simulating right-click command)
    const targetX = 300;
    const targetY = 200;
    shipActor.setTarget({ x: targetX, y: targetY });
    
    // Verify target is set (Z coordinate should match ship's current layer)
    expect(shipActor.targetPosition?.x).toBe(targetX);
    expect(shipActor.targetPosition?.y).toBe(targetY);
    expect(ship.location.isInTransit).toBe(true);
    
    // Simulate movement updates until ship reaches target
    let iterations = 0;
    const maxIterations = 1000; // Prevent infinite loops
    const deltaTime = 1/60; // 60 FPS simulation
    
    while (shipActor.targetPosition && iterations < maxIterations) {
      shipActor.update(deltaTime);
      iterations++;
    }
    
    // Verify ship reached target (within arrival threshold)
    const arrivalDistance = Math.sqrt(
      Math.pow(shipActor.position.x - targetX, 2) + 
      Math.pow(shipActor.position.y - targetY, 2)
    );
    
    expect(arrivalDistance).toBeLessThan(10); // Should be within arrival radius
    expect(ship.location.isInTransit).toBe(false);
    expect(shipActor.targetPosition).toBeNull();
    
    console.log(`Ship moved from (100, 100) to (${shipActor.position.x.toFixed(1)}, ${shipActor.position.y.toFixed(1)}) in ${iterations} frames`);
  });

  it('should orient ship toward movement direction', () => {
    const initialRotation = shipActor.rotation;
    
    // Set target that requires rotation
    const targetX = 400; // East
    const targetY = 100; // Same Y level
    shipActor.setTarget({ x: targetX, y: targetY });
    
    // Expected rotation for eastward movement
    const expectedRotation = Math.atan2(targetY - 100, targetX - 100); // Should be 0 radians (facing east)
    
    // Simulate a few update cycles to allow rotation
    const deltaTime = 1/60;
    for (let i = 0; i < 10; i++) {
      shipActor.update(deltaTime);
    }
    
    // Verify ship is rotating toward target
    const rotationDifference = Math.abs(shipActor.rotation - expectedRotation);
    const normalizedRotationDiff = Math.min(rotationDifference, 2 * Math.PI - rotationDifference);
    const rotationDiffDegrees = (normalizedRotationDiff * 180) / Math.PI;
    
    console.log(`Initial rotation: ${(initialRotation * 180 / Math.PI).toFixed(1)}°`);
    console.log(`Expected rotation: ${(expectedRotation * 180 / Math.PI).toFixed(1)}°`);
    console.log(`Actual rotation: ${(shipActor.rotation * 180 / Math.PI).toFixed(1)}°`);
    console.log(`Rotation difference: ${rotationDiffDegrees.toFixed(1)}°`);
    
    // Ship should be oriented within reasonable tolerance (rotation is progressive)
    expect(rotationDiffDegrees).toBeLessThan(90); // Should be rotating toward target
  });

  it('should maintain correct orientation during complete movement sequence', () => {
    // Test multiple movement scenarios
    const testCases = [
      { target: { x: 200, y: 100 }, description: 'eastward' },
      { target: { x: 100, y: 200 }, description: 'southward' },
      { target: { x: 50, y: 100 }, description: 'westward' },
      { target: { x: 100, y: 50 }, description: 'northward' },
    ];

    for (const testCase of testCases) {
      // Reset ship position
      shipActor.position.x = 100;
      shipActor.position.y = 100;
      shipActor.stopMovement();

      console.log(`\nTesting ${testCase.description} movement to (${testCase.target.x}, ${testCase.target.y})`);
      
      const initialPos = { x: shipActor.position.x, y: shipActor.position.y };
      shipActor.setTarget(testCase.target);
      
      // Calculate expected final rotation
      const deltaX = testCase.target.x - initialPos.x;
      const deltaY = testCase.target.y - initialPos.y;
      const expectedFinalRotation = Math.atan2(deltaY, deltaX);
      
      // Simulate movement to completion
      let iterations = 0;
      const maxIterations = 1000;
      const deltaTime = 1/60;
      
      while (shipActor.targetPosition && iterations < maxIterations) {
        shipActor.update(deltaTime);
        iterations++;
      }
      
      // Verify ship reached target
      const arrivalDistance = Math.sqrt(
        Math.pow(shipActor.position.x - testCase.target.x, 2) + 
        Math.pow(shipActor.position.y - testCase.target.y, 2)
      );
      expect(arrivalDistance).toBeLessThan(10);
      
      // Verify final orientation
      const rotationDifference = Math.abs(shipActor.rotation - expectedFinalRotation);
      const normalizedRotationDiff = Math.min(rotationDifference, 2 * Math.PI - rotationDifference);
      const rotationDiffDegrees = (normalizedRotationDiff * 180) / Math.PI;
      
      console.log(`  Expected rotation: ${(expectedFinalRotation * 180 / Math.PI).toFixed(1)}°`);
      console.log(`  Actual rotation: ${(shipActor.rotation * 180 / Math.PI).toFixed(1)}°`);
      console.log(`  Difference: ${rotationDiffDegrees.toFixed(1)}°`);
      
      expect(rotationDiffDegrees).toBeLessThan(15); // Within reasonable tolerance
    }
  });

  it('should handle right-click coordinate transformation correctly', () => {
    // This test simulates the coordinate transformation that happens when right-clicking
    // Based on the InputHandler.screenToWorldRayIntersection logic
    
    const mockCanvas = { width: 800, height: 600 };
    const mockCamera = { x: 0, y: 0, zoom: 1 };
    
    // Simulate right-click at screen coordinates (600, 300) - upper-right of center
    const screenX = 600;
    const screenY = 300;
    
    // Calculate expected world coordinates using the same logic as InputHandler
    const ndcX = ((screenX - mockCanvas.width / 2) / (mockCanvas.width / 2));
    const ndcY = ((screenY - mockCanvas.height / 2) / (mockCanvas.height / 2));
    
    const viewportWorldWidth = mockCanvas.width / mockCamera.zoom;
    const viewportWorldHeight = mockCanvas.height / mockCamera.zoom;
    
    const expectedWorldX = mockCamera.x + (ndcX * viewportWorldWidth / 2);
    const expectedWorldY = mockCamera.y + (ndcY * viewportWorldHeight / 2);
    
    console.log(`Screen click at (${screenX}, ${screenY})`);
    console.log(`Expected world coordinates: (${expectedWorldX}, ${expectedWorldY})`);
    
    // Set the calculated world coordinates as ship target
    shipActor.setTarget({ x: expectedWorldX, y: expectedWorldY });
    
    // Simulate movement
    let iterations = 0;
    const maxIterations = 1000;
    const deltaTime = 1/60;
    
    while (shipActor.targetPosition && iterations < maxIterations) {
      shipActor.update(deltaTime);
      iterations++;
    }
    
    // Verify ship reached the target coordinates derived from screen click
    const arrivalDistance = Math.sqrt(
      Math.pow(shipActor.position.x - expectedWorldX, 2) + 
      Math.pow(shipActor.position.y - expectedWorldY, 2)
    );
    
    expect(arrivalDistance).toBeLessThan(10);
    console.log(`Ship successfully moved to world coordinates (${shipActor.position.x.toFixed(1)}, ${shipActor.position.y.toFixed(1)})`);
    
    // Verify orientation toward the clicked position
    const deltaX = expectedWorldX - 100; // Initial X was 100
    const deltaY = expectedWorldY - 100; // Initial Y was 100
    const expectedRotation = Math.atan2(deltaY, deltaX);
    
    const rotationDifference = Math.abs(shipActor.rotation - expectedRotation);
    const normalizedRotationDiff = Math.min(rotationDifference, 2 * Math.PI - rotationDifference);
    const rotationDiffDegrees = (normalizedRotationDiff * 180) / Math.PI;
    
    expect(rotationDiffDegrees).toBeLessThan(15);
    console.log(`Ship oriented correctly: ${rotationDiffDegrees.toFixed(1)}° difference from expected`);
  });

  it('should demonstrate complete right-click-to-movement workflow', () => {
    console.log('\n=== Complete Right-Click Movement Workflow Test ===');
    
    // Step 1: Initial state
    console.log(`1. Initial ship position: (${shipActor.position.x}, ${shipActor.position.y})`);
    console.log(`   Initial rotation: ${(shipActor.rotation * 180 / Math.PI).toFixed(1)}°`);
    
    // Step 2: Simulate right-click at specific screen location
    const screenClickX = 650;
    const screenClickY = 250;
    console.log(`2. User right-clicks at screen coordinates (${screenClickX}, ${screenClickY})`);
    
    // Step 3: Convert screen coordinates to world coordinates (as InputHandler does)
    const canvas = { width: 800, height: 600 };
    const camera = { x: 0, y: 0, zoom: 1 };
    
    const ndcX = ((screenClickX - canvas.width / 2) / (canvas.width / 2));
    const ndcY = ((screenClickY - canvas.height / 2) / (canvas.height / 2));
    const viewportWorldWidth = canvas.width / camera.zoom;
    const viewportWorldHeight = canvas.height / camera.zoom;
    const worldX = camera.x + (ndcX * viewportWorldWidth / 2);
    const worldY = camera.y + (ndcY * viewportWorldHeight / 2);
    
    console.log(`3. Converted to world coordinates: (${worldX.toFixed(1)}, ${worldY.toFixed(1)})`);
    
    // Step 4: Command ship to move to target
    shipActor.setTarget({ x: worldX, y: worldY });
    console.log(`4. Ship target set. Ship begins moving and rotating.`);
    
    // Step 5: Simulate movement until completion
    let iterations = 0;
    const maxIterations = 1000;
    const deltaTime = 1/60;
    
    while (shipActor.targetPosition && iterations < maxIterations) {
      shipActor.update(deltaTime);
      iterations++;
      
      // Log progress every 60 frames (1 second)
      if (iterations % 60 === 0) {
        const distance = Math.sqrt(
          Math.pow(shipActor.position.x - worldX, 2) + 
          Math.pow(shipActor.position.y - worldY, 2)
        );
        console.log(`   After ${iterations/60}s: position (${shipActor.position.x.toFixed(1)}, ${shipActor.position.y.toFixed(1)}), distance to target: ${distance.toFixed(1)}`);
      }
    }
    
    // Step 6: Verify final state
    const finalDistance = Math.sqrt(
      Math.pow(shipActor.position.x - worldX, 2) + 
      Math.pow(shipActor.position.y - worldY, 2)
    );
    
    const deltaX = worldX - 100;
    const deltaY = worldY - 100;
    const expectedRotation = Math.atan2(deltaY, deltaX);
    const rotationDiff = Math.abs(shipActor.rotation - expectedRotation);
    const normalizedRotationDiff = Math.min(rotationDiff, 2 * Math.PI - rotationDiff);
    const rotationDiffDegrees = (normalizedRotationDiff * 180) / Math.PI;
    
    console.log(`5. Movement completed in ${(iterations/60).toFixed(1)} seconds:`);
    console.log(`   Final position: (${shipActor.position.x.toFixed(1)}, ${shipActor.position.y.toFixed(1)})`);
    console.log(`   Distance from target: ${finalDistance.toFixed(1)} units`);
    console.log(`   Final rotation: ${(shipActor.rotation * 180 / Math.PI).toFixed(1)}°`);
    console.log(`   Expected rotation: ${(expectedRotation * 180 / Math.PI).toFixed(1)}°`);
    console.log(`   Rotation accuracy: ${rotationDiffDegrees.toFixed(1)}° difference`);
    
    // Assertions
    expect(finalDistance).toBeLessThan(10); // Ship reached target
    expect(rotationDiffDegrees).toBeLessThan(15); // Ship oriented correctly
    expect(ship.location.isInTransit).toBe(false); // Movement completed
    
    console.log('✅ Right-click movement workflow completed successfully!');
    console.log('✅ Ship flies to clicked coordinates');
    console.log('✅ Ship orients toward movement direction');
  });
});