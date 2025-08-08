/**
 * Combat System Types
 * 
 * Defines all types used by the combat system including weapons, shields, encounters, and AI.
 * Supports kinetic weapons, magnetic shields, missile systems, and dynamic combat encounters.
 */

/**
 * Weapon types and characteristics
 */
export type WeaponType = 'energy' | 'kinetic' | 'missile' | 'plasma' | 'antimatter';
export type WeaponSize = 'light' | 'medium' | 'heavy' | 'capital';
export type DamageType = 'kinetic' | 'energy' | 'explosive' | 'electromagnetic';

export interface WeaponStats {
  damage: number;
  accuracy: number;
  range: number;
  fireRate: number; // Shots per minute
  ammoCapacity?: number; // For kinetic/missile weapons
  energyCost: number; // Energy per shot
  chargeTime: number; // Seconds between shots
}

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  size: WeaponSize;
  damageType: DamageType;
  stats: WeaponStats;
  license: WeaponLicense;
  description: string;
  cost: number;
  availability: 'civilian' | 'restricted' | 'military' | 'black-market';
}

/**
 * Shield systems and mechanics
 */
export type ShieldType = 'magnetic' | 'energy' | 'adaptive' | 'ablative';

export interface ShieldStats {
  strength: number; // Maximum shield points
  rechargeRate: number; // Shield points per second
  rechargeDelay: number; // Seconds before recharge starts after damage
  efficiency: number; // 0-1, energy efficiency
  coverage: number; // 0-1, percentage of ship protected
}

export interface Shield {
  id: string;
  name: string;
  type: ShieldType;
  stats: ShieldStats;
  resistances: {
    kinetic: number; // 0-1, damage reduction
    energy: number;
    explosive: number;
    electromagnetic: number;
  };
  description: string;
  cost: number;
  powerRequirement: number;
}

/**
 * Combat encounters and scenarios
 */
export type EncounterType = 'pirate-attack' | 'patrol-inspection' | 'mercenary-escort' | 
                          'faction-conflict' | 'bounty-hunter' | 'distress-response' | 'ambush';

export interface CombatEncounter {
  id: string;
  type: EncounterType;
  location: {
    systemId: string;
    coordinates: { x: number; y: number };
  };
  participants: CombatParticipant[];
  environment: CombatEnvironment;
  objectives: CombatObjective[];
  rewards: EncounterReward[];
  startTime: number;
  status: 'active' | 'resolved' | 'fled' | 'negotiated';
}

export interface CombatParticipant {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'ai';
  faction?: string;
  ship: ShipCombatData;
  position: { x: number; y: number };
  status: 'active' | 'disabled' | 'destroyed' | 'fled';
  ai?: CombatAI;
}

export interface ShipCombatData {
  id: string;
  name: string;
  class: string;
  hull: {
    current: number;
    maximum: number;
    armor: number;
  };
  shields: {
    current: number;
    maximum: number;
    type: ShieldType;
    recharging: boolean;
    rechargeCooldown: number;
  };
  weapons: EquippedWeapon[];
  systems: ShipSystems;
  crew: CrewStats;
  maneuverability: number;
  size: 'fighter' | 'corvette' | 'frigate' | 'cruiser' | 'capital';
}

export interface EquippedWeapon {
  weapon: Weapon;
  mountPoint: string;
  ammunition: number;
  energy: number;
  cooldown: number;
  targeting: TargetingData;
  status: 'operational' | 'damaged' | 'offline';
}

export interface ShipSystems {
  engines: number; // 0-1, operational percentage
  life_support: number;
  sensors: number;
  communications: number;
  navigation: number;
  power: number;
}

export interface CrewStats {
  count: number;
  morale: number; // 0-100
  experience: number; // 0-100
  casualties: number;
}

/**
 * Combat AI and behavior
 */
export interface CombatAI {
  personality: AIPersonality;
  tactics: CombatTactics;
  objectives: AIObjective[];
  threatAssessment: ThreatAssessment;
  decisionCooldown: number;
}

export interface AIPersonality {
  aggression: number; // 0-1, how likely to attack
  riskTolerance: number; // 0-1, willingness to take risks
  loyalty: number; // 0-1, likelihood to flee when damaged
  intelligence: number; // 0-1, tactical decision quality
}

export interface CombatTactics {
  preferredRange: 'close' | 'medium' | 'long';
  formation: 'aggressive' | 'defensive' | 'flanking' | 'escort';
  targeting: 'nearest' | 'weakest' | 'strongest' | 'tactical';
  retreatThreshold: number; // 0-1, hull/shield percentage to retreat
}

export interface AIObjective {
  type: 'destroy' | 'disable' | 'protect' | 'retreat' | 'board' | 'capture';
  target?: string;
  priority: number; // 1-10
  completed: boolean;
}

export interface ThreatAssessment {
  targets: {
    [participantId: string]: {
      threatLevel: number; // 0-10
      priority: number;
      lastUpdate: number;
    };
  };
  overallThreat: number;
  recommendedAction: 'attack' | 'defend' | 'retreat' | 'negotiate';
}

/**
 * Combat actions and results
 */
export type CombatActionType = 'attack' | 'move' | 'defend' | 'special' | 'retreat' | 'board';

export interface CombatAction {
  id: string;
  actorId: string;
  type: CombatActionType;
  targetId?: string;
  weaponId?: string;
  parameters: {
    [key: string]: any;
  };
  timestamp: number;
  resolved: boolean;
}

export interface AttackAction {
  weapon: EquippedWeapon;
  target: CombatParticipant;
  accuracy: number;
  damage: number;
  damageType: DamageType;
  criticalHit: boolean;
  shieldsHit: boolean;
}

export interface CombatResult {
  action: CombatAction;
  success: boolean;
  damage?: DamageResult;
  effects: CombatEffect[];
  message: string;
}

export interface DamageResult {
  amount: number;
  type: DamageType;
  target: 'hull' | 'shields' | 'systems' | 'crew';
  penetration: boolean;
  systemDamage?: {
    system: keyof ShipSystems;
    severity: number;
  };
}

export interface CombatEffect {
  type: 'damage' | 'system_damage' | 'shield_down' | 'crew_injury' | 'morale_change';
  target: string;
  value: number;
  duration?: number;
  description: string;
}

/**
 * Combat environment and conditions
 */
export interface CombatEnvironment {
  location: 'open_space' | 'asteroid_field' | 'nebula' | 'planet_orbit' | 'station_vicinity';
  conditions: EnvironmentalCondition[];
  visibility: number; // 0-1, sensor effectiveness
  gravity: number; // Relative to Earth gravity
  hazards: EnvironmentalHazard[];
}

export interface EnvironmentalCondition {
  type: 'radiation' | 'interference' | 'gravity_well' | 'debris' | 'solar_storm';
  severity: number; // 0-1
  effects: {
    accuracy?: number; // Modifier to weapon accuracy
    maneuverability?: number; // Modifier to ship maneuverability  
    sensors?: number; // Modifier to sensor effectiveness
    shields?: number; // Modifier to shield effectiveness
  };
}

export interface EnvironmentalHazard {
  type: 'asteroid' | 'mine' | 'debris' | 'radiation_burst';
  position: { x: number; y: number };
  radius: number;
  damage: number;
  active: boolean;
}

/**
 * Combat objectives and rewards
 */
export interface CombatObjective {
  id: string;
  type: 'eliminate' | 'survive' | 'protect' | 'capture' | 'retrieve';
  description: string;
  target?: string;
  completed: boolean;
  optional: boolean;
  rewards: ObjectiveReward[];
}

export interface EncounterReward {
  type: 'credits' | 'reputation' | 'equipment' | 'data' | 'cargo';
  amount: number;
  faction?: string;
  itemId?: string;
  description: string;
}

export interface ObjectiveReward {
  type: 'credits' | 'experience' | 'reputation' | 'equipment';
  amount: number;
  faction?: string;
  description: string;
}

/**
 * Weapon licensing and restrictions
 */
export interface WeaponLicense {
  required: boolean;
  type?: 'civilian' | 'commercial' | 'security' | 'military';
  issuingAuthority?: string;
  restrictions: WeaponRestriction[];
  cost: number;
  validityPeriod: number; // Days
}

export interface WeaponRestriction {
  type: 'location' | 'faction' | 'cargo' | 'activity';
  description: string;
  prohibited: string[]; // List of restricted items/locations/factions
  penalty: LegalConsequence;
}

export interface LegalConsequence {
  type: 'fine' | 'confiscation' | 'arrest' | 'bounty';
  severity: 'minor' | 'moderate' | 'major' | 'extreme';
  amount?: number;
  description: string;
}

/**
 * Targeting and sensors
 */
export interface TargetingData {
  locked: boolean;
  lockStrength: number; // 0-1, targeting accuracy
  lockTime: number; // Seconds to achieve lock
  distance: number;
  relativeVelocity: { x: number; y: number };
  signature: TargetSignature;
}

export interface TargetSignature {
  thermal: number; // Heat signature
  electromagnetic: number; // EM signature
  optical: number; // Visual signature
  mass: number; // Gravitational signature
}

/**
 * Combat statistics and progression
 */
export interface CombatStats {
  encountersTotal: number;
  encountersWon: number;
  encountersLost: number;
  encountersFled: number;
  
  damageDealt: number;
  damageTaken: number;
  shipsDestroyed: number;
  shipsDisabled: number;
  
  weaponsFired: number;
  accuracyPercentage: number;
  criticalHits: number;
  
  boardingActions: number;
  successfulBoarding: number;
  
  highestThreatDefeated: number;
  longestBattle: number; // Seconds
  favoriteWeapon?: string;
  
  reputation: {
    [faction: string]: number;
  };
}

/**
 * Complete combat system state
 */
export interface CombatState {
  activeEncounters: Map<string, CombatEncounter>;
  combatHistory: CombatEncounter[];
  playerWeapons: Weapon[];
  playerLicenses: PlayerWeaponLicense[];
  stats: CombatStats;
  
  // Current combat session
  currentEncounter?: CombatEncounter;
  turnOrder: string[];
  currentTurn: number;
  combatPhase: 'setup' | 'combat' | 'resolution';
}

export interface PlayerWeaponLicense {
  licenseType: WeaponLicense['type'];
  issuingAuthority: string;
  issueDate: number;
  expiryDate: number;
  cost: number;
  restrictions: WeaponRestriction[];
  status: 'active' | 'expired' | 'revoked' | 'suspended';
}