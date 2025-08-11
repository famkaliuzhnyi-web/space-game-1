import { test, expect } from '@playwright/test';

/**
 * E2E test for ship navigation and orientation
 * Tests that the ship flies to right-click coordinates and orients correctly
 */
test.describe('Ship Navigation and Orientation', () => {
  test('should move ship to right-click coordinates and orient correctly', async ({ page }) => {
    // Start the game and enter debug mode
    await page.goto('/');
    
    // Verify landing page loads
    await expect(page).toHaveTitle('Space Game');
    await expect(page.locator('h1.space-title')).toContainText('🚀 Space Game');
    
    // Enter debug mode by clicking the "🔧 Debug Start" button
    const debugButton = page.locator('button.space-button.debug');
    await expect(debugButton).toBeVisible();
    await expect(debugButton).toContainText('🔧 Debug Start');
    await debugButton.click();
    
    // Wait for game canvas to load
    const gameCanvas = page.locator('canvas');
    await expect(gameCanvas).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(3000); // Allow game engine to fully initialize
    
    // Take initial screenshot
    await page.screenshot({ path: 'e2e-test-results/01-initial-state.png' });
    
    // Set up console monitoring to capture ship movement and orientation data
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Inject debug functions to expose ship position and rotation
    await page.evaluate(() => {
      // Try to access the game engine through window object
      const gameEngine = (window as any).gameEngine || (window as any).engine;
      if (gameEngine && gameEngine.sceneManager) {
        // Add debug function to get ship position and rotation
        (window as any).getShipDebugInfo = () => {
          const shipActor = gameEngine.sceneManager.getPlayerShipActor();
          if (shipActor) {
            return {
              position: { x: shipActor.position.x, y: shipActor.position.y },
              rotation: shipActor.rotation,
              targetPosition: shipActor.targetPosition,
              isMoving: shipActor.isMoving()
            };
          }
          return null;
        };
        console.log('DEBUG: Ship debug functions injected successfully');
      } else {
        console.log('DEBUG: Could not access game engine for debug functions');
      }
    });
    
    // Get canvas bounding box for coordinate calculations
    const canvasBoundingBox = await gameCanvas.boundingBox();
    expect(canvasBoundingBox).not.toBeNull();
    
    if (canvasBoundingBox) {
      // Calculate center and test coordinates
      const centerX = canvasBoundingBox.x + canvasBoundingBox.width / 2;
      const centerY = canvasBoundingBox.y + canvasBoundingBox.height / 2;
      
      // Test positions: upper-right, lower-left, and center
      const testPositions = [
        { name: 'upper-right', x: centerX + 150, y: centerY - 100 },
        { name: 'lower-left', x: centerX - 120, y: centerY + 80 },
        { name: 'center', x: centerX, y: centerY }
      ];
      
      for (const testPos of testPositions) {
        console.log(`Testing movement to ${testPos.name} position`);
        
        // Get initial ship state
        const initialShipInfo = await page.evaluate(() => {
          return (window as any).getShipDebugInfo?.() || { position: null };
        });
        
        // Right-click at target position to command ship movement
        await page.mouse.click(testPos.x, testPos.y, { button: 'right' });
        console.log(`Right-clicked at (${testPos.x}, ${testPos.y})`);
        
        // Wait for movement to start and then complete
        await page.waitForTimeout(500); // Initial delay for movement to start
        
        // Wait for ship movement to complete (poll until ship stops moving)
        let shipInfo;
        let attempts = 0;
        const maxAttempts = 30; // 15 seconds max wait
        
        do {
          await page.waitForTimeout(500);
          shipInfo = await page.evaluate(() => {
            return (window as any).getShipDebugInfo?.();
          });
          attempts++;
        } while (shipInfo?.isMoving && attempts < maxAttempts);
        
        // Take screenshot after movement
        await page.screenshot({ 
          path: `e2e-test-results/02-after-move-to-${testPos.name}.png` 
        });
        
        if (shipInfo && shipInfo.position) {
          console.log(`Ship final position: (${shipInfo.position.x}, ${shipInfo.position.y})`);
          console.log(`Ship rotation: ${shipInfo.rotation} radians`);
          
          // Calculate expected orientation (angle from initial to final position)
          if (initialShipInfo.position && shipInfo.position) {
            const dx = shipInfo.position.x - initialShipInfo.position.x;
            const dy = shipInfo.position.y - initialShipInfo.position.y;
            const expectedRotation = Math.atan2(dy, dx);
            
            console.log(`Expected rotation: ${expectedRotation} radians`);
            console.log(`Actual rotation: ${shipInfo.rotation} radians`);
            
            // Normalize angles for comparison
            const normalizeAngle = (angle) => {
              let normalized = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
              if (normalized > Math.PI) normalized -= 2 * Math.PI;
              return normalized;
            };
            
            const normalizedExpected = normalizeAngle(expectedRotation);
            const normalizedActual = normalizeAngle(shipInfo.rotation);
            const angleDiff = Math.abs(normalizedExpected - normalizedActual);
            const angleDiffDegrees = (angleDiff * 180) / Math.PI;
            
            console.log(`Angle difference: ${angleDiffDegrees} degrees`);
            
            // Verify ship orientation is approximately correct (within 10 degrees)
            expect(angleDiffDegrees).toBeLessThan(10);
          }
        }
        
        // Add delay between test positions
        await page.waitForTimeout(1000);
      }
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'e2e-test-results/03-navigation-test-complete.png',
      fullPage: true 
    });
    
    // Verify game is still responsive
    await expect(gameCanvas).toBeVisible();
    
    console.log('✅ Ship navigation and orientation test completed successfully');
  });
  
  test('should maintain correct orientation during complex movement patterns', async ({ page }) => {
    // Start the game and enter debug mode
    await page.goto('/');
    await page.locator('button.space-button.debug').click();
    
    // Wait for game canvas to load
    const gameCanvas = page.locator('canvas');
    await expect(gameCanvas).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Inject debug functions
    await page.evaluate(() => {
      const gameEngine = (window as any).gameEngine || (window as any).engine;
      if (gameEngine && gameEngine.sceneManager) {
        (window as any).getShipDebugInfo = () => {
          const shipActor = gameEngine.sceneManager.getPlayerShipActor();
          if (shipActor) {
            return {
              position: { x: shipActor.position.x, y: shipActor.position.y },
              rotation: shipActor.rotation,
              isMoving: shipActor.isMoving()
            };
          }
          return null;
        };
      }
    });
    
    const canvasBoundingBox = await gameCanvas.boundingBox();
    expect(canvasBoundingBox).not.toBeNull();
    
    if (canvasBoundingBox) {
      const centerX = canvasBoundingBox.x + canvasBoundingBox.width / 2;
      const centerY = canvasBoundingBox.y + canvasBoundingBox.height / 2;
      
      // Create a circular movement pattern
      const radius = 100;
      const steps = 8;
      const positions = [];
      
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        positions.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          expectedRotation: angle
        });
      }
      
      // Test circular movement pattern
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        
        // Right-click to move to position
        await page.mouse.click(pos.x, pos.y, { button: 'right' });
        
        // Wait for movement to complete
        let shipInfo;
        let attempts = 0;
        do {
          await page.waitForTimeout(500);
          shipInfo = await page.evaluate(() => {
            return (window as any).getShipDebugInfo?.();
          });
          attempts++;
        } while (shipInfo?.isMoving && attempts < 20);
        
        // Verify orientation for longer movements
        if (shipInfo && i > 0) {
          const prevPos = positions[i - 1];
          const dx = pos.x - prevPos.x;
          const dy = pos.y - prevPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only check orientation for movements that are long enough
          if (distance > 50) {
            const expectedRotation = Math.atan2(dy, dx);
            const normalizeAngle = (angle) => {
              let normalized = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
              if (normalized > Math.PI) normalized -= 2 * Math.PI;
              return normalized;
            };
            
            const normalizedExpected = normalizeAngle(expectedRotation);
            const normalizedActual = normalizeAngle(shipInfo.rotation);
            let angleDiff = Math.abs(normalizedExpected - normalizedActual);
            
            // Handle wrap-around case
            if (angleDiff > Math.PI) {
              angleDiff = 2 * Math.PI - angleDiff;
            }
            
            const angleDiffDegrees = (angleDiff * 180) / Math.PI;
            
            // Allow slightly more tolerance for complex movement patterns
            expect(angleDiffDegrees).toBeLessThan(15);
          }
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'e2e-test-results/04-circular-movement-complete.png' 
    });
    
    console.log('✅ Complex movement pattern test completed successfully');
  });
});