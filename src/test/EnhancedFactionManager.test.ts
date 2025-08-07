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
      const tradersGuild = factions.find(f => f.id === 'traders-guild');
      
      expect(tradersGuild).toBeDefined();
      expect(tradersGuild?.influence).toBeDefined();
      expect(tradersGuild?.relationships).toBeDefined();
      expect(tradersGuild?.territories).toBeDefined();
      expect(tradersGuild?.specializations).toBeDefined();
      
      expect(tradersGuild?.territories.length).toBeGreaterThan(0);
      expect(tradersGuild?.specializations).toContain('Commerce');
    });

    it('should have faction relationships defined', () => {
      const factions = factionManager.getFactions();
      const earthFederation = factions.find(f => f.id === 'earth-federation');
      
      expect(earthFederation?.relationships['outer-colonies']).toBe(-0.5); // Opposed
      expect(earthFederation?.relationships['security-forces']).toBe(0.4); // Allied
    });
  });

  describe('Faction Relationships', () => {
    it('should initialize player faction relationships', () => {
      const relationship = factionManager.getFactionRelationship('traders-guild');
      
      expect(relationship).toBeDefined();
      expect(relationship?.factionId).toBe('traders-guild');
      expect(relationship?.trustLevel).toBe(50);
      expect(relationship?.accessLevel).toBe(1);
      expect(relationship?.influence).toBe(0);
      expect(relationship?.specialPrivileges).toEqual([]);
      expect(relationship?.restrictions).toEqual([]);
    });

    it('should update relationships when reputation changes', () => {
      const initialRelationship = factionManager.getFactionRelationship('traders-guild');
      const initialTrust = initialRelationship?.trustLevel || 0;
      
      factionManager.modifyReputation(
        playerReputation,
        'traders-guild',
        40, // Large reputation boost
        'Major trade success'
      );

      const updatedRelationship = factionManager.getFactionRelationship('traders-guild');
      expect(updatedRelationship?.trustLevel).toBeGreaterThan(initialTrust);
      expect(updatedRelationship?.accessLevel).toBeGreaterThan(1);
    });

    it('should grant special privileges at higher access levels', () => {
      // Boost reputation significantly to increase access level
      factionManager.modifyReputation(playerReputation, 'traders-guild', 50, 'Major achievement');
      factionManager.modifyReputation(playerReputation, 'traders-guild', 50, 'Another achievement');

      const relationship = factionManager.getFactionRelationship('traders-guild');
      expect(relationship?.accessLevel).toBeGreaterThan(2);
      expect(relationship?.specialPrivileges.length).toBeGreaterThan(0);
    });

    it('should apply restrictions for low trust', () => {
      // Reduce trust significantly
      factionManager.modifyReputation(playerReputation, 'traders-guild', -60, 'Major betrayal');
      factionManager.modifyReputation(playerReputation, 'traders-guild', -40, 'Another betrayal');

      const relationship = factionManager.getFactionRelationship('traders-guild');
      expect(relationship?.restrictions.length).toBeGreaterThan(0);
      expect(relationship?.restrictions).toContain('limited-contracts');
    });
  });

  describe('Access Control', () => {
    it('should check access to faction content', () => {
      // Initially should have basic access
      expect(factionManager.hasAccess('traders-guild', 'basic-contracts')).toBe(true);
      expect(factionManager.hasAccess('traders-guild', 'exclusive-contracts')).toBe(false);

      // Boost reputation to gain higher access
      factionManager.modifyReputation(playerReputation, 'traders-guild', 50, 'Major trade success');
      factionManager.modifyReputation(playerReputation, 'traders-guild', 30, 'Another success');

      expect(factionManager.hasAccess('traders-guild', 'exclusive-contracts')).toBe(true);
    });

    it('should respect restrictions', () => {
      // Reduce trust to get restrictions
      factionManager.modifyReputation(playerReputation, 'traders-guild', -70, 'Major failure');

      const relationship = factionManager.getFactionRelationship('traders-guild');
      if (relationship?.restrictions.includes('limited-contracts')) {
        expect(factionManager.hasAccess('traders-guild', 'limited-contracts')).toBe(false);
      }
    });

    it('should handle invalid faction IDs', () => {
      expect(factionManager.hasAccess('invalid-faction', 'basic-contracts')).toBe(false);
    });
  });

  describe('Territory Influence', () => {
    it('should get faction influence in territories', () => {
      const influences = factionManager.getFactionInfluenceInTerritory('trade-hub-1');
      
      expect(influences.length).toBeGreaterThan(0);
      const tradersInfluence = influences.find(i => i.factionId === 'traders-guild');
      expect(tradersInfluence).toBeDefined();
      expect(tradersInfluence?.influence).toBeGreaterThan(0);
    });

    it('should sort influences by strength', () => {
      const influences = factionManager.getFactionInfluenceInTerritory('earth-station');
      
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
      factionManager.createStationContact('test-station', 'traders-guild');
      
      const contactManager = factionManager.getContactManager();
      const contacts = contactManager.getContactsAtStation('test-station');
      
      expect(contacts.length).toBe(1);
      expect(contacts[0].factionId).toBe('traders-guild');
      expect(contacts[0].stationId).toBe('test-station');
    });
  });

  describe('Enhanced Reputation Consequences', () => {
    it('should use faction relationship data for consequences', () => {
      const consequences = factionManager.checkReputationConsequences('earth-federation', 20);
      
      expect(consequences.length).toBeGreaterThan(0);
      
      // Should find outer-colonies with negative consequence (they're opposed)
      const outerColoniesConsequence = consequences.find(c => c.factionId === 'outer-colonies');
      expect(outerColoniesConsequence).toBeDefined();
      expect(outerColoniesConsequence?.change).toBeLessThan(0);

      // Should find security-forces with positive consequence (they're allied)
      const securityConsequence = consequences.find(c => c.factionId === 'security-forces');
      expect(securityConsequence).toBeDefined();
      expect(securityConsequence?.change).toBeGreaterThan(0);
    });

    it('should handle factions with no defined relationships', () => {
      // Create a faction with minimal relationships
      const consequences = factionManager.checkReputationConsequences('security-forces', 10);
      
      // Should still work, just with fewer consequences
      expect(consequences).toBeDefined();
      expect(Array.isArray(consequences)).toBe(true);
    });
  });

  describe('Enhanced Serialization', () => {
    it('should serialize and deserialize enhanced faction data', () => {
      // Make some changes to create state
      factionManager.modifyReputation(playerReputation, 'traders-guild', 30, 'Test change');
      factionManager.createStationContact('test-station', 'traders-guild');

      const serialized = factionManager.serialize();
      
      expect(serialized.factionRelationships).toBeDefined();
      expect(serialized.contactManager).toBeDefined();
      expect(serialized.reputationHistory).toBeDefined();

      // Create new faction manager and restore
      const newFactionManager = new FactionManager();
      newFactionManager.deserialize(serialized);

      const restoredRelationship = newFactionManager.getFactionRelationship('traders-guild');
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
      expect(factionManager.getFactions().length).toBe(5);
      expect(factionManager.getFaction('traders-guild')).toBeDefined();
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
        'traders-guild',
        50000
      );

      expect(changes.length).toBeGreaterThan(0);
      
      // Should also update faction relationships
      const relationship = factionManager.getFactionRelationship('traders-guild');
      expect(relationship?.trustLevel).toBeGreaterThan(50);
    });

    it('should handle mission completion with enhanced features', () => {
      const changes = factionManager.handleMissionCompletion(
        playerReputation,
        'traders-guild',
        'delivery',
        true
      );

      expect(changes.length).toBeGreaterThan(0);
      
      // Should also update faction relationships
      const relationship = factionManager.getFactionRelationship('traders-guild');
      expect(relationship?.trustLevel).toBeGreaterThan(50);
    });
  });
});