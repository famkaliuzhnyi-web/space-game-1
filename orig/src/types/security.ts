/**
 * Security and Law Enforcement System Types
 * 
 * This module defines the core types for the galaxy's security and legal systems,
 * including sector security levels, crime types, law enforcement agencies, and
 * legal consequences for player actions.
 */

export interface SecurityLevel {
  level: number; // 1-5 (1=maximum security, 5=no security)
  name: string;
  description: string;
  responseTime: number; // seconds
  patrolCoverage: number; // 0-100 percentage
  crimeRate: number; // 0-100 percentage
  inspectionChance: number; // 0-100 percentage
  characteristics: string[];
}

export interface SecurityZone {
  id: string;
  name: string;
  securityLevel: SecurityLevel;
  controllingFaction?: string;
  enforcementAgencies: string[];
  restrictions: SecurityRestriction[];
}

export interface SecurityRestriction {
  type: 'cargo' | 'weapon' | 'ship' | 'access' | 'license';
  itemId?: string;
  description: string;
  violationPenalty: CriminalPenalty;
}

export interface CrimeType {
  id: string;
  name: string;
  category: 'property' | 'violent' | 'economic' | 'political' | 'regulatory';
  severity: number; // 1-10 (1=minor, 10=capital offense)
  description: string;
  basePenalty: CriminalPenalty;
  factionReputationImpact: { [factionId: string]: number };
}

export interface CriminalRecord {
  playerId: string;
  crimes: CriminalOffense[];
  warrants: Warrant[];
  legalStatus: LegalStatus;
  totalCrimeScore: number;
}

export interface CriminalOffense {
  id: string;
  crimeType: string;
  location: string; // systemId or stationId
  timestamp: number;
  witnesses: string[]; // NPC IDs or faction IDs
  evidence: Evidence[];
  status: 'reported' | 'investigating' | 'charged' | 'convicted' | 'dismissed';
  penalty?: CriminalPenalty;
}

export interface Evidence {
  type: 'witness' | 'physical' | 'digital' | 'circumstantial';
  reliability: number; // 0-100 percentage
  description: string;
  source: string;
}

export interface Warrant {
  id: string;
  issuingFaction: string;
  crimeId: string;
  bounty: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  jurisdiction: string[]; // systemIds where warrant is active
  expirationTime?: number;
}

export interface CriminalPenalty {
  fine: number;
  imprisonment?: number; // hours of game time
  assetSeizure?: string[]; // ship/cargo IDs to seize
  reputationLoss: { [factionId: string]: number };
  restrictions?: string[]; // access restrictions
}

export interface LegalStatus {
  overall: 'clean' | 'suspected' | 'wanted' | 'criminal' | 'fugitive';
  factionStatus: { [factionId: string]: 'clean' | 'suspected' | 'wanted' | 'criminal' | 'fugitive' };
  activeWarrants: number;
  totalBounty: number;
}

export interface LawEnforcementAgency {
  id: string;
  name: string;
  faction: string;
  jurisdiction: string[]; // systemIds where they operate
  authority: 'local' | 'regional' | 'federal' | 'military' | 'corporate';
  capabilities: LawEnforcementCapability[];
  responsePatterns: ResponsePattern[];
}

export interface LawEnforcementCapability {
  type: 'patrol' | 'investigation' | 'arrest' | 'pursuit' | 'interdiction';
  effectiveness: number; // 0-100 percentage
  resources: number; // relative strength
}

export interface ResponsePattern {
  crimeCategory: string;
  securityLevel: number;
  responseType: 'ignore' | 'investigate' | 'pursue' | 'arrest' | 'lethal_force';
  responseDelay: number; // seconds
  pursuitRange: number; // distance in AU
  escalationThreshold: number; // crime score that triggers escalation
}

export interface LawEnforcementUnit {
  id: string;
  agency: string;
  type: 'patrol' | 'detective' | 'swat' | 'military';
  currentLocation: string;
  status: 'idle' | 'patrolling' | 'investigating' | 'pursuing' | 'engaged';
  target?: string; // player or NPC ID
  jurisdiction: string[];
  equipment: LawEnforcementEquipment;
}

export interface LawEnforcementEquipment {
  ships: string[]; // ship type IDs
  weapons: string[]; // weapon type IDs
  specialEquipment: string[]; // scanner, tracker, etc.
  personnelCount: number;
}

export interface CrimeDetection {
  method: 'witness' | 'scanner' | 'patrol' | 'investigation' | 'informant';
  reliability: number; // 0-100 percentage
  detectionRange: number; // distance in AU
  detectionChance: number; // 0-100 percentage per check
}

export interface InvestigationResult {
  crimeId: string;
  evidence: Evidence[];
  suspects: string[]; // player or NPC IDs
  confidence: number; // 0-100 percentage
  recommendedAction: 'dismiss' | 'warn' | 'fine' | 'arrest' | 'bounty';
}

export interface SecurityScan {
  timestamp: number;
  location: string;
  targetId: string; // player or ship ID
  scanType: 'routine' | 'targeted' | 'random' | 'warrant';
  results: SecurityScanResult[];
}

export interface SecurityScanResult {
  type: 'cargo' | 'ship' | 'identity' | 'weapon' | 'license';
  status: 'clear' | 'suspicious' | 'violation' | 'contraband';
  details: string;
  severity: number; // 1-10
  evidence?: Evidence;
}

// Security Manager Events
export interface SecurityEvent {
  id: string;
  type: 'crime_detected' | 'warrant_issued' | 'arrest_attempt' | 'escape' | 'conviction';
  timestamp: number;
  location: string;
  participants: string[]; // player/NPC IDs
  data: Record<string, any>;
}

export interface PatrolRoute {
  id: string;
  agency: string;
  waypoints: string[]; // systemIds or coordinates
  frequency: number; // patrols per hour
  unitTypes: string[]; // types of enforcement units on this route
  priority: 'low' | 'medium' | 'high';
}

// Weapon and Equipment Licensing
export interface License {
  id: string;
  type: 'weapon' | 'ship' | 'cargo' | 'operation';
  category: string; // specific license category
  issuingFaction: string;
  validJurisdictions: string[]; // where license is recognized
  restrictions: string[];
  expirationTime?: number;
  cost: number;
}

export interface LicenseRequirement {
  licenseType: string;
  category: string;
  minimumReputation?: number;
  requiredFaction?: string;
  prerequisites?: string[]; // other required licenses
  backgroundCheck?: boolean;
}

// Integration with existing systems
export interface SecurityState {
  zones: Map<string, SecurityZone>;
  agencies: Map<string, LawEnforcementAgency>;
  units: Map<string, LawEnforcementUnit>;
  criminalRecords: Map<string, CriminalRecord>;
  activeInvestigations: Map<string, InvestigationResult>;
  patrolRoutes: PatrolRoute[];
  crimeDatabase: Map<string, CrimeType>;
  licenses: Map<string, License>;
  securityEvents: SecurityEvent[];
}