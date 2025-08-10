import { 
  Commodity, 
  Market, 
  MarketCommodity, 
  StationEconomics, 
  Production, 
  Consumption,
  PricePoint,
  EconomicEvent
} from '../types/economy';
import { Station } from '../types/world';
import { Character } from '../types/character';
import { COMMODITIES, getCommodity } from '../data/commodities';

export class EconomicSystem {
  private markets: Map<string, Market> = new Map();
  private stationEconomics: Map<string, StationEconomics> = new Map();
  private activeEvents: EconomicEvent[] = [];
  private lastUpdateTime: number = 0;
  private updateInterval: number = 3600000; // Update every hour (in milliseconds)

  constructor() {
    this.lastUpdateTime = Date.now();
  }

  /**
   * Initialize economic system for a station
   */
  initializeStationEconomics(station: Station, system?: {securityLevel: number}): StationEconomics {
    const economics: StationEconomics = {
      stationId: station.id,
      stationType: station.type,
      population: this.calculateStationPopulation(station),
      wealthLevel: this.determineWealthLevel(station),
      produces: this.generateProduction(station),
      consumes: this.generateConsumption(station),
      economicFactors: {
        efficiency: 0.8 + Math.random() * 0.4, // 0.8-1.2
        corruption: Math.random() * 0.3, // 0-0.3
        stability: 0.7 + Math.random() * 0.3, // 0.7-1.0
        infrastructure: 0.6 + Math.random() * 0.4 // 0.6-1.0
      },
      market: this.initializeMarket(station, system),
      credits: this.calculateStationCredits(station),
      tradeVolume: 0
    };

    this.stationEconomics.set(station.id, economics);
    return economics;
  }

  /**
   * Initialize market for a station
   */
  private initializeMarket(station: Station, system?: {securityLevel: number}): Market {
    const market: Market = {
      stationId: station.id,
      commodities: new Map(),
      lastUpdate: Date.now(),
      demandFactors: {
        stationType: this.getStationTypeModifier(station.type),
        population: Math.log10(this.calculateStationPopulation(station)) / 6, // Normalize to 0-1
        securityLevel: (system?.securityLevel ?? 5) / 10,
        factionControl: 1.0 // Default, could be modified by faction relations
      }
    };

    // Initialize commodity prices and availability
    this.initializeCommodityPrices(market, station, system);
    this.markets.set(station.id, market);
    
    return market;
  }

  /**
   * Initialize commodity prices and availability for a market
   */
  private initializeCommodityPrices(market: Market, station: Station, system?: {securityLevel: number}): void {
    const availableCommodities = this.getAvailableCommodities(station, system);
    
    for (const commodityId of availableCommodities) {
      const commodity = getCommodity(commodityId);
      if (!commodity) continue;

      const marketCommodity: MarketCommodity = {
        commodityId,
        available: this.calculateInitialAvailability(commodity, station),
        demand: this.calculateInitialDemand(commodity, station),
        currentPrice: this.calculatePrice(commodity, market),
        priceHistory: [{
          timestamp: Date.now(),
          price: commodity.basePrice,
          volume: 0
        }],
        supplyLevel: 'normal',
        demandLevel: 'normal',
        productionRate: this.getProductionRate(commodityId, station),
        restockTime: 8 + Math.random() * 16 // 8-24 hours
      };

      market.commodities.set(commodityId, marketCommodity);
    }
  }

  /**
   * Calculate current price for a commodity at a market
   */
  calculatePrice(commodity: Commodity, market: Market): number {
    return this.calculatePriceWithCharacterBonus(commodity, market, null);
  }

  /**
   * Calculate current price for a commodity at a market with character bonuses
   */
  calculatePriceWithCharacterBonus(commodity: Commodity, market: Market, character: Character | null): number {
    let price = commodity.basePrice;
    
    // Apply demand factors with more controlled ranges
    price *= market.demandFactors.stationType;
    price *= (0.5 + market.demandFactors.population);
    price *= (0.8 + market.demandFactors.securityLevel * 0.4);
    
    // Apply security restrictions for illegal/restricted items (reduced multipliers)
    if (commodity.legalStatus === 'illegal') {
      price *= 1.5 + (1.0 - market.demandFactors.securityLevel) * 1.0; // Max 2.5x for illegal
    } else if (commodity.legalStatus === 'restricted') {
      price *= 1.1 + (1.0 - market.demandFactors.securityLevel) * 0.4; // Max 1.5x for restricted
    }
    
    // Apply volatility with more controlled range
    const volatilityFactor = 1.0 + (Math.random() - 0.5) * commodity.volatility * 0.5;
    price *= volatilityFactor;
    
    // Apply active economic events with capped multiplier
    const eventMultiplier = this.getEventPriceMultiplier(commodity.id, market.stationId);
    price *= Math.min(2.0, Math.max(0.5, eventMultiplier)); // Cap event effects
    
    // Apply character bonuses if character is provided
    if (character) {
      const tradingBonus = this.calculateTradingBonus(character);
      price *= tradingBonus;
    }
    
    // Ensure final price stays within reasonable bounds (0.2x to 4x base price)
    const finalPrice = Math.max(commodity.basePrice * 0.2, 
                               Math.min(commodity.basePrice * 4.0, price));
    
    return Math.max(1, Math.round(finalPrice));
  }

  /**
   * Enhanced Phase 4.2: Calculate price with faction reputation bonuses
   */
  calculatePriceWithFactionBonus(
    commodity: Commodity, 
    market: Market, 
    character: Character | null, 
    factionManager: any,
    playerReputation: Map<string, any>
  ): number {
    // Start with character-adjusted price
    let price = this.calculatePriceWithCharacterBonus(commodity, market, character);
    
    if (factionManager && playerReputation) {
      // Get the station's controlling faction (simplified - could use market.factionId if available)
      const stationFactionId = market.stationId.includes('traders') ? 'traders-guild' : 
                              market.stationId.includes('earth') ? 'earth-federation' :
                              market.stationId.includes('outer') ? 'outer-colonies' : 'traders-guild';
      
      const reputation = playerReputation.get(stationFactionId);
      if (reputation) {
        const factionBenefits = factionManager.getFactionBenefits(reputation.standing);
        
        if (factionBenefits && factionBenefits.tradingDiscount) {
          // Apply trading discount (positive values are discounts, negative are markups)
          const discountMultiplier = 1.0 - (factionBenefits.tradingDiscount / 100);
          price *= Math.max(0.5, Math.min(1.5, discountMultiplier)); // Cap at 50% discount to 50% markup
        }
        
        // Check for faction restrictions
        const restrictions = factionManager.getFactionRestrictions(playerReputation, stationFactionId);
        if (restrictions && restrictions.tradingRestrictions.length > 0) {
          // Apply penalty for restricted trading
          price *= 1.2; // 20% markup for restricted traders
        }
      }
    }
    
    return Math.max(1, Math.round(price));
  }

  /**
   * Calculate trading bonus based on character attributes and skills
   */
  private calculateTradingBonus(character: Character): number {
    if (!character || !character.attributes || !character.skills) {
      return 1.0;
    }

    // Charisma affects trading prices (1-3% per point above 10)
    const charismaBonus = 1.0 - (character.attributes.charisma - 10) * 0.02;
    
    // Trading skill affects trading prices (0.5-1% per point above 0)
    const tradingBonus = 1.0 - character.skills.trading * 0.008;
    
    // Combine bonuses with reasonable limits
    const finalBonus = Math.max(0.75, Math.min(1.25, charismaBonus * tradingBonus));
    
    return finalBonus;
  }

  /**
   * Calculate current price for a commodity at a market with character bonuses (test version without volatility)
   */
  calculatePriceWithCharacterBonusStable(commodity: Commodity, market: Market, character: Character | null): number {
    let price = commodity.basePrice;
    
    // Apply demand factors with more controlled ranges
    price *= market.demandFactors.stationType;
    price *= (0.5 + market.demandFactors.population);
    price *= (0.8 + market.demandFactors.securityLevel * 0.4);
    
    // Apply security restrictions for illegal/restricted items (reduced multipliers)
    if (commodity.legalStatus === 'illegal') {
      price *= 1.5 + (1.0 - market.demandFactors.securityLevel) * 1.0; // Max 2.5x for illegal
    } else if (commodity.legalStatus === 'restricted') {
      price *= 1.1 + (1.0 - market.demandFactors.securityLevel) * 0.4; // Max 1.5x for restricted
    }
    
    // Skip volatility for testing
    
    // Apply active economic events with capped multiplier
    const eventMultiplier = this.getEventPriceMultiplier(commodity.id, market.stationId);
    price *= Math.min(2.0, Math.max(0.5, eventMultiplier)); // Cap event effects
    
    // Apply character bonuses if character is provided
    if (character) {
      const tradingBonus = this.calculateTradingBonus(character);
      price *= tradingBonus;
    }
    
    // Ensure final price stays within reasonable bounds (0.2x to 4x base price)
    const finalPrice = Math.max(commodity.basePrice * 0.2, 
                               Math.min(commodity.basePrice * 4.0, price));
    
    return Math.max(1, Math.round(finalPrice));
  }

  /**
   * Update all markets and economic cycles
   */
  update(_deltaTime: number): void {
    const currentTime = Date.now();
    
    // Only update markets periodically (every hour in game time)
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.updateMarkets(_deltaTime);
      this.updateProduction(_deltaTime);
      this.updateEvents(_deltaTime);
      this.lastUpdateTime = currentTime;
    }
  }

  /**
   * Update all market prices and availability
   */
  private updateMarkets(deltaTime: number): void {
    for (const market of this.markets.values()) {
      this.updateMarket(market, deltaTime);
    }
  }

  /**
   * Update a single market
   */
  private updateMarket(market: Market, deltaTime: number): void {
    const economics = this.stationEconomics.get(market.stationId);
    if (!economics) return;

    for (const [commodityId, marketCommodity] of market.commodities) {
      const commodity = getCommodity(commodityId);
      if (!commodity) continue;

      // Update supply based on production
      const hoursPassed = deltaTime / 3600000; // Convert ms to hours
      this.updateSupply(marketCommodity, economics, hoursPassed);
      
      // Update demand based on consumption
      this.updateDemand(marketCommodity, economics, hoursPassed);
      
      // Update price based on supply/demand
      this.updatePrice(marketCommodity, commodity, market);
      
      // Update supply/demand levels
      this.updateSupplyDemandLevels(marketCommodity);
    }

    market.lastUpdate = Date.now();
  }

  /**
   * Update commodity supply based on production
   */
  private updateSupply(marketCommodity: MarketCommodity, economics: StationEconomics, hours: number): void {
    const production = economics.produces.find(p => p.commodityId === marketCommodity.commodityId);
    if (production) {
      const produced = production.baseRate * production.efficiency * economics.economicFactors.efficiency * hours;
      marketCommodity.available += Math.round(produced);
      marketCommodity.productionRate = production.baseRate * production.efficiency;
    }
  }

  /**
   * Update commodity demand based on consumption
   */
  private updateDemand(marketCommodity: MarketCommodity, economics: StationEconomics, hours: number): void {
    const consumption = economics.consumes.find(c => c.commodityId === marketCommodity.commodityId);
    if (consumption) {
      const consumed = consumption.baseRate * hours;
      marketCommodity.demand += Math.round(consumed);
      
      // Station consumes from available supply if possible
      const actualConsumption = Math.min(consumed, marketCommodity.available);
      marketCommodity.available -= Math.round(actualConsumption);
      marketCommodity.available = Math.max(0, marketCommodity.available);
    }
  }

  /**
   * Update price based on supply and demand
   */
  private updatePrice(marketCommodity: MarketCommodity, commodity: Commodity, market: Market): void {
    const supplyDemandRatio = marketCommodity.available / Math.max(1, marketCommodity.demand);
    
    // Price goes down with oversupply, up with shortage
    let priceMultiplier = 1.0;
    if (supplyDemandRatio > 2.0) {
      priceMultiplier = 0.7; // Oversupply
    } else if (supplyDemandRatio > 1.5) {
      priceMultiplier = 0.85;
    } else if (supplyDemandRatio < 0.3) {
      priceMultiplier = 1.8; // Critical shortage
    } else if (supplyDemandRatio < 0.7) {
      priceMultiplier = 1.3; // Shortage
    }
    
    const newPrice = this.calculatePrice(commodity, market) * priceMultiplier;
    
    // Add price history point
    const pricePoint: PricePoint = {
      timestamp: Date.now(),
      price: newPrice,
      volume: 0 // Will be updated when trades occur
    };
    
    marketCommodity.priceHistory.push(pricePoint);
    
    // Keep only last 100 price points
    if (marketCommodity.priceHistory.length > 100) {
      marketCommodity.priceHistory = marketCommodity.priceHistory.slice(-100);
    }
    
    marketCommodity.currentPrice = newPrice;
  }

  /**
   * Update supply and demand level descriptors
   */
  private updateSupplyDemandLevels(marketCommodity: MarketCommodity): void {
    const supplyRatio = marketCommodity.available / Math.max(1, marketCommodity.demand);
    
    // Update supply level
    if (supplyRatio > 3.0) {
      marketCommodity.supplyLevel = 'oversupply';
    } else if (supplyRatio < 0.2) {
      marketCommodity.supplyLevel = 'critical';
    } else if (supplyRatio < 0.7) {
      marketCommodity.supplyLevel = 'shortage';
    } else {
      marketCommodity.supplyLevel = 'normal';
    }
    
    // Update demand level
    if (marketCommodity.demand > marketCommodity.available * 3) {
      marketCommodity.demandLevel = 'desperate';
    } else if (marketCommodity.demand > marketCommodity.available * 1.5) {
      marketCommodity.demandLevel = 'high';
    } else if (marketCommodity.demand < marketCommodity.available * 0.3) {
      marketCommodity.demandLevel = 'none';
    } else if (marketCommodity.demand < marketCommodity.available * 0.7) {
      marketCommodity.demandLevel = 'low';
    } else {
      marketCommodity.demandLevel = 'normal';
    }
  }

  /**
   * Execute a trade transaction with player inventory integration
   */
  executeTradeWithPlayer(stationId: string, commodityId: string, quantity: number, isBuying: boolean, playerManager: any): {
    success: boolean;
    totalCost?: number;
    pricePerUnit?: number;
    error?: string;
  } {
    const market = this.markets.get(stationId);
    if (!market) {
      return { success: false, error: 'Market not found' };
    }

    const marketCommodity = market.commodities.get(commodityId);
    if (!marketCommodity) {
      return { success: false, error: 'Commodity not available' };
    }

    if (isBuying) {
      // Player buying from station
      if (quantity > marketCommodity.available) {
        return { success: false, error: 'Insufficient supply' };
      }
      
      const pricePerUnit = marketCommodity.currentPrice;
      const totalCost = pricePerUnit * quantity;
      
      // Execute the purchase through PlayerManager
      const result = playerManager.executeBuy(stationId, commodityId, quantity, pricePerUnit);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      // Update market state
      marketCommodity.available -= quantity;
      marketCommodity.demand = Math.max(0, marketCommodity.demand - quantity);
      
      // Update price history with trade volume
      if (marketCommodity.priceHistory.length > 0) {
        const lastPrice = marketCommodity.priceHistory[marketCommodity.priceHistory.length - 1];
        lastPrice.volume += quantity;
      }
      
      // Update supply/demand levels
      this.updateSupplyDemandLevels(marketCommodity);
      
      return {
        success: true,
        totalCost,
        pricePerUnit
      };
    } else {
      // Player selling to station
      const pricePerUnit = marketCommodity.currentPrice;
      const totalValue = pricePerUnit * quantity;
      
      // Execute the sale through PlayerManager
      const result = playerManager.executeSell(stationId, commodityId, quantity, pricePerUnit);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      // Update market state
      marketCommodity.available += quantity;
      marketCommodity.demand += Math.floor(quantity * 0.8); // Stations want more when they buy
      
      // Update price history with trade volume
      if (marketCommodity.priceHistory.length > 0) {
        const lastPrice = marketCommodity.priceHistory[marketCommodity.priceHistory.length - 1];
        lastPrice.volume += quantity;
      }
      
      // Update supply/demand levels
      this.updateSupplyDemandLevels(marketCommodity);
      
      return {
        success: true,
        totalCost: totalValue,
        pricePerUnit
      };
    }
  }

  /**
   * Execute a trade transaction (legacy method for compatibility)
   */
  executeTrade(stationId: string, commodityId: string, quantity: number, isBuying: boolean): {
    success: boolean;
    totalCost?: number;
    pricePerUnit?: number;
    error?: string;
  } {
    const market = this.markets.get(stationId);
    if (!market) {
      return { success: false, error: 'Market not found' };
    }

    const marketCommodity = market.commodities.get(commodityId);
    if (!marketCommodity) {
      return { success: false, error: 'Commodity not available' };
    }

    if (isBuying) {
      // Player buying from station
      if (quantity > marketCommodity.available) {
        return { success: false, error: 'Insufficient supply' };
      }
      
      const totalCost = marketCommodity.currentPrice * quantity;
      marketCommodity.available -= quantity;
      
      // Update price history with trade volume
      if (marketCommodity.priceHistory.length > 0) {
        const lastPrice = marketCommodity.priceHistory[marketCommodity.priceHistory.length - 1];
        lastPrice.volume += quantity;
      }
      
      return {
        success: true,
        totalCost,
        pricePerUnit: marketCommodity.currentPrice
      };
    } else {
      // Player selling to station
      const totalValue = marketCommodity.currentPrice * quantity;
      marketCommodity.available += quantity;
      marketCommodity.demand = Math.max(0, marketCommodity.demand - quantity);
      
      // Update price history with trade volume
      if (marketCommodity.priceHistory.length > 0) {
        const lastPrice = marketCommodity.priceHistory[marketCommodity.priceHistory.length - 1];
        lastPrice.volume += quantity;
      }
      
      return {
        success: true,
        totalCost: totalValue,
        pricePerUnit: marketCommodity.currentPrice
      };
    }
  }

  // Helper methods for initialization
  private calculateStationPopulation(station: Station): number {
    const basePopulation = {
      'trade': 50000,
      'mining': 25000,
      'refinery': 60000,
      'manufacturing_hub': 80000,
      'industrial': 80000,
      'military': 30000,
      'research': 15000,
      'luxury': 20000,
      'diplomatic': 10000,
      'entertainment': 35000,
      'pirate': 8000,
      'agricultural': 40000,
      'medical': 18000,
      'exploration': 12000,
      'colonial': 45000,
      'salvage': 15000,
      'observatory': 5000,
      'foundry': 75000,
      'habitat': 90000,
      'security': 25000,
      'prison': 8000,
      'energy': 20000,
      'shipyard': 85000
    };
    
    const base = basePopulation[station.type] || 30000;
    return Math.round(base * (0.5 + Math.random()));
  }

  private determineWealthLevel(station: Station): 'poor' | 'average' | 'wealthy' | 'elite' {
    const random = Math.random();
    if (station.type === 'trade' && random > 0.7) return 'wealthy';
    if (station.type === 'research' && random > 0.8) return 'elite';
    if (station.type === 'mining' && random < 0.3) return 'poor';
    if (random < 0.2) return 'poor';
    if (random > 0.8) return 'wealthy';
    return 'average';
  }

  private generateProduction(station: Station): Production[] {
    // Enhanced production chains for supply chain
    const productions: Production[] = [];
    
    switch (station.type) {
      case 'mining':
        productions.push(
          { commodityId: 'iron-ore', baseRate: 120, efficiency: 1.0, capacity: 250 },
          { commodityId: 'copper-ore', baseRate: 90, efficiency: 1.0, capacity: 180 },
          { commodityId: 'aluminum-ore', baseRate: 80, efficiency: 1.0, capacity: 160 },
          { commodityId: 'titanium-ore', baseRate: 40, efficiency: 1.0, capacity: 80 },
          { commodityId: 'silicon-ore', baseRate: 60, efficiency: 1.0, capacity: 120 },
          { commodityId: 'carbon-crystals', baseRate: 25, efficiency: 1.0, capacity: 50 },
          { commodityId: 'rare-earth-elements', baseRate: 15, efficiency: 1.0, capacity: 30 }
        );
        break;
      case 'refinery':
        productions.push(
          { commodityId: 'steel-alloys', baseRate: 80, efficiency: 1.0, capacity: 160 },
          { commodityId: 'copper-ingots', baseRate: 70, efficiency: 1.0, capacity: 140 },
          { commodityId: 'aluminum-sheets', baseRate: 60, efficiency: 1.0, capacity: 120 },
          { commodityId: 'titanium-plates', baseRate: 30, efficiency: 1.0, capacity: 60 },
          { commodityId: 'silicon-wafers', baseRate: 45, efficiency: 1.0, capacity: 90 }
        );
        break;
      case 'manufacturing_hub':
        productions.push(
          { commodityId: 'advanced-electronics', baseRate: 50, efficiency: 1.0, capacity: 100 },
          { commodityId: 'consumer-goods', baseRate: 70, efficiency: 1.0, capacity: 140 },
          { commodityId: 'ship-components', baseRate: 35, efficiency: 1.0, capacity: 70 },
          { commodityId: 'synthetic-fabrics', baseRate: 60, efficiency: 1.0, capacity: 120 }
        );
        break;
      case 'industrial':
        productions.push(
          { commodityId: 'electronics', baseRate: 40, efficiency: 1.0, capacity: 80 },
          { commodityId: 'machinery', baseRate: 20, efficiency: 1.0, capacity: 40 },
          { commodityId: 'ship-hulls', baseRate: 8, efficiency: 1.0, capacity: 16 },
          { commodityId: 'fusion-drives', baseRate: 12, efficiency: 1.0, capacity: 24 }
        );
        break;
      case 'research':
        productions.push(
          { commodityId: 'quantum-processors', baseRate: 5, efficiency: 1.0, capacity: 10 },
          { commodityId: 'neural-interfaces', baseRate: 3, efficiency: 1.0, capacity: 6 }
        );
        break;
      case 'energy':
        productions.push(
          { commodityId: 'fusion-cells', baseRate: 100, efficiency: 1.0, capacity: 200 },
          { commodityId: 'antimatter-pods', baseRate: 8, efficiency: 1.0, capacity: 16 }
        );
        break;
      case 'agricultural':
        productions.push(
          { commodityId: 'protein-rations', baseRate: 150, efficiency: 1.0, capacity: 300 },
          { commodityId: 'hydroponic-produce', baseRate: 80, efficiency: 1.0, capacity: 160 }
        );
        break;
    }
    
    return productions;
  }

  private generateConsumption(station: Station): Consumption[] {
    // Enhanced consumption patterns for supply chain
    const consumptions: Consumption[] = [
      { commodityId: 'protein-rations', baseRate: 20, necessity: 'essential' },
      { commodityId: 'fusion-cells', baseRate: 10, necessity: 'critical' }
    ];
    
    // Add station-specific consumption based on production chains
    switch (station.type) {
      case 'refinery':
        // Refineries consume raw materials to produce refined materials
        consumptions.push(
          { commodityId: 'iron-ore', baseRate: 100, necessity: 'essential' },
          { commodityId: 'copper-ore', baseRate: 80, necessity: 'essential' },
          { commodityId: 'aluminum-ore', baseRate: 70, necessity: 'essential' },
          { commodityId: 'titanium-ore', baseRate: 35, necessity: 'essential' },
          { commodityId: 'silicon-ore', baseRate: 50, necessity: 'essential' },
          { commodityId: 'carbon-crystals', baseRate: 30, necessity: 'normal' }
        );
        break;
      case 'manufacturing_hub':
        // Manufacturing hubs consume refined materials to produce finished goods
        consumptions.push(
          { commodityId: 'steel-alloys', baseRate: 60, necessity: 'essential' },
          { commodityId: 'copper-ingots', baseRate: 50, necessity: 'essential' },
          { commodityId: 'aluminum-sheets', baseRate: 45, necessity: 'essential' },
          { commodityId: 'silicon-wafers', baseRate: 40, necessity: 'essential' },
          { commodityId: 'synthetic-fabrics', baseRate: 35, necessity: 'normal' }
        );
        break;
      case 'industrial':
        // Industrial stations consume both raw and refined materials
        consumptions.push(
          { commodityId: 'iron-ore', baseRate: 60, necessity: 'essential' },
          { commodityId: 'steel-alloys', baseRate: 40, necessity: 'essential' },
          { commodityId: 'carbon-crystals', baseRate: 25, necessity: 'normal' },
          { commodityId: 'copper-ingots', baseRate: 30, necessity: 'normal' }
        );
        break;
      case 'research':
        // Research stations consume high-tech materials
        consumptions.push(
          { commodityId: 'rare-earth-elements', baseRate: 15, necessity: 'essential' },
          { commodityId: 'electronics', baseRate: 10, necessity: 'normal' },
          { commodityId: 'silicon-wafers', baseRate: 8, necessity: 'normal' },
          { commodityId: 'advanced-electronics', baseRate: 5, necessity: 'normal' }
        );
        break;
      case 'trade':
        // Trade stations consume consumer goods
        consumptions.push(
          { commodityId: 'consumer-goods', baseRate: 40, necessity: 'normal' },
          { commodityId: 'electronics', baseRate: 25, necessity: 'normal' },
          { commodityId: 'synthetic-fabrics', baseRate: 20, necessity: 'normal' }
        );
        break;
      case 'shipyard':
        // Shipyards consume all kinds of ship-building materials
        consumptions.push(
          { commodityId: 'steel-alloys', baseRate: 80, necessity: 'essential' },
          { commodityId: 'titanium-plates', baseRate: 40, necessity: 'essential' },
          { commodityId: 'ship-components', baseRate: 30, necessity: 'essential' },
          { commodityId: 'advanced-electronics', baseRate: 25, necessity: 'essential' },
          { commodityId: 'fusion-drives', baseRate: 15, necessity: 'normal' }
        );
        break;
      case 'mining':
        // Mining stations consume equipment and energy
        consumptions.push(
          { commodityId: 'machinery', baseRate: 15, necessity: 'essential' },
          { commodityId: 'electronics', baseRate: 10, necessity: 'normal' }
        );
        break;
    }
    
    return consumptions;
  }

  private getStationTypeModifier(type: string): number {
    const modifiers = {
      'trade': 1.0,
      'mining': 0.7,        // Cheap raw materials
      'refinery': 0.85,     // Moderate prices for processing
      'manufacturing_hub': 1.1, // Expensive finished goods
      'industrial': 0.9,
      'military': 1.1,
      'research': 1.2,
      'shipyard': 1.15,
      'luxury': 1.5,
      'energy': 1.0,
      'agricultural': 0.8
    };
    return modifiers[type as keyof typeof modifiers] || 1.0;
  }

  private calculateStationCredits(station: Station): number {
    const baseCredits = {
      'trade': 1000000,
      'mining': 400000,
      'refinery': 800000,
      'manufacturing_hub': 1200000,
      'industrial': 800000,
      'military': 1200000,
      'research': 600000,
      'luxury': 2000000,
      'diplomatic': 800000,
      'entertainment': 1500000,
      'pirate': 300000,
      'agricultural': 500000,
      'medical': 900000,
      'exploration': 400000,
      'colonial': 600000,
      'salvage': 350000,
      'observatory': 300000,
      'foundry': 1100000,
      'habitat': 700000,
      'security': 800000,
      'prison': 400000,
      'energy': 1300000,
      'shipyard': 1500000
    };
    
    const base = baseCredits[station.type] || 500000;
    return Math.round(base * (0.5 + Math.random()));
  }

  private getAvailableCommodities(_station: Station, system?: {securityLevel: number}): string[] {
    let commodities = Object.keys(COMMODITIES);
    
    const securityLevel = system?.securityLevel ?? 5;
    
    // Filter based on security level and station type
    if (securityLevel >= 8) {
      // High security - no illegal items
      commodities = commodities.filter(id => {
        const commodity = getCommodity(id);
        return commodity && commodity.legalStatus !== 'illegal';
      });
    }
    
    if (securityLevel >= 5) {
      // Medium security - restricted items are rare
      commodities = commodities.filter(id => {
        const commodity = getCommodity(id);
        if (!commodity) return false;
        if (commodity.legalStatus === 'restricted') {
          return Math.random() < 0.3; // 30% chance
        }
        return true;
      });
    }
    
    return commodities;
  }

  private calculateInitialAvailability(commodity: Commodity, station: Station): number {
    const baseAvailability = Math.random() * 100 + 50; // 50-150 units
    
    // Adjust based on station type
    let multiplier = 1.0;
    if (station.type === 'trade') multiplier = 2.0;
    if (station.type === 'industrial' && commodity.category === 'manufactured') multiplier = 1.5;
    if (station.type === 'mining' && commodity.category === 'raw-materials') multiplier = 3.0;
    
    return Math.round(baseAvailability * multiplier);
  }

  private calculateInitialDemand(commodity: Commodity, station: Station): number {
    const baseDemand = Math.random() * 50 + 25; // 25-75 units
    
    // Adjust based on commodity type and station needs
    let multiplier = 1.0;
    if (commodity.category === 'food') multiplier = 2.0;
    if (commodity.category === 'energy') multiplier = 1.5;
    if (station.type === 'industrial' && commodity.category === 'raw-materials') multiplier = 2.5;
    
    return Math.round(baseDemand * multiplier);
  }

  private getProductionRate(commodityId: string, station: Station): number {
    const production = this.generateProduction(station).find(p => p.commodityId === commodityId);
    return production ? production.baseRate * production.efficiency : 0;
  }

  private updateProduction(deltaTime: number): void {
    // Update production cycles for all stations
    // Production logic is handled in updateMarket method
    // deltaTime parameter is reserved for future production cycle implementation
    void deltaTime;
  }

  private updateEvents(deltaTime: number): void {
    const currentTime = Date.now();
    
    // Remove expired events
    this.activeEvents = this.activeEvents.filter(event => currentTime < event.endTime);
    
    // Randomly generate new events (low probability)
    if (Math.random() < 0.01) { // 1% chance per update
      this.generateRandomEvent();
    }
    
    // deltaTime parameter is reserved for future event timing implementation
    void deltaTime;
  }

  private generateRandomEvent(): void {
    // Simple random event generation - would be expanded
    const eventTypes = ['supply-shortage', 'demand-spike', 'price-crash'] as const;
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const event: EconomicEvent = {
      id: `event-${Date.now()}`,
      type,
      affectedCommodities: [Object.keys(COMMODITIES)[Math.floor(Math.random() * Object.keys(COMMODITIES).length)]],
      affectedStations: Array.from(this.stationEconomics.keys()).slice(0, 3),
      severity: Math.random() * 0.5 + 0.3, // 0.3-0.8
      duration: (4 + Math.random() * 20) * 3600000, // 4-24 hours
      startTime: Date.now(),
      endTime: Date.now() + (4 + Math.random() * 20) * 3600000,
      description: `Market ${type} affecting regional trade`,
      effects: {
        priceMultiplier: type === 'price-crash' ? 0.5 : type === 'demand-spike' ? 1.5 : 1.0,
        availabilityMultiplier: type === 'supply-shortage' ? 0.3 : 1.0
      }
    };
    
    this.activeEvents.push(event);
  }

  private getEventPriceMultiplier(commodityId: string, stationId: string): number {
    let multiplier = 1.0;
    
    for (const event of this.activeEvents) {
      if (event.affectedCommodities.includes(commodityId) && 
          event.affectedStations.includes(stationId)) {
        multiplier *= event.effects.priceMultiplier || 1.0;
      }
    }
    
    return multiplier;
  }

  // Public getters
  getMarket(stationId: string): Market | undefined {
    return this.markets.get(stationId);
  }

  getStationEconomics(stationId: string): StationEconomics | undefined {
    return this.stationEconomics.get(stationId);
  }

  getActiveEvents(): EconomicEvent[] {
    return [...this.activeEvents];
  }

  getAllMarkets(): Map<string, Market> {
    return new Map(this.markets);
  }

  // Test helper method to force updates
  forceUpdate(deltaTime: number): void {
    this.lastUpdateTime = 0; // Force next update to happen
    this.update(deltaTime);
  }
}