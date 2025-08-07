import { 
  Contact, 
  ContactInteraction, 
  SocialNetwork, 
  NetworkEffect, 
  InteractionType, 
  InteractionOutcome,
  CONTACT_ROLES,
  PERSONALITY_TRAITS,
  RELATIONSHIP_LEVELS,
  ContactService
} from '../types/contacts';
import { FactionReputation } from '../types/player';

/**
 * ContactManager handles the personal relationship and contact network system.
 * This extends the basic faction reputation with individual relationships.
 */
export class ContactManager {
  private socialNetwork: SocialNetwork;
  private networkEffects: NetworkEffect[] = [];

  constructor() {
    this.socialNetwork = {
      contacts: new Map(),
      interactions: [],
      networkConnections: new Map()
    };
  }

  /**
   * Meet a new contact for the first time
   */
  meetContact(contactData: Omit<Contact, 'id' | 'metAt' | 'lastInteraction' | 'interactionCount' | 'trustLevel' | 'relationship'>): Contact {
    const contact: Contact = {
      ...contactData,
      id: this.generateContactId(contactData.name, contactData.factionId),
      trustLevel: 10, // Starting trust level
      relationship: RELATIONSHIP_LEVELS[0], // Stranger
      metAt: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 0 // Start at 0, will be incremented by recordInteraction
    };

    this.socialNetwork.contacts.set(contact.id, contact);
    
    // Record the first meeting
    this.recordInteraction(contact.id, 'greeting', 'success', 5);

    console.log(`Met new contact: ${contact.name} (${contact.role.name})`);
    return contact;
  }

  /**
   * Get contact by ID
   */
  getContact(contactId: string): Contact | undefined {
    return this.socialNetwork.contacts.get(contactId);
  }

  /**
   * Get all contacts for a faction
   */
  getContactsForFaction(factionId: string): Contact[] {
    return Array.from(this.socialNetwork.contacts.values())
      .filter(contact => contact.factionId === factionId);
  }

  /**
   * Get all contacts at a specific station
   */
  getContactsAtStation(stationId: string): Contact[] {
    return Array.from(this.socialNetwork.contacts.values())
      .filter(contact => contact.stationId === stationId);
  }

  /**
   * Record an interaction with a contact
   */
  recordInteraction(
    contactId: string, 
    type: InteractionType, 
    outcome: InteractionOutcome, 
    trustChange: number,
    notes?: string
  ): boolean {
    const contact = this.socialNetwork.contacts.get(contactId);
    if (!contact) return false;

    // Apply personality trait modifiers
    const personalityModifier = contact.personalityTraits
      .reduce((sum, trait) => sum + trait.interactionModifier, 0);
    
    const adjustedTrustChange = Math.round(trustChange * (1 + personalityModifier));

    // Update contact
    contact.trustLevel = Math.max(0, Math.min(100, contact.trustLevel + adjustedTrustChange));
    contact.lastInteraction = Date.now();
    contact.interactionCount++;
    contact.relationship = this.calculateRelationshipLevel(contact.trustLevel);

    // Record interaction
    const interaction: ContactInteraction = {
      contactId,
      timestamp: Date.now(),
      type,
      outcome,
      trustChange: adjustedTrustChange,
      notes
    };

    this.socialNetwork.interactions.push(interaction);

    // Apply network effects if this contact is well-connected
    this.applyNetworkEffects(contact, type, outcome, adjustedTrustChange);

    console.log(`Interaction with ${contact.name}: ${type} (${outcome}) - Trust ${adjustedTrustChange > 0 ? '+' : ''}${adjustedTrustChange} (${contact.trustLevel})`);
    return true;
  }

  /**
   * Calculate relationship level based on trust
   */
  private calculateRelationshipLevel(trustLevel: number): typeof RELATIONSHIP_LEVELS[0] {
    // Find the highest relationship level the trust qualifies for
    for (let i = RELATIONSHIP_LEVELS.length - 1; i >= 0; i--) {
      if (trustLevel >= RELATIONSHIP_LEVELS[i].trustThreshold) {
        return RELATIONSHIP_LEVELS[i];
      }
    }
    return RELATIONSHIP_LEVELS[0]; // Default to stranger
  }

  /**
   * Check if a contact can provide a specific service
   */
  canProvideService(contactId: string, serviceId: string, playerReputation: Map<string, FactionReputation>, playerCredits: number): boolean {
    const contact = this.getContact(contactId);
    if (!contact) return false;

    const service = contact.services.find(s => s.id === serviceId);
    if (!service) return false;

    // Check all requirements
    return service.requirements.every(req => {
      switch (req.type) {
        case 'trust':
          return contact.trustLevel >= req.minimum;
        case 'reputation':
          const rep = playerReputation.get(contact.factionId);
          return rep ? rep.standing >= req.minimum : false;
        case 'credits':
          return playerCredits >= req.minimum;
        case 'faction_standing':
          const factionRep = playerReputation.get(req.value);
          return factionRep ? factionRep.standing >= req.minimum : false;
        default:
          return true;
      }
    });
  }

  /**
   * Get available services from a contact
   */
  getAvailableServices(contactId: string, playerReputation: Map<string, FactionReputation>, playerCredits: number): ContactService[] {
    const contact = this.getContact(contactId);
    if (!contact) return [];

    return contact.services.filter(service => 
      this.canProvideService(contactId, service.id, playerReputation, playerCredits)
    );
  }

  /**
   * Create network connections between contacts
   */
  createNetworkConnection(contact1Id: string, contact2Id: string): boolean {
    const contact1 = this.getContact(contact1Id);
    const contact2 = this.getContact(contact2Id);
    
    if (!contact1 || !contact2) return false;

    // Add bidirectional connection
    const connections1 = this.socialNetwork.networkConnections.get(contact1Id) || [];
    const connections2 = this.socialNetwork.networkConnections.get(contact2Id) || [];

    if (!connections1.includes(contact2Id)) {
      connections1.push(contact2Id);
      this.socialNetwork.networkConnections.set(contact1Id, connections1);
    }

    if (!connections2.includes(contact1Id)) {
      connections2.push(contact1Id);
      this.socialNetwork.networkConnections.set(contact2Id, connections2);
    }

    return true;
  }

  /**
   * Apply network effects when interacting with well-connected contacts
   */
  private applyNetworkEffects(contact: Contact, _type: InteractionType, outcome: InteractionOutcome, trustChange: number): void {
    if (contact.role.influence < 6 || Math.abs(trustChange) < 5) return; // Only influential contacts with significant interactions

    const connections = this.socialNetwork.networkConnections.get(contact.id) || [];
    
    connections.forEach(connectionId => {
      const connectedContact = this.getContact(connectionId);
      if (!connectedContact) return;

      // Calculate network effect strength based on the contact's influence and outcome
      let effectStrength = (contact.role.influence / 10) * 0.3; // 30% max effect
      
      if (outcome === 'exceptional') effectStrength *= 1.5;
      else if (outcome === 'failure') effectStrength *= -1;

      const networkTrustChange = Math.round(trustChange * effectStrength);

      if (Math.abs(networkTrustChange) >= 1) {
        // Apply secondary reputation effect
        connectedContact.trustLevel = Math.max(0, Math.min(100, connectedContact.trustLevel + networkTrustChange));
        connectedContact.relationship = this.calculateRelationshipLevel(connectedContact.trustLevel);

        // Create network effect record
        const effect: NetworkEffect = {
          sourceContactId: contact.id,
          targetContactId: connectionId,
          type: trustChange > 0 ? 'recommendation' : 'warning',
          strength: Math.abs(effectStrength),
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        };

        this.networkEffects.push(effect);

        console.log(`Network effect: ${contact.name} influences ${connectedContact.name} (${networkTrustChange > 0 ? '+' : ''}${networkTrustChange} trust)`);
      }
    });
  }

  /**
   * Get recent interactions with a contact
   */
  getRecentInteractions(contactId: string, limit: number = 10): ContactInteraction[] {
    return this.socialNetwork.interactions
      .filter(interaction => interaction.contactId === contactId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get all contacts sorted by relationship strength
   */
  getContactsByRelationship(): Contact[] {
    return Array.from(this.socialNetwork.contacts.values())
      .sort((a, b) => b.trustLevel - a.trustLevel);
  }

  /**
   * Find contacts that can provide introductions to new contacts
   */
  getIntroductionOpportunities(_targetFactionId: string): Contact[] {
    return Array.from(this.socialNetwork.contacts.values())
      .filter(contact => {
        // Must be well-connected and trusted
        if (contact.trustLevel < 60 || contact.role.influence < 7) return false;
        
        // Must have connections
        const connections = this.socialNetwork.networkConnections.get(contact.id) || [];
        return connections.length > 0;
      });
  }

  /**
   * Generate unique contact ID
   */
  private generateContactId(name: string, factionId: string): string {
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString().slice(-6);
    return `${factionId}-${nameSlug}-${timestamp}`;
  }

  /**
   * Clean up expired network effects
   */
  cleanupExpiredEffects(): void {
    const now = Date.now();
    this.networkEffects = this.networkEffects.filter(effect => 
      !effect.expiresAt || effect.expiresAt > now
    );
  }

  /**
   * Enhanced Phase 4.2: Discover contacts through referrals
   */
  discoverContactsViaReferral(existingContactId: string, targetFactionId?: string): Contact[] {
    const existingContact = this.getContact(existingContactId);
    if (!existingContact || existingContact.trustLevel < 40 || !existingContact.stationId) {
      return []; // Need good relationship for referrals and valid station
    }

    const discoveredContacts: Contact[] = [];
    const connectionLimit = Math.floor(existingContact.role.influence / 3); // More influential contacts know more people
    
    for (let i = 0; i < connectionLimit; i++) {
      const contactData = ContactFactory.createStationContact(
        existingContact.stationId,
        targetFactionId || existingContact.factionId,
        this.getRandomContactType()
      );
      
      const newContact = this.meetContact({
        ...contactData,
        biography: `${contactData.biography} Introduced by ${existingContact.name}.`
      });
      
      // Create network connection
      this.createNetworkConnection(existingContactId, newContact.id);
      
      // Referral bonus - start with higher trust
      newContact.trustLevel = Math.min(50, 15 + Math.floor(existingContact.trustLevel * 0.3));
      newContact.relationship = this.calculateRelationshipLevel(newContact.trustLevel);
      
      discoveredContacts.push(newContact);
    }
    
    return discoveredContacts;
  }

  /**
   * Enhanced Phase 4.2: Advanced contact interaction with more outcomes
   */
  performAdvancedInteraction(
    contactId: string,
    interactionType: InteractionType,
    playerSkills?: { charisma?: number; reputation?: number }
  ): { outcome: InteractionOutcome; trustChange: number; unlocked?: string[] } {
    const contact = this.getContact(contactId);
    if (!contact) {
      return { outcome: 'failure', trustChange: 0 };
    }

    // Enhanced interaction calculation with player skills
    let baseChance = this.calculateBaseInteractionChance(contact, interactionType);
    
    if (playerSkills) {
      // Charisma improves all interactions
      if (playerSkills.charisma) {
        baseChance += (playerSkills.charisma - 10) * 2; // Each point above 10 adds 2% chance
      }
      
      // Reputation with contact's faction helps
      if (playerSkills.reputation) {
        baseChance += Math.max(0, playerSkills.reputation / 5); // Positive reputation helps
      }
    }

    // Determine outcome with more possibilities
    const roll = Math.random() * 100;
    let outcome: InteractionOutcome;
    let trustChange = 0;

    if (roll < baseChance * 0.1) {
      outcome = 'exceptional';
      trustChange = this.getBaseTrustChangeForType(interactionType) * 2;
    } else if (roll < baseChance) {
      outcome = 'success';
      trustChange = this.getBaseTrustChangeForType(interactionType);
    } else if (roll < baseChance + 30) {
      outcome = 'neutral';
      trustChange = Math.round(this.getBaseTrustChangeForType(interactionType) * 0.3);
    } else {
      outcome = 'failure';
      trustChange = -Math.abs(Math.round(this.getBaseTrustChangeForType(interactionType) * 0.7));
    }

    // Apply personality modifiers
    const personalityBonus = this.calculatePersonalityBonusForInteraction(contact, interactionType);
    trustChange += personalityBonus;

    // Record the interaction
    this.recordInteraction(contactId, interactionType, outcome, trustChange);

    // Check for unlocked services or opportunities
    const unlocked = this.checkForUnlocks(contact, interactionType, outcome);

    return { outcome, trustChange, unlocked };
  }

  /**
   * Calculate base interaction chance (helper method)
   */
  private calculateBaseInteractionChance(contact: Contact, interactionType: InteractionType): number {
    let baseChance = 50; // Start with 50% base chance
    
    // Adjust based on current relationship level
    switch (contact.relationship.id) {
      case 'hostile': baseChance = 10; break;
      case 'enemy': baseChance = 20; break;
      case 'disliked': baseChance = 30; break;
      case 'neutral': baseChance = 50; break;
      case 'liked': baseChance = 70; break;
      case 'friend': baseChance = 80; break;
      case 'ally': baseChance = 90; break;
      default: baseChance = 50;
    }
    
    // Adjust based on interaction type difficulty
    switch (interactionType) {
      case 'greeting': baseChance += 20; break;
      case 'social_chat': baseChance += 10; break;
      case 'favor': baseChance -= 10; break;
      case 'business_deal': baseChance -= 5; break;
      case 'contract_negotiation': baseChance -= 15; break;
    }
    
    return Math.max(5, Math.min(95, baseChance)); // Keep between 5-95%
  }

  /**
   * Get base trust change for interaction type (helper method)
   */
  private getBaseTrustChangeForType(interactionType: InteractionType): number {
    switch (interactionType) {
      case 'greeting': return 3;
      case 'social_chat': return 2;
      case 'favor': return 8;
      case 'business_deal': return 6;
      case 'contract_negotiation': return 10;
      default: return 3;
    }
  }

  /**
   * Calculate personality bonus for interaction (helper method)
   */
  private calculatePersonalityBonusForInteraction(contact: Contact, interactionType: InteractionType): number {
    let bonus = 0;
    
    contact.personalityTraits.forEach(trait => {
      switch (trait.id) {
        case 'friendly':
          if (interactionType === 'greeting' || interactionType === 'social_chat') {
            bonus += trait.interactionModifier * 10; // Convert to trust points
          }
          break;
        case 'business-minded':
          if (interactionType === 'business_deal' || interactionType === 'contract_negotiation') {
            bonus += trait.interactionModifier * 10;
          }
          break;
        case 'suspicious':
          bonus += trait.interactionModifier * 10; // Usually negative
          break;
      }
    });
    
    return Math.round(bonus);
  }

  /**
   * Enhanced Phase 4.2: Check for service/opportunity unlocks
   */
  private checkForUnlocks(contact: Contact, interactionType: InteractionType, outcome: InteractionOutcome): string[] {
    const unlocked: string[] = [];
    
    // High-trust interactions can unlock special services
    if (contact.trustLevel >= 60 && outcome === 'exceptional') {
      switch (contact.role.id) {
        case 'station_commander':
          if (interactionType === 'favor') {
            unlocked.push('priority_docking', 'station_intel');
          }
          break;
        case 'trade_liaison':
          if (interactionType === 'business_deal') {
            unlocked.push('bulk_discounts', 'market_intel');
          }
          break;
        case 'quartermaster':
          if (interactionType === 'favor') {
            unlocked.push('equipment_access', 'maintenance_priority');
          }
          break;
      }
    }
    
    // Network connections can be unlocked
    if (contact.trustLevel >= 40 && outcome !== 'failure') {
      const connections = this.socialNetwork.networkConnections.get(contact.id) || [];
      if (connections.length === 0) {
        unlocked.push('network_introductions');
      }
    }
    
    return unlocked;
  }

  /**
   * Enhanced Phase 4.2: Get random contact type for variety
   */
  private getRandomContactType(): 'commander' | 'trade_liaison' | 'quartermaster' | 'dock_supervisor' {
    const types = ['commander', 'trade_liaison', 'quartermaster', 'dock_supervisor'] as const;
    const weights = [0.15, 0.4, 0.25, 0.2]; // Trade liaisons are most common
    
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < types.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        return types[i];
      }
    }
    
    return 'trade_liaison';
  }

  /**
   * Serialize contact manager state
   */
  serialize(): any {
    return {
      contacts: Array.from(this.socialNetwork.contacts.entries()),
      interactions: this.socialNetwork.interactions,
      networkConnections: Array.from(this.socialNetwork.networkConnections.entries()),
      networkEffects: this.networkEffects
    };
  }

  /**
   * Deserialize contact manager state
   */
  deserialize(data: any): void {
    if (data?.contacts) {
      this.socialNetwork.contacts = new Map(data.contacts);
    }
    if (data?.interactions) {
      this.socialNetwork.interactions = data.interactions;
    }
    if (data?.networkConnections) {
      this.socialNetwork.networkConnections = new Map(data.networkConnections);
    }
    if (data?.networkEffects) {
      this.networkEffects = data.networkEffects;
    }
  }
}

/**
 * Contact factory for creating default contacts at stations
 * Enhanced for Phase 4.2 with more diverse contact generation
 */
export class ContactFactory {
  /**
   * Enhanced Phase 4.2: Create diverse contacts based on station characteristics
   */
  static createEnhancedStationContacts(
    stationId: string, 
    factionId: string,
    stationType: string = 'trading',
    playerReputation?: number
  ): Omit<Contact, 'id' | 'metAt' | 'lastInteraction' | 'interactionCount' | 'trustLevel' | 'relationship'>[] {
    const contacts: Omit<Contact, 'id' | 'metAt' | 'lastInteraction' | 'interactionCount' | 'trustLevel' | 'relationship'>[] = [];
    
    // Base contacts based on station type
    switch (stationType) {
      case 'military':
        contacts.push(
          this.createStationContact(stationId, factionId, 'commander'),
          this.createStationContact(stationId, factionId, 'quartermaster')
        );
        break;
      case 'industrial':
        contacts.push(
          this.createStationContact(stationId, factionId, 'trade_liaison'),
          this.createStationContact(stationId, factionId, 'dock_supervisor')
        );
        break;
      case 'research':
        contacts.push(
          this.createStationContact(stationId, factionId, 'commander'),
          this.createSpecializedContact(stationId, factionId, 'research_director')
        );
        break;
      default: // trading station
        contacts.push(
          this.createStationContact(stationId, factionId, 'trade_liaison'),
          this.createStationContact(stationId, factionId, 'dock_supervisor')
        );
    }
    
    // Add reputation-based contacts
    if (playerReputation && playerReputation >= 40) {
      contacts.push(this.createSpecializedContact(stationId, factionId, 'information_broker'));
    }
    
    if (playerReputation && playerReputation >= 60) {
      contacts.push(this.createSpecializedContact(stationId, factionId, 'faction_representative'));
    }
    
    return contacts;
  }

  /**
   * Enhanced Phase 4.2: Create specialized contacts with unique services
   */
  static createSpecializedContact(
    stationId: string, 
    factionId: string, 
    specialType: string
  ): Omit<Contact, 'id' | 'metAt' | 'lastInteraction' | 'interactionCount' | 'trustLevel' | 'relationship'> {
    const specialRoles = {
      'research_director': {
        roleId: 'research_director',
        name: ['Dr. Sarah Chen', 'Dr. Marcus Webb', 'Dr. Elena Rodriguez', 'Dr. James Anderson'][Math.floor(Math.random() * 4)],
        specialties: ['Advanced Technology', 'Research Grants', 'Prototype Access'],
        services: [
          {
            id: 'prototype_access',
            name: 'Prototype Equipment Access',
            description: 'Access to experimental technology',
            cost: 15000,
            requirements: [
              { type: 'trust' as const, value: 'trust', minimum: 70 },
              { type: 'reputation' as const, value: 'reputation', minimum: 50 }
            ],
            availability: 'conditional' as const
          }
        ]
      },
      'information_broker': {
        roleId: 'information_broker',
        name: ['Shadow', 'Intel', 'Network', 'Cipher'][Math.floor(Math.random() * 4)],
        specialties: ['Market Intelligence', 'Route Information', 'Competitor Analysis'],
        services: [
          {
            id: 'competitor_intelligence',
            name: 'Competitor Intelligence',
            description: 'Detailed information about competing traders',
            cost: 8000,
            requirements: [
              { type: 'trust' as const, value: 'trust', minimum: 60 }
            ],
            availability: 'conditional' as const
          }
        ]
      },
      'faction_representative': {
        roleId: 'faction_representative',
        name: ['Ambassador Sterling', 'Envoy Harrison', 'Representative Clarke', 'Delegate Morgan'][Math.floor(Math.random() * 4)],
        specialties: ['Faction Relations', 'Diplomatic Missions', 'Territory Access'],
        services: [
          {
            id: 'diplomatic_immunity',
            name: 'Diplomatic Immunity',
            description: 'Temporary protection in hostile territory',
            cost: 25000,
            requirements: [
              { type: 'trust' as const, value: 'trust', minimum: 80 },
              { type: 'reputation' as const, value: 'reputation', minimum: 70 }
            ],
            availability: 'conditional' as const
          }
        ]
      }
    };

    const roleData = specialRoles[specialType as keyof typeof specialRoles];
    if (!roleData) {
      return this.createStationContact(stationId, factionId, 'trade_liaison');
    }

    // Create custom role or use existing one
    const role = CONTACT_ROLES.find(r => r.id === roleData.roleId) || {
      id: roleData.roleId,
      name: roleData.roleId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      influence: 8,
      description: `A specialized contact with unique services and connections.`
    };

    // Enhanced personality traits for specialized contacts
    const traits = this.getEnhancedTraits(specialType);

    return {
      name: roleData.name,
      factionId,
      stationId,
      role,
      specialties: roleData.specialties,
      personalityTraits: traits,
      services: roleData.services,
      biography: this.generateEnhancedBiography(roleData.name, role, factionId, specialType)
    };
  }

  /**
   * Enhanced Phase 4.2: Get personality traits based on contact specialization
   */
  private static getEnhancedTraits(specialType: string): typeof PERSONALITY_TRAITS[0][] {
    const specializedTraits = {
      'research_director': ['methodical', 'innovative'],
      'information_broker': ['secretive', 'opportunistic'],
      'faction_representative': ['diplomatic', 'influential']
    };

    const baseTraits = specializedTraits[specialType as keyof typeof specializedTraits] || [];
    const additionalTraits = this.getRandomTraits(2 - baseTraits.length);
    
    // Convert string traits to proper trait objects
    const traitObjects = baseTraits.map(traitName => 
      PERSONALITY_TRAITS.find(t => t.id === traitName) || PERSONALITY_TRAITS[0]
    );
    
    return [...traitObjects, ...additionalTraits];
  }

  /**
   * Enhanced Phase 4.2: Generate rich biographies for specialized contacts
   */
  private static generateEnhancedBiography(name: string, role: any, factionId: string, specialType?: string): string {
    const baseBio = this.generateBiography(name, role, factionId);
    
    const specializations = {
      'research_director': `${name} leads cutting-edge research initiatives and has connections throughout the scientific community.`,
      'information_broker': `${name} operates in the shadows, trading in secrets and intelligence across multiple sectors.`,
      'faction_representative': `${name} serves as a key diplomatic liaison and can facilitate access to restricted faction resources.`
    };

    if (specialType && specializations[specialType as keyof typeof specializations]) {
      return `${baseBio} ${specializations[specialType as keyof typeof specializations]}`;
    }

    return baseBio;
  }

  /**
   * Create a default contact for a station based on faction
   */
  static createStationContact(
    stationId: string, 
    factionId: string, 
    contactType: 'commander' | 'trade_liaison' | 'quartermaster' | 'dock_supervisor' = 'trade_liaison'
  ): Omit<Contact, 'id' | 'metAt' | 'lastInteraction' | 'interactionCount' | 'trustLevel' | 'relationship'> {
    // Map contact types to role IDs
    const roleIdMap = {
      'commander': 'station_commander',
      'trade_liaison': 'trade_liaison',
      'quartermaster': 'quartermaster',
      'dock_supervisor': 'dock_supervisor'
    };
    
    const roleId = roleIdMap[contactType];
    const role = CONTACT_ROLES.find(r => r.id === roleId) || CONTACT_ROLES[1]; // Default to trade liaison
    
    // Generate name based on role
    const names = this.getNameForRole(role.id);
    const name = names[Math.floor(Math.random() * names.length)];

    // Assign personality traits
    const traits = this.getRandomTraits(2);

    // Define services based on role
    const services = this.getServicesForRole(role.id);

    return {
      name,
      factionId,
      stationId,
      role,
      specialties: this.getSpecialtiesForRole(role.id),
      personalityTraits: traits,
      services,
      biography: this.generateBiography(name, role, factionId)
    };
  }

  private static getNameForRole(roleId: string): string[] {
    const names = {
      station_commander: ['Commander Hayes', 'Captain Morrison', 'Colonel Anders', 'Commander Chen'],
      trade_liaison: ['Marcus Webb', 'Elena Vasquez', 'David Park', 'Sarah Connor'],
      quartermaster: ['Chief Rodriguez', 'Supply Officer Kim', 'Master Smith', 'Officer Johnson'],
      dock_supervisor: ['Supervisor Garcia', 'Chief Mechanic Wong', 'Dock Chief Anderson', 'Foreman Miller']
    };
    return names[roleId as keyof typeof names] || ['Contact Person'];
  }

  private static getRandomTraits(count: number): typeof PERSONALITY_TRAITS[0][] {
    const shuffled = [...PERSONALITY_TRAITS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private static getSpecialtiesForRole(roleId: string): string[] {
    const specialties = {
      station_commander: ['Security', 'Administration', 'Defense Contracts'],
      trade_liaison: ['Commercial Negotiations', 'Market Intelligence', 'Trade Routes'],
      quartermaster: ['Equipment Procurement', 'Supply Chains', 'Maintenance'],
      dock_supervisor: ['Ship Repairs', 'Technical Services', 'Cargo Handling']
    };
    return specialties[roleId as keyof typeof specialties] || ['General Services'];
  }

  private static getServicesForRole(roleId: string): ContactService[] {
    // Define common services based on role
    const commonServices = {
      station_commander: [
        {
          id: 'security_clearance',
          name: 'Security Clearance',
          description: 'Temporary access to restricted areas',
          cost: 5000,
          requirements: [
            { type: 'trust' as const, value: 'trust', minimum: 50 },
            { type: 'reputation' as const, value: 'reputation', minimum: 30 }
          ],
          availability: 'conditional' as const
        }
      ],
      trade_liaison: [
        {
          id: 'market_insider_info',
          name: 'Market Insider Information',
          description: 'Advance notice of price changes and supply issues',
          cost: 2000,
          requirements: [
            { type: 'trust' as const, value: 'trust', minimum: 40 }
          ],
          availability: 'limited' as const
        }
      ],
      quartermaster: [
        {
          id: 'bulk_discount',
          name: 'Bulk Purchase Discount',
          description: '15% discount on equipment purchases',
          cost: 0,
          requirements: [
            { type: 'trust' as const, value: 'trust', minimum: 60 }
          ],
          availability: 'always' as const
        }
      ]
    };

    return commonServices[roleId as keyof typeof commonServices] || [];
  }

  private static generateBiography(name: string, role: typeof CONTACT_ROLES[0], _factionId: string): string {
    const templates = [
      `${name} serves as ${role.name} with distinction, having worked in this position for several years.`,
      `A seasoned professional, ${name} has built a reputation for reliability in their role as ${role.name}.`,
      `${name} brings extensive experience to their position as ${role.name}, making them a valuable contact.`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
}