# End-to-End (E2E) Testing

This directory contains end-to-end tests for the Space Game application using [Playwright](https://playwright.dev/).

## Prerequisites

- Node.js >= 14.18.0
- All project dependencies installed (`npm install`)
- Playwright browsers installed (run `npx playwright install`)

## Running E2E Tests

### All Tests
```bash
npm run test:e2e
```

### Debug Mode (with browser UI)
```bash
npm run test:e2e:debug
```

### Headed Mode (see browser window)
```bash
npm run test:e2e:headed
```

### Run Specific Test
```bash
npx playwright test -g "should start game"
```

## Test Structure

### Current Tests

1. **should start game, enter debug scene, and command ship movement** (space-game.spec.ts)
   - Loads the landing page
   - Clicks "🔧 Debug Start" button to enter debug mode
   - Waits for game canvas to load
   - Tests ship movement by right-clicking at different positions
   - Verifies UI responsiveness with keyboard shortcuts
   - Takes screenshots for visual verification

2. **should handle ship movement with WASD camera controls** (space-game.spec.ts)
   - Loads the game in debug mode
   - Tests WASD camera movement controls
   - Tests zoom in/out controls (+/-)
   - Verifies canvas remains responsive

3. **🚀 NEW: Ship Navigation and Orientation Tests** (ship-navigation.spec.ts)
   - **should move ship to right-click coordinates and orient correctly**
     - Tests ship movement to specific clicked coordinates
     - Validates ship orientation matches movement direction
     - Uses debug functions to access ship position and rotation
     - Tests multiple positions: upper-right, lower-left, center
     - Verifies orientation within 10° tolerance
   
   - **should maintain correct orientation during complex movement patterns**
     - Tests circular movement pattern
     - Validates orientation accuracy for longer movements
     - Uses 15° tolerance for complex patterns

### Manual Testing Options

When automated e2e tests cannot run due to browser setup issues, use these alternatives:

#### 1. Manual Validation Guide
- See `MANUAL_VALIDATION_GUIDE.md` for step-by-step manual testing
- Provides browser console commands for validation
- Includes troubleshooting steps

#### 2. Console Test Script
- Load `e2e/console-test-script.js` in browser console
- Run `testShipNavigation()` to execute automated validation
- Works in any browser with the game loaded in debug mode

### Debug Features for Testing

The game exposes debug functionality when running in debug mode:

```javascript
// Access game engine (available in debug mode)
window.gameEngine

// Get ship position and rotation
const ship = window.gameEngine.getSceneManager().getPlayerShipActor();
ship.position // { x, y, z }
ship.rotation // rotation angle in radians
ship.isMoving() // boolean
```

### Screenshots

Test screenshots are saved to `e2e-test-results/` directory:
- `01-landing-page.png` - Initial landing page
- `02-after-debug-click.png` - After clicking debug button
- `03-after-wait.png` - Game loading state
- `debug-scene-after-ship-commands.png` - Final state after ship commands
- Ship navigation test screenshots with movement validation

## Configuration

The e2e tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:5173`
- Automatically starts dev server before tests
- Uses Chromium browser for consistent results
- Includes trace collection for debugging failed tests
- Reuses existing dev server if available

## Debugging

### View Test Traces
When tests fail, Playwright generates trace files that can be viewed:
```bash
npx playwright show-trace test-results/[trace-file].zip
```

### Generate HTML Report
```bash
npx playwright show-report
```

### Console Logs
The tests capture console logs to verify debug mode initialization and game state.

## Game-Specific Test Details

### Debug Mode
The tests use debug mode (`debugMode=true`) which:
- Automatically creates a debug character
- Skips character creation UI
- Applies debug scenario with maximum resources
- Enables faster test execution
- Exposes `window.gameEngine` for testing access

### Ship Controls Tested
- **Right-click navigation**: Commands ship movement to clicked coordinates
- **Ship orientation**: Validates ship rotates to face movement direction
- **Movement completion**: Waits for ship movement to complete
- **Position accuracy**: Verifies ship reaches target coordinates
- **WASD camera movement**: Moves camera view (not ship directly)  
- **Zoom controls**: Plus/minus keys for zooming in/out
- **Keyboard shortcuts**: Tests UI panel shortcuts (N, S, F, etc.)

### Canvas Detection
Tests look for any `canvas` element since the game uses dynamic canvas creation through the engine.

### Ship Navigation Validation
- Uses `Math.atan2(deltaY, deltaX)` to calculate expected ship orientation
- Compares actual ship rotation with expected angle
- Normalizes angles to handle wrap-around cases (-π to π)
- Allows tolerance of 10-15° for orientation accuracy
- Tests both simple and complex movement patterns

## CI/CD Integration

These tests are designed to run in headless mode on CI systems. The configuration automatically:
- Retries failed tests (2 retries on CI)
- Runs tests sequentially for stability
- Captures traces and screenshots for debugging
- Uses appropriate timeouts for game initialization

## Adding New Tests

When adding new e2e tests:
1. Place test files in the `e2e/` directory
2. Use `.spec.ts` extension
3. Follow the existing pattern for game initialization
4. Include appropriate waits for canvas and game engine loading
5. Take screenshots for visual verification of UI changes
6. Test both UI interactions and game mechanics
7. Use debug functions for accessing internal game state
8. Include manual validation alternatives for complex tests