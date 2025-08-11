import { describe, test, expect } from 'vitest';
import { angleToTarget, normalizeAngle } from '../utils/coordinates';
import { Vector3D } from '../types';

describe('Ship Rotation Analysis', () => {
  test('should analyze ship rotation behavior for different directions', () => {
    console.log('\n=== Ship Rotation Analysis ===');
    
    const shipPosition: Vector3D = { x: 0, y: 0, z: 50 };
    
    // Define test targets in different directions
    const targets = [
      { name: 'Right', position: { x: 100, y: 0, z: 50 }, expectedAngle: 0 },
      { name: 'Up', position: { x: 0, y: -100, z: 50 }, expectedAngle: -Math.PI/2 },
      { name: 'Left', position: { x: -100, y: 0, z: 50 }, expectedAngle: Math.PI },
      { name: 'Down', position: { x: 0, y: 100, z: 50 }, expectedAngle: Math.PI/2 },
      { name: 'Up-Right', position: { x: 100, y: -100, z: 50 }, expectedAngle: -Math.PI/4 },
      { name: 'Down-Left', position: { x: -100, y: 100, z: 50 }, expectedAngle: 3*Math.PI/4 }
    ];

    console.log('Ship position:', shipPosition);
    console.log('Ship sprites point RIGHT (+X direction) when rotation = 0\n');

    targets.forEach(target => {
      const calculatedAngle = angleToTarget(shipPosition, target.position);
      const normalizedAngle = normalizeAngle(calculatedAngle);
      const degrees = (normalizedAngle * 180 / Math.PI).toFixed(1);
      const expectedDegrees = (target.expectedAngle * 180 / Math.PI).toFixed(1);
      const isCorrect = Math.abs(normalizedAngle - target.expectedAngle) < 0.001;
      
      console.log(`${target.name}:`);
      console.log(`  Target: (${target.position.x}, ${target.position.y})`);
      console.log(`  Expected: ${expectedDegrees}° (${target.expectedAngle.toFixed(3)} rad)`);
      console.log(`  Actual: ${degrees}° (${normalizedAngle.toFixed(3)} rad)`);
      console.log(`  Result: ${isCorrect ? '✓ CORRECT' : '✗ WRONG'}`);
      
      // Since ship sprite points right by default, check if rotation makes sense
      if (target.name === 'Right') {
        console.log(`    Ship points RIGHT naturally, no rotation needed`);
      } else if (target.name === 'Left') {
        console.log(`    Ship rotates 180° to point LEFT`);
      } else if (target.name === 'Up') {
        console.log(`    Ship rotates -90° to point UP`);
      } else if (target.name === 'Down') {
        console.log(`    Ship rotates 90° to point DOWN`);
      }
      console.log();
      
      expect(isCorrect).toBe(true);
    });
  });

  test('should demonstrate the problem with diagonal movement', () => {
    console.log('\n=== Diagonal Movement Analysis ===');
    
    const shipPosition: Vector3D = { x: 100, y: 100, z: 50 };
    
    // Test diagonal movements that might cause the "wrong direction" issue
    const diagonalTargets = [
      { name: 'Northeast', target: { x: 200, y: 50, z: 50 } },   // Should point NE
      { name: 'Northwest', target: { x: 50, y: 50, z: 50 } },    // Should point NW  
      { name: 'Southeast', target: { x: 200, y: 150, z: 50 } },  // Should point SE
      { name: 'Southwest', target: { x: 50, y: 150, z: 50 } }    // Should point SW
    ];

    diagonalTargets.forEach(({ name, target }) => {
      const angle = angleToTarget(shipPosition, target);
      const degrees = (angle * 180 / Math.PI).toFixed(1);
      
      // Calculate expected direction vector
      const dx = target.x - shipPosition.x;
      const dy = target.y - shipPosition.y;
      
      console.log(`${name} movement:`);
      console.log(`  From: (${shipPosition.x}, ${shipPosition.y}) to (${target.x}, ${target.y})`);
      console.log(`  Vector: (${dx}, ${dy})`);
      console.log(`  Angle: ${degrees}°`);
      console.log(`  Ship rotation: ${degrees}° from default right-pointing orientation`);
      console.log();
    });
  });

  test('should identify potential coordinate system issues', () => {
    console.log('\n=== Coordinate System Analysis ===');
    
    // Test if the issue is related to Y-axis direction
    console.log('Canvas coordinate system:');
    console.log('- X increases rightward (positive X = right)');
    console.log('- Y increases downward (positive Y = down)');  
    console.log('- This is DIFFERENT from standard math coordinates where Y increases upward');
    console.log();
    
    const ship: Vector3D = { x: 0, y: 0, z: 50 };
    
    // Test upward movement in canvas coordinates
    const upTarget: Vector3D = { x: 0, y: -50, z: 50 }; // Y decreases = up in canvas
    const upAngle = angleToTarget(ship, upTarget);
    const upDegrees = (upAngle * 180 / Math.PI).toFixed(1);
    
    console.log(`Moving UP (Y decreases from 0 to -50):`);
    console.log(`  Angle: ${upDegrees}° (expected -90°)`);
    console.log(`  atan2(-50, 0) = ${(Math.atan2(-50, 0) * 180 / Math.PI).toFixed(1)}°`);
    
    // Test downward movement  
    const downTarget: Vector3D = { x: 0, y: 50, z: 50 }; // Y increases = down in canvas
    const downAngle = angleToTarget(ship, downTarget);
    const downDegrees = (downAngle * 180 / Math.PI).toFixed(1);
    
    console.log(`Moving DOWN (Y increases from 0 to 50):`);
    console.log(`  Angle: ${downDegrees}° (expected 90°)`);
    console.log(`  atan2(50, 0) = ${(Math.atan2(50, 0) * 180 / Math.PI).toFixed(1)}°`);
    
    // Both should be correct for canvas coordinates
    expect(Math.abs(upAngle - (-Math.PI/2))).toBeLessThan(0.001);
    expect(Math.abs(downAngle - (Math.PI/2))).toBeLessThan(0.001);
    
    console.log('\n✅ Coordinate system is working correctly for canvas');
  });
});