/**
 * Character System Types
 * Defines types for character stats, skills, progression and personal equipment
 */

// Core character attributes that affect gameplay
export interface CharacterAttributes {
  // Primary attributes (0-100 scale)
  strength: number;     // Affects cargo handling, combat effectiveness
  intelligence: number; // Affects hacking, system efficiency, learning speed
  charisma: number;     // Affects trading prices, reputation gains
  endurance: number;    // Affects long-distance travel, stress resistance
  dexterity: number;    // Affects piloting, precision tasks, reaction time
  perception: number;   // Affects scanning, threat detection, navigation
}

// Character skills that can be improved through gameplay
export interface CharacterSkills {
  // Trading skills
  trading: number;      // Better prices, market information
  negotiation: number;  // Contract bonuses, reputation boosts
  economics: number;    // Market analysis, investment opportunities
  
  // Technical skills  
  engineering: number;  // Equipment efficiency, maintenance costs
  piloting: number;     // Ship handling, fuel efficiency
  navigation: number;   // Route optimization, travel time reduction
  
  // Combat/Security skills
  combat: number;       // Weapon effectiveness, damage reduction
  tactics: number;      // Combat strategy, threat assessment
  security: number;     // Hacking defense, cargo protection
  
  // Social/Information skills
  networking: number;   // Contact benefits, information access
  investigation: number; // Data gathering, market intelligence
  leadership: number;   // Crew efficiency, reputation effects
}

// Experience and progression tracking
export interface CharacterProgression {
  level: number;                    // Overall character level
  experience: number;               // Total experience points
  experienceToNext: number;         // XP needed for next level
  skillPoints: number;              // Unallocated skill points
  attributePoints: number;          // Unallocated attribute points
  totalAttributePointsSpent: number; // Track total spent for validation
  totalSkillPointsSpent: number;    // Track total spent for validation
}

// Personal equipment separate from ship equipment
export interface PersonalEquipment {
  suit: PersonalItem | null;        // Space suit, affects survival, protection
  tool: PersonalItem | null;        // Multi-tool, affects repair/hacking efficiency
  datapad: PersonalItem | null;     // Information device, affects analysis
  accessory: PersonalItem | null;   // Personal accessory, various effects
}

// Personal equipment items
export interface PersonalItem {
  id: string;
  name: string;
  type: 'suit' | 'tool' | 'datapad' | 'accessory';
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  effects: PersonalItemEffects;
  cost: number;
  durability: number;               // 0-1, affects effectiveness
  maxDurability: number;            // Maximum durability when new
}

// Effects that personal equipment can have
export interface PersonalItemEffects {
  // Attribute bonuses
  strengthBonus?: number;
  intelligenceBonus?: number;
  charismaBonus?: number;
  enduranceBonus?: number;
  dexterityBonus?: number;
  perceptionBonus?: number;
  
  // Skill bonuses
  tradingBonus?: number;
  engineeringBonus?: number;
  pilotingBonus?: number;
  combatBonus?: number;
  hackingBonus?: number;
  
  // Special effects
  oxygenEfficiency?: number;        // Reduces life support costs
  radiationResistance?: number;     // Reduces radiation damage
  repairEfficiency?: number;        // Faster/cheaper repairs
  scannerRange?: number;            // Extended scanner range
  informationAccess?: number;       // Better market/faction data
}

// Complete character data structure
export interface Character {
  id: string;
  name: string;
  appearance: CharacterAppearance;
  background: CharacterBackground;
  attributes: CharacterAttributes;
  skills: CharacterSkills;
  progression: CharacterProgression;
  personalEquipment: PersonalEquipment;
  achievements: string[];           // Achievement IDs earned
  skillHistory: SkillChangeRecord[]; // Track skill improvements
}

// Character visual customization
export interface CharacterAppearance {
  gender: 'male' | 'female' | 'other';
  skinTone: string;
  hairColor: string;
  eyeColor: string;
  age: number;
  portrait: string;                 // Asset ID for character portrait
}

// Character background affecting starting skills/attributes
export interface CharacterBackground {
  id: string;
  name: string;
  description: string;
  startingAttributeBonus: Partial<CharacterAttributes>;
  startingSkillBonus: Partial<CharacterSkills>;
  startingEquipment: string[];      // IDs of starting personal equipment
  startingCredits: number;          // Bonus/penalty to starting credits
}

// Skill progression tracking
export interface SkillChangeRecord {
  skillName: keyof CharacterSkills;
  oldValue: number;
  newValue: number;
  source: string;                   // What caused the skill increase
  timestamp: number;
}

// Experience sources for character progression
export interface ExperienceGain {
  source: string;                   // What activity granted XP
  amount: number;
  category: 'trading' | 'combat' | 'exploration' | 'social' | 'technical';
  timestamp: number;
}

// Character creation configuration
export interface CharacterCreationConfig {
  startingAttributePoints: number;  // Points to allocate to attributes
  startingSkillPoints: number;      // Points to allocate to skills  
  maxAttributeValue: number;        // Maximum starting attribute value
  maxSkillValue: number;            // Maximum starting skill value
  availableBackgrounds: string[];   // Available background IDs
}