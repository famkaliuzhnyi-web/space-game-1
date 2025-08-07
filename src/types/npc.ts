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