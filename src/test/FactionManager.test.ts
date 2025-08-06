import { describe, it, expect, beforeEach } from 'vitest';
import { FactionManager } from '../systems/FactionManager';
import { FactionReputation } from '../types/player';

describe('FactionManager', () => {
  let factionManager: FactionManager;
  let playerReputation: Map<string, FactionReputation>;

  beforeEach(() => {
    factionManager = new FactionManager();
    playerReputation = factionManager.initializePlayerReputation();
  });

  describe('Faction Initialization', () => {
    it('should initialize with default factions', () => {
      const factions = factionManager.getFactions();
      expect(factions.length).toBeGreaterThan(0);
      
      const factionIds = factions.map(f => f.id);
      expect(factionIds).toContain('traders-guild');
      expect(factionIds).toContain('earth-federation');
      expect(factionIds).toContain('outer-colonies');
      expect(factionIds).toContain('industrial-consortium');
      expect(factionIds).toContain('security-forces');
    });

    it('should initialize player reputation with all factions', () => {
      expect(playerReputation.size).toBe(5);
      
      const tradersGuildRep = playerReputation.get('traders-guild');
      expect(tradersGuildRep).toBeDefined();
      expect(tradersGuildRep?.standing).toBe(0);
      expect(tradersGuildRep?.rank).toBe('Neutral');
      expect(tradersGuildRep?.missions).toBe(0);
    });
  });

  describe('Reputation Modification', () => {
    it('should modify reputation correctly', () => {
      const result = factionManager.modifyReputation(
        playerReputation,
        'traders-guild',
        25,
        'Trade completion'
      );

      expect(result.success).toBe(true);
      expect(result.newReputation?.standing).toBe(25);
      expect(result.newReputation?.rank).toBe('Friend');
    });

    it('should handle reputation bounds', () => {
      // Test upper bound
      factionManager.modifyReputation(playerReputation, 'traders-guild', 150, 'Test');
      const rep = playerReputation.get('traders-guild');
      expect(rep?.standing).toBe(100);

      // Test lower bound
      factionManager.modifyReputation(playerReputation, 'traders-guild', -250, 'Test');
      const rep2 = playerReputation.get('traders-guild');
      expect(rep2?.standing).toBe(-100);
    });

    it('should reject invalid faction IDs', () => {
      const result = factionManager.modifyReputation(
        playerReputation,
        'invalid-faction',
        10,
        'Test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown faction');
    });
  });

  describe('Rank Calculation', () => {
    it('should calculate ranks correctly', () => {
      expect(factionManager.calculateRank(-85)).toBe('Nemesis');
      expect(factionManager.calculateRank(-65)).toBe('Hated');
      expect(factionManager.calculateRank(-45)).toBe('Hostile');
      expect(factionManager.calculateRank(-25)).toBe('Enemy');
      expect(factionManager.calculateRank(-10)).toBe('Disliked');
      expect(factionManager.calculateRank(0)).toBe('Neutral');
      expect(factionManager.calculateRank(10)).toBe('Liked');
      expect(factionManager.calculateRank(25)).toBe('Friend');
      expect(factionManager.calculateRank(45)).toBe('Ally');
      expect(factionManager.calculateRank(65)).toBe('Champion');
      expect(factionManager.calculateRank(85)).toBe('Hero');
    });
  });

  describe('Faction Benefits', () => {
    it('should provide benefits based on reputation', () => {
      const neutralBenefits = factionManager.getFactionBenefits(0);
      expect(neutralBenefits.tradingDiscount).toBe(0);
      expect(neutralBenefits.serviceDiscount).toBe(0);
      expect(neutralBenefits.contractAccess).toHaveLength(0);

      const friendBenefits = factionManager.getFactionBenefits(25);
      expect(friendBenefits.tradingDiscount).toBeGreaterThan(0);
      expect(friendBenefits.serviceDiscount).toBeGreaterThan(0);

      const allyBenefits = factionManager.getFactionBenefits(45);
      expect(allyBenefits.contractAccess).toContain('priority-contracts');

      const heroBenefits = factionManager.getFactionBenefits(85);
      expect(heroBenefits.contractAccess).toContain('legendary-contracts');
      expect(heroBenefits.equipmentAccess).toContain('prototype-equipment');
    });
  });

  describe('Reputation Consequences', () => {
    it('should calculate reputation consequences for other factions', () => {
      const consequences = factionManager.checkReputationConsequences(
        'earth-federation',
        20
      );

      expect(consequences.length).toBeGreaterThan(0);
      
      // Earth Federation and Outer Colonies are opposed
      const outerColoniesConsequence = consequences.find(c => c.factionId === 'outer-colonies');
      expect(outerColoniesConsequence).toBeDefined();
      expect(outerColoniesConsequence?.change).toBeLessThan(0);
    });
  });

  describe('Trade Reputation', () => {
    it('should handle trade completion reputation', () => {
      const changes = factionManager.handleTradeCompletion(
        playerReputation,
        'traders-guild',
        50000 // 50k credit trade
      );

      expect(changes.length).toBeGreaterThan(0);
      const primaryChange = changes.find(c => c.factionId === 'traders-guild');
      expect(primaryChange?.change).toBeGreaterThan(0);
      expect(primaryChange?.reason).toContain('Trade completion');
    });

    it('should not give reputation for small trades', () => {
      const changes = factionManager.handleTradeCompletion(
        playerReputation,
        'traders-guild',
        1000 // 1k credit trade
      );

      expect(changes.length).toBe(0);
    });
  });

  describe('Mission Reputation', () => {
    it('should handle successful mission completion', () => {
      const changes = factionManager.handleMissionCompletion(
        playerReputation,
        'traders-guild',
        'delivery',
        true
      );

      expect(changes.length).toBeGreaterThan(0);
      const primaryChange = changes.find(c => c.factionId === 'traders-guild');
      expect(primaryChange?.change).toBeGreaterThan(0);
      expect(primaryChange?.reason).toBe('Mission completed');

      // Check mission count increased
      const rep = playerReputation.get('traders-guild');
      expect(rep?.missions).toBe(1);
    });

    it('should handle mission failure', () => {
      const changes = factionManager.handleMissionCompletion(
        playerReputation,
        'traders-guild',
        'delivery',
        false
      );

      expect(changes.length).toBeGreaterThan(0);
      const primaryChange = changes.find(c => c.factionId === 'traders-guild');
      expect(primaryChange?.change).toBeLessThan(0);
      expect(primaryChange?.reason).toBe('Mission failed');

      // Mission count should not increase on failure
      const rep = playerReputation.get('traders-guild');
      expect(rep?.missions).toBe(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      // Make some changes to create history
      factionManager.modifyReputation(playerReputation, 'traders-guild', 10, 'Test 1');
      factionManager.modifyReputation(playerReputation, 'earth-federation', -5, 'Test 2');

      const serialized = factionManager.serialize();
      expect(serialized.reputationHistory).toHaveLength(2);

      const newFactionManager = new FactionManager();
      newFactionManager.deserialize(serialized);
      
      const history = newFactionManager.getReputationHistory();
      expect(history).toHaveLength(2);
    });
  });

  describe('Reputation History', () => {
    it('should track reputation changes', () => {
      factionManager.modifyReputation(playerReputation, 'traders-guild', 10, 'Test change');
      
      const history = factionManager.getReputationHistory(5);
      expect(history.length).toBe(1);
      expect(history[0].factionId).toBe('traders-guild');
      expect(history[0].change).toBe(10);
      expect(history[0].reason).toBe('Test change');
    });

    it('should limit history results', () => {
      // Create multiple changes
      for (let i = 0; i < 15; i++) {
        factionManager.modifyReputation(playerReputation, 'traders-guild', 1, `Change ${i}`);
      }

      const history = factionManager.getReputationHistory(10);
      expect(history.length).toBe(10);
      
      // Should be most recent first
      expect(history[0].reason).toBe('Change 14');
    });
  });
});