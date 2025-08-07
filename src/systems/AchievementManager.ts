/**
 * AchievementManager
 * Manages achievement tracking, progress, and rewards for player accomplishments
 */

import { 
  Achievement, 
  AchievementCategory,
  AchievementProgress, 
  AchievementTrigger, 
  AchievementUnlock,
  PlayerAchievements,
  AchievementNotification
} from '../types/achievements';

interface AchievementManagerSaveData {
  playerAchievements: PlayerAchievements;
}

export class AchievementManager {
  private achievements: Map<string, Achievement> = new Map();
  private playerAchievements: PlayerAchievements;
  private eventListeners: Map<string, ((notification: AchievementNotification) => void)[]> = new Map();

  constructor() {
    this.playerAchievements = {
      unlocked: [],
      progress: new Map(),
      totalPoints: 0,
      categoryCounts: new Map(),
      lastUnlocked: undefined
    };
    this.initializeAchievements();
  }

  /**
   * Initialize all available achievements
   */
  private initializeAchievements(): void {
    const achievementDefs: Achievement[] = [
      // Trading Achievements
      {
        id: 'first_trade',
        name: 'First Trade',
        description: 'Complete your first commodity transaction',
        category: 'trading',
        rarity: 'common',
        icon: '🤝',
        requirements: [
          { type: 'action', key: 'trade_complete', value: 1, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 50 },
          { type: 'credits', amount: 500 }
        ],
        hidden: false,
        points: 10
      },
      {
        id: 'savvy_trader',
        name: 'Savvy Trader',
        description: 'Complete 50 profitable trades',
        category: 'trading',
        rarity: 'uncommon', 
        icon: '💰',
        requirements: [
          { type: 'stat', key: 'profitable_trades', value: 50, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 200 },
          { type: 'skill_points', amount: 2 }
        ],
        hidden: false,
        points: 25
      },
      {
        id: 'trade_baron',
        name: 'Trade Baron',
        description: 'Accumulate over 1,000,000 credits in total trading profits',
        category: 'trading',
        rarity: 'rare',
        icon: '👑',
        requirements: [
          { type: 'stat', key: 'total_trade_profit', value: 1000000, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 500 },
          { type: 'skill_points', amount: 5 },
          { type: 'title', title: 'Trade Baron' }
        ],
        hidden: false,
        points: 75
      },

      // Technical Achievements
      {
        id: 'first_repair',
        name: 'First Repair',
        description: 'Successfully repair a ship component',
        category: 'technical',
        rarity: 'common',
        icon: '🔧',
        requirements: [
          { type: 'action', key: 'ship_repair', value: 1, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 25 }
        ],
        hidden: false,
        points: 10
      },
      {
        id: 'master_engineer',
        name: 'Master Engineer',
        description: 'Reach Engineering skill level 50',
        category: 'technical',
        rarity: 'uncommon',
        icon: '⚙️',
        requirements: [
          { type: 'stat', key: 'engineering_skill', value: 50, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 300 },
          { type: 'skill_points', amount: 3 }
        ],
        hidden: false,
        points: 40
      },
      {
        id: 'ship_builder',
        name: 'Ship Builder', 
        description: 'Construct your first custom ship',
        category: 'technical',
        rarity: 'rare',
        icon: '🚢',
        requirements: [
          { type: 'action', key: 'ship_construction', value: 1, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 400 },
          { type: 'skill_points', amount: 4 }
        ],
        hidden: false,
        points: 60
      },

      // Exploration Achievements
      {
        id: 'first_jump',
        name: 'First Jump',
        description: 'Travel to another star system',
        category: 'exploration',
        rarity: 'common',
        icon: '🌟',
        requirements: [
          { type: 'stat', key: 'systems_visited', value: 2, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 75 }
        ],
        hidden: false,
        points: 15
      },
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Visit 25 different star systems',
        category: 'exploration',
        rarity: 'uncommon',
        icon: '🗺️',
        requirements: [
          { type: 'stat', key: 'systems_visited', value: 25, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 250 },
          { type: 'skill_points', amount: 2 }
        ],
        hidden: false,
        points: 35
      },

      // Social Achievements
      {
        id: 'networker',
        name: 'Networker',
        description: 'Establish relationships with 10 contacts',
        category: 'social',
        rarity: 'uncommon',
        icon: '🤝',
        requirements: [
          { type: 'stat', key: 'contacts_count', value: 10, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 150 },
          { type: 'skill_points', amount: 2 }
        ],
        hidden: false,
        points: 30
      },

      // Progression Achievements  
      {
        id: 'level_up',
        name: 'Level Up',
        description: 'Reach character level 2',
        category: 'progression',
        rarity: 'common',
        icon: '⬆️',
        requirements: [
          { type: 'stat', key: 'character_level', value: 2, comparison: 'gte' }
        ],
        rewards: [
          { type: 'skill_points', amount: 1 }
        ],
        hidden: false,
        points: 20
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'Reach character level 10', 
        category: 'progression',
        rarity: 'uncommon',
        icon: '🎖️',
        requirements: [
          { type: 'stat', key: 'character_level', value: 10, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 500 },
          { type: 'skill_points', amount: 5 }
        ],
        hidden: false,
        points: 50
      },

      // Milestone Achievements
      {
        id: 'first_million',
        name: 'First Million',
        description: 'Accumulate 1,000,000 credits',
        category: 'milestone',
        rarity: 'rare',
        icon: '💎',
        requirements: [
          { type: 'stat', key: 'current_credits', value: 1000000, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 300 },
          { type: 'skill_points', amount: 3 }
        ],
        hidden: false,
        points: 65
      },

      // Special/Hidden Achievements
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete 100 contracts without a single failure',
        category: 'special',
        rarity: 'epic',
        icon: '✨',
        requirements: [
          { type: 'stat', key: 'perfect_contracts_streak', value: 100, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 1000 },
          { type: 'skill_points', amount: 10 },
          { type: 'title', title: 'Perfectionist' }
        ],
        hidden: true,
        points: 150
      },

      // Phase 4.3: Character Progression Achievements
      {
        id: 'level_up',
        name: 'Level Up!',
        description: 'Reach character level 2',
        category: 'progression',
        rarity: 'common',
        icon: '⬆️',
        requirements: [
          { type: 'stat', key: 'character_level', value: 2, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 100 },
          { type: 'attribute_points', amount: 1 }
        ],
        hidden: false,
        points: 20
      },
      {
        id: 'skill_specialist',
        name: 'Skill Specialist',
        description: 'Reach level 50 in any skill',
        category: 'progression',
        rarity: 'uncommon',
        icon: '🎯',
        requirements: [
          { type: 'stat', key: 'max_skill_level', value: 50, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 300 },
          { type: 'skill_points', amount: 3 }
        ],
        hidden: false,
        points: 40
      },
      {
        id: 'jack_of_trades',
        name: 'Jack of All Trades',
        description: 'Have at least 25 in all skill categories',
        category: 'progression',
        rarity: 'rare',
        icon: '🔧',
        requirements: [
          { type: 'stat', key: 'min_skill_category', value: 25, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 500 },
          { type: 'skill_points', amount: 5 }
        ],
        hidden: false,
        points: 75
      },
      
      // Phase 4.3: Equipment and Enhancement Achievements
      {
        id: 'well_equipped',
        name: 'Well Equipped',
        description: 'Equip personal items in all 4 slots',
        category: 'equipment',
        rarity: 'common',
        icon: '🎒',
        requirements: [
          { type: 'stat', key: 'equipped_slots', value: 4, comparison: 'gte' }
        ],
        rewards: [
          { type: 'experience', amount: 150 },
          { type: 'credits', amount: 1000 }
        ],
        hidden: false,
        points: 25
      },
      {
        id: 'experience_seeker',
        name: 'Experience Seeker',
        description: 'Gain 1000 total experience points',
        category: 'progression',
        rarity: 'uncommon',
        icon: '📈',
        requirements: [
          { type: 'stat', key: 'total_experience', value: 1000, comparison: 'gte' }
        ],
        rewards: [
          { type: 'skill_points', amount: 2 },
          { type: 'attribute_points', amount: 1 }
        ],
        hidden: false,
        points: 30
      }
    ];

    // Register all achievements
    achievementDefs.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  /**
   * Check achievement progress when a game event occurs
   */
  processAchievementTrigger(trigger: AchievementTrigger, playerStats: Record<string, any>): AchievementNotification[] {
    const notifications: AchievementNotification[] = [];

    // Check all achievements for progress updates
    for (const [achievementId, achievement] of this.achievements) {
      // Skip already unlocked achievements
      if (this.playerAchievements.unlocked.includes(achievementId)) {
        continue;
      }

      // Check prerequisites
      if (achievement.prerequisite && !this.hasPrerequisites(achievement.prerequisite)) {
        continue;
      }

      let progressUpdated = false;
      let currentProgress = this.playerAchievements.progress.get(achievementId);
      
      if (!currentProgress) {
        currentProgress = {
          achievementId,
          progress: new Map(),
          completed: false
        };
        this.playerAchievements.progress.set(achievementId, currentProgress);
      }

      // Check each requirement
      for (const requirement of achievement.requirements) {
        const oldValue = currentProgress.progress.get(requirement.key) || 0;
        let newValue = oldValue;

        // Update progress based on trigger type and requirement
        if (requirement.type === 'action' && trigger.type === requirement.key) {
          newValue = oldValue + 1;
          progressUpdated = true;
        } else if (requirement.type === 'stat' && playerStats[requirement.key] !== undefined) {
          newValue = playerStats[requirement.key];
          if (newValue !== oldValue) {
            progressUpdated = true;
          }
        }

        currentProgress.progress.set(requirement.key, newValue);
      }

      // Check if achievement is now completed
      if (progressUpdated && this.isAchievementCompleted(achievement, currentProgress)) {
        const unlock = this.unlockAchievement(achievementId);
        if (unlock) {
          notifications.push({
            achievement,
            isNew: true
          });
        }
      } else if (progressUpdated) {
        // Progress update notification
        const progress = this.calculateAchievementProgress(achievement, currentProgress);
        notifications.push({
          achievement,
          isNew: false,
          progress
        });
      }
    }

    return notifications;
  }

  /**
   * Check if an achievement's requirements are met
   */
  private isAchievementCompleted(achievement: Achievement, progress: AchievementProgress): boolean {
    return achievement.requirements.every(req => {
      const currentValue = progress.progress.get(req.key) || 0;
      const targetValue = typeof req.value === 'number' ? req.value : 0;
      const comparison = req.comparison || 'gte';

      switch (comparison) {
        case 'gte': return currentValue >= targetValue;
        case 'lte': return currentValue <= targetValue;
        case 'gt': return currentValue > targetValue;
        case 'lt': return currentValue < targetValue;
        case 'eq': return currentValue === targetValue;
        default: return false;
      }
    });
  }

  /**
   * Calculate current progress percentage for an achievement
   */
  private calculateAchievementProgress(achievement: Achievement, progress: AchievementProgress): { current: number, total: number, percentage: number } {
    if (achievement.requirements.length === 0) {
      return { current: 0, total: 1, percentage: 0 };
    }

    // For simplicity, use the first requirement's progress
    const firstReq = achievement.requirements[0];
    const current = progress.progress.get(firstReq.key) || 0;
    const total = typeof firstReq.value === 'number' ? firstReq.value : 1;
    const percentage = Math.min(100, (current / total) * 100);

    return { current, total, percentage };
  }

  /**
   * Unlock an achievement and apply rewards
   */
  private unlockAchievement(achievementId: string): AchievementUnlock | null {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || this.playerAchievements.unlocked.includes(achievementId)) {
      return null;
    }

    // Add to unlocked list
    this.playerAchievements.unlocked.push(achievementId);
    this.playerAchievements.totalPoints += achievement.points;

    // Update category count
    const currentCount = this.playerAchievements.categoryCounts.get(achievement.category) || 0;
    this.playerAchievements.categoryCounts.set(achievement.category, currentCount + 1);

    // Remove from progress tracking
    this.playerAchievements.progress.delete(achievementId);

    // Create unlock record
    const unlock: AchievementUnlock = {
      achievement,
      dateEarned: new Date(),
      rewards: achievement.rewards || []
    };

    this.playerAchievements.lastUnlocked = unlock;

    // Emit unlock event
    this.emitEvent('achievement_unlocked', {
      achievement,
      isNew: true
    });

    return unlock;
  }

  /**
   * Check if prerequisites are met
   */
  private hasPrerequisites(prerequisites: string[]): boolean {
    return prerequisites.every(prereq => this.playerAchievements.unlocked.includes(prereq));
  }

  /**
   * Get all available achievements (non-hidden or unlocked)
   */
  getAvailableAchievements(): Achievement[] {
    return Array.from(this.achievements.values())
      .filter(achievement => !achievement.hidden || this.playerAchievements.unlocked.includes(achievement.id));
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.category === category && 
              (!achievement.hidden || this.playerAchievements.unlocked.includes(achievement.id)));
  }

  /**
   * Get player's achievement progress for a specific achievement
   */
  getAchievementProgress(achievementId: string): AchievementProgress | null {
    return this.playerAchievements.progress.get(achievementId) || null;
  }

  /**
   * Get player's achievement statistics
   */
  getPlayerAchievements(): PlayerAchievements {
    return { ...this.playerAchievements };
  }

  /**
   * Get specific achievement by ID
   */
  getAchievement(achievementId: string): Achievement | null {
    return this.achievements.get(achievementId) || null;
  }

  /**
   * Check if player has unlocked specific achievement
   */
  hasAchievement(achievementId: string): boolean {
    return this.playerAchievements.unlocked.includes(achievementId);
  }

  /**
   * Get recently unlocked achievements (within last N unlocks)
   */
  getRecentUnlocks(_count: number = 5): AchievementUnlock[] {
    if (!this.playerAchievements.lastUnlocked) {
      return [];
    }
    // For simplicity, just return the last unlocked. In a full implementation,
    // we'd maintain a history of recent unlocks
    return [this.playerAchievements.lastUnlocked];
  }

  /**
   * Add event listener for achievement events
   */
  addEventListener(event: string, callback: (notification: AchievementNotification) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (notification: AchievementNotification) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: string, notification: AchievementNotification): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(notification));
  }

  /**
   * Serialize achievement data for save/load
   */
  serialize(): AchievementManagerSaveData {
    return {
      playerAchievements: {
        ...this.playerAchievements,
        progress: this.playerAchievements.progress,
        categoryCounts: this.playerAchievements.categoryCounts
      }
    };
  }

  /**
   * Load achievement data from save
   */
  deserialize(data: AchievementManagerSaveData): void {
    if (data.playerAchievements) {
      this.playerAchievements = {
        ...data.playerAchievements,
        progress: data.playerAchievements.progress || new Map(),
        categoryCounts: data.playerAchievements.categoryCounts || new Map()
      };
    }
  }
}