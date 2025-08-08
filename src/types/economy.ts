export interface Commodity {
  id: string;
  name: string;
  category: 'raw-materials' | 'manufactured' | 'luxury' | 'technology' | 'food' | 'energy';
  description: string;
  basePrice: number; // Base price in credits per unit
  unitSize: number; // Cargo space per unit
  unitMass: number; // Mass per unit in tons
  volatility: number; // 0-1, how much price fluctuates
  legalStatus: 'legal' | 'restricted' | 'illegal';
  perishable: boolean;
  shelfLife?: number; // Days before spoilage (if perishable)
}

export interface Market {
  stationId: string;
  commodities: Map<string, MarketCommodity>;
  lastUpdate: number; // Timestamp of last market update
  demandFactors: {
    stationType: number; // Multiplier based on station type
    population: number; // Multiplier based on station population
    securityLevel: number; // Affects illegal goods availability
    factionControl: number; // Faction-specific demand
  };
}

export interface MarketCommodity {
  commodityId: string;
  available: number; // Units available for purchase
  demand: number; // Units wanted by station
  currentPrice: number; // Current price per unit
  priceHistory: PricePoint[];
  supplyLevel: 'oversupply' | 'normal' | 'shortage' | 'critical';
  demandLevel: 'none' | 'low' | 'normal' | 'high' | 'desperate';
  productionRate: number; // Units produced per day (if positive) or consumed (if negative)
  restockTime: number; // Hours until next restock
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number; // Units traded at this price
}

export interface StationEconomics {
  stationId: string;
  stationType: 'trade' | 'industrial' | 'military' | 'research' | 'mining' | 'luxury' | 'diplomatic' | 
               'entertainment' | 'pirate' | 'agricultural' | 'medical' | 'exploration' | 'colonial' | 
               'salvage' | 'observatory' | 'foundry' | 'habitat' | 'security' | 'prison' | 'energy';
  population: number;
  wealthLevel: 'poor' | 'average' | 'wealthy' | 'elite';
  
  // Production capabilities
  produces: Production[];
  consumes: Consumption[];
  
  // Economic factors
  economicFactors: {
    efficiency: number; // 0-1, how efficient production/consumption is
    corruption: number; // 0-1, affects prices and availability
    stability: number; // 0-1, affects price volatility
    infrastructure: number; // 0-1, affects capacity and efficiency
  };
  
  // Market state
  market: Market;
  credits: number; // Station's available credits for purchasing
  tradeVolume: number; // Total daily trade volume
}

export interface Production {
  commodityId: string;
  baseRate: number; // Units produced per day under normal conditions
  efficiency: number; // Current efficiency multiplier (0-2)
  capacity: number; // Maximum production capacity
  requiredInputs?: {
    commodityId: string;
    unitsRequired: number; // Per unit of output
  }[];
}

export interface Consumption {
  commodityId: string;
  baseRate: number; // Units consumed per day under normal conditions
  necessity: 'luxury' | 'normal' | 'essential' | 'critical';
  substitutes?: string[]; // Other commodities that can fulfill this need
}

export interface TradeContract {
  id: string;
  type: 'delivery' | 'purchase' | 'transport' | 'bulk';
  issuer: string; // Station or NPC ID
  title: string;
  description: string;
  
  // Contract details
  origin: string; // Station ID where goods are picked up
  destination: string; // Station ID where goods are delivered
  commodity: string; // Commodity ID
  quantity: number;
  pricePerUnit: number;
  totalValue: number;
  
  // Requirements and constraints
  timeLimit: number; // Hours to complete
  minimumCargoCapacity: number;
  securityClearance?: number; // Required security level
  factionStanding?: {
    faction: string;
    minimumReputation: number;
  };
  
  // Rewards
  baseReward: number; // Credits on completion
  bonusReward?: number; // Additional reward for fast completion
  reputationReward?: {
    faction: string;
    amount: number;
  };
  
  // Status
  status: 'available' | 'accepted' | 'in-progress' | 'completed' | 'failed' | 'expired';
  acceptedBy?: string; // Player ID if accepted
  deadline: number; // Timestamp when contract expires
  completedAt?: number; // Timestamp when completed
}

export interface EconomicEvent {
  id: string;
  type: 'supply-shortage' | 'demand-spike' | 'price-crash' | 'trade-disruption' | 'production-bonus';
  affectedCommodities: string[];
  affectedStations: string[];
  severity: number; // 0-1
  duration: number; // Hours
  startTime: number; // Timestamp
  endTime: number; // Timestamp
  description: string;
  effects: {
    priceMultiplier?: number;
    availabilityMultiplier?: number;
    demandMultiplier?: number;
    productionMultiplier?: number;
  };
}

// Trade route analysis types
export interface TradeRoute {
  id: string;
  origin: string; // Station ID
  destination: string; // Station ID
  commodity: string;
  profitPerUnit: number;
  profitMargin: number; // Percentage
  distance: number;
  travelTime: number; // Hours
  profitPerHour: number;
  risk: number; // 0-1, based on security levels along route
  volume: number; // How much can be traded
  lastCalculated: number; // Timestamp
}

export interface RouteAnalysis {
  routes: TradeRoute[];
  topRoutes: TradeRoute[]; // Sorted by profitability
  riskAdjustedRoutes: TradeRoute[]; // Sorted by risk-adjusted profit
  updated: number; // Last analysis timestamp
}