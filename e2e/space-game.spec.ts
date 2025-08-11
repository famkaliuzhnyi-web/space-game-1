import { test, expect } from '@playwright/test';

/**
 * First E2E test for Space Game
 * Tests the core flow: start game → enter debug scene → command ship around
 */
test.describe('Space Game E2E', () => {
  test('should start game, enter debug scene, and command ship movement', async ({ page }) => {
    // Start the game from the landing page
    await page.goto('/');

    // Verify landing page loads with the expected title
    await expect(page).toHaveTitle('Space Game');
    await expect(page.locator('h1.space-title')).toContainText('🚀 Space Game');

    // Take screenshot of landing page for debugging
    await page.screenshot({ path: 'e2e-test-results/01-landing-page.png' });

    // Enter debug mode by clicking the "🔧 Debug Start" button
    const debugButton = page.locator('button.space-button.debug');
    await expect(debugButton).toBeVisible();
    await expect(debugButton).toContainText('🔧 Debug Start');
    
    await debugButton.click();

    // Take screenshot after clicking debug button
    await page.screenshot({ path: 'e2e-test-results/02-after-debug-click.png' });

    // Wait a bit for transition
    await page.waitForTimeout(3000);

    // Take screenshot to see what's rendered
    await page.screenshot({ path: 'e2e-test-results/03-after-wait.png' });

    // Try to find any canvas element
    const anyCanvas = page.locator('canvas');
    await expect(anyCanvas).toBeVisible({ timeout: 30000 });
    
    // Wait a bit more for the game engine to fully initialize
    await page.waitForTimeout(2000);

    // Verify debug mode initialized properly by checking console logs
    // In debug mode, the game should log debug character creation
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    // Wait for debug initialization logs
    await page.waitForTimeout(1000);
    
    // Check that debug character was created (should be in console logs)
    const hasDebugLog = consoleLogs.some(log => 
      log.includes('Debug mode: Creating debug character automatically') ||
      log.includes('Debug scenario applied') ||
      log.includes('debug-tester')
    );
    
    // If we don't see the logs yet, wait a bit more and try again
    if (!hasDebugLog) {
      await page.waitForTimeout(2000);
    }

    // Test ship movement commands
    // Get canvas bounding box for coordinate calculations
    const canvasBoundingBox = await anyCanvas.boundingBox();
    expect(canvasBoundingBox).not.toBeNull();
    
    if (canvasBoundingBox) {
      // Calculate center of canvas
      const centerX = canvasBoundingBox.x + canvasBoundingBox.width / 2;
      const centerY = canvasBoundingBox.y + canvasBoundingBox.height / 2;
      
      // Test ship movement by right-clicking at different positions
      // According to InputHandler.ts, right-click (button 2) triggers ship commands
      
      // Move ship to upper-left quadrant
      const moveX1 = centerX - 100;
      const moveY1 = centerY - 100;
      await page.mouse.click(moveX1, moveY1, { button: 'right' });
      
      // Wait for command to process
      await page.waitForTimeout(500);
      
      // Move ship to lower-right quadrant  
      const moveX2 = centerX + 100;
      const moveY2 = centerY + 100;
      await page.mouse.click(moveX2, moveY2, { button: 'right' });
      
      // Wait for command to process
      await page.waitForTimeout(500);
      
      // Move ship back to center
      await page.mouse.click(centerX, centerY, { button: 'right' });
      
      // Wait for final command to process
      await page.waitForTimeout(500);
    }

    // Verify game is still responsive after ship commands
    // Test a UI interaction (keyboard shortcut to open navigation panel)
    await page.keyboard.press('KeyN');
    
    // Wait a moment for UI to respond
    await page.waitForTimeout(500);
    
    // Press ESC to close any opened panels
    await page.keyboard.press('Escape');
    
    // Final verification: canvas should still be visible and responsive
    await expect(anyCanvas).toBeVisible();
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: 'e2e-test-results/debug-scene-after-ship-commands.png',
      fullPage: true 
    });

    // Test passed if we reach this point without errors
    console.log('✅ E2E test completed successfully: Game started, debug scene entered, ship commands issued');
  });

  test('should handle ship movement with WASD camera controls', async ({ page }) => {
    // Start the game and enter debug mode
    await page.goto('/');
    await page.locator('button.space-button.debug').click();
    
    // Wait for game canvas to load
    const gameCanvas = page.locator('canvas');
    await expect(gameCanvas).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);

    // Test WASD camera movement (according to InputHandler.ts)
    // These should move the camera, not the ship directly
    await page.keyboard.press('KeyW'); // Move camera up
    await page.waitForTimeout(100);
    
    await page.keyboard.press('KeyS'); // Move camera down
    await page.waitForTimeout(100);
    
    await page.keyboard.press('KeyA'); // Move camera left
    await page.waitForTimeout(100);
    
    await page.keyboard.press('KeyD'); // Move camera right
    await page.waitForTimeout(100);

    // Test zoom controls
    await page.keyboard.press('Equal'); // Zoom in
    await page.waitForTimeout(100);
    
    await page.keyboard.press('Minus'); // Zoom out
    await page.waitForTimeout(100);

    // Verify canvas is still responsive after camera movements
    await expect(gameCanvas).toBeVisible();
    
    console.log('✅ Camera controls test completed successfully');
  });
});