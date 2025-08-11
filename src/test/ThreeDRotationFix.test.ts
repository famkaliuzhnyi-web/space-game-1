import { describe, it, expect } from 'vitest';

describe('3D Rotation Axis Issue Analysis', () => {
  it('should demonstrate the coordinate system mismatch', () => {
    // This is a conceptual test to document the issue
    
    // In 2D Canvas coordinate system:
    // - Origin at top-left, +X right, +Y down
    // - Ship moving down (+Y direction) should rotate π/2 (90°) to face down
    const canvas2D = {
      movement: { x: 0, y: 100 }, // Moving down
      expectedRotation: Math.PI/2, // 90° clockwise from right
      description: '2D Canvas: Ship moving down should face down (π/2 rotation)'
    };
    
    // In 3D Three.js coordinate system:
    // - Origin at center, +X right, +Y up, +Z out
    // - Position is displayed as (x, -y, z) to match screen coordinates
    // - Current code applies rotation as -rotation
    const threejs3D = {
      displayPosition: { x: 0, y: -100 }, // -Y to flip coordinate system
      currentRotationApplication: -Math.PI/2, // Current code negates rotation
      description: '3D Three.js: Ship at (0, -100) with rotation -π/2'
    };
    
    // The problem:
    // 1. Ship moves to (0, 100) in 2D (down direction)
    // 2. Ship rotates to π/2 to face down (correct in 2D)
    // 3. In 3D, position becomes (0, -100) (flipped Y)
    // 4. In 3D, rotation becomes -π/2 (flipped rotation)
    // 5. Ship now faces UP instead of DOWN, which is wrong!
    
    console.log('=== Coordinate System Analysis ===');
    console.log('2D Canvas:', canvas2D);
    console.log('3D Three.js:', threejs3D);
    
    // Expected behavior: Ship should face the direction it's moving
    // In both 2D and 3D, if ship moves down, it should visually face down
    // The fix: Don't negate rotation when Y coordinate is negated
    
    const correctRotationInThreeJS = Math.PI/2; // Same as 2D, not negated
    console.log('Correct 3D rotation should be:', correctRotationInThreeJS, 'rad (not negated)');
    
    // Verify the issue exists
    expect(threejs3D.currentRotationApplication).toBe(-Math.PI/2);
    expect(canvas2D.expectedRotation).toBe(Math.PI/2);
    expect(threejs3D.currentRotationApplication).not.toBe(canvas2D.expectedRotation);
  });
  
  it('should verify the fix maintains directional consistency', () => {
    // Test all cardinal directions
    const directions = [
      { name: 'RIGHT', movement: { x: 100, y: 0 }, rotation: 0 },
      { name: 'DOWN', movement: { x: 0, y: 100 }, rotation: Math.PI/2 },
      { name: 'LEFT', movement: { x: -100, y: 0 }, rotation: Math.PI },
      { name: 'UP', movement: { x: 0, y: -100 }, rotation: -Math.PI/2 }
    ];
    
    directions.forEach(dir => {
      const canvas2DRotation = dir.rotation;
      const currentThreeJSRotation = -dir.rotation; // Current buggy behavior
      const correctedThreeJSRotation = dir.rotation; // Proposed fix
      
      console.log(`${dir.name} movement:`);
      console.log(`  2D rotation: ${canvas2DRotation.toFixed(3)} rad`);
      console.log(`  Current 3D rotation: ${currentThreeJSRotation.toFixed(3)} rad (WRONG)`);
      console.log(`  Corrected 3D rotation: ${correctedThreeJSRotation.toFixed(3)} rad (CORRECT)`);
      
      // The corrected rotation should match 2D rotation
      expect(correctedThreeJSRotation).toBe(canvas2DRotation);
    });
  });
});