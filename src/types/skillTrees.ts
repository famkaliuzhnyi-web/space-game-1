/**
 * Skill Specialization System Types
 * Defines types for skill trees, specializations, and advanced character progression
 */

export type SkillCategory = 'trading' | 'technical' | 'combat' | 'social';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  baseSkill: string;                // Which base skill this node enhances
  tier: number;                     // 1-5, higher tiers require more investment
  maxRank: number;                  // Maximum ranks in this node (usually 1-5)
  currentRank: number;              // Player's current rank in this node
  prerequisites: SkillNodeRequirement[]; // Requirements to unlock this node
  effects: SkillNodeEffect[];       // Bonuses this node provides per rank
  icon: string;                     // Visual icon for the node
}

export interface SkillNodeRequirement {
  type: 'skill' | 'node' | 'level' | 'attribute';
  id: string;                       // Skill name, node ID, or attribute name
  value: number;                    // Required value/level
}

export interface SkillNodeEffect {
  type: 'skill_bonus' | 'percentage_bonus' | 'flat_bonus' | 'unlock_ability';
  target: string;                   // What the effect applies to
  value: number;                    // Effect magnitude per rank
  description: string;              // Human-readable effect description
}

export interface SkillTree {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  baseSkills: string[];             // Base skills this tree enhances
  nodes: SkillNode[];               // All nodes in this tree
  layout: SkillTreeLayout;          // Visual layout information
}

export interface SkillTreeLayout {
  width: number;                    // Grid width for layout
  height: number;                   // Grid height for layout
  nodePositions: Map<string, { x: number; y: number }>; // Node ID -> position
  connections: SkillTreeConnection[]; // Visual connections between nodes
}

export interface SkillTreeConnection {
  fromNodeId: string;
  toNodeId: string;
  connectionType: 'prerequisite' | 'enhancement' | 'alternative';
}

export interface SkillSpecialization {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  unlockRequirements: SkillNodeRequirement[];
  benefits: SpecializationBenefit[];
  title: string;                    // Special title granted
  isUnlocked: boolean;
  dateUnlocked?: Date;
}

export interface SpecializationBenefit {
  type: 'skill_cap_increase' | 'experience_bonus' | 'cost_reduction' | 'unlock_content';
  target: string;
  value: number;
  description: string;
}

// Player's skill tree progress
export interface PlayerSkillTrees {
  unlockedNodes: Map<string, number>;     // nodeId -> current rank
  specializations: string[];               // Unlocked specialization IDs
  availableSkillPoints: number;           // Unspent skill points
  totalSkillPointsSpent: number;          // Total points spent across all trees
  lastNodeUnlocked?: string;              // Most recently unlocked node
}

// Skill point costs for different tiers
export interface SkillPointCosts {
  tier1: number;                    // Cost per rank for tier 1 nodes
  tier2: number;                    // Cost per rank for tier 2 nodes  
  tier3: number;                    // Cost per rank for tier 3 nodes
  tier4: number;                    // Cost per rank for tier 4 nodes
  tier5: number;                    // Cost per rank for tier 5 nodes
}

// Skill advancement notification
export interface SkillAdvancementNotification {
  type: 'node_unlocked' | 'rank_increased' | 'specialization_unlocked';
  nodeId?: string;
  specializationId?: string;
  newRank?: number;
  skillPointsSpent: number;
  effects: SkillNodeEffect[];
}

// Enhanced character skills with specialization bonuses
export interface EnhancedCharacterSkills {
  baseSkills: Record<string, number>;     // Base skill values
  nodeBonus: Record<string, number>;      // Bonuses from skill nodes
  totalSkills: Record<string, number>;    // Combined base + bonuses
  activeBonuses: ActiveSkillBonus[];      // All active percentage/flat bonuses
}

export interface ActiveSkillBonus {
  source: string;                   // Node ID or specialization ID
  type: 'percentage' | 'flat';
  target: string;                   // What skill/activity this affects
  value: number;
  description: string;
}