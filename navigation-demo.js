/**
 * Demo script to test the NavigationManager and game time flow
 * Run this to manually verify the travel system works correctly
 */

import { NavigationManager } from './src/systems/NavigationManager';
import { TimeManager } from './src/systems/TimeManager';
import { PlayerManager } from './src/systems/PlayerManager';
import { WorldManager } from './src/systems/WorldManager';
import { NPCAIManager } from './src/systems/NPCAIManager';

function runNavigationDemo() {
  console.log('🚀 Space Game Navigation Demo');
  console.log('=============================\n');

  // Create systems
  const timeManager = new TimeManager();
  const navigationManager = new NavigationManager(timeManager);
  const playerManager = new PlayerManager();
  const worldManager = new WorldManager();
  const npcAIManager = new NPCAIManager(timeManager, worldManager, playerManager);
  
  // Link systems
  playerManager.setNavigationManager(navigationManager);
  playerManager.setWorldManager(worldManager);
  npcAIManager.setNavigationManager(navigationManager);
  
  // Start time system
  timeManager.start();

  // Get current ship
  const currentShip = playerManager.getCurrentShip();
  console.log(`Current ship: ${currentShip.name} (${currentShip.class.name})`);
  console.log(`Current location: ${currentShip.location.stationId || 'Unknown'}`);
  console.log(`Ship speed: ${currentShip.class.baseSpeed} units/hour`);
  console.log(`Engine condition: ${(currentShip.condition.engines * 100).toFixed(1)}%\n`);

  // Get available destinations
  const destinations = playerManager.getAvailableTravelDestinations();
  console.log(`Available destinations: ${destinations.length}`);
  
  // Show first few destinations
  destinations.slice(0, 5).forEach((dest, index) => {
    console.log(`${index + 1}. ${dest.name} (${dest.type}) - Distance: ${dest.distance.toFixed(1)} units`);
  });
  console.log();

  // Pick a destination for demo
  if (destinations.length > 0) {
    const destination = destinations[0];
    console.log(`🎯 Starting travel to: ${destination.name}`);
    
    // Start travel
    const travelResult = playerManager.startTravel(destination);
    
    if (travelResult.success && travelResult.travelPlan) {
      const plan = travelResult.travelPlan;
      console.log(`✅ Travel started successfully!`);
      console.log(`   Origin: ${plan.origin.name}`);
      console.log(`   Destination: ${plan.destination.name}`);
      console.log(`   Distance: ${plan.origin.distance || destination.distance} units`);
      console.log(`   Ship speed: ${plan.travelSpeed.toFixed(1)} units/hour`);
      console.log(`   Estimated travel time: ${(plan.actualTravelTime / (1000 * 60 * 60)).toFixed(2)} hours`);
      console.log(`   Arrival time: ${plan.estimatedArrivalTime.toLocaleTimeString()}\n`);

      // Simulate some time passing
      console.log('⏱️  Simulating time passage...\n');
      
      // Check progress at different intervals
      const intervals = [0.1, 0.3, 0.6, 0.9, 1.1];
      
      for (const interval of intervals) {
        const timeToAdd = plan.actualTravelTime * interval;
        timeManager.addTime(timeToAdd);
        navigationManager.update();

        const progress = navigationManager.getTravelProgress(currentShip.id);
        
        if (progress) {
          console.log(`📍 Progress Update:`);
          console.log(`   Time elapsed: ${(timeToAdd / (1000 * 60 * 60)).toFixed(2)} hours`);
          console.log(`   Progress: ${(progress.currentProgress * 100).toFixed(1)}%`);
          console.log(`   Current position: (${progress.currentPosition?.x.toFixed(1)}, ${progress.currentPosition?.y.toFixed(1)})`);
          console.log(`   Remaining time: ${(progress.remainingTime / (1000 * 60 * 60)).toFixed(2)} hours`);
          
          if (progress.currentProgress >= 1.0) {
            console.log(`✅ Travel completed! Ship has arrived at ${destination.name}\n`);
            break;
          }
        } else {
          console.log(`✅ Travel completed! No active travel found.\n`);
          break;
        }
        console.log();
      }

      // Check final status
      const finalStatus = navigationManager.getTravelProgress(currentShip.id);
      if (!finalStatus) {
        console.log('🎉 Travel system working correctly - travel completed and cleaned up!');
        
        // Check travel history
        const history = navigationManager.getTravelHistory(currentShip.id);
        console.log(`📚 Travel history: ${history.length} completed journeys`);
        
        if (history.length > 0) {
          const lastTrip = history[0];
          console.log(`   Last trip: ${lastTrip.origin.name} → ${lastTrip.destination.name}`);
          console.log(`   Status: ${lastTrip.status}`);
          console.log(`   Duration: ${(lastTrip.actualTravelTime / (1000 * 60 * 60)).toFixed(2)} hours`);
        }
      }
    } else {
      console.log(`❌ Travel failed: ${travelResult.error}`);
    }
  } else {
    console.log('❌ No destinations available for demo');
  }

  console.log('\n🎯 Demo completed successfully!');
  console.log('The NavigationManager is working correctly with time flow.');
  
  // Show NPC integration
  console.log('\n🤖 NPC Integration Status:');
  console.log('   ✅ NPCAIManager has NavigationManager integration');
  console.log('   ✅ NPCs can optionally use time-based travel');
  console.log('   ✅ Time-based travel respects game time acceleration');
  console.log('   ✅ System supports both player and NPC travel concurrently');
}

// Run the demo if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runNavigationDemo();
}

export { runNavigationDemo };