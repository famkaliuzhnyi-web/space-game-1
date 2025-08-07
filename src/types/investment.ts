/**
 * Investment and Advanced Economic System Types
 * 
 * This module defines types for:
 * - Investment opportunities and portfolio management
 * - Market speculation and futures trading
 * - Complex supply chain dependencies
 * - Player market influence and economic warfare
 */

export type InvestmentType = 
  | 'station_infrastructure'
  | 'commodity_futures'
  | 'faction_venture'
  | 'research_project'
  | 'mining_operation'
  | 'trade_route';

export type RiskLevel = 'low' | 'moderate' | 'high';

export type InvestmentStatus = 
  | 'active'
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Represents an investment opportunity
 */
export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  description: string;
  requiredCapital: number;
  expectedReturn: number; // Annual return rate (0.1 = 10%)
  riskLevel: RiskLevel;
  duration: number; // Duration in days
  sector: string;
  minimumInvestment: number;
  maximumInvestment: number;
  currentInvestors: number;
  totalRaised: number;
  targetAmount: number;
  deadline: number; // Timestamp
  status: InvestmentStatus;
  faction: string;
  requirements: {
    minimumReputation: number;
    requiredLicenses: string[];
    minimumCredits: number;
  };
}

/**
 * Player's individual investment record
 */
export interface PlayerInvestment {
  investmentId: string;
  amount: number;
  dateInvested: number;
  expectedReturn: number;
  actualReturn: number;
  status: InvestmentStatus;
}

/**
 * Investment portfolio performance metrics
 */
export interface PortfolioMetrics {
  roi: number; // Return on investment
  volatility: number; // Portfolio volatility
  sharpeRatio: number; // Risk-adjusted return
  maxDrawdown: number; // Maximum loss from peak
}

/**
 * Player's complete investment portfolio
 */
export interface InvestmentPortfolio {
  totalValue: number;
  totalInvested: number;
  totalReturns: number;
  riskLevel: RiskLevel;
  diversificationScore: number; // 0-1, higher is better
  investments: PlayerInvestment[];
  speculationHistory: SpeculationRecord[];
  performanceMetrics: PortfolioMetrics;
}

export type SpeculationType = 
  | 'commodity_futures'
  | 'station_bonds'
  | 'faction_securities'
  | 'currency_exchange'
  | 'volatility_trading';

export type Position = 'long' | 'short';

export type MarketSentiment = 'bullish' | 'bearish' | 'neutral';

/**
 * Risk metrics for speculation positions
 */
export interface RiskMetrics {
  volatility: number; // Expected price volatility
  beta: number; // Correlation with market
  maxLoss: number; // Maximum potential loss
  probabilityOfProfit: number; // 0-1 probability of profit
}

/**
 * Market speculation position
 */
export interface MarketSpeculation {
  id: string;
  type: SpeculationType;
  commodity: string;
  market: string;
  position: Position;
  leverage: number; // 1x to 10x
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  margin: number; // Required margin deposit
  profitLoss: number; // Current P&L
  confidence: number; // Player's confidence in position (0-1)
  marketSentiment: MarketSentiment;
  expirationDate: number;
  riskMetrics: RiskMetrics;
}

/**
 * Historical speculation record
 */
export interface SpeculationRecord {
  commodity: string;
  position: Position;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  profitLoss: number;
  duration: number; // Position duration in ms
}

export type SupplyChainNodeType = 
  | 'raw_material'
  | 'processing'
  | 'manufacturing'
  | 'distribution'
  | 'retail';

/**
 * Node in a supply chain network
 */
export interface SupplyChainNode {
  id: string;
  type: SupplyChainNodeType;
  commodity: string;
  tier: number; // 0 = raw materials, higher = more processed
  productionCapacity: number;
  currentProduction: number;
  efficiency: number; // 0-1, affects production
  suppliers: string[]; // Node IDs that supply this node
  consumers: string[]; // Node IDs that consume from this node
  location: string; // Station or system ID
  operatingCosts: number; // Daily operating costs
}

/**
 * Dependency relationship between supply chain nodes
 */
export interface SupplyChainDependency {
  supplierId: string;
  consumerId: string;
  commodity: string;
  requiredRatio: number; // How much input needed per unit output
  flexibility: number; // 0-1, how easily substitutions can be made
  transportCost: number; // Cost per unit to transport
  leadTime: number; // Days between order and delivery
  reliability: number; // 0-1, probability of successful delivery
}

export type MarketInfluenceType = 
  | 'large_trade'
  | 'supply_manipulation'
  | 'demand_creation'
  | 'price_manipulation'
  | 'market_cornering';

/**
 * Record of player's market influence actions
 */
export interface MarketInfluenceEvent {
  id: string;
  type: MarketInfluenceType;
  market: string;
  commodity: string;
  timestamp: number;
  playerInfluence: number; // Player's influence level at time of action
  volumeAffected: number;
  priceImpact: number; // Percentage price change caused
  duration: number; // How long the effect lasted
  consequences: string[]; // Legal, reputation, or other consequences
}

export type EconomicWarfareType = 
  | 'market_corner'
  | 'supply_disruption'
  | 'price_manipulation'
  | 'trade_embargo'
  | 'currency_attack'
  | 'infrastructure_sabotage';

/**
 * Economic warfare action that player can take
 */
export interface EconomicWarfareAction {
  type: EconomicWarfareType;
  targetMarket: string;
  targetCommodity?: string;
  targetFaction?: string;
  requiredInfluence: number; // Minimum market influence needed
  cost: number; // Credits required to execute
  riskLevel: RiskLevel;
  potentialReward: number;
  legalConsequences: string[];
  reputationImpact: { [faction: string]: number };
  executionTime: number; // Time to execute in hours
}

/**
 * Market manipulation detection system
 */
export interface ManipulationAlert {
  id: string;
  market: string;
  commodity: string;
  suspiciousActivity: string[];
  confidenceLevel: number; // 0-1, how certain the detection is
  timestamp: number;
  playerImplication: number; // 0-1, how much player is implicated
  investigationStatus: 'pending' | 'investigating' | 'cleared' | 'guilty';
  consequences: string[];
}

/**
 * Economic crisis event that affects supply chains and markets
 */
export interface EconomicCrisis {
  id: string;
  type: 'supply_shortage' | 'demand_collapse' | 'infrastructure_failure' | 'political_instability';
  affectedRegions: string[]; // System or sector IDs
  affectedCommodities: string[];
  severity: number; // 0-1, higher is more severe
  duration: number; // Duration in days
  priceMultipliers: { [commodity: string]: number }; // Price adjustment factors
  supplyMultipliers: { [commodity: string]: number }; // Supply adjustment factors
  recoveryRate: number; // How quickly conditions normalize (per day)
  playerOpportunities: string[]; // Special opportunities created by crisis
}

/**
 * Advanced market analysis data
 */
export interface MarketAnalysis {
  market: string;
  commodity: string;
  currentPrice: number;
  priceHistory: number[]; // Last 30 days
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  supplyLevel: 'critical' | 'low' | 'normal' | 'high' | 'oversupply';
  demandLevel: 'none' | 'low' | 'normal' | 'high' | 'critical';
  competitionLevel: number; // 0-1, how much competition exists
  predictedPriceRange: { min: number; max: number; confidence: number };
  recommendedAction: 'buy' | 'sell' | 'hold' | 'avoid';
  riskAssessment: RiskLevel;
}

/**
 * Investment advisor recommendation
 */
export interface InvestmentAdvice {
  investmentId: string;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  reasoning: string[];
  riskWarnings: string[];
  expectedOutcome: {
    bestCase: number;
    worstCase: number;
    mostLikely: number;
  };
  timeHorizon: number; // Recommended holding period in days
  diversificationScore: number; // How this fits in portfolio
}

/**
 * Portfolio rebalancing recommendation
 */
export interface RebalancingAdvice {
  currentRisk: RiskLevel;
  targetRisk: RiskLevel;
  overweightedSectors: string[];
  underweightedSectors: string[];
  recommendedActions: {
    sell: Array<{ investmentId: string; amount: number; reason: string }>;
    buy: Array<{ investmentId: string; amount: number; reason: string }>;
  };
  expectedImpact: {
    riskReduction: number;
    expectedReturnChange: number;
    diversificationImprovement: number;
  };
}

/**
 * Economic indicator that affects investment performance
 */
export interface EconomicIndicator {
  name: string;
  category: 'leading' | 'lagging' | 'coincident';
  value: number;
  trend: 'improving' | 'declining' | 'stable';
  impact: { [sector: string]: number }; // Impact multiplier by sector
  reliability: number; // 0-1, how reliable this indicator is
  updateFrequency: number; // Days between updates
  lastUpdate: number; // Timestamp of last update
}

/**
 * Sector performance analysis
 */
export interface SectorAnalysis {
  sector: string;
  totalValue: number;
  averageReturn: number;
  volatility: number;
  marketShare: number; // Player's share of this sector
  competitionLevel: number;
  growthTrend: 'expanding' | 'contracting' | 'stable';
  riskFactors: string[];
  opportunities: string[];
  topPerformers: string[]; // Investment IDs
  worstPerformers: string[]; // Investment IDs
}

/**
 * Complex financial instrument (bonds, derivatives, etc.)
 */
export interface FinancialInstrument {
  id: string;
  type: 'bond' | 'derivative' | 'option' | 'future' | 'swap';
  underlyingAsset: string;
  strikePrice?: number;
  expirationDate: number;
  premium: number;
  payoff: number;
  riskProfile: RiskLevel;
  liquidity: 'high' | 'medium' | 'low';
  counterparty: string; // Faction or institution
  terms: string[];
}

/**
 * Economic war between factions affecting markets
 */
export interface EconomicWar {
  id: string;
  participants: string[]; // Faction IDs
  startDate: number;
  duration: number; // Expected duration in days
  battlegrounds: string[]; // Markets or commodities being fought over
  strategies: { [faction: string]: EconomicWarfareType[] };
  currentPhase: 'escalation' | 'active' | 'resolution' | 'aftermath';
  playerInvolvement: 'neutral' | 'minor' | 'major' | 'catalyst';
  economicDamage: number; // Total credits destroyed
  opportunities: InvestmentOpportunity[];
  consequences: string[];
}

/**
 * Special investment opportunity created by events
 */
export interface InvestmentOpportunity {
  id: string;
  name: string;
  description: string;
  trigger: string; // What event created this opportunity
  window: number; // How long the opportunity lasts (in days)
  potentialReturn: number;
  riskLevel: RiskLevel;
  requirements: string[];
  exclusivity: 'unique' | 'limited' | 'open'; // How many players can participate
}