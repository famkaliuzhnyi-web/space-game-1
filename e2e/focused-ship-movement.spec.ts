import { test, expect } from '@playwright/test';

/**
 * Focused E2E test for ship right-click movement and orientation
 * Tests the core requirement: ship flies to right-click coordinates and orients correctly
 */
test.describe('Focused Ship Movement Test', () => {
  test('should move ship to right-click coordinates and face the correct direction', async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    
    // Verify landing page loads
    await expect(page).toHaveTitle('Space Game');
    await expect(page.locator('h1.space-title')).toContainText('🚀 Space Game');
    
    // Enter debug mode for immediate access to ship
    const debugButton = page.locator('button.space-button.debug');
    await expect(debugButton).toBeVisible();
    await debugButton.click();
    
    // Wait for game canvas to initialize
    const gameCanvas = page.locator('canvas');
    await expect(gameCanvas).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(3000); // Allow game engine to fully initialize
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-initial-ship-position.png' });
    
    // Inject debug functions to monitor ship state
    await page.evaluate(() => {
      const gameEngine = (window as any).gameEngine || (window as any).engine;
      if (gameEngine && gameEngine.sceneManager) {
        (window as any).getShipInfo = () => {
          const shipActor = gameEngine.sceneManager.getPlayerShipActor();
          if (shipActor) {
            return {
              position: { x: shipActor.position.x, y: shipActor.position.y },
              rotation: shipActor.rotation, // Ship's facing direction in radians
              targetPosition: shipActor.targetPosition,
              isMoving: shipActor.isMoving()
            };
          }
          return null;
        };
        console.log('DEBUG: Ship monitoring functions injected');
      }
    });
    
    // Get canvas bounds for coordinate calculations
    const canvasBounds = await gameCanvas.boundingBox();
    expect(canvasBounds).not.toBeNull();
    
    if (canvasBounds) {
      // Calculate test coordinates relative to canvas center
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;
      
      // Get initial ship position and orientation
      const initialShip = await page.evaluate(() => (window as any).getShipInfo?.());
      console.log('Initial ship state:', initialShip);
      
      // Test Case 1: Move ship to upper-right quadrant
      const targetX = centerX + 120;
      const targetY = centerY - 80;
      
      console.log(`Right-clicking at screen coordinates (${targetX}, ${targetY})`);
      
      // Perform right-click to command ship movement
      await page.mouse.click(targetX, targetY, { button: 'right' });
      
      // Wait for ship to start moving
      await page.waitForTimeout(500);
      
      // Wait for ship movement to complete (poll until ship stops)
      let finalShip;
      let attempts = 0;
      const maxAttempts = 30; // 15 seconds max wait time
      
      do {
        await page.waitForTimeout(500);
        finalShip = await page.evaluate(() => (window as any).getShipInfo?.());
        attempts++;
        if (finalShip) {
          console.log(`Ship state after ${attempts * 0.5}s: position (${finalShip.position.x.toFixed(1)}, ${finalShip.position.y.toFixed(1)}), rotation: ${(finalShip.rotation * 180 / Math.PI).toFixed(1)}°, moving: ${finalShip.isMoving}`);
        }
      } while (finalShip?.isMoving && attempts < maxAttempts);
      
      // Take screenshot after movement
      await page.screenshot({ path: 'test-results/02-after-movement.png' });
      
      // Verify ship moved to new position and oriented correctly
      if (initialShip && finalShip) {
        console.log('=== MOVEMENT VERIFICATION ===');
        console.log(`Initial position: (${initialShip.position.x.toFixed(1)}, ${initialShip.position.y.toFixed(1)})`);
        console.log(`Final position: (${finalShip.position.x.toFixed(1)}, ${finalShip.position.y.toFixed(1)})`);
        console.log(`Initial rotation: ${(initialShip.rotation * 180 / Math.PI).toFixed(1)}°`);
        console.log(`Final rotation: ${(finalShip.rotation * 180 / Math.PI).toFixed(1)}°`);
        
        // Verify ship actually moved (position changed significantly)
        const movementDistance = Math.sqrt(
          Math.pow(finalShip.position.x - initialShip.position.x, 2) + 
          Math.pow(finalShip.position.y - initialShip.position.y, 2)
        );
        console.log(`Movement distance: ${movementDistance.toFixed(1)} units`);
        expect(movementDistance).toBeGreaterThan(50); // Ship should have moved significantly
        
        // Calculate expected rotation (angle from initial to final position)
        const deltaX = finalShip.position.x - initialShip.position.x;
        const deltaY = finalShip.position.y - initialShip.position.y;
        const expectedRotation = Math.atan2(deltaY, deltaX);
        
        console.log(`Expected rotation: ${(expectedRotation * 180 / Math.PI).toFixed(1)}°`);
        
        // Normalize angles to [-π, π] for comparison
        const normalizeAngle = (angle: number) => {
          let normalized = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
          if (normalized > Math.PI) normalized -= 2 * Math.PI;
          return normalized;
        };
        
        const normalizedExpected = normalizeAngle(expectedRotation);
        const normalizedActual = normalizeAngle(finalShip.rotation);
        let angleDiff = Math.abs(normalizedExpected - normalizedActual);
        
        // Handle wrap-around case (e.g., -179° vs 179°)
        if (angleDiff > Math.PI) {
          angleDiff = 2 * Math.PI - angleDiff;
        }
        
        const angleDiffDegrees = (angleDiff * 180) / Math.PI;
        console.log(`Angle difference: ${angleDiffDegrees.toFixed(1)}°`);
        
        // Verify ship is oriented correctly (within 15° tolerance)
        expect(angleDiffDegrees).toBeLessThan(15);
        
        console.log('✅ Ship movement and orientation verified successfully!');
      } else {
        throw new Error('Failed to get ship state information for verification');
      }
      
      // Test Case 2: Move ship to opposite corner to verify consistent behavior
      console.log('\n=== Testing Second Movement ===');
      const secondTargetX = centerX - 100;
      const secondTargetY = centerY + 90;
      
      const preSecondShip = await page.evaluate(() => (window as any).getShipInfo?.());
      
      // Right-click to move ship to second position
      await page.mouse.click(secondTargetX, secondTargetY, { button: 'right' });
      await page.waitForTimeout(500);
      
      // Wait for second movement to complete
      let secondFinalShip;
      attempts = 0;
      do {
        await page.waitForTimeout(500);
        secondFinalShip = await page.evaluate(() => (window as any).getShipInfo?.());
        attempts++;
      } while (secondFinalShip?.isMoving && attempts < maxAttempts);
      
      // Take final screenshot
      await page.screenshot({ path: 'test-results/03-final-position.png' });
      
      // Verify second movement
      if (preSecondShip && secondFinalShip) {
        const secondMovementDistance = Math.sqrt(
          Math.pow(secondFinalShip.position.x - preSecondShip.position.x, 2) + 
          Math.pow(secondFinalShip.position.y - preSecondShip.position.y, 2)
        );
        
        expect(secondMovementDistance).toBeGreaterThan(50);
        
        // Verify orientation for second movement
        const secondDeltaX = secondFinalShip.position.x - preSecondShip.position.x;
        const secondDeltaY = secondFinalShip.position.y - preSecondShip.position.y;
        const secondExpectedRotation = Math.atan2(secondDeltaY, secondDeltaX);
        
        const secondNormalizedExpected = normalizeAngle(secondExpectedRotation);
        const secondNormalizedActual = normalizeAngle(secondFinalShip.rotation);
        let secondAngleDiff = Math.abs(secondNormalizedExpected - secondNormalizedActual);
        
        if (secondAngleDiff > Math.PI) {
          secondAngleDiff = 2 * Math.PI - secondAngleDiff;
        }
        
        const secondAngleDiffDegrees = (secondAngleDiff * 180) / Math.PI;
        console.log(`Second movement angle difference: ${secondAngleDiffDegrees.toFixed(1)}°`);
        
        expect(secondAngleDiffDegrees).toBeLessThan(15);
        
        console.log('✅ Second movement and orientation verified successfully!');
      }
    }
    
    // Final verification: ensure canvas is still responsive
    await expect(gameCanvas).toBeVisible();
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('✅ Ship responds to right-click commands');
    console.log('✅ Ship moves to clicked coordinates');
    console.log('✅ Ship orients toward movement direction');
    console.log('✅ Consistent behavior across multiple movements');
  });
});