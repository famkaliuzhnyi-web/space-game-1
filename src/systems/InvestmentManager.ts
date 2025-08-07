import {
  Investment,
  InvestmentPortfolio,
  MarketSpeculation,
  SupplyChainNode,
  SupplyChainDependency,
  MarketInfluenceEvent,
  EconomicWarfareAction
} from '../types/investment';
import { TimeManager } from './TimeManager';
import { WorldManager } from './WorldManager';
import { PlayerManager } from './PlayerManager';
import { FactionManager } from './FactionManager';
import { EconomicSystem } from './EconomicSystem';

/**
 * InvestmentManager handles advanced economic features including investments,
 * market speculation, complex supply chains, and player market influence.
 * 
 * Responsibilities:
 * - Managing investment portfolios and opportunities
 * - Coordinating market speculation and risk/reward calculations
 * - Modeling complex supply chain dependencies
 * - Tracking player influence on market conditions
 * - Economic warfare capabilities and large-scale trading effects
 * 
 * Features:
 * - Investment opportunities in stations, commodities, and faction ventures
 * - Speculation mechanics with dynamic risk assessment
 * - Multi-tier supply chain modeling with cascading effects
 * - Market manipulation detection and consequences
 * - Economic warfare and strategic resource control
 */
export class InvestmentManager {
  private timeManager: TimeManager;
  private worldManager: WorldManager;
  private playerManager: PlayerManager;
  private economicSystem: EconomicSystem;

  // Investment System State
  private playerPortfolio: InvestmentPortfolio = {
    totalValue: 0,
    totalInvested: 0,
    totalReturns: 0,
    riskLevel: 'moderate',
    diversificationScore: 0,
    investments: [],
    speculationHistory: [],
    performanceMetrics: {
      roi: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    }
  };
  private availableInvestments: Map<string, Investment> = new Map();
  private activeSpeculations: Map<string, MarketSpeculation> = new Map();

  // Supply Chain System State
  private supplyChains: Map<string, SupplyChainNode[]> = new Map();
  private chainDependencies: Map<string, SupplyChainDependency[]> = new Map();

  // Market Influence State
  private marketInfluenceHistory: MarketInfluenceEvent[] = [];
  private playerMarketPower: Map<string, number> = new Map(); // Market ID -> influence level (0-1)

  constructor(
    timeManager: TimeManager,
    worldManager: WorldManager,
    playerManager: PlayerManager,
    _factionManager: FactionManager,
    economicSystem: EconomicSystem
  ) {
    this.timeManager = timeManager;
    this.worldManager = worldManager;
    this.playerManager = playerManager;
    this.economicSystem = economicSystem;

    this.initializePlayerPortfolio();
    this.generateInvestmentOpportunities();
    this.initializeSupplyChains();
  }

  /**
   * Initialize the player's investment portfolio
   */
  private initializePlayerPortfolio(): void {
    // Already initialized in declaration
  }

  /**
   * Generate available investment opportunities
   */
  private generateInvestmentOpportunities(): void {
    const stations = this.worldManager.getAllStations();
    
    for (const station of stations) {
      // Station infrastructure investments
      this.createStationInvestment(station);
      
      // Commodity speculation opportunities
      this.createCommoditySpeculation(station);
      
      // Faction venture investments
      this.createFactionInvestment(station);
    }
  }

  /**
   * Create a station infrastructure investment opportunity
   */
  private createStationInvestment(station: any): void {
    const investmentId = `station_${station.id}_${Date.now()}`;
    const baseValue = 50000 + Math.random() * 200000; // 50k-250k credits
    
    const investment: Investment = {
      id: investmentId,
      type: 'station_infrastructure',
      name: `${station.name} Infrastructure Development`,
      description: `Invest in upgrading ${station.name}'s infrastructure to improve production efficiency and reduce operational costs.`,
      requiredCapital: baseValue,
      expectedReturn: 0.08 + Math.random() * 0.12, // 8-20% annual return
      riskLevel: this.calculateStationRiskLevel(station),
      duration: 180 + Math.random() * 180, // 6-12 months
      sector: this.getStationSector(station),
      minimumInvestment: Math.floor(baseValue * 0.1),
      maximumInvestment: baseValue * 2,
      currentInvestors: Math.floor(Math.random() * 10),
      totalRaised: Math.floor(baseValue * (0.3 + Math.random() * 0.4)),
      targetAmount: baseValue,
      deadline: this.timeManager.getCurrentTimestamp() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000, // 30-90 days
      status: 'active',
      faction: station.faction,
      requirements: {
        minimumReputation: 10 + Math.random() * 40,
        requiredLicenses: [],
        minimumCredits: Math.floor(baseValue * 0.1)
      }
    };

    this.availableInvestments.set(investmentId, investment);
  }

  /**
   * Create commodity speculation opportunity
   */
  private createCommoditySpeculation(station: any): void {
    const commodities = ['electronics', 'rare_metals', 'food', 'medical_supplies', 'luxury_goods'];
    const commodity = commodities[Math.floor(Math.random() * commodities.length)];
    const speculationId = `spec_${commodity}_${station.id}_${Date.now()}`;
    
    const speculation: MarketSpeculation = {
      id: speculationId,
      type: 'commodity_futures',
      commodity,
      market: station.id,
      position: Math.random() > 0.5 ? 'long' : 'short',
      leverage: 1 + Math.random() * 4, // 1x to 5x leverage
      entryPrice: 0, // Will be set when position is opened
      currentPrice: 0,
      quantity: Math.floor(100 + Math.random() * 500),
      margin: 0,
      profitLoss: 0,
      confidence: Math.random(),
      marketSentiment: this.getMarketSentiment(commodity, station.id),
      expirationDate: this.timeManager.getCurrentTimestamp() + (7 + Math.random() * 23) * 24 * 60 * 60 * 1000, // 1-4 weeks
      riskMetrics: {
        volatility: Math.random() * 0.5,
        beta: 0.5 + Math.random() * 1.5,
        maxLoss: 0,
        probabilityOfProfit: 0.3 + Math.random() * 0.4
      }
    };

    this.activeSpeculations.set(speculationId, speculation);
  }

  /**
   * Create faction venture investment opportunity
   */
  private createFactionInvestment(station: any): void {
    const ventures = [
      'mining_operation',
      'trade_route',
      'research_facility',
      'defense_contract',
      'exploration_mission'
    ];
    
    const venture = ventures[Math.floor(Math.random() * ventures.length)];
    const investmentId = `faction_${station.faction}_${venture}_${Date.now()}`;
    const baseValue = 100000 + Math.random() * 500000; // 100k-600k credits
    
    const investment: Investment = {
      id: investmentId,
      type: 'faction_venture',
      name: `${station.faction} ${venture.replace('_', ' ')}`,
      description: this.getFactionVentureDescription(station.faction, venture),
      requiredCapital: baseValue,
      expectedReturn: 0.12 + Math.random() * 0.18, // 12-30% return (higher risk)
      riskLevel: 'high',
      duration: 90 + Math.random() * 270, // 3-12 months
      sector: venture,
      minimumInvestment: Math.floor(baseValue * 0.05),
      maximumInvestment: baseValue,
      currentInvestors: Math.floor(Math.random() * 5),
      totalRaised: Math.floor(baseValue * (0.1 + Math.random() * 0.3)),
      targetAmount: baseValue,
      deadline: this.timeManager.getCurrentTimestamp() + (14 + Math.random() * 28) * 24 * 60 * 60 * 1000, // 2-6 weeks
      status: 'active',
      faction: station.faction,
      requirements: {
        minimumReputation: 25 + Math.random() * 50,
        requiredLicenses: [],
        minimumCredits: Math.floor(baseValue * 0.05)
      }
    };

    this.availableInvestments.set(investmentId, investment);
  }

  /**
   * Initialize complex supply chain dependencies
   */
  private initializeSupplyChains(): void {
    const commodities = ['electronics', 'rare_metals', 'food', 'medical_supplies', 'luxury_goods', 'industrial_equipment'];
    
    for (const commodity of commodities) {
      this.createSupplyChain(commodity);
    }
  }

  /**
   * Create a supply chain for a specific commodity
   */
  private createSupplyChain(commodity: string): void {
    const chain: SupplyChainNode[] = [];
    const dependencies: SupplyChainDependency[] = [];
    
    // Raw materials level
    const rawMaterials = this.getRawMaterialsFor(commodity);
    for (const material of rawMaterials) {
      chain.push({
        id: `raw_${material}`,
        type: 'raw_material',
        commodity: material,
        tier: 0,
        productionCapacity: 1000 + Math.random() * 2000,
        currentProduction: 0,
        efficiency: 0.8 + Math.random() * 0.2,
        suppliers: [],
        consumers: [],
        location: this.getRandomLocation(),
        operatingCosts: 100 + Math.random() * 200
      });
    }
    
    // Processing level
    chain.push({
      id: `process_${commodity}`,
      type: 'processing',
      commodity,
      tier: 1,
      productionCapacity: 500 + Math.random() * 1000,
      currentProduction: 0,
      efficiency: 0.7 + Math.random() * 0.3,
      suppliers: rawMaterials.map(mat => `raw_${mat}`),
      consumers: [],
      location: this.getRandomLocation(),
      operatingCosts: 200 + Math.random() * 400
    });
    
    // Manufacturing level
    chain.push({
      id: `mfg_${commodity}`,
      type: 'manufacturing',
      commodity,
      tier: 2,
      productionCapacity: 200 + Math.random() * 500,
      currentProduction: 0,
      efficiency: 0.6 + Math.random() * 0.4,
      suppliers: [`process_${commodity}`],
      consumers: [],
      location: this.getRandomLocation(),
      operatingCosts: 500 + Math.random() * 1000
    });
    
    // Create dependencies between tiers
    for (let i = 0; i < chain.length - 1; i++) {
      dependencies.push({
        supplierId: chain[i].id,
        consumerId: chain[i + 1].id,
        commodity: chain[i].commodity,
        requiredRatio: 1.5 + Math.random() * 2.5, // How much raw material per unit of output
        flexibility: Math.random() * 0.5, // How easily substitutions can be made
        transportCost: 10 + Math.random() * 50,
        leadTime: 1 + Math.random() * 14, // Days
        reliability: 0.8 + Math.random() * 0.2
      });
    }
    
    this.supplyChains.set(commodity, chain);
    this.chainDependencies.set(commodity, dependencies);
  }

  /**
   * Make an investment
   */
  public makeInvestment(investmentId: string, amount: number): boolean {
    const investment = this.availableInvestments.get(investmentId);
    if (!investment) return false;
    
    if (amount < investment.minimumInvestment || amount > investment.maximumInvestment) {
      return false;
    }
    
    if (!this.playerManager.spendCredits(amount)) {
      return false;
    }
    
    // Check reputation requirements
    const playerReputation = this.playerManager.getReputationForFaction(investment.faction);
    if (!playerReputation || playerReputation.standing < investment.requirements.minimumReputation) {
      this.playerManager.addCredits(amount); // Refund
      return false;
    }
    
    // Add to portfolio
    this.playerPortfolio.investments.push({
      investmentId,
      amount,
      dateInvested: this.timeManager.getCurrentTimestamp(),
      expectedReturn: investment.expectedReturn,
      actualReturn: 0,
      status: 'active'
    });
    
    this.playerPortfolio.totalInvested += amount;
    this.updatePortfolioMetrics();
    
    return true;
  }

  /**
   * Open a speculation position
   */
  public openSpeculation(speculationId: string, amount: number): boolean {
    const speculation = this.activeSpeculations.get(speculationId);
    if (!speculation) return false;
    
    const requiredMargin = amount / speculation.leverage;
    if (!this.playerManager.spendCredits(requiredMargin)) {
      return false;
    }
    
    // Get current commodity price from market
    const market = this.economicSystem.getMarket(speculation.market);
    const currentPrice = market?.commodities.get(speculation.commodity)?.currentPrice || 100;
    
    if (!currentPrice || currentPrice === 0) {
      // Use fallback price if economic system doesn't have the price
      const fallbackPrice = 100; // Default commodity price
      speculation.entryPrice = fallbackPrice;
      speculation.currentPrice = fallbackPrice;
    } else {
      speculation.entryPrice = currentPrice;
      speculation.currentPrice = currentPrice;
    }
    
    speculation.margin = requiredMargin;
    speculation.quantity = Math.floor(amount / (speculation.entryPrice || 100));
    
    return true;
  }

  /**
   * Simulate supply chain disruption
   */
  public simulateSupplyDisruption(commodity: string, severity: number = 0.5): void {
    const chain = this.supplyChains.get(commodity);
    if (!chain) return;
    
    // Randomly select nodes to disrupt
    const disruptedNodes = chain.filter(() => Math.random() < severity * 0.3);
    
    for (const node of disruptedNodes) {
      node.efficiency *= (1 - severity);
      node.currentProduction = Math.floor(node.productionCapacity * node.efficiency);
      
      // Cascade effects to consumers
      this.cascadeSupplyEffects(node, severity * 0.7);
    }
    
    // Update market prices based on supply disruption
    this.updateMarketPricesFromSupply(commodity, severity);
  }

  /**
   * Calculate player's market influence in a specific market
   */
  public calculateMarketInfluence(marketId: string): number {
    const tradeHistory = this.getPlayerTradeHistory(marketId);
    const totalVolume = this.getMarketTotalVolume(marketId);
    
    if (totalVolume === 0) return 0;
    
    const playerVolume = tradeHistory.reduce((sum, trade) => sum + trade.volume, 0);
    const influence = Math.min(playerVolume / totalVolume, 0.3); // Cap at 30% influence
    
    this.playerMarketPower.set(marketId, influence);
    return influence;
  }

  /**
   * Execute economic warfare action
   */
  public executeEconomicWarfare(action: EconomicWarfareAction): boolean {
    // Check if player has sufficient influence
    const influence = this.calculateMarketInfluence(action.targetMarket);
    if (influence < action.requiredInfluence) return false;
    
    // Check costs
    if (!this.playerManager.spendCredits(action.cost)) return false;
    
    switch (action.type) {
      case 'market_corner':
        return this.executeMarketCorner(action);
      case 'supply_disruption':
        return this.executeSupplyDisruption(action);
      case 'price_manipulation':
        return this.executePriceManipulation(action);
      case 'trade_embargo':
        return this.executeTradeEmbargo(action);
      default:
        return false;
    }
  }

  /**
   * Update investment returns and portfolio performance
   */
  public updateInvestments(): void {
    const currentTime = this.timeManager.getCurrentTimestamp();
    
    // Update active investments
    for (const investment of this.playerPortfolio.investments) {
      if (investment.status !== 'active') continue;
      
      const daysSinceInvestment = (currentTime - investment.dateInvested) / (24 * 60 * 60 * 1000);
      const expectedDailyReturn = investment.expectedReturn / 365;
      
      // Add some volatility to returns
      const volatility = Math.random() * 0.1 - 0.05; // ±5%
      const actualDailyReturn = expectedDailyReturn + volatility;
      
      investment.actualReturn = investment.amount * actualDailyReturn * daysSinceInvestment;
    }
    
    // Update speculations
    this.updateSpeculations();
    
    // Update portfolio metrics
    this.updatePortfolioMetrics();
    
    // Update supply chains
    this.updateSupplyChains();
  }

  // Helper methods
  private calculateStationRiskLevel(_station: any): 'low' | 'moderate' | 'high' {
    const riskScore = Math.random();
    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.7) return 'moderate';
    return 'high';
  }

  private getStationSector(_station: any): string {
    const sectors = ['mining', 'manufacturing', 'trade', 'research', 'defense'];
    return sectors[Math.floor(Math.random() * sectors.length)];
  }

  private getMarketSentiment(_commodity: string, _marketId: string): 'bullish' | 'bearish' | 'neutral' {
    const sentiment = Math.random();
    if (sentiment < 0.33) return 'bearish';
    if (sentiment < 0.66) return 'neutral';
    return 'bullish';
  }

  private getFactionVentureDescription(faction: string, venture: string): string {
    const descriptions = {
      mining_operation: `A new mining operation in ${faction} territory promising high-grade ore extraction`,
      trade_route: `Establishing a lucrative trade route through ${faction} space`,
      research_facility: `A cutting-edge research facility backed by ${faction}`,
      defense_contract: `A defense contract with ${faction} for system protection`,
      exploration_mission: `An exploration mission into uncharted ${faction} territories`
    };
    return descriptions[venture as keyof typeof descriptions] || `A ${venture} venture with ${faction}`;
  }

  private getRawMaterialsFor(commodity: string): string[] {
    const materials: { [key: string]: string[] } = {
      electronics: ['rare_metals', 'industrial_equipment'],
      medical_supplies: ['organic_compounds', 'rare_metals'],
      luxury_goods: ['art_objects', 'rare_metals'],
      food: ['organic_compounds', 'water'],
      industrial_equipment: ['rare_metals', 'carbon_crystals']
    };
    return materials[commodity] || ['raw_materials'];
  }

  private getRandomLocation(): string {
    const stations = this.worldManager.getAllStations();
    return stations[Math.floor(Math.random() * stations.length)]?.id || 'unknown';
  }

  private cascadeSupplyEffects(node: SupplyChainNode, severity: number): void {
    // Find all consumers of this node
    for (const chain of this.supplyChains.values()) {
      for (const chainNode of chain) {
        if (chainNode.suppliers.includes(node.id)) {
          chainNode.efficiency *= (1 - severity * 0.5);
          chainNode.currentProduction = Math.floor(chainNode.productionCapacity * chainNode.efficiency);
          
          // Recursive cascade with diminishing effect
          if (severity > 0.1) {
            this.cascadeSupplyEffects(chainNode, severity * 0.7);
          }
        }
      }
    }
  }

  private updateMarketPricesFromSupply(_commodity: string, _severity: number): void {
    // This would integrate with EconomicSystem to update prices
    // For now, we'll simulate the effect
    // const priceIncrease = 1 + (severity * 0.5); // Up to 50% price increase
    // economicSystem.adjustCommodityPrice(commodity, priceIncrease);
  }

  private getPlayerTradeHistory(_marketId: string): any[] {
    // This would fetch actual trade history from the player manager
    return [];
  }

  private getMarketTotalVolume(_marketId: string): number {
    // This would fetch total market volume from economic system
    return 10000 + Math.random() * 50000;
  }

  private executeMarketCorner(_action: EconomicWarfareAction): boolean {
    // Implementation for cornering a market
    return true;
  }

  private executeSupplyDisruption(action: EconomicWarfareAction): boolean {
    // Implementation for disrupting supply chains
    this.simulateSupplyDisruption(action.targetCommodity || 'electronics', 0.7);
    return true;
  }

  private executePriceManipulation(_action: EconomicWarfareAction): boolean {
    // Implementation for manipulating prices
    return true;
  }

  private executeTradeEmbargo(_action: EconomicWarfareAction): boolean {
    // Implementation for trade embargos
    return true;
  }

  private updateSpeculations(): void {
    const currentTime = this.timeManager.getCurrentTimestamp();
    
    for (const [id, speculation] of this.activeSpeculations.entries()) {
      if (currentTime > speculation.expirationDate) {
        // Close expired speculations
        this.closeSpeculation(id);
        continue;
      }
      
      // Update current prices and P&L
      const market = this.economicSystem.getMarket(speculation.market);
      speculation.currentPrice = market?.commodities.get(speculation.commodity)?.currentPrice || speculation.entryPrice;
      
      if (speculation.position === 'long') {
        speculation.profitLoss = (speculation.currentPrice - speculation.entryPrice) * speculation.quantity;
      } else {
        speculation.profitLoss = (speculation.entryPrice - speculation.currentPrice) * speculation.quantity;
      }
    }
  }

  private closeSpeculation(speculationId: string): void {
    const speculation = this.activeSpeculations.get(speculationId);
    if (!speculation) return;
    
    // Settle P&L
    const finalProfitLoss = speculation.profitLoss;
    const returnAmount = speculation.margin + finalProfitLoss;
    
    if (returnAmount > 0) {
      this.playerManager.addCredits(returnAmount);
    }
    
    // Record in portfolio history
    this.playerPortfolio.speculationHistory.push({
      commodity: speculation.commodity,
      position: speculation.position,
      entryPrice: speculation.entryPrice,
      exitPrice: speculation.currentPrice,
      quantity: speculation.quantity,
      profitLoss: finalProfitLoss,
      duration: this.timeManager.getCurrentTimestamp() - (speculation.expirationDate - 30 * 24 * 60 * 60 * 1000)
    });
    
    this.activeSpeculations.delete(speculationId);
  }

  private updatePortfolioMetrics(): void {
    const portfolio = this.playerPortfolio;
    
    // Calculate total value
    portfolio.totalValue = portfolio.investments.reduce((sum, inv) => sum + inv.amount + inv.actualReturn, 0);
    
    // Calculate total returns
    portfolio.totalReturns = portfolio.investments.reduce((sum, inv) => sum + inv.actualReturn, 0);
    
    // Calculate ROI
    if (portfolio.totalInvested > 0) {
      portfolio.performanceMetrics.roi = portfolio.totalReturns / portfolio.totalInvested;
    }
    
    // Calculate diversification score (simplified)
    const uniqueSectors = new Set();
    for (const inv of portfolio.investments) {
      const investment = this.availableInvestments.get(inv.investmentId);
      if (investment) {
        uniqueSectors.add(investment.sector);
      }
    }
    portfolio.diversificationScore = Math.min(uniqueSectors.size / 5, 1.0); // Max score with 5+ sectors
    
    // Update risk level based on current positions
    const avgRisk = this.calculateAverageRisk();
    portfolio.riskLevel = avgRisk < 0.3 ? 'low' : avgRisk < 0.7 ? 'moderate' : 'high';
  }

  private calculateAverageRisk(): number {
    let totalRisk = 0;
    let totalWeight = 0;
    
    for (const inv of this.playerPortfolio.investments) {
      const investment = this.availableInvestments.get(inv.investmentId);
      if (investment) {
        const riskValue = investment.riskLevel === 'low' ? 0.2 : investment.riskLevel === 'moderate' ? 0.5 : 0.8;
        totalRisk += riskValue * inv.amount;
        totalWeight += inv.amount;
      }
    }
    
    return totalWeight > 0 ? totalRisk / totalWeight : 0.5;
  }

  private updateSupplyChains(): void {
    // Update production levels based on efficiency and demand
    for (const [_commodity, chain] of this.supplyChains.entries()) {
      for (const node of chain) {
        // Natural recovery of efficiency over time
        if (node.efficiency < 1.0) {
          node.efficiency = Math.min(1.0, node.efficiency + 0.01); // 1% recovery per update
        }
        
        // Update current production
        node.currentProduction = Math.floor(node.productionCapacity * node.efficiency);
      }
    }
  }

  // Public getters for UI and system integration
  public getPlayerPortfolio(): InvestmentPortfolio {
    return this.playerPortfolio;
  }

  public getAvailableInvestments(): Investment[] {
    return Array.from(this.availableInvestments.values());
  }

  public getActiveSpeculations(): MarketSpeculation[] {
    return Array.from(this.activeSpeculations.values());
  }

  public getSupplyChains(): Map<string, SupplyChainNode[]> {
    return this.supplyChains;
  }

  public getMarketInfluence(marketId: string): number {
    return this.playerMarketPower.get(marketId) || 0;
  }

  // Save/Load functionality
  public serialize(): any {
    return {
      playerPortfolio: this.playerPortfolio,
      availableInvestments: Array.from(this.availableInvestments.entries()),
      activeSpeculations: Array.from(this.activeSpeculations.entries()),
      supplyChains: Array.from(this.supplyChains.entries()),
      chainDependencies: Array.from(this.chainDependencies.entries()),
      marketInfluenceHistory: this.marketInfluenceHistory,
      playerMarketPower: Array.from(this.playerMarketPower.entries())
    };
  }

  public deserialize(data: any): void {
    if (data.playerPortfolio) this.playerPortfolio = data.playerPortfolio;
    if (data.availableInvestments) this.availableInvestments = new Map(data.availableInvestments);
    if (data.activeSpeculations) this.activeSpeculations = new Map(data.activeSpeculations);
    if (data.supplyChains) this.supplyChains = new Map(data.supplyChains);
    if (data.chainDependencies) this.chainDependencies = new Map(data.chainDependencies);
    if (data.marketInfluenceHistory) this.marketInfluenceHistory = data.marketInfluenceHistory;
    if (data.playerMarketPower) this.playerMarketPower = new Map(data.playerMarketPower);
  }
}