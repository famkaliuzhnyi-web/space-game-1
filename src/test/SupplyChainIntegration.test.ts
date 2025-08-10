import { describe, it, expect, beforeEach } from 'vitest';
import { EconomicSystem } from '../systems/EconomicSystem';
import { Station } from '../types/world';

describe('Supply Chain Integration', () => {
  let economicSystem: EconomicSystem;

  // Test stations for supply chain
  const miningStation: Station = {
    id: 'mining-station',
    name: 'Iron Mining Station',
    type: 'mining',
    position: { x: 100, y: 0 },
    faction: 'Asteroid Miners Guild',
    dockingCapacity: 10,
    services: ['refuel', 'repair', 'raw_materials_trading'],
    description: 'A mining station that extracts raw ores'
  };

  const refineryStation: Station = {
    id: 'refinery-station',
    name: 'Ore Processing Refinery',
    type: 'refinery',
    position: { x: 200, y: 0 },
    faction: 'Industrial Consortium',
    dockingCapacity: 8,
    services: ['refuel', 'repair', 'refined_materials_trading'],
    description: 'A refinery that processes raw ores into refined materials'
  };

  const manufacturingStation: Station = {
    id: 'manufacturing-station',
    name: 'Advanced Manufacturing Hub',
    type: 'manufacturing_hub',
    position: { x: 300, y: 0 },
    faction: 'Galactic Manufacturers Union',
    dockingCapacity: 12,
    services: ['refuel', 'repair', 'consumer_goods_trading'],
    description: 'A manufacturing station that creates finished goods'
  };

  beforeEach(() => {
    economicSystem = new EconomicSystem();
  });

  describe('Station Production Chains', () => {
    it('should have mining stations produce raw materials', () => {
      const economics = economicSystem.initializeStationEconomics(miningStation);
      
      expect(economics.produces.length).toBeGreaterThan(0);
      
      const rawMaterialProduction = economics.produces.filter(p => 
        ['iron-ore', 'copper-ore', 'aluminum-ore', 'titanium-ore', 'silicon-ore'].includes(p.commodityId)
      );
      expect(rawMaterialProduction.length).toBeGreaterThan(0);
      
      // Should produce iron ore specifically
      const ironOreProduction = economics.produces.find(p => p.commodityId === 'iron-ore');
      expect(ironOreProduction).toBeDefined();
      expect(ironOreProduction!.baseRate).toBeGreaterThan(0);
    });

    it('should have refineries consume raw materials and produce refined materials', () => {
      const economics = economicSystem.initializeStationEconomics(refineryStation);
      
      // Should consume raw materials
      const rawMaterialConsumption = economics.consumes.filter(c => 
        ['iron-ore', 'copper-ore', 'aluminum-ore', 'titanium-ore', 'silicon-ore'].includes(c.commodityId)
      );
      expect(rawMaterialConsumption.length).toBeGreaterThan(0);
      
      // Should produce refined materials
      const refinedMaterialProduction = economics.produces.filter(p => 
        ['steel-alloys', 'copper-ingots', 'aluminum-sheets', 'titanium-plates', 'silicon-wafers'].includes(p.commodityId)
      );
      expect(refinedMaterialProduction.length).toBeGreaterThan(0);
      
      // Check specific supply chain: consumes iron ore, produces steel alloys
      const ironOreConsumption = economics.consumes.find(c => c.commodityId === 'iron-ore');
      const steelAlloysProduction = economics.produces.find(p => p.commodityId === 'steel-alloys');
      
      expect(ironOreConsumption).toBeDefined();
      expect(steelAlloysProduction).toBeDefined();
    });

    it('should have manufacturing hubs consume refined materials and produce finished goods', () => {
      const economics = economicSystem.initializeStationEconomics(manufacturingStation);
      
      // Should consume refined materials
      const refinedMaterialConsumption = economics.consumes.filter(c => 
        ['steel-alloys', 'copper-ingots', 'aluminum-sheets', 'silicon-wafers'].includes(c.commodityId)
      );
      expect(refinedMaterialConsumption.length).toBeGreaterThan(0);
      
      // Should produce finished goods
      const finishedGoodsProduction = economics.produces.filter(p => 
        ['advanced-electronics', 'consumer-goods', 'ship-components', 'synthetic-fabrics'].includes(p.commodityId)
      );
      expect(finishedGoodsProduction.length).toBeGreaterThan(0);
      
      // Check specific supply chain: consumes steel alloys, produces consumer goods
      const steelAlloysConsumption = economics.consumes.find(c => c.commodityId === 'steel-alloys');
      const consumerGoodsProduction = economics.produces.find(p => p.commodityId === 'consumer-goods');
      
      expect(steelAlloysConsumption).toBeDefined();
      expect(consumerGoodsProduction).toBeDefined();
    });
  });

  describe('Market Pricing', () => {
    it('should have different pricing modifiers for different station types', () => {
      const miningEconomics = economicSystem.initializeStationEconomics(miningStation);
      const refineryEconomics = economicSystem.initializeStationEconomics(refineryStation);
      const manufacturingEconomics = economicSystem.initializeStationEconomics(manufacturingStation);
      
      // Get market demand factors for pricing
      expect(miningEconomics.market.demandFactors.stationType).toBeLessThan(1.0); // Mining should have lower modifier (0.7)
      expect(refineryEconomics.market.demandFactors.stationType).toBeLessThan(1.0); // Refinery should be moderate (0.85)
      expect(manufacturingEconomics.market.demandFactors.stationType).toBeGreaterThan(1.0); // Manufacturing should be higher (1.1)
    });

    it('should create appropriate supply and demand levels', () => {
      const miningEconomics = economicSystem.initializeStationEconomics(miningStation);
      const refineryEconomics = economicSystem.initializeStationEconomics(refineryStation);

      // Mining station should have iron ore available 
      const miningIronOre = miningEconomics.market.commodities.get('iron-ore');
      expect(miningIronOre?.available).toBeGreaterThan(0);

      // Refinery should have demand for iron ore
      const refineryIronOre = refineryEconomics.market.commodities.get('iron-ore');
      expect(refineryIronOre?.demand).toBeGreaterThan(0);
      
      // Refinery should have steel alloys available  
      const refinerySteelAlloys = refineryEconomics.market.commodities.get('steel-alloys');
      expect(refinerySteelAlloys?.available).toBeGreaterThan(0);
    });
  });

  describe('Supply Chain Economics', () => {
    it('should simulate realistic supply chain flow over time', () => {
      const miningEconomics = economicSystem.initializeStationEconomics(miningStation);
      const refineryEconomics = economicSystem.initializeStationEconomics(refineryStation);
      const manufacturingEconomics = economicSystem.initializeStationEconomics(manufacturingStation);

      // Force update to simulate production/consumption cycles
      economicSystem.forceUpdate(3600000); // 1 hour

      // Mining station should have produced more iron ore
      const miningIronOre = miningEconomics.market.commodities.get('iron-ore');
      expect(miningIronOre?.available).toBeGreaterThan(50); // Should have produced some
      
      // Refinery should have produced steel alloys and consumed iron ore
      const refinerySteelAlloys = refineryEconomics.market.commodities.get('steel-alloys');
      expect(refinerySteelAlloys?.available).toBeGreaterThan(0);
      
      // Manufacturing should have produced consumer goods
      const manufacturingConsumerGoods = manufacturingEconomics.market.commodities.get('consumer-goods');
      expect(manufacturingConsumerGoods?.available).toBeGreaterThan(0);
    });

    it('should create appropriate production rates for supply chain', () => {
      const miningEconomics = economicSystem.initializeStationEconomics(miningStation);
      const refineryEconomics = economicSystem.initializeStationEconomics(refineryStation);
      
      // Mining stations should have high production rates for raw materials
      const ironOreProduction = miningEconomics.produces.find(p => p.commodityId === 'iron-ore');
      expect(ironOreProduction?.baseRate).toBeGreaterThanOrEqual(100); // High rate for mining
      
      // Refineries should consume at similar rates to what mining produces
      const ironOreConsumption = refineryEconomics.consumes.find(c => c.commodityId === 'iron-ore');
      expect(ironOreConsumption?.baseRate).toBeGreaterThanOrEqual(80); // Should consume a significant amount
      
      // Refineries should produce refined materials
      const steelAlloysProduction = refineryEconomics.produces.find(p => p.commodityId === 'steel-alloys');
      expect(steelAlloysProduction?.baseRate).toBeGreaterThan(0);
    });
  });

  describe('New Station Types', () => {
    it('should properly categorize refinery as a valid station type', () => {
      expect(refineryStation.type).toBe('refinery');
      const economics = economicSystem.initializeStationEconomics(refineryStation);
      expect(economics.stationType).toBe('refinery');
    });

    it('should properly categorize manufacturing hub as a valid station type', () => {
      expect(manufacturingStation.type).toBe('manufacturing_hub');
      const economics = economicSystem.initializeStationEconomics(manufacturingStation);
      expect(economics.stationType).toBe('manufacturing_hub');
    });
  });
});