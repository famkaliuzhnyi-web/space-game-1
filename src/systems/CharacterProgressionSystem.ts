/**
 * Character Progression System
 * Handles experience awards from various gameplay activities and manages character advancement
 */

import { CharacterManager } from './CharacterManager';
import { ExperienceGain } from '../types/character';

export interface ExperienceSource {
  source: string;
  baseExperience: number;
  category: ExperienceGain['category'];
  description: string;
}

export interface ActivityData {
  value?: number;
  profitMargin?: number;
  riskLevel?: number;
  complexity?: number;
}

/**
 * System for calculating and awarding experience from gameplay activities
 */
export class CharacterProgressionSystem {
  private characterManager: CharacterManager;
  private achievementManager?: any; // AchievementManager reference
  private experienceSources: Map<string, ExperienceSource> = new Map();
  
  constructor(characterManager: CharacterManager) {
    this.characterManager = characterManager;
    this.initializeExperienceSources();
  }

  /**
   * Initialize all experience sources and their base values
   */
  private initializeExperienceSources(): void {
    const sources: ExperienceSource[] = [
      // Trading Activities
      { source: 'trade_buy', baseExperience: 2, category: 'trading', description: 'Purchasing commodities' },
      { source: 'trade_sell', baseExperience: 3, category: 'trading', description: 'Selling commodities' },
      { source: 'contract_complete', baseExperience: 25, category: 'trading', description: 'Completing trade contracts' },
      { source: 'profitable_trade', baseExperience: 5, category: 'trading', description: 'Making profitable trades' },
      { source: 'high_value_trade', baseExperience: 8, category: 'trading', description: 'High-value transactions' },
      
      // Technical Activities  
      { source: 'ship_repair', baseExperience: 4, category: 'technical', description: 'Repairing ship components' },
      { source: 'ship_maintenance', baseExperience: 2, category: 'technical', description: 'Maintaining ship systems' },
      { source: 'ship_construction', baseExperience: 15, category: 'technical', description: 'Building or modifying ships' },
      { source: 'equipment_upgrade', baseExperience: 8, category: 'technical', description: 'Upgrading equipment' },
      
      // Social Activities
      { source: 'reputation_gain', baseExperience: 3, category: 'social', description: 'Improving faction standing' },
      { source: 'contact_made', baseExperience: 10, category: 'social', description: 'Making new contacts' },
      { source: 'negotiation_success', baseExperience: 6, category: 'social', description: 'Successful negotiations' },
      
      // Exploration Activities
      { source: 'system_visit', baseExperience: 5, category: 'exploration', description: 'Visiting new systems' },
      { source: 'station_discovery', baseExperience: 12, category: 'exploration', description: 'Discovering new stations' },
      { source: 'route_optimization', baseExperience: 7, category: 'exploration', description: 'Finding efficient routes' },
      
      // Combat Activities (for future implementation)
      { source: 'combat_victory', baseExperience: 20, category: 'combat', description: 'Winning combat encounters' },
      { source: 'threat_avoided', baseExperience: 8, category: 'combat', description: 'Successfully avoiding dangers' }
    ];

    sources.forEach(source => {
      this.experienceSources.set(source.source, source);
    });
  }

  /**
   * Award experience for a trading activity
   */
  awardTradingExperience(activity: string, data: ActivityData = {}): boolean {
    const source = this.experienceSources.get(activity);
    if (!source) return false;

    let experience = source.baseExperience;

    // Apply multipliers based on activity data
    if (data.value) {
      // Higher value trades give more experience (logarithmic scaling)
      const valueMultiplier = 1 + Math.log10(Math.max(1, data.value / 1000));
      experience *= Math.min(3, valueMultiplier); // Cap at 3x
    }

    if (data.profitMargin) {
      // Better profit margins give bonus experience
      const profitMultiplier = 1 + Math.max(0, data.profitMargin / 100);
      experience *= Math.min(2, profitMultiplier); // Cap at 2x
    }

    const result = this.characterManager.awardExperience(
      Math.floor(experience), 
      source.description, 
      source.category
    );

    // Trigger achievement checks if experience was awarded
    if (result) {
      this.triggerAchievementChecks(activity, Math.floor(experience), source.category);
    }

    return result;
  }

  /**
   * Award experience for technical activities
   */
  awardTechnicalExperience(activity: string, data: ActivityData = {}): boolean {
    const source = this.experienceSources.get(activity);
    if (!source) return false;

    let experience = source.baseExperience;

    // Apply complexity bonus for technical work
    if (data.complexity) {
      const complexityMultiplier = 1 + (data.complexity / 10);
      experience *= Math.min(2.5, complexityMultiplier); // Cap at 2.5x
    }

    if (data.value) {
      // More expensive repairs/constructions give more experience
      const valueMultiplier = 1 + Math.log10(Math.max(1, data.value / 500));
      experience *= Math.min(2, valueMultiplier); // Cap at 2x
    }

    const result = this.characterManager.awardExperience(
      Math.floor(experience), 
      source.description, 
      source.category
    );

    // Trigger achievement checks if experience was awarded
    if (result) {
      this.triggerAchievementChecks(activity, Math.floor(experience), source.category);
    }

    return result;
  }

  /**
   * Award experience for social activities
   */
  awardSocialExperience(activity: string, data: ActivityData = {}): boolean {
    const source = this.experienceSources.get(activity);
    if (!source) return false;

    let experience = source.baseExperience;

    // Apply relationship/reputation bonuses
    if (data.value) {
      // Higher reputation gains or relationship improvements give more XP
      const socialMultiplier = 1 + Math.abs(data.value) / 25;
      experience *= Math.min(2, socialMultiplier); // Cap at 2x
    }

    const result = this.characterManager.awardExperience(
      Math.floor(experience), 
      source.description, 
      source.category
    );

    // Trigger achievement checks if experience was awarded
    if (result) {
      this.triggerAchievementChecks(activity, Math.floor(experience), source.category);
    }

    return result;
  }

  /**
   * Award experience for exploration activities
   */
  awardExplorationExperience(activity: string, data: ActivityData = {}): boolean {
    const source = this.experienceSources.get(activity);
    if (!source) return false;

    let experience = source.baseExperience;

    // First-time bonuses for exploration
    if (data.riskLevel) {
      // Riskier exploration gives more experience
      const riskMultiplier = 1 + (data.riskLevel / 5);
      experience *= Math.min(2, riskMultiplier); // Cap at 2x
    }

    const result = this.characterManager.awardExperience(
      Math.floor(experience), 
      source.description, 
      source.category
    );

    // Trigger achievement checks if experience was awarded
    if (result) {
      this.triggerAchievementChecks(activity, Math.floor(experience), source.category);
    }

    return result;
  }

  /**
   * Get all available experience sources for documentation
   */
  getExperienceSources(): ExperienceSource[] {
    return Array.from(this.experienceSources.values());
  }

  /**
   * Calculate potential experience for an activity (for UI preview)
   */
  calculateExperiencePreview(activity: string, data: ActivityData = {}): number {
    const source = this.experienceSources.get(activity);
    if (!source) return 0;

    let experience = source.baseExperience;

    // Apply the same multiplier logic as the award methods
    if (source.category === 'trading') {
      if (data.value) {
        const valueMultiplier = 1 + Math.log10(Math.max(1, data.value / 1000));
        experience *= Math.min(3, valueMultiplier);
      }
      if (data.profitMargin) {
        const profitMultiplier = 1 + Math.max(0, data.profitMargin / 100);
        experience *= Math.min(2, profitMultiplier);
      }
    } else if (source.category === 'technical') {
      if (data.complexity) {
        const complexityMultiplier = 1 + (data.complexity / 10);
        experience *= Math.min(2.5, complexityMultiplier);
      }
      if (data.value) {
        const valueMultiplier = 1 + Math.log10(Math.max(1, data.value / 500));
        experience *= Math.min(2, valueMultiplier);
      }
    } else if (source.category === 'social') {
      if (data.value) {
        const socialMultiplier = 1 + Math.abs(data.value) / 25;
        experience *= Math.min(2, socialMultiplier);
      }
    } else if (source.category === 'exploration') {
      if (data.riskLevel) {
        const riskMultiplier = 1 + (data.riskLevel / 5);
        experience *= Math.min(2, riskMultiplier);
      }
    }

    return Math.floor(experience);
  }

  /**
   * Get character's current progression state
   */
  getProgressionState() {
    const character = this.characterManager.getCharacter();
    if (!character) return null;

    return {
      level: character.progression.level,
      experience: character.progression.experience,
      experienceToNext: character.progression.experienceToNext,
      skillPoints: character.progression.skillPoints,
      attributePoints: character.progression.attributePoints
    };
  }

  /**
   * Set achievement manager for triggering achievements on experience gain
   */
  setAchievementManager(achievementManager: any): void {
    this.achievementManager = achievementManager;
  }

  /**
   * Trigger achievement checks when experience is awarded
   */
  private triggerAchievementChecks(activity: string, _experienceGained: number, _category: string): void {
    if (!this.achievementManager) return;

    // Map activity to achievement triggers
    const activityMap: { [key: string]: string } = {
      'trade_buy': 'trade_complete',
      'trade_sell': 'trade_complete', 
      'contract_complete': 'contract_complete',
      'ship_repair': 'ship_repair',
      'ship_maintenance': 'ship_maintenance',
      'contact_made': 'contact_made',
      'system_visit': 'system_visit'
    };

    const achievementKey = activityMap[activity];
    if (achievementKey && typeof this.achievementManager.triggerAction === 'function') {
      this.achievementManager.triggerAction(achievementKey, 1);
    }

    // Trigger experience-based achievements
    const character = this.characterManager.getCharacter();
    if (character && typeof this.achievementManager.triggerAction === 'function') {
      this.achievementManager.triggerAction('experience_gained', character.progression.experience);
      this.achievementManager.triggerAction('level_reached', character.progression.level);
    }
  }
}