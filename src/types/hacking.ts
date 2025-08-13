/**
 * Hacking System Types
 * 
 * Defines all types used by the hacking and electronic warfare system.
 * Supports minigame mechanics, data theft, electronic warfare, and countermeasures.
 */

/**
 * Security access levels for various systems
 */
export type AccessLevel = 0 | 1 | 2 | 3 | 4;

export interface AccessLevelInfo {
  level: AccessLevel;
  name: string;
  description: string;
  difficulty: number; // Base difficulty multiplier
}

/**
 * Hacking equipment types
 */
export interface HackingEquipment {
  id: string;
  name: string;
  type: 'handheld' | 'professional' | 'military';
  capabilities: {
    maxAccessLevel: AccessLevel;
    encryptionBreaking: number; // 1-5 scale
    stealthBonus: number; // Reduces detection chance
    processingPower: number; // Affects speed
  };
  requirements: {
    powerConsumption: number;
    skillRequired: number;
  };
  cost: number;
  availability: 'common' | 'restricted' | 'military';
  description: string;
}

/**
 * Hacking software tools
 */
export interface HackingSoftware {
  id: string;
  name: string;
  category: 'intrusion' | 'data' | 'warfare';
  type: string; // Specific tool type within category
  effectiveness: number; // 1-5 scale
  detectionRisk: number; // Risk of being detected
  cost: number;
  skillRequired: number;
  description: string;
}

/**
 * Hacking target types
 */
export type HackingTargetType = 'ship-navigation' | 'ship-communication' | 'ship-cargo' | 
                               'station-security' | 'station-economic' | 'station-industrial' |
                               'network-data' | 'network-communication';

export interface HackingTarget {
  id: string;
  name: string;
  type: HackingTargetType;
  location: {
    stationId?: string;
    shipId?: string;
    networkId?: string;
  };
  security: {
    accessLevel: AccessLevel;
    encryptionStrength: number; // 1-5 scale
    monitoring: number; // Detection system strength
    countermeasures: boolean; // Has active defenses
  };
  value: {
    informationWorth: number; // Credits value of data
    strategicValue: number; // Long-term benefit score
    riskLevel: number; // Legal/reputation consequences
  };
  description: string;
}

/**
 * Hacking attempt phases
 */
export type HackingPhase = 'reconnaissance' | 'penetration' | 'exploitation' | 'cleanup';

export interface HackingAttempt {
  id: string;
  targetId: string;
  playerId: string;
  startTime: number;
  phase: HackingPhase;
  progress: {
    currentPhase: HackingPhase;
    phaseProgress: number; // 0-100
    overallProgress: number; // 0-100
  };
  equipment: {
    hardwareId: string;
    softwareIds: string[];
  };
  status: 'active' | 'success' | 'failed' | 'detected' | 'aborted';
  detection: {
    riskAccumulated: number; // 0-100
    detected: boolean;
    tracebackLevel: number; // How close they are to identifying player
  };
}

/**
 * Hacking minigame mechanics
 */
export interface HackingMinigame {
  type: 'password-crack' | 'pattern-match' | 'circuit-bypass' | 'code-inject' | '2048';
  difficulty: number;
  timeLimit?: number; // Seconds
  parameters: {
    [key: string]: any; // Game-specific parameters
  };
  success: boolean;
  score: number; // Performance score
}

/**
 * Hacking results and consequences
 */
export interface HackingResult {
  success: boolean;
  data?: HackedData[];
  systemAccess?: SystemAccess[];
  consequences: {
    legal: LegalConsequence[];
    reputation: ReputationConsequence[];
    security: SecurityConsequence[];
  };
  detection: {
    detected: boolean;
    traceLevel: number; // 0-3 (none, partial, full, identity revealed)
    evidenceLeft: string[];
  };
}

/**
 * Types of data that can be stolen
 */
export type DataType = 'market-intelligence' | 'trade-routes' | 'personal-communications' |
                       'financial-records' | 'security-protocols' | 'research-data' |
                       'faction-intelligence' | 'military-data';

export interface HackedData {
  id: string;
  type: DataType;
  sourceTargetId: string;
  quality: number; // 1-5 scale (accuracy/completeness)
  freshness: number; // Age in hours
  marketValue: number; // Current credits value
  content: {
    title: string;
    description: string;
    details: any; // Specific data structure based on type
  };
  restrictions: {
    sellable: boolean;
    factionSensitive: string[]; // Factions that would react negatively
    legalRisk: number; // Risk of legal consequences if discovered
  };
}

/**
 * System access gained from hacking
 */
export interface SystemAccess {
  targetId: string;
  accessLevel: AccessLevel;
  capabilities: string[]; // What can be done with this access
  duration: number; // How long access lasts (minutes)
  persistent: boolean; // Survives system restarts
}

/**
 * Legal consequences of hacking
 */
export interface LegalConsequence {
  severity: 'minor' | 'major' | 'severe' | 'extreme';
  type: 'fine' | 'warrant' | 'bounty' | 'asset-seizure' | 'imprisonment';
  jurisdiction: string; // Faction or system with jurisdiction
  details: any; // Specific consequence data
}

/**
 * Reputation consequences
 */
export interface ReputationConsequence {
  factionId: string;
  change: number; // Positive or negative
  reason: string;
  category: 'hacking' | 'corporate-espionage' | 'data-theft' | 'system-disruption';
}

/**
 * Security response consequences
 */
export interface SecurityConsequence {
  type: 'lockout' | 'trace-back' | 'counter-attack' | 'alert-network';
  severity: number; // 1-5 scale
  duration?: number; // Minutes, if applicable
  details: string;
}

/**
 * Information market mechanics
 */
export interface DataMarket {
  id: string;
  name: string;
  location: string; // Station or network ID
  reputation: 'underground' | 'gray-market' | 'corporate' | 'government';
  accessibility: {
    reputationRequired: number;
    skillRequired: number;
    contactRequired?: string; // Contact ID needed for access
  };
  pricing: {
    basePriceMultiplier: number; // Multiplier on data market value
    qualityBonus: number; // Bonus for high-quality data
    freshnessBonus: number; // Bonus for recent data
    riskPenalty: number; // Penalty for high-risk data
  };
}

/**
 * Data buy/sell transactions
 */
export interface DataTransaction {
  id: string;
  marketId: string;
  dataId: string;
  type: 'buy' | 'sell';
  price: number;
  timestamp: number;
  buyer?: string;
  seller?: string;
  anonymous: boolean; // Whether transaction is anonymous
}

/**
 * Electronic warfare capabilities
 */
export type WarfareType = 'system-disruption' | 'communication-jamming' | 'navigation-interference' |
                         'weapon-disable' | 'shield-disable' | 'life-support-sabotage';

export interface ElectronicWarfare {
  type: WarfareType;
  targetId: string;
  duration: number; // Effect duration in seconds
  effectiveness: number; // 0-100%
  detectability: number; // Risk of being detected
  reversible: boolean; // Can target recover automatically
}

/**
 * Countermeasure systems
 */
export type CountermeasureType = 'firewall' | 'intrusion-detection' | 'trace-back' | 'honey-pot' |
                                'auto-lockout' | 'alert-system' | 'quantum-encryption';

export interface Countermeasure {
  type: CountermeasureType;
  effectiveness: number; // Defense strength
  cost: number; // Implementation/maintenance cost
  powerRequirement: number;
  description: string;
  activeResponse: boolean; // Fights back vs passive defense
}

/**
 * Hacking session state (for active hacking attempts)
 */
export interface HackingSession {
  attemptId: string;
  target: HackingTarget;
  equipment: HackingEquipment;
  software: HackingSoftware[];
  currentMinigame?: HackingMinigame;
  phaseResults: {
    [phase in HackingPhase]?: {
      success: boolean;
      timeSpent: number;
      detectionRisk: number;
    };
  };
  totalDetectionRisk: number;
  startTime: number;
}

/**
 * Hacking statistics for player progression
 */
export interface HackingStats {
  attemptsTotal: number;
  attemptsSuccessful: number;
  timesDetected: number;
  dataStolen: number;
  creditsEarned: number;
  systemsCompromised: number;
  
  // Skill progression
  skillLevel: number;
  experience: number;
  specializations: string[];
  
  // Records
  highestAccessLevel: AccessLevel;
  mostValuableDataStolen: number;
  longestSessionDuration: number;
}

/**
 * Complete hacking system state
 */
export interface HackingState {
  activeAttempts: Map<string, HackingAttempt>;
  activeSessions: Map<string, HackingSession>;
  ownedEquipment: HackingEquipment[];
  ownedSoftware: HackingSoftware[];
  stolenData: HackedData[];
  systemAccess: SystemAccess[];
  stats: HackingStats;
  
  // Market access
  knownMarkets: string[];
  marketReputation: Map<string, number>;
  
  // Legal status
  activeWarrants: string[];
  criminalRecord: string[];
}