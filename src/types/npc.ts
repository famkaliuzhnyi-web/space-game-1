export interface NPCShip {
  id: string;
  name: string;
  type: 'trader' | 'pirate' | 'patrol' | 'civilian' | 'transport';
  position: {
    systemId: string;
    stationId?: string; // If docked at a station
    coordinates: { x: number; y: number };
  };
  movement: {
    targetSystemId?: string;
    targetStationId?: string;
    targetCoordinates?: { x: number; y: number };
    speed: number; // Units per second
    currentVelocity: { x: number; y: number };
    lastMoveTime: number;
    // Enhanced movement properties for Phase 5.2
    pathfindingWaypoints?: { x: number; y: number }[];
    currentWaypoint?: number;
    avoidanceVector?: { x: number; y: number };
    formation?: {
      leaderId?: string;
      position: 'lead' | 'follow_left' | 'follow_right' | 'follow_rear';
      offset: { x: number; y: number };
    };
    maneuverability: number; // 0-100, affects turning speed and agility
    maxAcceleration: number; // Maximum acceleration rate
    brakingDistance: number; // Distance needed to stop at current speed
    // Time-based navigation integration
    isInTransit?: boolean; // If using time-based travel system
    travelPlanId?: string; // ID of active travel plan from NavigationManager
    arrivalTime?: number; // Timestamp when travel completes (for time-based travel)
  };
  ai: NPCAIData;
  ship: {
    class: string;
    cargoCapacity: number;
    currentCargo: Map<string, number>; // commodityId -> quantity
    condition: number; // 0-100, 100 being perfect
    fuel: number; // Current fuel level
    fuelCapacity: number;
  };
  faction: string;
  reputation: number; // -100 to 100, affects behavior toward player
  credits: number;
  lastActionTime: number;
}

export interface NPCAIData {
  personality: NPCPersonality;
  currentGoal: NPCGoal;
  goalHistory: NPCGoal[]; // Recent goals for behavior patterns
  decisionCooldown: number; // Time until next decision can be made
  riskTolerance: number; // 0-100, affects pirate aggression, trader route selection
  aggressiveness: number; // 0-100, affects combat and interaction behavior
  tradingSkill: number; // 0-100, affects profit margins and route selection
  lastInteraction: {
    withPlayer: boolean;
    type: string;
    timestamp: number;
    outcome: 'positive' | 'negative' | 'neutral';
  } | null;
  // Enhanced AI properties for Phase 5.2
  combatSkill: number; // 0-100, affects combat effectiveness
  navigationSkill: number; // 0-100, affects pathfinding and maneuvering
  socialSkill: number; // 0-100, affects conversations and reputation gain
  marketKnowledge: number; // 0-100, affects trading decisions and market timing
  threatAssessment: {
    nearbyThreats: string[]; // IDs of threatening NPCs/player
    currentThreatLevel: number; // 0-100
    lastThreatUpdate: number;
  };
  routeOptimization: {
    preferredRoutes: Map<string, number>; // stationId -> preference score
    avoidedSectors: string[];
    knownProfitableRoutes: Array<{
      from: string;
      to: string;
      commodity: string;
      profitMargin: number;
      lastUpdated: number;
    }>;
  };
}

export interface NPCPersonality {
  type: 'aggressive' | 'cautious' | 'opportunistic' | 'diplomatic' | 'hostile' | 'friendly';
  traits: NPCTrait[];
}

export interface NPCTrait {
  id: string;
  name: string;
  description: string;
  effects: {
    aggression?: number; // Modifier to aggressiveness
    riskTolerance?: number; // Modifier to risk tolerance
    tradingBonus?: number; // Modifier to trading efficiency
    reputationSensitivity?: number; // How much faction reputation affects behavior
  };
}

export interface NPCGoal {
  id: string;
  type: 'trade' | 'patrol' | 'pirate' | 'transport' | 'idle' | 'flee' | 'investigate';
  priority: number; // 1-10, 10 being highest priority
  targetSystemId?: string;
  targetStationId?: string;
  targetCommodity?: string;
  expectedProfit?: number; // For trading goals
  timeLimit?: number; // Optional deadline for goal completion
  startTime: number;
  parameters: Map<string, any>; // Goal-specific data
}

export interface NPCConversation {
  id: string;
  npcId: string;
  type: 'greeting' | 'trade_offer' | 'threat' | 'information' | 'distress' | 'diplomatic';
  context: {
    playerReputation: number;
    npcMood: number; // -100 to 100
    systemSecurity: number;
    recentEvents: string[]; // Recent event IDs that might affect conversation
  };
  dialogue: ConversationNode[];
  currentNodeId: string;
  startTime: number;
}

export interface ConversationNode {
  id: string;
  text: string;
  speakerType: 'npc' | 'player';
  choices?: ConversationChoice[];
  conditions?: ConversationCondition[]; // Conditions to display this node
  effects?: ConversationEffect[]; // Effects when this node is reached
  nextNodeId?: string; // Auto-advance to next node if no choices
}

export interface ConversationChoice {
  id: string;
  text: string;
  requirements?: {
    minReputation?: number;
    minCredits?: number;
    requiredSkills?: string[]; // Skill names needed for this choice
    requiredItems?: string[]; // Item IDs needed
  };
  consequences: ConversationEffect[];
  nextNodeId: string;
}

export interface ConversationCondition {
  type: 'reputation' | 'credits' | 'faction' | 'skill' | 'item' | 'random';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: any;
  target?: string; // For faction, skill, item conditions
}

export interface ConversationEffect {
  type: 'reputation' | 'credits' | 'cargo' | 'information' | 'combat' | 'mission';
  target?: string; // Faction for reputation, commodity for cargo, etc.
  value: number | string;
  message?: string; // Optional player feedback message
}

export interface NPCMarketBehavior {
  npcId: string;
  systemId: string;
  stationId: string;
  commodityPreferences: Map<string, number>; // commodityId -> preference score (0-100)
  buyingBehavior: {
    priceThreshold: number; // Won't buy above this multiplier of base price
    quantityLimits: Map<string, number>; // commodityId -> max quantity to buy
    frequency: number; // Average time between purchases in minutes
  };
  sellingBehavior: {
    priceThreshold: number; // Won't sell below this multiplier of base price
    stockLimits: Map<string, number>; // commodityId -> max quantity to keep
    frequency: number; // Average time between sales in minutes
  };
  lastTradeTime: number;
  currentOrders: NPCTradeOrder[];
}

export interface NPCTradeOrder {
  id: string;
  type: 'buy' | 'sell';
  commodityId: string;
  quantity: number;
  maxPrice?: number; // For buy orders
  minPrice?: number; // For sell orders
  expirationTime: number;
  systemId: string;
  stationId: string;
}

export interface NPCFleet {
  id: string;
  name: string;
  faction: string;
  ships: string[]; // NPCShip IDs
  fleetGoal: NPCGoal;
  formation: FleetFormation;
  commandShipId: string;
  lastUpdateTime: number;
}

export interface FleetFormation {
  type: 'escort' | 'patrol' | 'convoy' | 'attack' | 'dispersed';
  spacing: number; // Distance between ships
  roles: Map<string, FleetRole>; // shipId -> role
}

export interface FleetRole {
  type: 'leader' | 'escort' | 'scout' | 'transport' | 'support';
  position: { x: number; y: number }; // Relative to leader
  behavior: 'aggressive' | 'defensive' | 'support';
}

// Enhanced AI interfaces for Phase 5.2
export interface PathfindingNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // Total cost (g + h)
  parent?: PathfindingNode;
  obstacle?: boolean;
  cost?: number; // Movement cost multiplier
}

export interface AvoidanceTarget {
  id: string;
  position: { x: number; y: number };
  radius: number;
  strength: number; // How strongly to avoid (0-100)
  type: 'ship' | 'station' | 'hazard' | 'debris';
}

export interface AIDecisionContext {
  npc: NPCShip;
  nearbyNPCs: NPCShip[];
  nearbyStations: any[]; // Station interfaces
  playerInRange: boolean;
  playerPosition?: { x: number; y: number };
  marketData?: any; // Market price data
  threatLevel: number;
  timestamp: number;
}

export interface TradeDecision {
  action: 'buy' | 'sell' | 'wait' | 'travel';
  commodity?: string;
  quantity?: number;
  targetPrice?: number;
  targetStationId?: string;
  confidence: number; // 0-100, how confident the AI is in this decision
  reasoning: string; // Human-readable explanation
}

export interface CombatDecision {
  action: 'engage' | 'flee' | 'intimidate' | 'ignore' | 'call_backup';
  targetId?: string;
  tacticalPosition?: { x: number; y: number };
  confidence: number;
  reasoning: string;
}

export interface ConversationState {
  npcId: string;
  playerId: string;
  currentTopic: string;
  moodModifier: number; // -100 to 100, affects responses
  conversationHistory: Array<{
    speaker: 'npc' | 'player';
    text: string;
    timestamp: number;
  }>;
  availableTopics: string[];
  relationshipChange: number; // Pending reputation change
}