import { TradeRoute, RouteAnalysis, Market } from '../types/economy';
import { Station, Sector, StarSystem } from '../types/world';
import { getCommodity } from '../data/commodities';

export class RouteAnalyzer {
  private analysisCache: Map<string, RouteAnalysis> = new Map();
  private cacheExpiry: number = 1800000; // 30 minutes cache
  private worldManager: any = null; // Will be injected to access galaxy data

  constructor() {
    // Cache initialization only
  }

  /**
   * Set the world manager for access to galaxy data and gates
   */
  setWorldManager(worldManager: any): void {
    this.worldManager = worldManager;
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

    // Check if this is a cross-sector route and get gate information
    let gateCost = 0;
    let gateId: string | null = null;
    
    if (!this.areInSameSector(originStation, destinationStation)) {
      const gateRoute = this.findGateRoute(originStation, destinationStation);
      if (gateRoute) {
        gateCost = gateRoute.gateCost;
        gateId = gateRoute.gateId;
      }
    }

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
      
      // Subtract gate costs from profit for cross-sector routes
      const adjustedProfitPerUnit = profitPerUnit - (gateCost / Math.max(1, originCommodity.available));
      
      // Only profitable routes (accounting for gate costs)
      if (adjustedProfitPerUnit <= 0) continue;

      const profitMargin = (adjustedProfitPerUnit / buyPrice) * 100;
      const volume = Math.min(originCommodity.available, destinationCommodity.demand || 100);
      const totalProfit = adjustedProfitPerUnit * volume;
      const profitPerHour = totalProfit / Math.max(1, travelTime);

      // Create route entry
      const route: TradeRoute = {
        id: `${originMarket.stationId}-${destinationMarket.stationId}-${commodityId}`,
        origin: originMarket.stationId,
        destination: destinationMarket.stationId,
        commodity: commodityId,
        profitPerUnit: adjustedProfitPerUnit,
        profitMargin,
        distance,
        travelTime,
        profitPerHour,
        risk,
        volume,
        lastCalculated: Date.now(),
        // Add gate information for cross-sector routes
        ...(gateId && { 
          gateCost, 
          gateId,
          requiresGate: true 
        })
      };

      routes.push(route);
    }

    return routes;
  }

  /**
   * Calculate distance between two stations, considering gates for cross-sector routes
   */
  private calculateDistance(station1: Station, station2: Station): number {
    // If stations are in the same sector, use direct distance
    if (this.areInSameSector(station1, station2)) {
      const dx = (station1.position?.x || 0) - (station2.position?.x || 0);
      const dy = (station1.position?.y || 0) - (station2.position?.y || 0);
      return Math.sqrt(dx * dx + dy * dy);
    }

    // For cross-sector routes, find gate-based distance
    if (this.worldManager) {
      const gateRoute = this.findGateRoute(station1, station2);
      if (gateRoute) {
        return gateRoute.totalDistance;
      }
    }

    // Fallback to direct distance if no gates found
    const dx = (station1.position?.x || 0) - (station2.position?.x || 0);
    const dy = (station1.position?.y || 0) - (station2.position?.y || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate travel time based on distance (in hours)
   */
  private calculateTravelTime(distance: number): number {
    // Base travel time calculation
    const speed = 100; // Average speed of 100 units per hour
    const baseTime = distance / speed;
    
    // Gate travel is instantaneous (no additional time cost)
    // The time cost is just getting to/from the gate
    
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

  /**
   * Check if two stations are in the same sector
   */
  private areInSameSector(station1: Station, station2: Station): boolean {
    if (!this.worldManager) return true; // Assume same sector if no world manager

    const galaxy = this.worldManager.getGalaxy();
    let sector1: Sector | undefined;
    let sector2: Sector | undefined;

    // Find sectors containing these stations
    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        if (system.stations.some((s: Station) => s.id === station1.id)) {
          sector1 = sector;
        }
        if (system.stations.some((s: Station) => s.id === station2.id)) {
          sector2 = sector;
        }
      }
    }

    return sector1?.id === sector2?.id;
  }

  /**
   * Find the best gate route between two stations in different sectors
   */
  private findGateRoute(station1: Station, station2: Station): { 
    totalDistance: number; 
    gateCost: number; 
    gateId: string | null;
  } | null {
    if (!this.worldManager) return null;

    const galaxy = this.worldManager.getGalaxy();
    
    // Find systems containing these stations
    let system1: StarSystem | undefined;
    let system2: StarSystem | undefined;
    let sector1: Sector | undefined;
    let sector2: Sector | undefined;

    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        if (system.stations.some((s: Station) => s.id === station1.id)) {
          system1 = system;
          sector1 = sector;
        }
        if (system.stations.some((s: Station) => s.id === station2.id)) {
          system2 = system;
          sector2 = sector;
        }
      }
    }

    if (!system1 || !system2 || !sector1 || !sector2) return null;
    if (sector1.id === sector2.id) return null; // Same sector, shouldn't use gates

    // Find a gate that can take us to the destination sector
    let bestRoute: { totalDistance: number; gateCost: number; gateId: string } | null = null;

    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        for (const gate of system.gates) {
          if (gate.destinationSectorId === sector2.id && gate.isActive) {
            // Calculate total distance: station1 → gate → destination system → station2
            const distanceToGate = this.calculateDirectDistance(station1.position, gate.position);
            const distanceFromGate = this.calculateDirectDistance(
              this.findSystemById(gate.destinationSystemId || sector2.systems[0]?.id)?.position || { x: 0, y: 0, z: 0 },
              station2.position
            );
            
            const totalDistance = distanceToGate + distanceFromGate;
            
            if (!bestRoute || totalDistance < bestRoute.totalDistance) {
              bestRoute = {
                totalDistance,
                gateCost: gate.energyCost,
                gateId: gate.id
              };
            }
          }
        }
      }
    }

    return bestRoute;
  }

  /**
   * Calculate direct distance between two coordinate points
   */
  private calculateDirectDistance(pos1: { x: number; y: number; z?: number }, pos2: { x: number; y: number; z?: number }): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Find system by ID across all sectors
   */
  private findSystemById(systemId?: string): StarSystem | undefined {
    if (!this.worldManager || !systemId) return undefined;

    const galaxy = this.worldManager.getGalaxy();
    for (const sector of galaxy.sectors) {
      const system = sector.systems.find((s: StarSystem) => s.id === systemId);
      if (system) return system;
    }
    return undefined;
  }
}