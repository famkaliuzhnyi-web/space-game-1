/**
 * Achievement System Types
 * Defines types for tracking and rewarding player milestones
 */

export type AchievementCategory = 
  | 'trading'      // Commerce and economic activities
  | 'exploration'  // Travel and discovery
  | 'technical'    // Engineering and maintenance
  | 'social'       // Relationships and networking  
  | 'progression'  // Character advancement
  | 'milestone'    // Major game milestones
  | 'special';     // Hidden or event achievements

export type AchievementRarity = 
  | 'common'      // Easy to obtain, most players will get
  | 'uncommon'    // Requires some effort or specific actions
  | 'rare'        // Challenging to obtain, skilled play required
  | 'epic'        // Very difficult, significant achievement
  | 'legendary';  // Extremely rare, exceptional accomplishment

export interface AchievementRequirement {
  type: 'stat' | 'action' | 'milestone' | 'condition';
  key: string;           // Stat name, action type, or condition identifier
  value: number | string; // Target value or condition
  comparison?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt'; // For numeric comparisons
}

export interface AchievementReward {
  type: 'experience' | 'skill_points' | 'credits' | 'item' | 'title';
  amount?: number;      // For experience, skill points, credits
  itemId?: string;      // For item rewards
  title?: string;       // For title rewards
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;                        // Icon identifier
  requirements: AchievementRequirement[]; // Conditions to unlock
  rewards?: AchievementReward[];       // Optional rewards
  hidden: boolean;                     // Hidden until unlocked
  prerequisite?: string[];             // Required achievement IDs
  points: number;                      // Achievement points value
}

export interface AchievementProgress {
  achievementId: string;
  progress: Map<string, number>;       // requirement key -> current progress
  completed: boolean;
  dateEarned?: Date;
}

export interface AchievementUnlock {
  achievement: Achievement;
  dateEarned: Date;
  rewards: AchievementReward[];
}

// Player achievement data
export interface PlayerAchievements {
  unlocked: string[];                  // Achievement IDs earned
  progress: Map<string, AchievementProgress>; // Active progress tracking
  totalPoints: number;                 // Total achievement points
  categoryCounts: Map<AchievementCategory, number>; // Achievements per category
  lastUnlocked?: AchievementUnlock;    // Most recent unlock for notifications
}

// Achievement tracking for various game activities
export interface AchievementTrigger {
  type: 'trade_complete' | 'contract_finish' | 'ship_repair' | 'system_visit' | 
        'level_up' | 'skill_increase' | 'reputation_gain' | 'credits_earned' |
        'distance_traveled' | 'maintenance_performed' | 'stat_update';
  data: Record<string, any>;           // Activity-specific data
}

// Achievement notification data
export interface AchievementNotification {
  achievement: Achievement;
  isNew: boolean;                      // Just unlocked vs progress update
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}