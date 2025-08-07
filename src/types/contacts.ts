/**
 * Contact and relationship system types for Phase 4.2
 * Extends the basic faction reputation system with personal contacts and relationships
 */

export interface Contact {
  id: string;
  name: string;
  factionId: string;
  stationId?: string; // Where they can be found
  role: ContactRole;
  specialties: string[];
  personalityTraits: PersonalityTrait[];
  trustLevel: number; // 0-100, separate from faction reputation
  relationship: RelationshipLevel;
  metAt: number; // Timestamp when first met
  lastInteraction: number; // Timestamp of last interaction
  interactionCount: number;
  services: ContactService[];
  biography: string;
}

export interface ContactRole {
  id: string;
  name: string;
  description: string;
  influence: number; // 1-10, how influential they are in their faction
}

export interface PersonalityTrait {
  id: string;
  name: string;
  description: string;
  interactionModifier: number; // -0.5 to 0.5, affects relationship building
}

export interface ContactService {
  id: string;
  name: string;
  description: string;
  cost: number;
  requirements: ServiceRequirement[];
  availability: 'always' | 'conditional' | 'limited';
}

export interface ServiceRequirement {
  type: 'reputation' | 'trust' | 'faction_standing' | 'credits' | 'item';
  value: any;
  minimum: number;
}

export interface RelationshipLevel {
  id: string;
  name: string;
  description: string;
  trustThreshold: number;
}

export interface ContactInteraction {
  contactId: string;
  timestamp: number;
  type: InteractionType;
  outcome: InteractionOutcome;
  trustChange: number;
  notes?: string;
}

export type InteractionType = 
  | 'greeting'
  | 'information_request' 
  | 'service_request'
  | 'contract_negotiation'
  | 'favor'
  | 'gift'
  | 'business_deal'
  | 'social_chat';

export type InteractionOutcome = 
  | 'success'
  | 'failure'
  | 'neutral'
  | 'exceptional';

export interface SocialNetwork {
  contacts: Map<string, Contact>;
  interactions: ContactInteraction[];
  networkConnections: Map<string, string[]>; // Contact ID -> list of connected contact IDs
}

export interface FactionRelationship {
  factionId: string;
  trustLevel: number; // Separate from reputation, affects contact interactions
  influence: number; // Player's influence within the faction
  accessLevel: number; // 1-5, determines what content/services are available
  specialPrivileges: string[]; // Special access or abilities earned
  restrictions: string[]; // Things player is restricted from
}

export interface NetworkEffect {
  sourceContactId: string;
  targetContactId: string;
  type: 'introduction' | 'recommendation' | 'warning' | 'vouching';
  strength: number; // 0.1 to 1.0
  expiresAt?: number;
}

// Pre-defined contact roles
export const CONTACT_ROLES: ContactRole[] = [
  {
    id: 'station_commander',
    name: 'Station Commander',
    description: 'Manages station operations and security',
    influence: 8
  },
  {
    id: 'trade_liaison',
    name: 'Trade Liaison',
    description: 'Handles commercial relationships',
    influence: 6
  },
  {
    id: 'quartermaster',
    name: 'Quartermaster',
    description: 'Manages supplies and equipment',
    influence: 5
  },
  {
    id: 'intelligence_officer',
    name: 'Intelligence Officer',
    description: 'Gathers and trades information',
    influence: 7
  },
  {
    id: 'dock_supervisor',
    name: 'Dock Supervisor',
    description: 'Oversees ship maintenance and docking',
    influence: 4
  },
  {
    id: 'faction_diplomat',
    name: 'Faction Diplomat',
    description: 'Represents faction interests',
    influence: 9
  }
];

// Pre-defined personality traits
export const PERSONALITY_TRAITS: PersonalityTrait[] = [
  {
    id: 'trustworthy',
    name: 'Trustworthy',
    description: 'Reliable and honest in dealings',
    interactionModifier: 0.2
  },
  {
    id: 'suspicious',
    name: 'Suspicious',
    description: 'Wary of newcomers and outsiders',
    interactionModifier: -0.3
  },
  {
    id: 'greedy',
    name: 'Greedy',
    description: 'Motivated primarily by profit',
    interactionModifier: -0.1
  },
  {
    id: 'generous',
    name: 'Generous',
    description: 'Willing to help others',
    interactionModifier: 0.3
  },
  {
    id: 'ambitious',
    name: 'Ambitious',
    description: 'Seeks advancement and recognition',
    interactionModifier: 0.1
  },
  {
    id: 'cautious',
    name: 'Cautious',
    description: 'Careful and methodical in decisions',
    interactionModifier: -0.1
  }
];

// Pre-defined relationship levels
export const RELATIONSHIP_LEVELS: RelationshipLevel[] = [
  {
    id: 'stranger',
    name: 'Stranger',
    description: 'Unknown person with no established relationship',
    trustThreshold: 0
  },
  {
    id: 'acquaintance',
    name: 'Acquaintance',
    description: 'Someone you know but not well',
    trustThreshold: 20
  },
  {
    id: 'associate',
    name: 'Associate',
    description: 'Professional relationship established',
    trustThreshold: 40
  },
  {
    id: 'ally',
    name: 'Ally',
    description: 'Trusted partner in business and ventures',
    trustThreshold: 60
  },
  {
    id: 'friend',
    name: 'Friend',
    description: 'Personal friendship beyond business',
    trustThreshold: 80
  },
  {
    id: 'confidant',
    name: 'Confidant',
    description: 'Deep trust and mutual respect',
    trustThreshold: 95
  }
];