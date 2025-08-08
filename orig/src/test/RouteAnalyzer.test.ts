import { describe, it, expect, beforeEach } from 'vitest';
import { RouteAnalyzer } from '../systems/RouteAnalyzer';
import { Market, MarketCommodity } from '../types/economy';
import { Station } from '../types/world';

describe('RouteAnalyzer', () => {
  let routeAnalyzer: RouteAnalyzer;
  let mockMarkets: Map<string, Market>;
  let mockStations: Map<string, Station>;

  beforeEach(() => {
    routeAnalyzer = new RouteAnalyzer();

    // Create mock stations
    const station1: Station = {
      id: 'station-1',
      name: 'Station Alpha',
      type: 'trade',
      position: { x: 0, y: 0 },
      faction: 'Earth Federation',
      dockingCapacity: 100,
      services: ['trade', 'refuel', 'repair'],
      description: 'Major trading hub'
    };

    const station2: Station = {
      id: 'station-2',
      name: 'Station Beta',
      type: 'industrial',
      position: { x: 100, y: 0 },
      faction: 'Industrial Alliance',
      dockingCapacity: 50,
      services: ['manufacturing', 'trade'],
      description: 'Industrial production facility'
    };

    mockStations = new Map([
      ['station-1', station1],
      ['station-2', station2]
    ]);

    // Create mock markets
    const commodity1: MarketCommodity = {
      commodityId: 'iron-ore',
      available: 100,
      demand: 50,
      currentPrice: 45,
      priceHistory: [{
        timestamp: Date.now(),
        price: 45,
        volume: 0
      }],
      supplyLevel: 'normal',
      demandLevel: 'normal',
      productionRate: 10,
      restockTime: 12
    };

    const commodity2: MarketCommodity = {
      commodityId: 'iron-ore',
      available: 20,
      demand: 100,
      currentPrice: 65,
      priceHistory: [{
        timestamp: Date.now(),
        price: 65,
        volume: 0
      }],
      supplyLevel: 'shortage',
      demandLevel: 'high',
      productionRate: 0,
      restockTime: 8
    };

    const market1: Market = {
      stationId: 'station-1',
      commodities: new Map([['iron-ore', commodity1]]),
      lastUpdate: Date.now(),
      demandFactors: {
        stationType: 1.0,
        population: 0.8,
        securityLevel: 0.7,
        factionControl: 1.0
      }
    };

    const market2: Market = {
      stationId: 'station-2',
      commodities: new Map([['iron-ore', commodity2]]),
      lastUpdate: Date.now(),
      demandFactors: {
        stationType: 0.9,
        population: 0.6,
        securityLevel: 0.8,
        factionControl: 1.0
      }
    };

    mockMarkets = new Map([
      ['station-1', market1],
      ['station-2', market2]
    ]);
  });

  describe('Route Analysis', () => {
    it('should analyze routes between markets', () => {
      const analysis = routeAnalyzer.analyzeRoutes(mockMarkets, mockStations);
      
      expect(analysis).toBeDefined();
      expect(analysis.routes).toBeDefined();
      expect(analysis.topRoutes).toBeDefined();
      expect(analysis.riskAdjustedRoutes).toBeDefined();
      expect(analysis.updated).toBeGreaterThan(0);
    });

    it('should find profitable routes', () => {
      const analysis = routeAnalyzer.analyzeRoutes(mockMarkets, mockStations);
      
      // Should find a route from station-1 to station-2 for iron-ore (65 - 45 = 20 profit per unit)
      const profitableRoutes = analysis.routes.filter(route => route.profitPerUnit > 0);
      expect(profitableRoutes.length).toBeGreaterThan(0);
      
      const ironOreRoute = profitableRoutes.find(route => 
        route.commodity === 'iron-ore' && 
        route.origin === 'station-1' && 
        route.destination === 'station-2'
      );
      
      expect(ironOreRoute).toBeDefined();
      expect(ironOreRoute!.profitPerUnit).toBe(20); // 65 - 45
      expect(ironOreRoute!.profitMargin).toBeCloseTo(44.44, 1); // (20/45) * 100
    });

    it('should calculate distance and travel time', () => {
      const analysis = routeAnalyzer.analyzeRoutes(mockMarkets, mockStations);
      
      const route = analysis.routes[0];
      if (route) {
        expect(route.distance).toBeGreaterThan(0);
        expect(route.travelTime).toBeGreaterThan(0);
        expect(route.profitPerHour).toBeGreaterThan(0);
      }
    });

    it('should calculate route risk', () => {
      const analysis = routeAnalyzer.analyzeRoutes(mockMarkets, mockStations);
      
      const route = analysis.routes[0];
      if (route) {
        expect(route.risk).toBeGreaterThan(0);
        expect(route.risk).toBeLessThan(1);
      }
    });

    it('should sort top routes by profitability', () => {
      const analysis = routeAnalyzer.analyzeRoutes(mockMarkets, mockStations);
      
      if (analysis.topRoutes.length > 1) {
        for (let i = 1; i < analysis.topRoutes.length; i++) {
          expect(analysis.topRoutes[i-1].profitPerHour).toBeGreaterThanOrEqual(
            analysis.topRoutes[i].profitPerHour
          );
        }
      }
    });

    it('should limit top routes to reasonable number', () => {
      const analysis = routeAnalyzer.analyzeRoutes(mockMarkets, mockStations);
      
      expect(analysis.topRoutes.length).toBeLessThanOrEqual(20);
      expect(analysis.riskAdjustedRoutes.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Route Recommendations', () => {
    it('should get route recommendations for specific commodity', () => {
      const routes = routeAnalyzer.getRouteRecommendations('iron-ore', mockMarkets, mockStations);
      
      expect(routes).toBeDefined();
      expect(Array.isArray(routes)).toBe(true);
      
      routes.forEach(route => {
        expect(route.commodity).toBe('iron-ore');
      });
    });

    it('should get routes from specific station', () => {
      const routes = routeAnalyzer.getRoutesFromStation('station-1', mockMarkets, mockStations);
      
      expect(routes).toBeDefined();
      expect(Array.isArray(routes)).toBe(true);
      
      routes.forEach(route => {
        expect(route.origin).toBe('station-1');
      });
    });

    it('should limit recommendations to reasonable number', () => {
      const commodityRoutes = routeAnalyzer.getRouteRecommendations('iron-ore', mockMarkets, mockStations);
      const stationRoutes = routeAnalyzer.getRoutesFromStation('station-1', mockMarkets, mockStations);
      
      expect(commodityRoutes.length).toBeLessThanOrEqual(10);
      expect(stationRoutes.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Caching', () => {
    it('should cache analysis results', () => {
      const analysis1 = routeAnalyzer.analyzeRoutes(mockMarkets, mockStations);
      const analysis2 = routeAnalyzer.analyzeRoutes(mockMarkets, mockStations);
      
      // Should return the same cached result
      expect(analysis1.updated).toBe(analysis2.updated);
    });

    it('should clear cache when requested', () => {
      routeAnalyzer.analyzeRoutes(mockMarkets, mockStations);
      
      const cachedBefore = routeAnalyzer.getCachedAnalysis();
      expect(cachedBefore).toBeDefined();
      
      routeAnalyzer.clearCache();
      
      const cachedAfter = routeAnalyzer.getCachedAnalysis();
      expect(cachedAfter).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty markets', () => {
      const emptyMarkets = new Map<string, Market>();
      const emptyStations = new Map<string, Station>();
      
      const analysis = routeAnalyzer.analyzeRoutes(emptyMarkets, emptyStations);
      
      expect(analysis.routes).toHaveLength(0);
      expect(analysis.topRoutes).toHaveLength(0);
      expect(analysis.riskAdjustedRoutes).toHaveLength(0);
    });

    it('should handle markets with no profitable routes', () => {
      // Create markets where all prices are the same (no profit)
      const samePriceCommodity: MarketCommodity = {
        commodityId: 'iron-ore',
        available: 100,
        demand: 50,
        currentPrice: 50,
        priceHistory: [{
          timestamp: Date.now(),
          price: 50,
          volume: 0
        }],
        supplyLevel: 'normal',
        demandLevel: 'normal',
        productionRate: 10,
        restockTime: 12
      };

      const market1: Market = {
        stationId: 'station-1',
        commodities: new Map([['iron-ore', samePriceCommodity]]),
        lastUpdate: Date.now(),
        demandFactors: {
          stationType: 1.0,
          population: 0.8,
          securityLevel: 0.7,
          factionControl: 1.0
        }
      };

      const market2: Market = {
        stationId: 'station-2',
        commodities: new Map([['iron-ore', { ...samePriceCommodity }]]),
        lastUpdate: Date.now(),
        demandFactors: {
          stationType: 0.9,
          population: 0.6,
          securityLevel: 0.8,
          factionControl: 1.0
        }
      };

      const markets = new Map([
        ['station-1', market1],
        ['station-2', market2]
      ]);

      const analysis = routeAnalyzer.analyzeRoutes(markets, mockStations);
      
      // Should have no profitable routes
      const profitableRoutes = analysis.routes.filter(route => route.profitPerUnit > 0);
      expect(profitableRoutes).toHaveLength(0);
    });

    it('should handle stations without available commodities', () => {
      // Create a market with zero availability
      const unavailableCommodity: MarketCommodity = {
        commodityId: 'iron-ore',
        available: 0, // No availability
        demand: 100,
        currentPrice: 65,
        priceHistory: [{
          timestamp: Date.now(),
          price: 65,
          volume: 0
        }],
        supplyLevel: 'critical',
        demandLevel: 'desperate',
        productionRate: 0,
        restockTime: 24
      };

      const market1: Market = {
        stationId: 'station-1',
        commodities: new Map([['iron-ore', unavailableCommodity]]),
        lastUpdate: Date.now(),
        demandFactors: {
          stationType: 1.0,
          population: 0.8,
          securityLevel: 0.7,
          factionControl: 1.0
        }
      };

      const markets = new Map([['station-1', market1]]);

      const analysis = routeAnalyzer.analyzeRoutes(markets, mockStations);
      
      // Should have no routes since there's nothing available to buy
      expect(analysis.routes).toHaveLength(0);
    });
  });
});