import { 
  NPCSchedule, 
  NPCScheduleStep, 
  NPCScheduleContext,
  TradeScheduleData
} from '../types/npc-schedule';
import { NPCShip } from '../types/npc';
import { TimeManager } from './TimeManager';
import { WorldManager } from './WorldManager';
import { Station } from '../types/world';

/**
 * NPCScheduleManager handles structured step-by-step schedules for NPCs.
 * 
 * Key features:
 * - Step-by-step schedule execution
 * - Schedule interruption and resumption
 * - Specialized trade schedules following the 8-step process
 * - Escape schedules that can interrupt other activities
 */
export class NPCScheduleManager {
  private timeManager: TimeManager;
  private worldManager: WorldManager;
  
  private scheduleContexts: Map<string, NPCScheduleContext> = new Map();
  private scheduleTemplates: Map<string, NPCSchedule> = new Map();
  
  constructor(timeManager: TimeManager, worldManager: WorldManager) {
    this.timeManager = timeManager;
    this.worldManager = worldManager;
    
    this.initializeScheduleTemplates();
  }

  /**
   * Initialize predefined schedule templates
   */
  private initializeScheduleTemplates(): void {
    // Create the 8-step trader schedule template
    const tradeSchedule = this.createTradeScheduleTemplate();
    this.scheduleTemplates.set('trader_main', tradeSchedule);
    
    // Create escape schedule template
    const escapeSchedule = this.createEscapeScheduleTemplate();
    this.scheduleTemplates.set('escape', escapeSchedule);
  }

  /**
   * Create the main 8-step trade schedule template as specified in the requirements
   */
  private createTradeScheduleTemplate(): NPCSchedule {
    return {
      id: 'trader_main',
      type: 'trade',
      priority: 5,
      currentStepIndex: 0,
      startTime: 0,
      interruptible: true,
      loopWhenComplete: true,
      steps: [
        {
          id: 'check_inventory',
          type: 'check_inventory',
          description: 'Check inventory for any wares',
          actions: [{
            type: 'check_inventory',
            parameters: new Map()
          }],
          completionCondition: {
            type: 'inventory_not_empty'
          }
        },
        {
          id: 'jump_to_sell_if_has_wares',
          type: 'check_inventory',
          description: 'If there\'s a ware jump to step 6 (search for best station to sell)',
          actions: [{
            type: 'check_inventory',
            parameters: new Map([['jump_to_sell_if_has_cargo', true]])
          }],
          completionCondition: {
            type: 'inventory_not_empty'
          }
        },
        {
          id: 'search_buy_opportunity',
          type: 'search_buy_opportunity',
          description: 'Search for ware to buy cheaper and sell at higher price',
          actions: [{
            type: 'search_market',
            parameters: new Map([['search_type', 'buy_opportunity']])
          }],
          completionCondition: {
            type: 'found_trade_opportunity'
          },
          timeout: 30000, // 30 second timeout
          onFailure: 'skip'
        },
        {
          id: 'travel_to_buy',
          type: 'travel_to_buy',
          description: 'Fly to station that sells cheaper',
          requirements: [{
            type: 'has_credits',
            value: 100,
            operator: '>'
          }],
          actions: [{
            type: 'set_destination',
            parameters: new Map([['destination_type', 'buy_station']])
          }],
          completionCondition: {
            type: 'arrived_at_destination'
          },
          timeout: 300000, // 5 minute travel timeout
          onFailure: 'abort_schedule'
        },
        {
          id: 'buy_ware',
          type: 'buy_cargo',
          description: 'Buy ware',
          requirements: [
            {
              type: 'at_station',
              value: true
            },
            {
              type: 'has_credits',
              value: 0,
              operator: '>'
            }
          ],
          actions: [{
            type: 'purchase_cargo',
            parameters: new Map()
          }],
          completionCondition: {
            type: 'transaction_complete'
          },
          timeout: 10000, // 10 second timeout for transaction
          onFailure: 'retry'
        },
        {
          id: 'search_sell_opportunity',
          type: 'search_sell_opportunity',
          description: 'Search for best station to sell',
          actions: [{
            type: 'search_market',
            parameters: new Map([['search_type', 'sell_opportunity']])
          }],
          completionCondition: {
            type: 'found_trade_opportunity'
          },
          timeout: 30000, // 30 second timeout
          onFailure: 'skip'
        },
        {
          id: 'travel_to_sell',
          type: 'travel_to_sell',
          description: 'Fly to station that buys at higher price',
          actions: [{
            type: 'set_destination',
            parameters: new Map([['destination_type', 'sell_station']])
          }],
          completionCondition: {
            type: 'arrived_at_destination'
          },
          timeout: 300000, // 5 minute travel timeout
          onFailure: 'abort_schedule'
        },
        {
          id: 'sell_ware',
          type: 'sell_cargo',
          description: 'Sell ware',
          requirements: [{
            type: 'at_station',
            value: true
          }],
          actions: [{
            type: 'sell_cargo',
            parameters: new Map()
          }],
          completionCondition: {
            type: 'transaction_complete'
          },
          timeout: 10000, // 10 second timeout for transaction
          onFailure: 'retry'
        }
      ]
    };
  }

  /**
   * Create escape schedule template for combat situations
   */
  private createEscapeScheduleTemplate(): NPCSchedule {
    return {
      id: 'escape',
      type: 'escape',
      priority: 10, // High priority to interrupt other schedules
      currentStepIndex: 0,
      startTime: 0,
      interruptible: false, // Escape schedules cannot be interrupted
      loopWhenComplete: false,
      steps: [
        {
          id: 'assess_threat',
          type: 'wait',
          description: 'Assess threat level and find escape route',
          actions: [{
            type: 'wait_at_location',
            parameters: new Map([['assess_threats', true]])
          }],
          completionCondition: {
            type: 'timeout_reached'
          },
          timeout: 2000 // 2 second assessment
        },
        {
          id: 'flee_to_safety',
          type: 'escape_flee',
          description: 'Flee to nearest safe location',
          actions: [{
            type: 'flee_to_safety',
            parameters: new Map()
          }],
          completionCondition: {
            type: 'safe_distance_reached'
          },
          timeout: 180000, // 3 minute escape timeout
          onFailure: 'retry'
        }
      ]
    };
  }

  /**
   * Start a schedule for an NPC
   */
  startSchedule(npcId: string, scheduleType: string, forceStart: boolean = false): boolean {
    const template = this.scheduleTemplates.get(scheduleType);
    if (!template) {
      console.warn(`Unknown schedule type: ${scheduleType}`);
      return false;
    }

    let context = this.scheduleContexts.get(npcId);
    if (!context) {
      context = {
        npcId,
        scheduleStack: [],
        lastScheduleUpdateTime: this.timeManager.getCurrentTimestamp(),
        scheduleExecutionData: new Map()
      };
      this.scheduleContexts.set(npcId, context);
    }

    // If there's an existing schedule, handle interruption
    if (context.currentSchedule) {
      if (!context.currentSchedule.interruptible && !forceStart) {
        return false; // Cannot interrupt non-interruptible schedule
      }

      // If new schedule has higher priority, interrupt current one
      if (template.priority > context.currentSchedule.priority || forceStart) {
        if (context.currentSchedule.interruptible) {
          // Save current schedule to stack for later resumption
          context.scheduleStack.push({
            ...context.currentSchedule,
            currentStepIndex: context.currentSchedule.currentStepIndex
          });
        }
      } else {
        return false; // Lower priority schedule cannot interrupt
      }
    }

    // Start new schedule
    const newSchedule: NPCSchedule = {
      ...template,
      id: `${template.id}_${Date.now()}`,
      startTime: this.timeManager.getCurrentTimestamp(),
      currentStepIndex: 0
    };

    context.currentSchedule = newSchedule;
    context.lastScheduleUpdateTime = this.timeManager.getCurrentTimestamp();

    return true;
  }

  /**
   * Update schedule execution for an NPC
   */
  updateSchedule(npc: NPCShip): boolean {
    const context = this.scheduleContexts.get(npc.id);
    if (!context || !context.currentSchedule) {
      return false;
    }

    const currentTime = this.timeManager.getCurrentTimestamp();
    const schedule = context.currentSchedule;
    
    // Check if schedule should be interrupted by escape conditions
    if (this.shouldTriggerEscapeSchedule(npc)) {
      this.startSchedule(npc.id, 'escape', true);
      return true;
    }

    // Get current step
    if (schedule.currentStepIndex >= schedule.steps.length) {
      // Schedule completed
      this.handleScheduleCompletion(context, npc);
      return true;
    }

    const currentStep = schedule.steps[schedule.currentStepIndex];

    // Check step timeout
    if (currentStep.timeout) {
      const stepStartTime = context.scheduleExecutionData.get(`step_${currentStep.id}_start_time`) || currentTime;
      if (currentTime - stepStartTime > currentStep.timeout) {
        this.handleStepTimeout(context, currentStep, npc);
        return true;
      }
    }

    // Check step requirements
    if (!this.checkStepRequirements(currentStep, npc)) {
      console.log(`NPC ${npc.name} cannot execute step ${currentStep.id} - requirements not met`);
      return false;
    }

    // Execute step
    const stepCompleted = this.executeScheduleStep(currentStep, npc, context);
    
    if (stepCompleted) {
      this.advanceToNextStep(context, npc);
    }

    context.lastScheduleUpdateTime = currentTime;
    return true;
  }

  /**
   * Check if escape schedule should be triggered
   */
  private shouldTriggerEscapeSchedule(npc: NPCShip): boolean {
    // Don't interrupt if already on escape schedule
    const context = this.scheduleContexts.get(npc.id);
    if (context?.currentSchedule?.type === 'escape') {
      return false;
    }

    // Check threat level
    const threatLevel = npc.ai.threatAssessment.currentThreatLevel;
    const riskTolerance = npc.ai.riskTolerance;

    // Trigger escape if threat is high and NPC has low risk tolerance
    return threatLevel > 60 && riskTolerance < 40;
  }

  /**
   * Execute a specific schedule step
   */
  private executeScheduleStep(step: NPCScheduleStep, npc: NPCShip, context: NPCScheduleContext): boolean {
    // Set start time for step if not already set
    const stepStartTimeKey = `step_${step.id}_start_time`;
    if (!context.scheduleExecutionData.has(stepStartTimeKey)) {
      context.scheduleExecutionData.set(stepStartTimeKey, this.timeManager.getCurrentTimestamp());
    }

    switch (step.type) {
      case 'check_inventory':
        return this.executeCheckInventoryStep(step, npc, context);
      case 'search_buy_opportunity':
        return this.executeSearchBuyOpportunityStep(step, npc, context);
      case 'travel_to_buy':
        return this.executeTravelToBuyStep(step, npc, context);
      case 'buy_cargo':
        return this.executeBuyCargoStep(step, npc, context);
      case 'search_sell_opportunity':
        return this.executeSearchSellOpportunityStep(step, npc, context);
      case 'travel_to_sell':
        return this.executeTravelToSellStep(step, npc, context);
      case 'sell_cargo':
        return this.executeSellCargoStep(step, npc, context);
      case 'escape_flee':
        return this.executeEscapeFleeStep(step, npc, context);
      default:
        console.warn(`Unknown step type: ${step.type}`);
        return true; // Skip unknown steps
    }
  }

  /**
   * Execute check inventory step (steps 1 & 2)
   */
  private executeCheckInventoryStep(step: NPCScheduleStep, npc: NPCShip, context: NPCScheduleContext): boolean {
    const hasWares = Array.from(npc.ship.currentCargo.values()).some(quantity => quantity > 0);
    
    // If this is step 2 and we have wares, jump to step 6 (search for sell opportunity)
    if (step.id === 'jump_to_sell_if_has_wares' && hasWares) {
      context.currentSchedule!.currentStepIndex = 5; // Jump to search_sell_opportunity (0-indexed)
      context.scheduleExecutionData.set('jumped_to_sell', true);
      return true;
    }
    
    return true; // Always complete check inventory steps
  }

  /**
   * Execute search buy opportunity step (step 3)
   */
  private executeSearchBuyOpportunityStep(_step: NPCScheduleStep, npc: NPCShip, context: NPCScheduleContext): boolean {
    // Use existing market analysis from NPCAIManager
    const tradeData = context.scheduleExecutionData.get('trade_data') as TradeScheduleData || {};
    
    if (!tradeData.targetCommodity) {
      // Find profitable commodities based on NPC's knowledge and skills
      const profitableCommodities = this.findProfitableBuyOpportunities(npc);
      
      if (profitableCommodities.length > 0) {
        const selectedOpportunity = profitableCommodities[0];
        tradeData.targetCommodity = selectedOpportunity.commodity;
        tradeData.buyStationId = selectedOpportunity.stationId;
        tradeData.expectedBuyPrice = selectedOpportunity.price;
        tradeData.targetQuantity = selectedOpportunity.quantity;
        
        context.scheduleExecutionData.set('trade_data', tradeData);
        return true;
      }
    }
    
    return !!tradeData.targetCommodity;
  }

  /**
   * Execute travel to buy step (step 4)
   */
  private executeTravelToBuyStep(_step: NPCScheduleStep, npc: NPCShip, context: NPCScheduleContext): boolean {
    const tradeData = context.scheduleExecutionData.get('trade_data') as TradeScheduleData;
    
    if (tradeData?.buyStationId) {
      // Set destination in NPC AI goal
      if (npc.position.stationId !== tradeData.buyStationId) {
        // Signal to NPCAIManager to travel to buy station
        context.scheduleExecutionData.set('travel_destination', tradeData.buyStationId);
        context.scheduleExecutionData.set('travel_purpose', 'buy');
        
        // Check if we've arrived
        return npc.position.stationId === tradeData.buyStationId;
      }
      return true; // Already at destination
    }
    
    return false;
  }

  /**
   * Execute buy cargo step (step 5)
   */
  private executeBuyCargoStep(_step: NPCScheduleStep, npc: NPCShip, context: NPCScheduleContext): boolean {
    const tradeData = context.scheduleExecutionData.get('trade_data') as TradeScheduleData;
    
    if (tradeData?.targetCommodity && npc.position.stationId === tradeData.buyStationId) {
      // Signal to NPCAIManager to make purchase
      context.scheduleExecutionData.set('purchase_commodity', tradeData.targetCommodity);
      context.scheduleExecutionData.set('purchase_quantity', tradeData.targetQuantity);
      
      // Check if purchase was completed
      const currentQuantity = npc.ship.currentCargo.get(tradeData.targetCommodity) || 0;
      const expectedQuantity = tradeData.targetQuantity || 1;
      
      return currentQuantity >= expectedQuantity;
    }
    
    return false;
  }

  /**
   * Execute search sell opportunity step (step 6)
   */
  private executeSearchSellOpportunityStep(_step: NPCScheduleStep, npc: NPCShip, context: NPCScheduleContext): boolean {
    const tradeData = context.scheduleExecutionData.get('trade_data') as TradeScheduleData || {};
    
    // Find best selling opportunities for current cargo
    const cargo = Array.from(npc.ship.currentCargo.entries()).filter(([, quantity]) => quantity > 0);
    
    if (cargo.length > 0) {
      const sellOpportunities = this.findProfitableSellOpportunities(npc, cargo);
      
      if (sellOpportunities.length > 0) {
        const bestOpportunity = sellOpportunities[0];
        tradeData.sellStationId = bestOpportunity.stationId;
        tradeData.expectedSellPrice = bestOpportunity.price;
        
        context.scheduleExecutionData.set('trade_data', tradeData);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Execute travel to sell step (step 7)
   */
  private executeTravelToSellStep(_step: NPCScheduleStep, npc: NPCShip, context: NPCScheduleContext): boolean {
    const tradeData = context.scheduleExecutionData.get('trade_data') as TradeScheduleData;
    
    if (tradeData?.sellStationId) {
      if (npc.position.stationId !== tradeData.sellStationId) {
        // Signal to NPCAIManager to travel to sell station
        context.scheduleExecutionData.set('travel_destination', tradeData.sellStationId);
        context.scheduleExecutionData.set('travel_purpose', 'sell');
        
        // Check if we've arrived
        return npc.position.stationId === tradeData.sellStationId;
      }
      return true; // Already at destination
    }
    
    return false;
  }

  /**
   * Execute sell cargo step (step 8)
   */
  private executeSellCargoStep(_step: NPCScheduleStep, npc: NPCShip, context: NPCScheduleContext): boolean {
    const tradeData = context.scheduleExecutionData.get('trade_data') as TradeScheduleData;
    
    if (npc.position.stationId === tradeData?.sellStationId) {
      // Signal to NPCAIManager to sell cargo
      context.scheduleExecutionData.set('sell_all_cargo', true);
      
      // Check if cargo was sold
      const totalCargo = Array.from(npc.ship.currentCargo.values()).reduce((sum, qty) => sum + qty, 0);
      
      return totalCargo === 0; // All cargo sold
    }
    
    return false;
  }

  /**
   * Execute escape flee step
   */
  private executeEscapeFleeStep(_step: NPCScheduleStep, npc: NPCShip, context: NPCScheduleContext): boolean {
    // Find safe destination
    const safeStation = this.findSafeEscapeDestination(npc);
    
    if (safeStation) {
      context.scheduleExecutionData.set('escape_destination', safeStation.id);
      
      // Check if we've reached safety
      const distance = this.calculateDistance(npc.position.coordinates, safeStation.position);
      return distance < 50; // Close enough to be considered safe
    }
    
    return false;
  }

  /**
   * Find profitable buy opportunities
   */
  private findProfitableBuyOpportunities(npc: NPCShip): Array<{commodity: string, stationId: string, price: number, quantity: number}> {
    // This would integrate with the existing market analysis in NPCAIManager
    // For now, return a simple example
    const system = this.findSystemById(npc.position.systemId);
    if (!system) return [];

    const opportunities = [];
    const commodities = ['electronics', 'medical_supplies', 'machinery'];
    
    for (const station of system.stations) {
      if (station.id !== npc.position.stationId) {
        for (const commodity of commodities) {
          if (npc.credits > 1000) {
            opportunities.push({
              commodity,
              stationId: station.id,
              price: 100 + Math.random() * 50,
              quantity: Math.floor(Math.random() * 20) + 5
            });
          }
        }
      }
    }
    
    return opportunities.sort((a, b) => a.price - b.price); // Cheaper first
  }

  /**
   * Find profitable sell opportunities
   */
  private findProfitableSellOpportunities(npc: NPCShip, cargo: [string, number][]): Array<{commodity: string, stationId: string, price: number}> {
    const system = this.findSystemById(npc.position.systemId);
    if (!system) return [];

    const opportunities = [];
    
    for (const station of system.stations) {
      if (station.id !== npc.position.stationId) {
        for (const [commodity] of cargo) {
          opportunities.push({
            commodity,
            stationId: station.id,
            price: 120 + Math.random() * 80 // Higher sell prices
          });
        }
      }
    }
    
    return opportunities.sort((a, b) => b.price - a.price); // Higher prices first
  }

  /**
   * Find safe escape destination
   */
  private findSafeEscapeDestination(npc: NPCShip): Station | null {
    const system = this.findSystemById(npc.position.systemId);
    if (!system) return null;

    // Find the farthest station from current position
    let safestStation: Station | null = null;
    let maxDistance = 0;
    
    for (const station of system.stations) {
      const distance = this.calculateDistance(npc.position.coordinates, station.position);
      if (distance > maxDistance) {
        maxDistance = distance;
        safestStation = station;
      }
    }
    
    return safestStation;
  }

  /**
   * Check step requirements
   */
  private checkStepRequirements(step: NPCScheduleStep, npc: NPCShip): boolean {
    if (!step.requirements) return true;

    for (const requirement of step.requirements) {
      if (!this.checkRequirement(requirement, npc)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check individual requirement
   */
  private checkRequirement(requirement: any, npc: NPCShip): boolean {
    switch (requirement.type) {
      case 'has_cargo':
        const totalCargo = Array.from(npc.ship.currentCargo.values()).reduce((sum, qty) => sum + qty, 0);
        return this.compareValue(totalCargo, requirement.operator || '>', requirement.value);
      
      case 'has_credits':
        return this.compareValue(npc.credits, requirement.operator || '>', requirement.value);
      
      case 'at_station':
        return !!npc.position.stationId === requirement.value;
      
      case 'not_in_combat':
        return npc.ai.threatAssessment.currentThreatLevel < 50;
      
      default:
        return true;
    }
  }

  /**
   * Compare values with operator
   */
  private compareValue(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case '>': return actual > expected;
      case '<': return actual < expected;
      case '>=': return actual >= expected;
      case '<=': return actual <= expected;
      case '==': return actual === expected;
      case '!=': return actual !== expected;
      default: return true;
    }
  }

  /**
   * Handle step timeout
   */
  private handleStepTimeout(context: NPCScheduleContext, step: NPCScheduleStep, npc: NPCShip): void {
    console.log(`NPC ${npc.name} step ${step.id} timed out`);
    
    switch (step.onFailure) {
      case 'retry':
        // Clear step start time to retry
        context.scheduleExecutionData.delete(`step_${step.id}_start_time`);
        break;
      
      case 'skip':
        this.advanceToNextStep(context, npc);
        break;
      
      case 'abort_schedule':
        this.abortCurrentSchedule(context, npc);
        break;
      
      default:
        this.advanceToNextStep(context, npc);
        break;
    }
  }

  /**
   * Advance to next step
   */
  private advanceToNextStep(context: NPCScheduleContext, npc: NPCShip): void {
    if (context.currentSchedule) {
      context.currentSchedule.currentStepIndex++;
      
      // Clear any step-specific execution data
      const currentStep = context.currentSchedule.steps[context.currentSchedule.currentStepIndex - 1];
      if (currentStep) {
        context.scheduleExecutionData.delete(`step_${currentStep.id}_start_time`);
      }
      
      console.log(`NPC ${npc.name} advanced to step ${context.currentSchedule.currentStepIndex}`);
    }
  }

  /**
   * Handle schedule completion
   */
  private handleScheduleCompletion(context: NPCScheduleContext, npc: NPCShip): void {
    const schedule = context.currentSchedule!;
    console.log(`NPC ${npc.name} completed schedule ${schedule.id}`);

    if (schedule.loopWhenComplete) {
      // Reset to first step
      schedule.currentStepIndex = 0;
      context.scheduleExecutionData.clear();
      console.log(`NPC ${npc.name} looping schedule ${schedule.id}`);
    } else {
      // End current schedule
      context.currentSchedule = undefined;
      
      // Resume previous schedule if exists
      if (context.scheduleStack.length > 0) {
        const previousSchedule = context.scheduleStack.pop()!;
        context.currentSchedule = previousSchedule;
        console.log(`NPC ${npc.name} resumed schedule ${previousSchedule.id}`);
      }
    }
  }

  /**
   * Abort current schedule
   */
  private abortCurrentSchedule(context: NPCScheduleContext, npc: NPCShip): void {
    console.log(`NPC ${npc.name} aborted schedule ${context.currentSchedule?.id}`);
    
    context.currentSchedule = undefined;
    context.scheduleExecutionData.clear();
    
    // Resume previous schedule if exists
    if (context.scheduleStack.length > 0) {
      const previousSchedule = context.scheduleStack.pop()!;
      context.currentSchedule = previousSchedule;
      console.log(`NPC ${npc.name} resumed schedule ${previousSchedule.id}`);
    }
  }

  /**
   * Get schedule execution data for NPC (used by NPCAIManager)
   */
  getScheduleExecutionData(npcId: string): Map<string, any> | null {
    const context = this.scheduleContexts.get(npcId);
    return context?.scheduleExecutionData || null;
  }

  /**
   * Get current schedule for NPC
   */
  getCurrentSchedule(npcId: string): NPCSchedule | null {
    const context = this.scheduleContexts.get(npcId);
    return context?.currentSchedule || null;
  }

  /**
   * Check if NPC has an active schedule
   */
  hasActiveSchedule(npcId: string): boolean {
    const context = this.scheduleContexts.get(npcId);
    return !!(context?.currentSchedule);
  }

  // Utility methods
  private findSystemById(systemId: string): any {
    const galaxy = this.worldManager.getGalaxy();
    for (const sector of galaxy.sectors) {
      const system = sector.systems.find((s: any) => s.id === systemId);
      if (system) return system;
    }
    return null;
  }

  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}