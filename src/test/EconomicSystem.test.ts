import { describe, it, expect, beforeEach } from 'vitest';
import { EconomicSystem } from '../systems/EconomicSystem';
import { Station } from '../types/world';
import { COMMODITIES } from '../data/commodities';

describe('EconomicSystem', () => {
  let economicSystem: EconomicSystem;
  let testStation: Station;
  let testSystem: { securityLevel: number };

  beforeEach(() => {
    economicSystem = new EconomicSystem();
    testStation = {
      id: 'test-station',
      name: 'Test Station',
      type: 'trade',
      position: { x: 100, y: 100 },
      faction: 'Test Faction',
      dockingCapacity: 50,
      services: ['trading', 'refuel'],
      description: 'A test trading station'
    };
    testSystem = { securityLevel: 5 };
  });

  describe('Station Economics Initialization', () => {
    it('should initialize station economics successfully', () => {
      const economics = economicSystem.initializeStationEconomics(testStation, testSystem);
      
      expect(economics).toBeDefined();
      expect(economics.stationId).toBe(testStation.id);
      expect(economics.stationType).toBe(testStation.type);
      expect(economics.population).toBeGreaterThan(0);
      expect(economics.credits).toBeGreaterThan(0);
      expect(economics.market).toBeDefined();
    });

    it('should create different wealth levels', () => {
      const economics1 = economicSystem.initializeStationEconomics(testStation, testSystem);
      const economics2 = economicSystem.initializeStationEconomics({
        ...testStation,
        id: 'test-station-2'
      }, testSystem);
      
      expect(['poor', 'average', 'wealthy', 'elite']).toContain(economics1.wealthLevel);
      expect(['poor', 'average', 'wealthy', 'elite']).toContain(economics2.wealthLevel);
    });

    it('should generate production and consumption patterns', () => {
      const economics = economicSystem.initializeStationEconomics(testStation, testSystem);
      
      expect(economics.produces).toBeDefined();
      expect(economics.consumes).toBeDefined();
      expect(Array.isArray(economics.produces)).toBe(true);
      expect(Array.isArray(economics.consumes)).toBe(true);
    });
  });

  describe('Market Initialization', () => {
    it('should initialize market with commodities', () => {
      economicSystem.initializeStationEconomics(testStation, testSystem);
      const market = economicSystem.getMarket(testStation.id);
      
      expect(market).toBeDefined();
      expect(market!.stationId).toBe(testStation.id);
      expect(market!.commodities.size).toBeGreaterThan(0);
    });

    it('should set initial prices for commodities', () => {
      economicSystem.initializeStationEconomics(testStation, testSystem);
      const market = economicSystem.getMarket(testStation.id);
      
      for (const [commodityId, marketCommodity] of market!.commodities) {
        expect(marketCommodity.commodityId).toBe(commodityId);
        expect(marketCommodity.currentPrice).toBeGreaterThan(0);
        expect(marketCommodity.available).toBeGreaterThanOrEqual(0);
        expect(marketCommodity.demand).toBeGreaterThanOrEqual(0);
        expect(marketCommodity.priceHistory).toHaveLength(1);
      }
    });

    it('should filter illegal commodities in high security systems', () => {
      const highSecuritySystem = { securityLevel: 9 };
      economicSystem.initializeStationEconomics(testStation, highSecuritySystem);
      const market = economicSystem.getMarket(testStation.id);
      
      // Check that no illegal commodities are available
      for (const [commodityId] of market!.commodities) {
        const commodity = COMMODITIES[commodityId];
        expect(commodity.legalStatus).not.toBe('illegal');
      }
    });
  });

  describe('Price Calculation', () => {
    it('should calculate prices based on commodity base price', () => {
      economicSystem.initializeStationEconomics(testStation, testSystem);
      const market = economicSystem.getMarket(testStation.id);
      
      for (const [commodityId, marketCommodity] of market!.commodities) {
        const commodity = COMMODITIES[commodityId];
        // Price should be related to base price (allowing for variations)
        expect(marketCommodity.currentPrice).toBeGreaterThan(commodity.basePrice * 0.1);
        expect(marketCommodity.currentPrice).toBeLessThan(commodity.basePrice * 5.0);
      }
    });

    it('should apply security level pricing for illegal items', () => {
      const lowSecuritySystem = { securityLevel: 2 };
      economicSystem.initializeStationEconomics(testStation, lowSecuritySystem);
      const market = economicSystem.getMarket(testStation.id);
      
      // Find an illegal commodity if available
      for (const [commodityId, marketCommodity] of market!.commodities) {
        const commodity = COMMODITIES[commodityId];
        if (commodity.legalStatus === 'illegal') {
          // Illegal items should be more expensive in any security level
          expect(marketCommodity.currentPrice).toBeGreaterThan(commodity.basePrice);
        }
      }
    });
  });

  describe('Trading Operations', () => {
    beforeEach(() => {
      economicSystem.initializeStationEconomics(testStation, testSystem);
    });

    it('should execute buy transactions successfully', () => {
      const market = economicSystem.getMarket(testStation.id);
      const [commodityId, marketCommodity] = Array.from(market!.commodities.entries())[0];
      const initialAvailable = marketCommodity.available;
      const quantity = Math.min(5, initialAvailable);
      
      if (quantity > 0) {
        const result = economicSystem.executeTrade(testStation.id, commodityId, quantity, true);
        
        expect(result.success).toBe(true);
        expect(result.totalCost).toBeDefined();
        expect(result.pricePerUnit).toBeDefined();
        expect(result.totalCost).toBe(result.pricePerUnit! * quantity);
        
        // Check that available quantity decreased
        const updatedMarketCommodity = market!.commodities.get(commodityId)!;
        expect(updatedMarketCommodity.available).toBe(initialAvailable - quantity);
      }
    });

    it('should execute sell transactions successfully', () => {
      const market = economicSystem.getMarket(testStation.id);
      const [commodityId, marketCommodity] = Array.from(market!.commodities.entries())[0];
      const initialAvailable = marketCommodity.available;
      const quantity = 5;
      
      const result = economicSystem.executeTrade(testStation.id, commodityId, quantity, false);
      
      expect(result.success).toBe(true);
      expect(result.totalCost).toBeDefined();
      expect(result.pricePerUnit).toBeDefined();
      
      // Check that available quantity increased
      const updatedMarketCommodity = market!.commodities.get(commodityId)!;
      expect(updatedMarketCommodity.available).toBe(initialAvailable + quantity);
    });

    it('should reject trades with insufficient supply', () => {
      const market = economicSystem.getMarket(testStation.id);
      const [commodityId, marketCommodity] = Array.from(market!.commodities.entries())[0];
      const excessiveQuantity = marketCommodity.available + 100;
      
      const result = economicSystem.executeTrade(testStation.id, commodityId, excessiveQuantity, true);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient supply');
    });

    it('should reject trades for non-existent commodities', () => {
      const result = economicSystem.executeTrade(testStation.id, 'non-existent-commodity', 1, true);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Commodity not available');
    });

    it('should reject trades for non-existent markets', () => {
      const result = economicSystem.executeTrade('non-existent-station', 'iron-ore', 1, true);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Market not found');
    });
  });

  describe('Market Updates', () => {
    beforeEach(() => {
      economicSystem.initializeStationEconomics(testStation, testSystem);
    });

    it('should update markets over time', async () => {
      const market = economicSystem.getMarket(testStation.id);
      const initialTimestamp = market!.lastUpdate;
      
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Use the test helper to force an update
      (economicSystem as any).forceUpdate(3600000);
      
      const updatedMarket = economicSystem.getMarket(testStation.id);
      expect(updatedMarket!.lastUpdate).toBeGreaterThan(initialTimestamp);
    });

    it('should track price history', () => {
      const market = economicSystem.getMarket(testStation.id);
      const commodityId = Array.from(market!.commodities.keys())[0];
      
      // Use the test helper to force an update
      (economicSystem as any).forceUpdate(3600000);
      
      const marketCommodity = market!.commodities.get(commodityId)!;
      expect(marketCommodity.priceHistory.length).toBeGreaterThan(0);
      
      for (const pricePoint of marketCommodity.priceHistory) {
        expect(pricePoint.timestamp).toBeGreaterThan(0);
        expect(pricePoint.price).toBeGreaterThan(0);
        expect(pricePoint.volume).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Supply and Demand Levels', () => {
    beforeEach(() => {
      economicSystem.initializeStationEconomics(testStation, testSystem);
    });

    it('should calculate supply and demand levels correctly', () => {
      const market = economicSystem.getMarket(testStation.id);
      
      for (const marketCommodity of market!.commodities.values()) {
        expect(['oversupply', 'normal', 'shortage', 'critical']).toContain(marketCommodity.supplyLevel);
        expect(['none', 'low', 'normal', 'high', 'desperate']).toContain(marketCommodity.demandLevel);
      }
    });
  });

  describe('System Integration', () => {
    it('should provide access to all markets', () => {
      economicSystem.initializeStationEconomics(testStation, testSystem);
      
      const station2 = { ...testStation, id: 'test-station-2', name: 'Test Station 2' };
      economicSystem.initializeStationEconomics(station2, testSystem);
      
      const allMarkets = economicSystem.getAllMarkets();
      expect(allMarkets.size).toBe(2);
      expect(allMarkets.has(testStation.id)).toBe(true);
      expect(allMarkets.has(station2.id)).toBe(true);
    });

    it('should track active economic events', () => {
      const events = economicSystem.getActiveEvents();
      expect(Array.isArray(events)).toBe(true);
      // Initially there should be no events
      expect(events.length).toBe(0);
    });

    it('should provide station economics data', () => {
      const economics = economicSystem.initializeStationEconomics(testStation, testSystem);
      const retrievedEconomics = economicSystem.getStationEconomics(testStation.id);
      
      expect(retrievedEconomics).toBeDefined();
      expect(retrievedEconomics).toBe(economics);
    });
  });
});