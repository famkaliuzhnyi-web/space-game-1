import { TradeRoute, RouteAnalysis, Market } from '../types/economy';
import { Station } from '../types/world';
import { getCommodity } from '../data/commodities';

export class RouteAnalyzer {
  private analysisCache: Map<string, RouteAnalysis> = new Map();
  private cacheExpiry: number = 1800000; // 30 minutes cache

  constructor() {
    // Cache initialization only
  }

  /**
   * Analyze all possible trade routes between markets
   */
  analyzeRoutes(
    markets: Map<string, Market>, 
    stations: Map<string, Station>
  ): RouteAnalysis {
    const currentTime = Date.now();
    const cacheKey = this.generateCacheKey(markets);
    
    // Check cache first
    const cached = this.analysisCache.get(cacheKey);
    if (cached && (currentTime - cached.updated) < this.cacheExpiry) {
      return cached;
    }

    console.log('Analyzing trade routes...');
    
    const routes: TradeRoute[] = [];
    const marketArray = Array.from(markets.values());
    
    // Generate all possible route combinations
    for (let i = 0; i < marketArray.length; i++) {
      for (let j = 0; j < marketArray.length; j++) {
        if (i === j) continue; // Skip same station trades
        
        const originMarket = marketArray[i];
        const destinationMarket = marketArray[j];
        const originStation = stations.get(originMarket.stationId);
        const destinationStation = stations.get(destinationMarket.stationId);
        
        if (!originStation || !destinationStation) continue;
        
        // Analyze commodities that can be traded between these stations
        const commodityRoutes = this.analyzeStationPair(
          originMarket, 
          destinationMarket, 
          originStation, 
          destinationStation
        );
        
        routes.push(...commodityRoutes);
      }
    }

    // Sort routes by profitability
    const topRoutes = [...routes]
      .sort((a, b) => b.profitPerHour - a.profitPerHour)
      .slice(0, 20); // Top 20 routes

    // Calculate risk-adjusted routes (profit per hour / risk)
    const riskAdjustedRoutes = [...routes]
      .map(route => ({
        ...route,
        riskAdjustedProfit: route.profitPerHour / Math.max(0.1, route.risk)
      }))
      .sort((a, b) => b.riskAdjustedProfit - a.riskAdjustedProfit)
      .slice(0, 20);

    const analysis: RouteAnalysis = {
      routes,
      topRoutes,
      riskAdjustedRoutes,
      updated: currentTime
    };

    // Cache the result
    this.analysisCache.set(cacheKey, analysis);
    
    console.log(`Route analysis complete: ${routes.length} routes found`);
    return analysis;
  }

  /**
   * Analyze trade opportunities between two specific stations
   */
  private analyzeStationPair(
    originMarket: Market,
    destinationMarket: Market,
    originStation: Station,
    destinationStation: Station
  ): TradeRoute[] {
    const routes: TradeRoute[] = [];
    
    // Calculate distance and travel time between stations
    const distance = this.calculateDistance(originStation, destinationStation);
    const travelTime = this.calculateTravelTime(distance);
    const risk = this.calculateRouteRisk(originStation, destinationStation);

    // Check each commodity that's available at origin and in demand at destination
    for (const [commodityId, originCommodity] of originMarket.commodities) {
      const destinationCommodity = destinationMarket.commodities.get(commodityId);
      if (!destinationCommodity) continue;

      const commodity = getCommodity(commodityId);
      if (!commodity) continue;

      // Only consider routes where we can buy at origin and sell at destination
      if (originCommodity.available <= 0) continue;
      
      const buyPrice = originCommodity.currentPrice;
      const sellPrice = destinationCommodity.currentPrice;
      const profitPerUnit = sellPrice - buyPrice;
      
      // Only profitable routes
      if (profitPerUnit <= 0) continue;

      const profitMargin = (profitPerUnit / buyPrice) * 100;
      const volume = Math.min(originCommodity.available, destinationCommodity.demand || 100);
      const totalProfit = profitPerUnit * volume;
      const profitPerHour = totalProfit / Math.max(1, travelTime);

      // Create route entry
      const route: TradeRoute = {
        id: `${originMarket.stationId}-${destinationMarket.stationId}-${commodityId}`,
        origin: originMarket.stationId,
        destination: destinationMarket.stationId,
        commodity: commodityId,
        profitPerUnit,
        profitMargin,
        distance,
        travelTime,
        profitPerHour,
        risk,
        volume,
        lastCalculated: Date.now()
      };

      routes.push(route);
    }

    return routes;
  }

  /**
   * Calculate distance between two stations (simplified)
   */
  private calculateDistance(station1: Station, station2: Station): number {
    // For now, use a simple distance calculation
    // In a real implementation, this would use actual coordinates
    const dx = (station1.position?.x || 0) - (station2.position?.x || 0);
    const dy = (station1.position?.y || 0) - (station2.position?.y || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate travel time based on distance (in hours)
   */
  private calculateTravelTime(distance: number): number {
    // Assume average speed of 100 units per hour
    const speed = 100;
    const baseTime = distance / speed;
    
    // Add some random variation (±20%)
    const variation = 0.8 + Math.random() * 0.4;
    
    return Math.max(0.5, baseTime * variation); // Minimum 30 minutes
  }

  /**
   * Calculate route risk based on stations and path
   */
  private calculateRouteRisk(station1: Station, station2: Station): number {
    // Base risk calculation (simplified)
    let risk = 0.1; // Base 10% risk
    
    // Higher risk for longer distances
    const distance = this.calculateDistance(station1, station2);
    risk += Math.min(0.3, distance / 1000); // Up to 30% additional risk
    
    // Station type affects risk
    if (station1.type === 'military' || station2.type === 'military') {
      risk -= 0.05; // Military stations are safer
    }
    
    if (station1.type === 'mining' || station2.type === 'mining') {
      risk += 0.1; // Mining stations in dangerous areas
    }

    // Random events and piracy risk
    risk += Math.random() * 0.1;
    
    return Math.max(0.05, Math.min(0.9, risk)); // Keep risk between 5% and 90%
  }

  /**
   * Get route recommendations for a specific commodity
   */
  getRouteRecommendations(
    commodityId: string, 
    markets: Map<string, Market>, 
    stations: Map<string, Station>
  ): TradeRoute[] {
    const analysis = this.analyzeRoutes(markets, stations);
    
    return analysis.topRoutes
      .filter(route => route.commodity === commodityId)
      .slice(0, 10); // Top 10 routes for this commodity
  }

  /**
   * Get best routes from a specific station
   */
  getRoutesFromStation(
    stationId: string, 
    markets: Map<string, Market>, 
    stations: Map<string, Station>
  ): TradeRoute[] {
    const analysis = this.analyzeRoutes(markets, stations);
    
    return analysis.topRoutes
      .filter(route => route.origin === stationId)
      .slice(0, 10); // Top 10 routes from this station
  }

  /**
   * Generate cache key for route analysis
   */
  private generateCacheKey(markets: Map<string, Market>): string {
    // Create a simple hash based on market update times
    const timestamps = Array.from(markets.values())
      .map(market => market.lastUpdate)
      .sort();
    
    return `routes-${timestamps.join('-')}`;
  }

  /**
   * Clear analysis cache (force recalculation)
   */
  clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Get cached analysis if available
   */
  getCachedAnalysis(): RouteAnalysis | null {
    const cached = Array.from(this.analysisCache.values())[0];
    if (cached && (Date.now() - cached.updated) < this.cacheExpiry) {
      return cached;
    }
    return null;
  }
}