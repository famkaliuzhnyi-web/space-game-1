import { test, expect } from '@playwright/test';

/**
 * Simple test to verify Playwright works and basic game loading
 */
test.describe('Simple Game Loading Test', () => {
  test('should load the game page', async ({ page }) => {
    // Just test if we can load the page
    await page.goto('http://localhost:5173');
    
    // Verify page loads
    await expect(page).toHaveTitle('Space Game');
    
    // Look for the main title
    await expect(page.locator('h1')).toContainText('Space Game');
    
    console.log('✅ Basic page loading test passed');
  });
});