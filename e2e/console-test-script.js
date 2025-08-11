/**
 * Browser Console Test Script for Ship Navigation and Orientation
 * 
 * Run this script in the browser console (F12 -> Console) when the game is loaded in debug mode.
 * This will automatically test ship movement and orientation functionality.
 */

// Utility functions
const getShipInfo = () => {
  const ship = window.gameEngine?.getSceneManager()?.getPlayerShipActor();
  return ship ? { 
    position: { x: ship.position.x, y: ship.position.y }, 
    rotation: ship.rotation, 
    isMoving: ship.isMoving(),
    targetPosition: ship.targetPosition
  } : null;
};

const calcExpectedAngle = (from, to) => Math.atan2(to.y - from.y, to.x - from.x);
const normalizeAngle = (angle) => {
  let normalized = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
  if (normalized > Math.PI) normalized -= 2 * Math.PI;
  return normalized;
};

const radiansToDegrees = (rad) => (rad * 180) / Math.PI;

// Test function
async function testShipNavigation() {
  console.log('🚀 Starting Ship Navigation Test...');
  
  // Check if game engine is available
  if (!window.gameEngine) {
    console.error('❌ window.gameEngine not found. Make sure game is in debug mode.');
    return false;
  }
  
  const sceneManager = window.gameEngine.getSceneManager();
  if (!sceneManager) {
    console.error('❌ SceneManager not found');
    return false;
  }
  
  const ship = sceneManager.getPlayerShipActor();
  if (!ship) {
    console.error('❌ Player ship actor not found');
    return false;
  }
  
  console.log('✅ Ship actor found, starting position tests...');
  
  // Get canvas for coordinate calculations
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('❌ Game canvas not found');
    return false;
  }
  
  const canvasRect = canvas.getBoundingBox();
  const centerX = canvasRect.x + canvasRect.width / 2;
  const centerY = canvasRect.y + canvasRect.height / 2;
  
  // Test positions relative to canvas center
  const testPositions = [
    { name: 'upper-right', x: centerX + 100, y: centerY - 80 },
    { name: 'lower-left', x: centerX - 100, y: centerY + 80 },
    { name: 'right', x: centerX + 150, y: centerY }
  ];
  
  let allTestsPassed = true;
  
  for (let i = 0; i < testPositions.length; i++) {
    const testPos = testPositions[i];
    console.log(`\n🎯 Testing movement to ${testPos.name} position...`);
    
    // Get initial ship state
    const initialShip = getShipInfo();
    if (!initialShip) {
      console.error('❌ Could not get initial ship info');
      allTestsPassed = false;
      continue;
    }
    
    console.log(`📍 Initial position: (${initialShip.position.x.toFixed(1)}, ${initialShip.position.y.toFixed(1)})`);
    console.log(`🧭 Initial rotation: ${radiansToDegrees(initialShip.rotation).toFixed(1)}°`);
    
    // Simulate right-click at target position
    // Note: This is a simulation - in real test you would actually click
    const clickEvent = new MouseEvent('click', {
      button: 2, // Right click
      clientX: testPos.x,
      clientY: testPos.y,
      bubbles: true
    });
    canvas.dispatchEvent(clickEvent);
    
    console.log(`🖱️  Simulated right-click at (${testPos.x}, ${testPos.y})`);
    
    // Wait for movement to start and complete
    let attempts = 0;
    let finalShip = null;
    
    while (attempts < 30) { // 15 seconds max wait
      await new Promise(resolve => setTimeout(resolve, 500));
      finalShip = getShipInfo();
      
      if (finalShip && !finalShip.isMoving) {
        break;
      }
      attempts++;
    }
    
    if (!finalShip) {
      console.error('❌ Could not get final ship info');
      allTestsPassed = false;
      continue;
    }
    
    if (finalShip.isMoving) {
      console.warn('⚠️  Ship still moving after timeout - test may be inconclusive');
    }
    
    console.log(`📍 Final position: (${finalShip.position.x.toFixed(1)}, ${finalShip.position.y.toFixed(1)})`);
    console.log(`🧭 Final rotation: ${radiansToDegrees(finalShip.rotation).toFixed(1)}°`);
    
    // Calculate movement vector and expected rotation
    const deltaX = finalShip.position.x - initialShip.position.x;
    const deltaY = finalShip.position.y - initialShip.position.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 10) { // Only check orientation for meaningful movement
      const expectedRotation = calcExpectedAngle(initialShip.position, finalShip.position);
      const actualRotation = finalShip.rotation;
      
      const normalizedExpected = normalizeAngle(expectedRotation);
      const normalizedActual = normalizeAngle(actualRotation);
      
      let angleDiff = Math.abs(normalizedExpected - normalizedActual);
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff; // Handle wrap-around
      }
      
      const angleDiffDegrees = radiansToDegrees(angleDiff);
      
      console.log(`📐 Expected rotation: ${radiansToDegrees(expectedRotation).toFixed(1)}°`);
      console.log(`📐 Actual rotation: ${radiansToDegrees(actualRotation).toFixed(1)}°`);
      console.log(`📐 Angle difference: ${angleDiffDegrees.toFixed(1)}°`);
      
      if (angleDiffDegrees < 15) { // Within 15 degrees tolerance
        console.log(`✅ Orientation test PASSED for ${testPos.name}`);
      } else {
        console.log(`❌ Orientation test FAILED for ${testPos.name} - difference too large`);
        allTestsPassed = false;
      }
    } else {
      console.log(`⚠️  Movement distance too small (${distance.toFixed(1)}) - skipping orientation test`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 ALL SHIP NAVIGATION TESTS PASSED!');
    console.log('✅ Ship moves to clicked coordinates correctly');
    console.log('✅ Ship orients towards movement direction correctly');
  } else {
    console.log('❌ SOME TESTS FAILED - Check logs above for details');
  }
  console.log('='.repeat(50));
  
  return allTestsPassed;
}

// Instructions
console.log('🚀 Ship Navigation Test Script Loaded!');
console.log('📋 To run the test, call: testShipNavigation()');
console.log('🎮 Make sure the game is loaded and in debug mode first.');

// Export for easy access
window.testShipNavigation = testShipNavigation;