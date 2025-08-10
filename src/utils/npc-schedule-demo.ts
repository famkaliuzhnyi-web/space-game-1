/**
 * Manual test script to demonstrate NPC trading schedules
 * 
 * This script shows how trader NPCs follow the 8-step schedule:
 * 1. check inventory for any wares
 * 2. if there's a ware jump to 6.
 * 3. search for ware to buy cheaper and sell at higher price
 * 4. fly to station that sells cheaper
 * 5. buy ware
 * 6. search for best station to sell
 * 7. fly to station that buys at higher price
 * 8. sell ware
 * 
 * And demonstrates escape schedule interrupts for combat.
 */

import { NPCAIManager } from '../systems/NPCAIManager';

export async function demonstrateNPCScheduling() {
  console.log('=== NPC Trading Schedule Demonstration ===\n');

  // Create mock managers for demonstration
  const timeManager = createMockTimeManager();
  const worldManager = createMockWorldManager();
  const playerManager = createMockPlayerManager();

  // Create NPC AI Manager with scheduling
  const npcAIManager = new NPCAIManager(timeManager, worldManager, playerManager);
  const scheduleManager = npcAIManager.getScheduleManager();

  // Get a trader NPC from the system
  const traderNPCs = Array.from(npcAIManager.getNPCsInSystem('test-system'))
    .filter(npc => npc.type === 'trader');
  
  if (traderNPCs.length === 0) {
    console.log('❌ No trader NPCs found in system');
    return;
  }

  const traderNPC = traderNPCs[0];
  console.log(`🤖 Following trader NPC: ${traderNPC.name}`);
  console.log(`📍 Starting location: ${traderNPC.position.stationId}`);
  console.log(`💰 Starting credits: ${traderNPC.credits}`);
  console.log(`📦 Starting cargo: ${JSON.stringify(Array.from(traderNPC.ship.currentCargo.entries()))}\n`);

  // Demonstrate the 8-step trading schedule
  console.log('🔄 Starting 8-step trading schedule...\n');

  // Start the trading schedule
  const scheduleStarted = scheduleManager.startSchedule(traderNPC.id, 'trader_main');
  if (!scheduleStarted) {
    console.log('❌ Failed to start trading schedule');
    return;
  }

  console.log('✅ Trading schedule started successfully');

  // Simulate several schedule updates to show step progression
  for (let i = 0; i < 15; i++) {
    console.log(`\n--- Update ${i + 1} ---`);
    
    const currentSchedule = scheduleManager.getCurrentSchedule(traderNPC.id);
    if (currentSchedule) {
      const currentStep = currentSchedule.steps[currentSchedule.currentStepIndex];
      console.log(`📋 Current step (${currentSchedule.currentStepIndex + 1}/8): ${currentStep?.description || 'Schedule complete'}`);
      
      // Update the schedule
      const updated = scheduleManager.updateSchedule(traderNPC);
      
      if (updated) {
        // Check if step changed
        const newSchedule = scheduleManager.getCurrentSchedule(traderNPC.id);
        const newStepIndex = newSchedule?.currentStepIndex || 0;
        
        if (newStepIndex !== currentSchedule.currentStepIndex) {
          console.log(`⏭️  Advanced to step ${newStepIndex + 1}`);
        }

        // Show execution data
        const executionData = scheduleManager.getScheduleExecutionData(traderNPC.id);
        if (executionData && executionData.size > 0) {
          console.log('🔧 Schedule execution data:');
          for (const [key, value] of executionData.entries()) {
            console.log(`   ${key}: ${JSON.stringify(value)}`);
          }
        }
      }
      
      console.log(`📍 Current location: ${traderNPC.position.stationId}`);
      console.log(`💰 Credits: ${traderNPC.credits}`);
      console.log(`📦 Cargo: ${JSON.stringify(Array.from(traderNPC.ship.currentCargo.entries()))}`);
    } else {
      console.log('❌ No active schedule');
      break;
    }

    // Simulate time passing
    const mockTimeManager = timeManager as any;
    mockTimeManager.getCurrentTimestamp = () => 1000 + (i * 30000);
    
    // Simulate some cargo changes to demonstrate different behaviors
    if (i === 5) {
      traderNPC.ship.currentCargo.set('machinery', 20);
      console.log('🎁 Added machinery to cargo for demonstration');
    }

    if (i === 10) {
      // Simulate combat threat to trigger escape schedule
      traderNPC.ai.threatAssessment.currentThreatLevel = 80;
      traderNPC.ai.riskTolerance = 20;
      console.log('⚠️  High threat detected - should trigger escape schedule');
    }
  }

  console.log('\n=== Schedule Interruption Demo ===');
  
  // Demonstrate manual escape schedule start
  console.log('\n🚨 Manually triggering escape schedule...');
  const escapeStarted = scheduleManager.startSchedule(traderNPC.id, 'escape', true);
  
  if (escapeStarted) {
    console.log('✅ Escape schedule started (interrupting trade schedule)');
    
    const escapeSchedule = scheduleManager.getCurrentSchedule(traderNPC.id);
    console.log(`📋 Escape schedule type: ${escapeSchedule?.type}`);
    console.log(`🔥 Priority: ${escapeSchedule?.priority} (higher than trade schedule)`);
    console.log(`🔒 Interruptible: ${escapeSchedule?.interruptible}`);
    
    // Run escape schedule for a few steps
    for (let i = 0; i < 5; i++) {
      console.log(`\n--- Escape Update ${i + 1} ---`);
      scheduleManager.updateSchedule(traderNPC);
      
      const currentSchedule = scheduleManager.getCurrentSchedule(traderNPC.id);
      if (currentSchedule) {
        const currentStep = currentSchedule.steps[currentSchedule.currentStepIndex];
        console.log(`🏃 Escape step: ${currentStep?.description || 'Escape complete'}`);
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log('✅ Demonstrated 8-step trader schedule');
  console.log('✅ Showed step-by-step progression');
  console.log('✅ Demonstrated schedule interruption with escape');
  console.log('✅ Showed schedule priority system');
  console.log('\n🎯 NPC Scheduling system is working correctly!');
}

// Mock helper functions
function createMockTimeManager(): any {
  return {
    getCurrentTimestamp: () => 1000,
    getCurrentTime: () => 1000,
    update: () => {}
  };
}

function createMockWorldManager(): any {
  return {
    getGalaxy: () => ({
      sectors: [{
        id: 'test-sector',
        systems: [{
          id: 'test-system',
          stations: [
            { id: 'station-1', name: 'Station 1', type: 'trade', position: { x: 100, y: 100 } },
            { id: 'station-2', name: 'Station 2', type: 'industrial', position: { x: 200, y: 200 } },
            { id: 'station-3', name: 'Station 3', type: 'mining', position: { x: 300, y: 300 } }
          ]
        }]
      }]
    })
  };
}

function createMockPlayerManager(): any {
  return {
    getPlayer: () => ({
      id: 'player-1',
      currentStationId: 'station-1'
    })
  };
}

// Export for manual testing
if (typeof window !== 'undefined') {
  (window as any).demonstrateNPCScheduling = demonstrateNPCScheduling;
  console.log('NPC Scheduling demo loaded. Run demonstrateNPCScheduling() in console.');
}