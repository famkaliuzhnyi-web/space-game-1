import { describe, it, expect, beforeEach } from 'vitest';
import { FactionManager } from '../systems/FactionManager';
import { FactionReputation } from '../types/player';

describe('Enhanced FactionManager (Phase 4.2)', () => {
  let factionManager: FactionManager;
  let playerReputation: Map<string, FactionReputation>;

  beforeEach(() => {
    factionManager = new FactionManager();
    playerReputation = factionManager.initializePlayerReputation();
  });

  describe('Enhanced Faction Properties', () => {
    it('should have enhanced faction data with relationships and territories', () => {
      const factions = factionManager.getFactions();
      const raijinCorp = factions.find(f => f.id === 'raijin-corp');
      
      expect(raijinCorp).toBeDefined();
      expect(raijinCorp?.influence).toBeDefined();
      expect(raijinCorp?.relationships).toBeDefined();
      expect(raijinCorp?.territories).toBeDefined();
      expect(raijinCorp?.specializations).toBeDefined();
      
      expect(raijinCorp?.territories.length).toBeGreaterThan(0);
      expect(raijinCorp?.specializations).toContain('Military Technology');
    });

    it('should have faction relationships defined', () => {
      const factions = factionManager.getFactions();
      const raijinCorp = factions.find(f => f.id === 'raijin-corp');
      
      expect(raijinCorp?.relationships['pirates']).toBe(-0.8); // Opposed
      expect(raijinCorp?.relationships['bellator-corp']).toBe(0.7); // Allied
    });
  });

  describe('Faction Relationships', () => {
    it('should initialize player faction relationships', () => {
      const relationship = factionManager.getFactionRelationship('raijin-corp');
      
      expect(relationship).toBeDefined();
      expect(relationship?.factionId).toBe('raijin-corp');
      expect(relationship?.trustLevel).toBe(50);
      expect(relationship?.accessLevel).toBe(1);
      expect(relationship?.influence).toBe(0);
      expect(relationship?.specialPrivileges).toEqual([]);
      expect(relationship?.restrictions).toEqual([]);
    });

    it('should update relationships when reputation changes', () => {
      const initialRelationship = factionManager.getFactionRelationship('raijin-corp');
      const initialTrust = initialRelationship?.trustLevel || 0;
      
      factionManager.modifyReputation(
        playerReputation,
        'raijin-corp',
        40, // Large reputation boost
        'Major trade success'
      );

      const updatedRelationship = factionManager.getFactionRelationship('raijin-corp');
      expect(updatedRelationship?.trustLevel).toBeGreaterThan(initialTrust);
      expect(updatedRelationship?.accessLevel).toBeGreaterThan(1);
    });

    it('should grant special privileges at higher access levels', () => {
      // Boost reputation significantly to increase access level
      factionManager.modifyReputation(playerReputation, 'raijin-corp', 50, 'Major achievement');
      factionManager.modifyReputation(playerReputation, 'raijin-corp', 50, 'Another achievement');

      const relationship = factionManager.getFactionRelationship('raijin-corp');
      expect(relationship?.accessLevel).toBeGreaterThan(2);
      expect(relationship?.specialPrivileges.length).toBeGreaterThan(0);
    });

    it('should apply restrictions for low trust', () => {
      // Reduce trust significantly
      factionManager.modifyReputation(playerReputation, 'raijin-corp', -60, 'Major betrayal');
      factionManager.modifyReputation(playerReputation, 'raijin-corp', -40, 'Another betrayal');

      const relationship = factionManager.getFactionRelationship('raijin-corp');
      expect(relationship?.restrictions.length).toBeGreaterThan(0);
      expect(relationship?.restrictions).toContain('limited-contracts');
    });
  });

  describe('Access Control', () => {
    it('should check access to faction content', () => {
      // Initially should have basic access
      expect(factionManager.hasAccess('raijin-corp', 'basic-contracts')).toBe(true);
      expect(factionManager.hasAccess('raijin-corp', 'exclusive-contracts')).toBe(false);

      // Boost reputation to gain higher access
      factionManager.modifyReputation(playerReputation, 'raijin-corp', 50, 'Major trade success');
      factionManager.modifyReputation(playerReputation, 'raijin-corp', 30, 'Another success');

      expect(factionManager.hasAccess('raijin-corp', 'exclusive-contracts')).toBe(true);
    });

    it('should respect restrictions', () => {
      // Reduce trust to get restrictions
      factionManager.modifyReputation(playerReputation, 'raijin-corp', -70, 'Major failure');

      const relationship = factionManager.getFactionRelationship('raijin-corp');
      if (relationship?.restrictions.includes('limited-contracts')) {
        expect(factionManager.hasAccess('raijin-corp', 'limited-contracts')).toBe(false);
      }
    });

    it('should handle invalid faction IDs', () => {
      expect(factionManager.hasAccess('invalid-faction', 'basic-contracts')).toBe(false);
    });
  });

  describe('Territory Influence', () => {
    it('should get faction influence in territories', () => {
      const influences = factionManager.getFactionInfluenceInTerritory('titan-industrial-complex');
      
      expect(influences.length).toBeGreaterThan(0);
      const raijinInfluence = influences.find(i => i.factionId === 'raijin-corp');
      expect(raijinInfluence).toBeDefined();
      expect(raijinInfluence?.influence).toBeGreaterThan(0);
    });

    it('should sort influences by strength', () => {
      const influences = factionManager.getFactionInfluenceInTerritory('titan-industrial-complex');
      
      if (influences.length > 1) {
        // Should be sorted with highest influence first
        expect(influences[0].influence).toBeGreaterThanOrEqual(influences[1].influence);
      }
    });

    it('should return empty array for unknown territories', () => {
      const influences = factionManager.getFactionInfluenceInTerritory('unknown-territory');
      expect(influences).toEqual([]);
    });
  });

  describe('Contact Integration', () => {
    it('should provide access to contact manager', () => {
      const contactManager = factionManager.getContactManager();
      expect(contactManager).toBeDefined();
    });

    it('should create station contacts', () => {
      factionManager.createStationContact('test-station', 'raijin-corp');
      
      const contactManager = factionManager.getContactManager();
      const contacts = contactManager.getContactsAtStation('test-station');
      
      expect(contacts.length).toBe(1);
      expect(contacts[0].factionId).toBe('raijin-corp');
      expect(contacts[0].stationId).toBe('test-station');
    });
  });

  describe('Enhanced Reputation Consequences', () => {
    it('should use faction relationship data for consequences', () => {
      const consequences = factionManager.checkReputationConsequences('raijin-corp', 20);
      
      expect(consequences.length).toBeGreaterThan(0);
      
      // Should find pirates with negative consequence (they're opposed)
      const piratesConsequence = consequences.find(c => c.factionId === 'pirates');
      expect(piratesConsequence).toBeDefined();
      expect(piratesConsequence?.change).toBeLessThan(0);

      // Should find bellator-corp with positive consequence (they're allied)
      const bellatorConsequence = consequences.find(c => c.factionId === 'bellator-corp');
      expect(bellatorConsequence).toBeDefined();
      expect(bellatorConsequence?.change).toBeGreaterThan(0);
    });

    it('should handle factions with no defined relationships', () => {
      // Create a faction with minimal relationships
      const consequences = factionManager.checkReputationConsequences('independents', 10);
      
      // Should still work, just with fewer consequences
      expect(consequences).toBeDefined();
      expect(Array.isArray(consequences)).toBe(true);
    });
  });

  describe('Enhanced Serialization', () => {
    it('should serialize and deserialize enhanced faction data', () => {
      // Make some changes to create state
      factionManager.modifyReputation(playerReputation, 'raijin-corp', 30, 'Test change');
      factionManager.createStationContact('test-station', 'raijin-corp');

      const serialized = factionManager.serialize();
      
      expect(serialized.factionRelationships).toBeDefined();
      expect(serialized.contactManager).toBeDefined();
      expect(serialized.reputationHistory).toBeDefined();

      // Create new faction manager and restore
      const newFactionManager = new FactionManager();
      newFactionManager.deserialize(serialized);

      const restoredRelationship = newFactionManager.getFactionRelationship('raijin-corp');
      expect(restoredRelationship).toBeDefined();
      expect(restoredRelationship?.trustLevel).toBeGreaterThan(50); // Should reflect the reputation change

      const contactManager = newFactionManager.getContactManager();
      const contacts = contactManager.getContactsAtStation('test-station');
      expect(contacts.length).toBe(1);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing FactionManager API', () => {
      // All existing methods should still work
      expect(factionManager.getFactions().length).toBe(11);
      expect(factionManager.getFaction('raijin-corp')).toBeDefined();
      expect(factionManager.calculateRank(50)).toBe('Ally');

      const benefits = factionManager.getFactionBenefits(60);
      expect(benefits).toBeDefined();
      expect(benefits.tradingDiscount).toBeGreaterThan(0);

      const history = factionManager.getReputationHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should handle trade completion with enhanced features', () => {
      const changes = factionManager.handleTradeCompletion(
        playerReputation,
        'volans-corp',
        50000
      );

      expect(changes.length).toBeGreaterThan(0);
      
      // Should also update faction relationships
      const relationship = factionManager.getFactionRelationship('volans-corp');
      expect(relationship?.trustLevel).toBeGreaterThan(50);
    });

    it('should handle mission completion with enhanced features', () => {
      const changes = factionManager.handleMissionCompletion(
        playerReputation,
        'mercenaries',
        'delivery',
        true
      );

      expect(changes.length).toBeGreaterThan(0);
      
      // Should also update faction relationships
      const relationship = factionManager.getFactionRelationship('mercenaries');
      expect(relationship?.trustLevel).toBeGreaterThan(50);
    });
  });
});