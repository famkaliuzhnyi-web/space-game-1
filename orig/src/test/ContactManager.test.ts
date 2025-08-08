import { describe, it, expect, beforeEach } from 'vitest';
import { ContactManager, ContactFactory } from '../systems/ContactManager';
import { Contact, CONTACT_ROLES, PERSONALITY_TRAITS } from '../types/contacts';
import { FactionReputation } from '../types/player';

describe('ContactManager', () => {
  let contactManager: ContactManager;
  let playerReputation: Map<string, FactionReputation>;

  beforeEach(() => {
    contactManager = new ContactManager();
    playerReputation = new Map([
      ['traders-guild', { faction: 'traders-guild', standing: 50, rank: 'Ally', missions: 0 }]
    ]);
  });

  describe('Contact Creation', () => {
    it('should create a new contact', () => {
      const contactData = {
        name: 'Test Contact',
        factionId: 'traders-guild',
        stationId: 'test-station',
        role: CONTACT_ROLES[0],
        specialties: ['Trade'],
        personalityTraits: [PERSONALITY_TRAITS[0]],
        services: [],
        biography: 'A test contact'
      };

      const contact = contactManager.meetContact(contactData);

      expect(contact).toBeDefined();
      expect(contact.name).toBe('Test Contact');
      // Trust starts at 10 + greeting interaction (5 * 1.2 with trustworthy trait) = 16
      expect(contact.trustLevel).toBe(16);
      expect(contact.relationship.id).toBe('stranger');
      expect(contact.interactionCount).toBe(1);
    });

    it('should generate unique contact IDs', () => {
      const contactData1 = {
        name: 'Contact One',
        factionId: 'traders-guild',
        stationId: 'test-station',
        role: CONTACT_ROLES[0],
        specialties: ['Trade'],
        personalityTraits: [PERSONALITY_TRAITS[0]],
        services: [],
        biography: 'First contact'
      };

      const contactData2 = {
        name: 'Contact Two',
        factionId: 'traders-guild',
        stationId: 'test-station',
        role: CONTACT_ROLES[1],
        specialties: ['Trade'],
        personalityTraits: [PERSONALITY_TRAITS[1]],
        services: [],
        biography: 'Second contact'
      };

      const contact1 = contactManager.meetContact(contactData1);
      const contact2 = contactManager.meetContact(contactData2);

      expect(contact1.id).not.toBe(contact2.id);
    });
  });

  describe('Contact Interactions', () => {
    let testContact: Contact;

    beforeEach(() => {
      const contactData = {
        name: 'Test Contact',
        factionId: 'traders-guild',
        stationId: 'test-station',
        role: CONTACT_ROLES[0],
        specialties: ['Trade'],
        personalityTraits: [PERSONALITY_TRAITS[0]], // Trustworthy (+0.2 modifier)
        services: [],
        biography: 'A trustworthy contact'
      };
      testContact = contactManager.meetContact(contactData);
    });

    it('should record successful interactions', () => {
      const success = contactManager.recordInteraction(
        testContact.id, 
        'business_deal', 
        'success', 
        10
      );

      expect(success).toBe(true);
      
      const updatedContact = contactManager.getContact(testContact.id);
      expect(updatedContact?.trustLevel).toBeGreaterThan(16); // Starting trust was 16
      expect(updatedContact?.interactionCount).toBe(2); // Initial meeting + this interaction
    });

    it('should apply personality trait modifiers', () => {
      const initialTrust = testContact.trustLevel;
      
      contactManager.recordInteraction(
        testContact.id, 
        'favor', 
        'success', 
        10
      );

      const updatedContact = contactManager.getContact(testContact.id);
      // With trustworthy trait (+0.2), trust change should be 10 * 1.2 = 12
      expect(updatedContact?.trustLevel).toBe(initialTrust + 12);
    });

    it('should update relationship levels based on trust', () => {
      // Starting trust is 16, increase to 40+ (Associate level)
      contactManager.recordInteraction(testContact.id, 'favor', 'success', 24); // 24 * 1.2 = ~29, total ~45
      
      let updatedContact = contactManager.getContact(testContact.id);
      expect(updatedContact?.relationship.id).toBe('associate');

      // Increase trust to 80+ (Friend level) 
      contactManager.recordInteraction(testContact.id, 'favor', 'success', 30); // 30 * 1.2 = 36, total ~81
      
      updatedContact = contactManager.getContact(testContact.id);
      expect(updatedContact?.relationship.id).toBe('friend');
    });

    it('should handle failed interactions', () => {
      const initialTrust = testContact.trustLevel; // 16
      
      contactManager.recordInteraction(
        testContact.id, 
        'contract_negotiation', 
        'failure', 
        -5
      );

      const updatedContact = contactManager.getContact(testContact.id);
      expect(updatedContact?.trustLevel).toBeLessThan(initialTrust);
    });
  });

  describe('Contact Services', () => {
    let contactWithServices: Contact;

    beforeEach(() => {
      const serviceContactData = {
        name: 'Service Provider',
        factionId: 'traders-guild',
        stationId: 'test-station',
        role: CONTACT_ROLES[1], // Trade Liaison
        specialties: ['Market Intelligence'],
        personalityTraits: [PERSONALITY_TRAITS[0]],
        services: [
          {
            id: 'market_info',
            name: 'Market Information',
            description: 'Provides market intelligence',
            cost: 1000,
            requirements: [
              { type: 'trust' as const, value: 'trust', minimum: 30 },
              { type: 'reputation' as const, value: 'reputation', minimum: 20 }
            ],
            availability: 'conditional' as const
          },
          {
            id: 'expensive_service',
            name: 'Expensive Service',
            description: 'A costly service',
            cost: 10000,
            requirements: [
              { type: 'credits' as const, value: 'credits', minimum: 10000 }
            ],
            availability: 'limited' as const
          }
        ],
        biography: 'A helpful service provider'
      };

      contactWithServices = contactManager.meetContact(serviceContactData);
    });

    it('should check service availability based on requirements', () => {
      // Initial state - low trust, so market info should not be available
      let canProvide = contactManager.canProvideService(
        contactWithServices.id, 
        'market_info', 
        playerReputation, 
        5000
      );
      expect(canProvide).toBe(false);

      // Increase trust to meet requirements (30 needed, starting from ~10 after meeting)
      contactManager.recordInteraction(contactWithServices.id, 'favor', 'success', 20); // Should reach ~30+ trust
      
      canProvide = contactManager.canProvideService(
        contactWithServices.id, 
        'market_info', 
        playerReputation, 
        5000
      );
      expect(canProvide).toBe(true);
    });

    it('should check credit requirements', () => {
      const canProvide = contactManager.canProvideService(
        contactWithServices.id, 
        'expensive_service', 
        playerReputation, 
        5000 // Not enough credits
      );
      expect(canProvide).toBe(false);

      const canProvideWithCredits = contactManager.canProvideService(
        contactWithServices.id, 
        'expensive_service', 
        playerReputation, 
        15000 // Enough credits
      );
      expect(canProvideWithCredits).toBe(true);
    });

    it('should get available services', () => {
      // Increase trust to meet service requirements
      contactManager.recordInteraction(contactWithServices.id, 'favor', 'success', 20);
      
      const availableServices = contactManager.getAvailableServices(
        contactWithServices.id, 
        playerReputation, 
        15000
      );

      expect(availableServices.length).toBe(2); // Both services should be available
      expect(availableServices.map(s => s.id)).toContain('market_info');
      expect(availableServices.map(s => s.id)).toContain('expensive_service');
    });
  });

  describe('Network Connections', () => {
    let contact1: Contact;
    let contact2: Contact;

    beforeEach(() => {
      const contactData1 = {
        name: 'Contact One',
        factionId: 'traders-guild',
        stationId: 'test-station',
        role: CONTACT_ROLES[0],
        specialties: ['Trade'],
        personalityTraits: [PERSONALITY_TRAITS[0]],
        services: [],
        biography: 'First contact'
      };

      const contactData2 = {
        name: 'Contact Two',
        factionId: 'traders-guild',
        stationId: 'test-station',
        role: CONTACT_ROLES[1],
        specialties: ['Intelligence'],
        personalityTraits: [PERSONALITY_TRAITS[1]],
        services: [],
        biography: 'Second contact'
      };

      contact1 = contactManager.meetContact(contactData1);
      contact2 = contactManager.meetContact(contactData2);
    });

    it('should create network connections between contacts', () => {
      const success = contactManager.createNetworkConnection(contact1.id, contact2.id);
      expect(success).toBe(true);
    });

    it('should handle invalid contact connections', () => {
      const success = contactManager.createNetworkConnection('invalid-id', contact2.id);
      expect(success).toBe(false);
    });
  });

  describe('Contact Queries', () => {
    let contact1: Contact;
    let contact2: Contact;

    beforeEach(() => {
      const contactData1 = {
        name: 'Guild Contact',
        factionId: 'traders-guild',
        stationId: 'guild-station',
        role: CONTACT_ROLES[0],
        specialties: ['Trade'],
        personalityTraits: [PERSONALITY_TRAITS[0]],
        services: [],
        biography: 'Guild member'
      };

      const contactData2 = {
        name: 'Federation Contact',
        factionId: 'earth-federation',
        stationId: 'fed-station',
        role: CONTACT_ROLES[1],
        specialties: ['Military'],
        personalityTraits: [PERSONALITY_TRAITS[1]],
        services: [],
        biography: 'Federation officer'
      };

      contact1 = contactManager.meetContact(contactData1);
      contact2 = contactManager.meetContact(contactData2);
      
      // Improve relationships to test sorting
      contactManager.recordInteraction(contact1.id, 'favor', 'success', 30);
      contactManager.recordInteraction(contact2.id, 'favor', 'success', 10);
    });

    it('should get contacts by faction', () => {
      const guildContacts = contactManager.getContactsForFaction('traders-guild');
      expect(guildContacts.length).toBe(1);
      expect(guildContacts[0].name).toBe('Guild Contact');

      const fedContacts = contactManager.getContactsForFaction('earth-federation');
      expect(fedContacts.length).toBe(1);
      expect(fedContacts[0].name).toBe('Federation Contact');
    });

    it('should get contacts by station', () => {
      const stationContacts = contactManager.getContactsAtStation('guild-station');
      expect(stationContacts.length).toBe(1);
      expect(stationContacts[0].name).toBe('Guild Contact');
    });

    it('should sort contacts by relationship strength', () => {
      const sortedContacts = contactManager.getContactsByRelationship();
      expect(sortedContacts.length).toBe(2);
      // Contact1 should be first (higher trust)
      expect(sortedContacts[0].name).toBe('Guild Contact');
      expect(sortedContacts[1].name).toBe('Federation Contact');
    });

    it('should get recent interactions', () => {
      const recentInteractions = contactManager.getRecentInteractions(contact1.id);
      expect(recentInteractions.length).toBeGreaterThan(0);
      expect(recentInteractions[0].contactId).toBe(contact1.id);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize contact data', () => {
      const contactData = {
        name: 'Test Contact',
        factionId: 'traders-guild',
        stationId: 'test-station',
        role: CONTACT_ROLES[0],
        specialties: ['Trade'],
        personalityTraits: [PERSONALITY_TRAITS[0]],
        services: [],
        biography: 'Test contact'
      };

      const contact = contactManager.meetContact(contactData);
      contactManager.recordInteraction(contact.id, 'favor', 'success', 10);

      const serialized = contactManager.serialize();
      expect(serialized.contacts).toBeDefined();
      expect(serialized.interactions).toBeDefined();

      const newContactManager = new ContactManager();
      newContactManager.deserialize(serialized);

      const restoredContact = newContactManager.getContact(contact.id);
      expect(restoredContact?.name).toBe('Test Contact');
      expect(restoredContact?.trustLevel).toBeGreaterThan(10);
    });
  });
});

describe('ContactFactory', () => {
  describe('Station Contact Creation', () => {
    it('should create default station contacts', () => {
      const contactData = ContactFactory.createStationContact(
        'test-station', 
        'traders-guild', 
        'trade_liaison'
      );

      expect(contactData.name).toBeDefined();
      expect(contactData.factionId).toBe('traders-guild');
      expect(contactData.stationId).toBe('test-station');
      expect(contactData.role.name).toBe('Trade Liaison');
      expect(contactData.specialties.length).toBeGreaterThan(0);
      expect(contactData.personalityTraits.length).toBe(2);
      expect(contactData.biography).toBeDefined();
    });

    it('should create different types of station contacts', () => {
      const commander = ContactFactory.createStationContact(
        'test-station', 
        'security-forces', 
        'commander'
      );

      const quartermaster = ContactFactory.createStationContact(
        'test-station', 
        'industrial-consortium', 
        'quartermaster'
      );

      expect(commander.role.name).toBe('Station Commander');
      expect(quartermaster.role.name).toBe('Quartermaster');
      expect(commander.specialties).not.toEqual(quartermaster.specialties);
    });

    it('should assign appropriate services based on role', () => {
      const tradeContact = ContactFactory.createStationContact(
        'test-station', 
        'traders-guild', 
        'trade_liaison'
      );

      expect(tradeContact.services.length).toBeGreaterThan(0);
    });
  });
});