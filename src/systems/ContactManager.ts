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
 */
export class ContactFactory {
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