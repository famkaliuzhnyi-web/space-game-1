/**
 * Event system types for the Space Game
 * Defines structures for random events, encounters, and dynamic content
 */

export type EventType = 
  | 'space_encounter'
  | 'station_event'
  | 'system_crisis'
  | 'emergency_contract'
  | 'social_interaction'
  | 'discovery'
  | 'market_fluctuation'
  | 'faction_development';

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

export type EventStatus = 'pending' | 'active' | 'completed' | 'failed' | 'expired';

export interface EventChoice {
  id: string;
  text: string;
  description?: string;
  requirements?: {
    credits?: number;
    reputation?: { [factionId: string]: number };
    skills?: { [skillName: string]: number };
    equipment?: string[];
    cargo?: { [commodityId: string]: number };
  };
  consequences?: {
    credits?: number;
    reputation?: { [factionId: string]: number };
    experience?: number;
    items?: string[];
    cargo?: { [commodityId: string]: number };
    unlocks?: string[];
    nextEvent?: string;
  };
  probability?: number; // 0-1, chance of success if applicable
}

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  priority: EventPriority;
  status: EventStatus;
  
  // Timing
  triggerTime: number; // Game time when event triggers
  expiryTime?: number; // Optional expiry for time-sensitive events
  duration?: number; // How long the event lasts
  
  // Location context
  locationId?: string; // Station, system, or sector ID
  coordinates?: { x: number; y: number }; // Space coordinates for encounters
  
  // Event interaction
  choices: EventChoice[];
  selectedChoice?: string;
  outcome?: any; // Result of the event after completion
  
  // Trigger conditions and probability
  triggerConditions?: {
    minReputation?: { [factionId: string]: number };
    maxReputation?: { [factionId: string]: number };
    requiredSystems?: string[];
    playerLevel?: number;
    credits?: { min?: number; max?: number };
    cargoValue?: number;
    lastEventTime?: number; // Minimum time since last event
  };
  
  baseProbability: number; // 0-1, base chance per time unit
  cooldownPeriod?: number; // Time before this event type can trigger again
  
  // Metadata
  tags?: string[]; // For categorization and filtering
  isRepeatable?: boolean;
  partOfChain?: string; // Event chain ID if part of a sequence
  
  // Results tracking
  timesTriggered?: number;
  lastTriggered?: number;
}

// Specific event subtypes
export interface SpaceEncounter extends GameEvent {
  type: 'space_encounter';
  encounterType: 'pirate' | 'merchant' | 'derelict' | 'patrol' | 'distress' | 'mysterious';
  shipData?: {
    class: string;
    condition: number;
    cargo?: { [commodityId: string]: number };
    credits?: number;
    equipment?: string[];
  };
  threatLevel?: number; // 1-10 difficulty rating
}

export interface StationEvent extends GameEvent {
  type: 'station_event';
  eventType: 'social' | 'commercial' | 'technical' | 'security' | 'cultural';
  npcsInvolved?: string[]; // Contact IDs
  affectedServices?: string[]; // Station services affected
}

export interface SystemCrisis extends GameEvent {
  type: 'system_crisis';
  crisisType: 'economic' | 'political' | 'environmental' | 'military' | 'technological';
  affectedSystems: string[];
  severity: number; // 1-10 scale
  emergencyContracts?: string[]; // Generated contract IDs
}

export interface EmergencyContract extends GameEvent {
  type: 'emergency_contract';
  contractType: 'rescue' | 'supply' | 'evacuation' | 'repair' | 'investigation';
  urgency: number; // 1-10, affects time limit and rewards
  baseReward: number;
  timeMultiplier: number; // Reward multiplier based on completion speed
}

// Event scheduling and management
export interface EventTrigger {
  id: string;
  eventId: string;
  triggerType: 'time' | 'location' | 'action' | 'condition';
  parameters: any;
  isActive: boolean;
  lastCheck?: number;
}

export interface EventChain {
  id: string;
  name: string;
  description: string;
  events: string[]; // Event IDs in sequence
  currentEventIndex: number;
  isActive: boolean;
  startConditions?: any;
  rewards?: any; // Chain completion rewards
}

export interface EventHistory {
  eventId: string;
  triggeredAt: number;
  completedAt?: number;
  choicesMade: string[];
  outcome: any;
  playerLevel: number;
  locationId?: string;
}

// Event manager configuration
export interface EventConfig {
  globalEventRate: number; // Base events per time unit
  maxActiveEvents: number;
  eventCooldowns: { [eventType: string]: number };
  difficultyScaling: {
    playerLevel: number;
    threatMultiplier: number;
    rewardMultiplier: number;
  }[];
}

// Event system state for save/load
export interface EventSystemState {
  activeEvents: GameEvent[];
  eventHistory: EventHistory[];
  eventTriggers: EventTrigger[];
  eventChains: EventChain[];
  config: EventConfig;
  lastEventCheck: number;
  eventCounters: { [eventType: string]: number };
}