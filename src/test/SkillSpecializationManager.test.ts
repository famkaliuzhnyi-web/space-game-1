/**
 * Tests for the SkillSpecializationManager system
 * Validates skill trees, specializations, and character advancement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SkillSpecializationManager } from '../systems/SkillSpecializationManager';
import { CharacterSkills } from '../types/character';

describe('SkillSpecializationManager', () => {
  let skillManager: SkillSpecializationManager;
  let testSkills: CharacterSkills;

  beforeEach(() => {
    skillManager = new SkillSpecializationManager();
    testSkills = {
      trading: 0,
      negotiation: 0,
      economics: 0,
      engineering: 0,
      piloting: 0,
      navigation: 0,
      combat: 0,
      tactics: 0,
      security: 0,
      networking: 0,
      investigation: 0,
      leadership: 0
    };
  });

  describe('Initialization', () => {
    it('should initialize with empty player skill trees', () => {
      const playerTrees = skillManager.getPlayerSkillTrees();
      
      expect(playerTrees.unlockedNodes.size).toBe(0);
      expect(playerTrees.specializations).toHaveLength(0);
      expect(playerTrees.availableSkillPoints).toBe(0);
      expect(playerTrees.totalSkillPointsSpent).toBe(0);
    });

    it('should load predefined skill trees', () => {
      const allTrees = skillManager.getAllSkillTrees();
      
      expect(allTrees.length).toBe(4); // Trading, Technical, Combat, Social
      
      const tradingTree = skillManager.getSkillTree('trading_mastery');
      expect(tradingTree).toBeDefined();
      expect(tradingTree?.name).toBe('Trading Mastery');
      expect(tradingTree?.category).toBe('trading');
      expect(tradingTree?.nodes.length).toBeGreaterThan(0);
    });

    it('should organize trees by category', () => {
      const tradingTrees = skillManager.getSkillTreesByCategory('trading');
      const technicalTrees = skillManager.getSkillTreesByCategory('technical');
      
      expect(tradingTrees).toHaveLength(1);
      expect(technicalTrees).toHaveLength(1);
      expect(tradingTrees[0].category).toBe('trading');
      expect(technicalTrees[0].category).toBe('technical');
    });
  });

  describe('Node Prerequisites', () => {
    it('should check skill requirements correctly', () => {
      // Market Sense requires trading skill 25
      const result = skillManager.canUnlockNode('market_sense', testSkills, 1, {});
      
      expect(result.canUnlock).toBe(false);
      expect(result.missingRequirements).toContain('trading skill must be 25 (currently 0)');
    });

    it('should allow unlocking when requirements are met', () => {
      testSkills.trading = 25;
      
      const result = skillManager.canUnlockNode('market_sense', testSkills, 1, {});
      
      expect(result.canUnlock).toBe(true);
      expect(result.missingRequirements).toHaveLength(0);
    });

    it('should check node requirements for tier 2 nodes', () => {
      testSkills.trading = 40;
      
      // Trade Baron requires Market Sense rank 2
      const result = skillManager.canUnlockNode('trade_baron', testSkills, 1, {});
      
      expect(result.canUnlock).toBe(false);
      expect(result.missingRequirements).toContain('market_sense node must be rank 2 (currently 0)');
    });

    it('should check level and attribute requirements', () => {
      const skillManager = new SkillSpecializationManager();
      
      // Create a test case with level requirement
      const result = skillManager.canUnlockNode('market_sense', { ...testSkills, trading: 30 }, 5, { intelligence: 20 });
      
      expect(result.canUnlock).toBe(true);
    });
  });

  describe('Node Unlocking', () => {
    it('should unlock tier 1 nodes with sufficient skill points', () => {
      testSkills.trading = 25;
      skillManager.addSkillPoints(5);
      
      const notification = skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('node_unlocked');
      expect(notification?.nodeId).toBe('market_sense');
      expect(notification?.newRank).toBe(1);
      expect(notification?.skillPointsSpent).toBe(1); // Tier 1 costs 1 point
      
      const playerTrees = skillManager.getPlayerSkillTrees();
      expect(playerTrees.unlockedNodes.get('market_sense')).toBe(1);
      expect(playerTrees.availableSkillPoints).toBe(4);
      expect(playerTrees.totalSkillPointsSpent).toBe(1);
    });

    it('should not unlock nodes without sufficient skill points', () => {
      testSkills.trading = 25;
      // Don't add any skill points
      
      const notification = skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      expect(notification).toBeNull();
      
      const playerTrees = skillManager.getPlayerSkillTrees();
      expect(playerTrees.unlockedNodes.has('market_sense')).toBe(false);
    });

    it('should allow upgrading nodes to higher ranks', () => {
      testSkills.trading = 25;
      skillManager.addSkillPoints(5);
      
      // Unlock first rank
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      // Upgrade to rank 2
      const notification2 = skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      expect(notification2).toBeDefined();
      expect(notification2?.type).toBe('rank_increased');
      expect(notification2?.newRank).toBe(2);
      
      const playerTrees = skillManager.getPlayerSkillTrees();
      expect(playerTrees.unlockedNodes.get('market_sense')).toBe(2);
    });

    it('should not allow upgrading beyond max rank', () => {
      testSkills.trading = 25;
      skillManager.addSkillPoints(10);
      
      // Unlock to max rank (3 for Market Sense)
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      // Try to upgrade beyond max
      const result = skillManager.canUnlockNode('market_sense', testSkills, 1, {});
      
      expect(result.canUnlock).toBe(false);
      expect(result.missingRequirements).toContain('Already at maximum rank');
    });

    it('should unlock tier 2 nodes when prerequisites are met', () => {
      testSkills.trading = 40;
      skillManager.addSkillPoints(10);
      
      // First unlock Market Sense to rank 2
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      // Now unlock Trade Baron
      const notification = skillManager.unlockNode('trade_baron', testSkills, 1, {});
      
      expect(notification).toBeDefined();
      expect(notification?.nodeId).toBe('trade_baron');
      expect(notification?.skillPointsSpent).toBe(2); // Tier 2 costs 2 points
      
      const playerTrees = skillManager.getPlayerSkillTrees();
      expect(playerTrees.unlockedNodes.get('trade_baron')).toBe(1);
    });
  });

  describe('Enhanced Skills Calculation', () => {
    it('should calculate base skills without bonuses', () => {
      testSkills.trading = 50;
      testSkills.engineering = 30;
      
      const enhanced = skillManager.calculateEnhancedSkills(testSkills);
      
      expect(enhanced.baseSkills.trading).toBe(50);
      expect(enhanced.baseSkills.engineering).toBe(30);
      expect(enhanced.totalSkills.trading).toBe(50);
      expect(enhanced.nodeBonus.trading).toBeUndefined();
      expect(enhanced.activeBonuses).toHaveLength(0);
    });

    it('should apply skill bonuses from unlocked nodes', () => {
      testSkills.trading = 25;
      skillManager.addSkillPoints(5);
      
      // Unlock Market Sense (provides percentage bonus, not skill bonus in this test)
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      const enhanced = skillManager.calculateEnhancedSkills(testSkills);
      
      expect(enhanced.activeBonuses).toHaveLength(1);
      expect(enhanced.activeBonuses[0].type).toBe('percentage');
      expect(enhanced.activeBonuses[0].target).toBe('trade_profit');
      expect(enhanced.activeBonuses[0].value).toBe(2); // 2% per rank, rank 1
    });

    it('should scale bonuses with node rank', () => {
      testSkills.trading = 25;
      skillManager.addSkillPoints(5);
      
      // Unlock Market Sense to rank 3
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      const enhanced = skillManager.calculateEnhancedSkills(testSkills);
      
      expect(enhanced.activeBonuses[0].value).toBe(6); // 2% per rank * 3 ranks = 6%
    });

    it('should combine bonuses from multiple nodes', () => {
      testSkills.trading = 25;
      testSkills.negotiation = 20;
      skillManager.addSkillPoints(10);
      
      // Unlock both Market Sense and Haggling Expert
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('haggling_expert', testSkills, 1, {});
      
      const enhanced = skillManager.calculateEnhancedSkills(testSkills);
      
      expect(enhanced.activeBonuses).toHaveLength(2);
      expect(enhanced.activeBonuses.some(b => b.target === 'trade_profit')).toBe(true);
      expect(enhanced.activeBonuses.some(b => b.target === 'contract_bonus')).toBe(true);
    });
  });

  describe('Specializations', () => {
    it('should start with no unlocked specializations', () => {
      const unlockedSpecs = skillManager.getUnlockedSpecializations();
      const availableSpecs = skillManager.getAvailableSpecializations();
      
      expect(unlockedSpecs).toHaveLength(0);
      expect(availableSpecs.length).toBeGreaterThan(0);
      
      const merchantPrince = availableSpecs.find(s => s.id === 'merchant_prince');
      expect(merchantPrince).toBeDefined();
      expect(merchantPrince?.isUnlocked).toBe(false);
    });

    it('should unlock specializations when requirements are met', () => {
      let specializationUnlocked = false;
      
      skillManager.addEventListener('specialization_unlocked', (notification) => {
        specializationUnlocked = true;
        expect(notification.type).toBe('specialization_unlocked');
        expect(notification.specializationId).toBe('merchant_prince');
      });
      
      // Set up requirements for Merchant Prince
      testSkills.trading = 60;
      testSkills.negotiation = 35;
      skillManager.addSkillPoints(20);
      
      // Unlock prerequisite nodes
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('trade_baron', testSkills, 1, {}); // This requires Market Sense rank 2
      skillManager.unlockNode('trade_baron', testSkills, 1, {}); // Upgrade to rank 2
      
      skillManager.unlockNode('haggling_expert', testSkills, 1, {});
      skillManager.unlockNode('haggling_expert', testSkills, 1, {});
      skillManager.unlockNode('contract_master', testSkills, 1, {}); // This requires Haggling Expert rank 2
      
      expect(specializationUnlocked).toBe(true);
      
      const unlockedSpecs = skillManager.getUnlockedSpecializations();
      expect(unlockedSpecs).toHaveLength(1);
      expect(unlockedSpecs[0].id).toBe('merchant_prince');
      expect(unlockedSpecs[0].isUnlocked).toBe(true);
    });

    it('should provide specialization benefits', () => {
      const availableSpecs = skillManager.getAvailableSpecializations();
      const merchantPrince = availableSpecs.find(s => s.id === 'merchant_prince');
      
      expect(merchantPrince?.benefits).toHaveLength(2);
      expect(merchantPrince?.benefits[0].type).toBe('skill_cap_increase');
      expect(merchantPrince?.benefits[0].target).toBe('trading');
      expect(merchantPrince?.benefits[0].value).toBe(20);
    });
  });

  describe('Skill Point Management', () => {
    it('should add skill points correctly', () => {
      skillManager.addSkillPoints(10);
      
      const playerTrees = skillManager.getPlayerSkillTrees();
      expect(playerTrees.availableSkillPoints).toBe(10);
    });

    it('should deduct skill points when unlocking nodes', () => {
      testSkills.trading = 25;
      skillManager.addSkillPoints(10);
      
      skillManager.unlockNode('market_sense', testSkills, 1, {}); // Costs 1 point (tier 1)
      
      const playerTrees = skillManager.getPlayerSkillTrees();
      expect(playerTrees.availableSkillPoints).toBe(9);
      expect(playerTrees.totalSkillPointsSpent).toBe(1);
    });

    it('should have different costs for different tiers', () => {
      testSkills.trading = 40;
      skillManager.addSkillPoints(20);
      
      // Unlock Market Sense first (tier 1, costs 1)
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      const playerTrees1 = skillManager.getPlayerSkillTrees();
      expect(playerTrees1.totalSkillPointsSpent).toBe(2); // 2 ranks * 1 point each
      
      // Unlock Trade Baron (tier 2, costs 2)
      skillManager.unlockNode('trade_baron', testSkills, 1, {});
      
      const playerTrees2 = skillManager.getPlayerSkillTrees();
      expect(playerTrees2.totalSkillPointsSpent).toBe(4); // 2 + 2 = 4
    });
  });

  describe('Technical Skills', () => {
    it('should unlock technical skill nodes', () => {
      testSkills.engineering = 25;
      skillManager.addSkillPoints(5);
      
      const notification = skillManager.unlockNode('systems_expert', testSkills, 1, {});
      
      expect(notification).toBeDefined();
      expect(notification?.nodeId).toBe('systems_expert');
      
      const enhanced = skillManager.calculateEnhancedSkills(testSkills);
      expect(enhanced.activeBonuses.some(b => b.target === 'maintenance_cost_reduction')).toBe(true);
    });

    it('should unlock master engineer with proper prerequisites', () => {
      testSkills.engineering = 50;
      skillManager.addSkillPoints(20);
      
      // Unlock Systems Expert to rank 3
      skillManager.unlockNode('systems_expert', testSkills, 1, {});
      skillManager.unlockNode('systems_expert', testSkills, 1, {});
      skillManager.unlockNode('systems_expert', testSkills, 1, {});
      
      // Now unlock Master Engineer
      const notification = skillManager.unlockNode('master_engineer', testSkills, 1, {});
      
      expect(notification).toBeDefined();
      expect(notification?.nodeId).toBe('master_engineer');
      
      const enhanced = skillManager.calculateEnhancedSkills(testSkills);
      expect(enhanced.activeBonuses.some(b => b.target === 'advanced_modifications')).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should emit events for node unlocks', () => {
      let eventFired = false;
      let receivedNotification: any = null;
      
      skillManager.addEventListener('skill_advancement', (notification) => {
        eventFired = true;
        receivedNotification = notification;
      });
      
      testSkills.trading = 25;
      skillManager.addSkillPoints(5);
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      expect(eventFired).toBe(true);
      expect(receivedNotification.type).toBe('node_unlocked');
      expect(receivedNotification.nodeId).toBe('market_sense');
    });

    it('should remove event listeners', () => {
      let eventCount = 0;
      const callback = () => { eventCount++; };
      
      skillManager.addEventListener('skill_advancement', callback);
      skillManager.removeEventListener('skill_advancement', callback);
      
      testSkills.trading = 25;
      skillManager.addSkillPoints(5);
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      expect(eventCount).toBe(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize skill tree data', () => {
      testSkills.trading = 25;
      skillManager.addSkillPoints(10);
      
      // Unlock some nodes
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      skillManager.unlockNode('market_sense', testSkills, 1, {});
      
      // Serialize
      const saveData = skillManager.serialize();
      expect(saveData.playerSkillTrees.unlockedNodes.get('market_sense')).toBe(2);
      expect(saveData.playerSkillTrees.totalSkillPointsSpent).toBe(2);
      
      // Create new manager and deserialize
      const newManager = new SkillSpecializationManager();
      newManager.deserialize(saveData);
      
      // Check that data was restored
      const restoredTrees = newManager.getPlayerSkillTrees();
      expect(restoredTrees.unlockedNodes.get('market_sense')).toBe(2);
      expect(restoredTrees.totalSkillPointsSpent).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent nodes gracefully', () => {
      const result = skillManager.canUnlockNode('non_existent_node', testSkills, 1, {});
      
      expect(result.canUnlock).toBe(false);
      expect(result.missingRequirements).toContain('Node not found');
    });

    it('should handle invalid tree IDs', () => {
      const tree = skillManager.getSkillTree('non_existent_tree');
      expect(tree).toBeNull();
    });

    it('should handle empty skill requirements', () => {
      // Test with a node that might have no requirements (unlikely but possible)
      const enhanced = skillManager.calculateEnhancedSkills(testSkills);
      expect(enhanced.baseSkills).toBeDefined();
      expect(enhanced.totalSkills).toBeDefined();
      expect(enhanced.activeBonuses).toHaveLength(0);
    });
  });
});