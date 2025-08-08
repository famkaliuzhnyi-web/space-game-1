import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvestmentManager } from '../systems/InvestmentManager';
import { TimeManager } from '../systems/TimeManager';
import { WorldManager } from '../systems/WorldManager';
import { PlayerManager } from '../systems/PlayerManager';
import { FactionManager } from '../systems/FactionManager';
import { EconomicSystem } from '../systems/EconomicSystem';

// Mock dependencies
const mockTimeManager = {
  getCurrentTimestamp: vi.fn(() => Date.now()),
  getCurrentTime: vi.fn(() => new Date()),
  update: vi.fn()
} as unknown as TimeManager;

const mockWorldManager = {
  getAllStations: vi.fn(() => [
    { 
      id: 'station1', 
      name: 'Test Station', 
      type: 'commercial',
      faction: 'Traders Guild',
      services: ['trade', 'repair']
    },
    { 
      id: 'station2', 
      name: 'Mining Outpost', 
      type: 'industrial',
      faction: 'Industrial Consortium',
      services: ['trade', 'mining']
    }
  ]),
  getSystem: vi.fn(() => ({ controllingFaction: 'Test Faction' })),
  getGalaxy: vi.fn(() => ({ 
    currentPlayerLocation: { systemId: 'test-system' },
    sectors: []
  }))
} as unknown as WorldManager;

const mockPlayerManager = {
  getCredits: vi.fn(() => 100000),
  spendCredits: vi.fn(() => true),
  addCredits: vi.fn(),
  getCurrentStation: vi.fn(() => 'station1'),
  getFactionManager: vi.fn(() => mockFactionManager),
  getReputationForFaction: vi.fn(() => ({ faction: 'Test Faction', standing: 50, rank: 'Neutral', missions: 0 }))
} as unknown as PlayerManager;

const mockFactionManager = {
  getReputation: vi.fn(() => 50),
  modifyReputation: vi.fn(),
  getFactionInfo: vi.fn(() => ({ name: 'Test Faction' }))
} as unknown as FactionManager;

const mockEconomicSystem = {
  getCommodityPrice: vi.fn(() => 100),
  getMarket: vi.fn(() => ({
    commodities: new Map([
      ['electronics', { currentPrice: 100 }],
      ['rare_metals', { currentPrice: 150 }],
      ['food', { currentPrice: 50 }],
      ['medical_supplies', { currentPrice: 200 }],
      ['luxury_goods', { currentPrice: 300 }]
    ])
  })),
  adjustCommodityPrice: vi.fn(),
  update: vi.fn()
} as unknown as EconomicSystem;

describe('InvestmentManager', () => {
  let investmentManager: InvestmentManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations to their default state
    vi.mocked(mockPlayerManager.spendCredits).mockReturnValue(true);
    vi.mocked(mockPlayerManager.getReputationForFaction).mockReturnValue({ faction: 'Test Faction', standing: 50, rank: 'Neutral', missions: 0 });
    vi.mocked(mockEconomicSystem.getCommodityPrice).mockReturnValue(100);
    vi.mocked(mockTimeManager.getCurrentTimestamp).mockReturnValue(Date.now());
    
    investmentManager = new InvestmentManager(
      mockTimeManager,
      mockWorldManager,
      mockPlayerManager,
      mockFactionManager,
      mockEconomicSystem
    );
  });

  describe('Initialization', () => {
    it('should initialize with empty portfolio', () => {
      const portfolio = investmentManager.getPlayerPortfolio();
      expect(portfolio.totalValue).toBe(0);
      expect(portfolio.totalInvested).toBe(0);
      expect(portfolio.investments).toHaveLength(0);
      expect(portfolio.riskLevel).toBe('moderate');
    });

    it('should generate investment opportunities on initialization', () => {
      const investments = investmentManager.getAvailableInvestments();
      expect(investments.length).toBeGreaterThan(0);
    });

    it('should initialize supply chains for commodities', () => {
      const supplyChains = investmentManager.getSupplyChains();
      expect(supplyChains.size).toBeGreaterThan(0);
    });
  });

  describe('Investment Opportunities', () => {
    it('should create station infrastructure investments', () => {
      const investments = investmentManager.getAvailableInvestments();
      const stationInvestments = investments.filter(inv => inv.type === 'station_infrastructure');
      expect(stationInvestments.length).toBeGreaterThan(0);
      
      const investment = stationInvestments[0];
      expect(investment.name).toContain('Infrastructure Development');
      expect(investment.requiredCapital).toBeGreaterThan(0);
      expect(investment.expectedReturn).toBeGreaterThan(0);
      expect(investment.riskLevel).toBeDefined();
    });

    it('should create faction venture investments', () => {
      const investments = investmentManager.getAvailableInvestments();
      const factionInvestments = investments.filter(inv => inv.type === 'faction_venture');
      expect(factionInvestments.length).toBeGreaterThan(0);
      
      const investment = factionInvestments[0];
      expect(investment.faction).toBeDefined();
      expect(investment.expectedReturn).toBeGreaterThan(0.1); // High risk, high reward
    });

    it('should have appropriate risk levels for different investment types', () => {
      const investments = investmentManager.getAvailableInvestments();
      
      const stationInvestments = investments.filter(inv => inv.type === 'station_infrastructure');
      const factionInvestments = investments.filter(inv => inv.type === 'faction_venture');
      
      expect(stationInvestments.some(inv => ['low', 'moderate'].includes(inv.riskLevel))).toBe(true);
      expect(factionInvestments.every(inv => inv.riskLevel === 'high')).toBe(true);
    });
  });

  describe('Making Investments', () => {
    it('should successfully make an investment with sufficient funds', () => {
      const investments = investmentManager.getAvailableInvestments();
      const investment = investments[0];
      const amount = investment.minimumInvestment;
      
      const success = investmentManager.makeInvestment(investment.id, amount);
      expect(success).toBe(true);
      expect(mockPlayerManager.spendCredits).toHaveBeenCalledWith(amount);
      
      const portfolio = investmentManager.getPlayerPortfolio();
      expect(portfolio.investments).toHaveLength(1);
      expect(portfolio.totalInvested).toBe(amount);
    });

    it('should fail investment with insufficient funds', () => {
      vi.mocked(mockPlayerManager.spendCredits).mockReturnValue(false);
      
      const investments = investmentManager.getAvailableInvestments();
      const investment = investments[0];
      const amount = investment.minimumInvestment;
      
      const success = investmentManager.makeInvestment(investment.id, amount);
      expect(success).toBe(false);
      
      const portfolio = investmentManager.getPlayerPortfolio();
      expect(portfolio.investments).toHaveLength(0);
    });

    it('should fail investment with insufficient reputation', () => {
      vi.mocked(mockPlayerManager.getReputationForFaction).mockReturnValue({ faction: 'Test Faction', standing: 0, rank: 'Hostile', missions: 0 });
      
      const investments = investmentManager.getAvailableInvestments();
      const investment = investments[0];
      const amount = investment.minimumInvestment;
      
      const success = investmentManager.makeInvestment(investment.id, amount);
      expect(success).toBe(false);
    });

    it('should validate investment amount limits', () => {
      const investments = investmentManager.getAvailableInvestments();
      const investment = investments[0];
      
      // Too small
      let success = investmentManager.makeInvestment(investment.id, investment.minimumInvestment - 1);
      expect(success).toBe(false);
      
      // Too large
      success = investmentManager.makeInvestment(investment.id, investment.maximumInvestment + 1);
      expect(success).toBe(false);
    });
  });

  describe('Market Speculation', () => {
    it('should have active speculation opportunities', () => {
      const speculations = investmentManager.getActiveSpeculations();
      expect(speculations.length).toBeGreaterThan(0);
    });

    it('should create speculations with proper risk metrics', () => {
      const speculations = investmentManager.getActiveSpeculations();
      const speculation = speculations[0];
      
      expect(speculation.type).toBe('commodity_futures');
      expect(speculation.leverage).toBeGreaterThanOrEqual(1);
      expect(speculation.leverage).toBeLessThanOrEqual(5);
      expect(speculation.riskMetrics.volatility).toBeGreaterThanOrEqual(0);
      expect(speculation.riskMetrics.probabilityOfProfit).toBeGreaterThan(0);
    });

    it('should open speculation positions with sufficient margin', () => {
      const speculations = investmentManager.getActiveSpeculations();
      const speculation = speculations[0];
      const amount = 10000;
      
      const success = investmentManager.openSpeculation(speculation.id, amount);
      expect(success).toBe(true);
      expect(mockPlayerManager.spendCredits).toHaveBeenCalled();
    });
  });

  describe('Supply Chain Management', () => {
    it('should create multi-tier supply chains', () => {
      const supplyChains = investmentManager.getSupplyChains();
      
      for (const [commodity, chain] of supplyChains.entries()) {
        expect(chain.length).toBeGreaterThanOrEqual(2); // At least raw materials and processing
        
        // Check tier ordering
        const sortedByTier = chain.slice().sort((a, b) => a.tier - b.tier);
        expect(chain).toEqual(expect.arrayContaining(sortedByTier));
        
        // Check that higher tiers have suppliers
        const processingNodes = chain.filter(node => node.tier > 0);
        for (const node of processingNodes) {
          expect(node.suppliers.length).toBeGreaterThan(0);
        }
      }
    });

    it('should simulate supply chain disruptions', () => {
      const commodity = 'electronics';
      const chain = investmentManager.getSupplyChains().get(commodity);
      expect(chain).toBeDefined();
      
      const initialEfficiency = chain![0].efficiency;
      
      investmentManager.simulateSupplyDisruption(commodity, 0.5);
      
      // Should have some impact on efficiency
      const newEfficiency = chain![0].efficiency;
      expect(newEfficiency).toBeLessThanOrEqual(initialEfficiency);
    });
  });

  describe('Market Influence', () => {
    it('should calculate market influence based on trading activity', () => {
      const influence = investmentManager.calculateMarketInfluence('station1');
      expect(influence).toBeGreaterThanOrEqual(0);
      expect(influence).toBeLessThanOrEqual(1);
    });

    it('should track market influence for different markets', () => {
      investmentManager.calculateMarketInfluence('station1');
      investmentManager.calculateMarketInfluence('station2');
      
      const influence1 = investmentManager.getMarketInfluence('station1');
      const influence2 = investmentManager.getMarketInfluence('station2');
      
      expect(influence1).toBeGreaterThanOrEqual(0);
      expect(influence2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Economic Warfare', () => {
    it('should validate economic warfare requirements', () => {
      const action = {
        type: 'market_corner' as const,
        targetMarket: 'station1',
        targetCommodity: 'electronics',
        requiredInfluence: 0.1,
        cost: 50000,
        riskLevel: 'high' as const,
        potentialReward: 100000,
        legalConsequences: ['market_manipulation'],
        reputationImpact: { 'Traders Guild': -10 },
        executionTime: 24
      };
      
      // Should fail without sufficient influence
      const success = investmentManager.executeEconomicWarfare(action);
      expect(success).toBe(false);
      
      // Increase market influence and try again
      investmentManager.calculateMarketInfluence('station1');
      // Note: In a real scenario, this would require actual trading history
    });
  });

  describe('Portfolio Management', () => {
    it('should update portfolio metrics correctly', () => {
      const investments = investmentManager.getAvailableInvestments();
      const investment = investments[0];
      const amount = investment.minimumInvestment;
      
      investmentManager.makeInvestment(investment.id, amount);
      
      const portfolio = investmentManager.getPlayerPortfolio();
      expect(portfolio.totalInvested).toBe(amount);
      expect(portfolio.diversificationScore).toBeGreaterThanOrEqual(0);
    });

    it('should track different risk levels in portfolio', () => {
      const investments = investmentManager.getAvailableInvestments();
      
      // Make a low-risk investment
      const lowRiskInvestment = investments.find(inv => inv.riskLevel === 'low');
      if (lowRiskInvestment) {
        investmentManager.makeInvestment(lowRiskInvestment.id, lowRiskInvestment.minimumInvestment);
      }
      
      // Make a high-risk investment  
      const highRiskInvestment = investments.find(inv => inv.riskLevel === 'high');
      if (highRiskInvestment) {
        investmentManager.makeInvestment(highRiskInvestment.id, highRiskInvestment.minimumInvestment);
      }
      
      const portfolio = investmentManager.getPlayerPortfolio();
      expect(portfolio.riskLevel).toBeDefined();
    });
  });

  describe('Update System', () => {
    it('should update investment returns over time', () => {
      const investments = investmentManager.getAvailableInvestments();
      const investment = investments[0];
      
      investmentManager.makeInvestment(investment.id, investment.minimumInvestment);
      
      const portfolioBefore = investmentManager.getPlayerPortfolio();
      const initialReturn = portfolioBefore.investments[0].actualReturn;
      
      // Simulate time passage
      vi.mocked(mockTimeManager.getCurrentTimestamp).mockReturnValue(Date.now() + 24 * 60 * 60 * 1000); // +1 day
      
      investmentManager.updateInvestments();
      
      const portfolioAfter = investmentManager.getPlayerPortfolio();
      const updatedReturn = portfolioAfter.investments[0].actualReturn;
      
      // Returns should have changed (could be positive or negative due to volatility)
      expect(updatedReturn).not.toBe(initialReturn);
    });

    it('should update supply chain efficiency recovery', () => {
      const commodity = 'electronics';
      const chain = investmentManager.getSupplyChains().get(commodity);
      expect(chain).toBeDefined();
      
      // Disrupt supply chain
      investmentManager.simulateSupplyDisruption(commodity, 0.5);
      const disruptedEfficiency = chain![0].efficiency;
      
      // Update system (should recover slightly)
      investmentManager.updateInvestments();
      
      const recoveredEfficiency = chain![0].efficiency;
      expect(recoveredEfficiency).toBeGreaterThanOrEqual(disruptedEfficiency);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize investment data', () => {
      // Make some investments first
      const investments = investmentManager.getAvailableInvestments();
      investmentManager.makeInvestment(investments[0].id, investments[0].minimumInvestment);
      
      const serialized = investmentManager.serialize();
      expect(serialized).toBeDefined();
      expect(serialized.playerPortfolio).toBeDefined();
      expect(serialized.availableInvestments).toBeDefined();
      expect(serialized.supplyChains).toBeDefined();
      
      // Create new manager and deserialize
      const newManager = new InvestmentManager(
        mockTimeManager,
        mockWorldManager,
        mockPlayerManager,
        mockFactionManager,
        mockEconomicSystem
      );
      
      newManager.deserialize(serialized);
      
      const newPortfolio = newManager.getPlayerPortfolio();
      expect(newPortfolio.investments).toHaveLength(1);
      expect(newPortfolio.totalInvested).toBe(investments[0].minimumInvestment);
    });
  });
});