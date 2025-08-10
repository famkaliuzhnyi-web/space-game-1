/**
 * NPC Schedule System Types
 * 
 * Defines structured step-by-step schedules for NPCs, particularly traders,
 * with support for interruptions and schedule switching.
 */

export interface NPCSchedule {
  id: string;
  type: 'trade' | 'patrol' | 'escort' | 'transport' | 'combat' | 'escape';
  priority: number; // Higher priority schedules can interrupt lower priority ones
  steps: NPCScheduleStep[];
  currentStepIndex: number;
  startTime: number;
  interruptible: boolean;
  loopWhenComplete: boolean;
}

export interface NPCScheduleStep {
  id: string;
  type: 'check_inventory' | 'search_buy_opportunity' | 'travel_to_buy' | 'buy_cargo' | 
        'search_sell_opportunity' | 'travel_to_sell' | 'sell_cargo' | 'wait' | 
        'patrol_move' | 'combat_engage' | 'escape_flee';
  description: string;
  requirements?: NPCScheduleRequirement[];
  actions: NPCScheduleAction[];
  completionCondition: NPCScheduleCondition;
  timeout?: number; // Maximum time to spend on this step in ms
  onFailure?: 'retry' | 'skip' | 'abort_schedule';
}

export interface NPCScheduleRequirement {
  type: 'has_cargo' | 'has_credits' | 'at_station' | 'not_in_combat' | 'system_security_level';
  value: any;
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
}

export interface NPCScheduleAction {
  type: 'check_inventory' | 'search_market' | 'set_destination' | 'purchase_cargo' | 
        'sell_cargo' | 'wait_at_location' | 'flee_to_safety';
  parameters: Map<string, any>;
}

export interface NPCScheduleCondition {
  type: 'has_cargo_space' | 'inventory_not_empty' | 'found_trade_opportunity' | 
        'arrived_at_destination' | 'transaction_complete' | 'timeout_reached' |
        'safe_distance_reached';
  parameters?: Map<string, any>;
}

export interface NPCScheduleContext {
  npcId: string;
  currentSchedule?: NPCSchedule;
  scheduleStack: NPCSchedule[]; // Stack for interrupted schedules
  lastScheduleUpdateTime: number;
  scheduleExecutionData: Map<string, any>; // Temporary data for schedule execution
}

/**
 * Trade-specific schedule data
 */
export interface TradeScheduleData {
  targetCommodity?: string;
  buyStationId?: string;
  sellStationId?: string;
  expectedBuyPrice?: number;
  expectedSellPrice?: number;
  targetQuantity?: number;
  profitMargin?: number;
  lastMarketSearchTime?: number;
}

/**
 * Combat/Escape schedule data
 */
export interface EscapeScheduleData {
  threatLevel: number;
  threatSources: string[]; // IDs of threatening entities
  safeDestinationId?: string;
  escapeStartTime: number;
  returnToOriginalSchedule: boolean;
  originalScheduleId?: string;
}