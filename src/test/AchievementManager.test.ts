/**
 * Tests for the AchievementManager system
 * Validates achievement tracking, progress, and rewards
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AchievementManager } from '../systems/AchievementManager';
import { AchievementTrigger } from '../types/achievements';

describe('AchievementManager', () => {
  let achievementManager: AchievementManager;

  beforeEach(() => {
    achievementManager = new AchievementManager();
  });

  describe('Initialization', () => {
    it('should initialize with empty player achievements', () => {
      const playerAchievements = achievementManager.getPlayerAchievements();
      
      expect(playerAchievements.unlocked).toHaveLength(0);
      expect(playerAchievements.totalPoints).toBe(0);
      expect(playerAchievements.progress.size).toBe(0);
      expect(playerAchievements.categoryCounts.size).toBe(0);
    });

    it('should load predefined achievements', () => {
      const availableAchievements = achievementManager.getAvailableAchievements();
      
      expect(availableAchievements.length).toBeGreaterThan(0);
      
      // Check that some expected achievements exist
      const firstTrade = availableAchievements.find(a => a.id === 'first_trade');
      expect(firstTrade).toBeDefined();
      expect(firstTrade?.name).toBe('First Trade');
      expect(firstTrade?.category).toBe('trading');
    });

    it('should not show hidden achievements until unlocked', () => {
      const availableAchievements = achievementManager.getAvailableAchievements();
      const hiddenAchievements = availableAchievements.filter(a => a.hidden);
      
      expect(hiddenAchievements).toHaveLength(0);
    });
  });

  describe('Achievement Tracking', () => {
    it('should track progress for action-based achievements', () => {
      const trigger: AchievementTrigger = {
        type: 'trade_complete',
        data: { value: 1000 }
      };
      
      const playerStats = { trade_complete: 1 };
      const notifications = achievementManager.processAchievementTrigger(trigger, playerStats);
      
      // Should get a notification for unlocking the achievement
      expect(notifications.length).toBeGreaterThan(0);
      
      const unlockNotification = notifications.find(n => n.isNew && n.achievement.id === 'first_trade');
      expect(unlockNotification).toBeDefined();
      
      // Achievement should now be unlocked, not in progress
      expect(achievementManager.hasAchievement('first_trade')).toBe(true);
      const firstTradeProgress = achievementManager.getAchievementProgress('first_trade');
      expect(firstTradeProgress).toBeNull(); // Should be null since it's unlocked
    });

    it('should unlock achievement when requirements are met', () => {
      const trigger: AchievementTrigger = {
        type: 'trade_complete', 
        data: { value: 1000 }
      };
      
      const playerStats = { trade_complete: 1 };
      const notifications = achievementManager.processAchievementTrigger(trigger, playerStats);
      
      // Should unlock "First Trade" achievement
      const unlockNotification = notifications.find(n => n.isNew && n.achievement.id === 'first_trade');
      expect(unlockNotification).toBeDefined();
      
      // Check that achievement is now unlocked
      expect(achievementManager.hasAchievement('first_trade')).toBe(true);
      
      // Check points were awarded
      const playerAchievements = achievementManager.getPlayerAchievements();
      expect(playerAchievements.totalPoints).toBe(10); // First trade is worth 10 points
      expect(playerAchievements.unlocked).toContain('first_trade');
    });

    it('should track progress for stat-based achievements', () => {
      const trigger: AchievementTrigger = {
        type: 'trade_complete',
        data: {}
      };
      
      // Simulate having 25 profitable trades
      const playerStats = { profitable_trades: 25 };
      achievementManager.processAchievementTrigger(trigger, playerStats);
      
      const savvyTraderProgress = achievementManager.getAchievementProgress('savvy_trader');
      expect(savvyTraderProgress).toBeDefined();
      expect(savvyTraderProgress?.progress.get('profitable_trades')).toBe(25);
      
      // Should not be unlocked yet (needs 50)
      expect(achievementManager.hasAchievement('savvy_trader')).toBe(false);
    });

    it('should unlock stat-based achievements when threshold is reached', () => {
      const trigger: AchievementTrigger = {
        type: 'stat_update', // Use different trigger type to avoid action-based matching
        data: {}
      };
      
      // Reach the threshold for Savvy Trader
      const playerStats = { profitable_trades: 50 };
      const notifications = achievementManager.processAchievementTrigger(trigger, playerStats);
      
      const unlockNotification = notifications.find(n => n.isNew && n.achievement.id === 'savvy_trader');
      expect(unlockNotification).toBeDefined();
      expect(achievementManager.hasAchievement('savvy_trader')).toBe(true);
      
      const playerAchievements = achievementManager.getPlayerAchievements();
      expect(playerAchievements.totalPoints).toBe(25); // Savvy trader is worth 25 points
    });

    it('should not unlock same achievement twice', () => {
      const trigger: AchievementTrigger = {
        type: 'trade_complete',
        data: {}
      };
      
      // First trigger
      const playerStats1 = { trade_complete: 1 };
      achievementManager.processAchievementTrigger(trigger, playerStats1);
      expect(achievementManager.hasAchievement('first_trade')).toBe(true);
      
      // Second trigger - should not unlock again
      const playerStats2 = { trade_complete: 2 };
      const notifications2 = achievementManager.processAchievementTrigger(trigger, playerStats2);
      
      const unlockNotifications = notifications2.filter(n => n.isNew && n.achievement.id === 'first_trade');
      expect(unlockNotifications).toHaveLength(0);
      
      // Points should not be awarded again
      const playerAchievements = achievementManager.getPlayerAchievements();
      expect(playerAchievements.totalPoints).toBe(10); // Still just 10 points
    });
  });

  describe('Achievement Categories', () => {
    it('should organize achievements by category', () => {
      const tradingAchievements = achievementManager.getAchievementsByCategory('trading');
      const technicalAchievements = achievementManager.getAchievementsByCategory('technical');
      
      expect(tradingAchievements.length).toBeGreaterThan(0);
      expect(technicalAchievements.length).toBeGreaterThan(0);
      
      // All trading achievements should have trading category
      tradingAchievements.forEach(achievement => {
        expect(achievement.category).toBe('trading');
      });
    });

    it('should track category counts correctly', () => {
      // Unlock a trading achievement
      const trigger: AchievementTrigger = { type: 'trade_complete', data: {} };
      const playerStats = { trade_complete: 1 };
      achievementManager.processAchievementTrigger(trigger, playerStats);
      
      const playerAchievements = achievementManager.getPlayerAchievements();
      expect(playerAchievements.categoryCounts.get('trading')).toBe(1);
    });
  });

  describe('Achievement Progress', () => {
    it('should calculate progress percentage correctly', () => {
      const trigger: AchievementTrigger = { type: 'trade_complete', data: {} };
      
      // Progress toward Savvy Trader (needs 50 profitable trades)
      const playerStats = { profitable_trades: 25 };
      const notifications = achievementManager.processAchievementTrigger(trigger, playerStats);
      
      const progressNotification = notifications.find(n => !n.isNew && n.achievement.id === 'savvy_trader');
      expect(progressNotification).toBeDefined();
      expect(progressNotification?.progress?.percentage).toBe(50); // 25/50 = 50%
      expect(progressNotification?.progress?.current).toBe(25);
      expect(progressNotification?.progress?.total).toBe(50);
    });
  });

  describe('Achievement Queries', () => {
    it('should retrieve specific achievements', () => {
      const firstTrade = achievementManager.getAchievement('first_trade');
      expect(firstTrade).toBeDefined();
      expect(firstTrade?.id).toBe('first_trade');
      expect(firstTrade?.name).toBe('First Trade');
    });

    it('should return null for non-existent achievements', () => {
      const nonExistent = achievementManager.getAchievement('non_existent');
      expect(nonExistent).toBeNull();
    });

    it('should check achievement unlock status', () => {
      expect(achievementManager.hasAchievement('first_trade')).toBe(false);
      
      // Unlock it
      const trigger: AchievementTrigger = { type: 'trade_complete', data: {} };
      const playerStats = { trade_complete: 1 };
      achievementManager.processAchievementTrigger(trigger, playerStats);
      
      expect(achievementManager.hasAchievement('first_trade')).toBe(true);
    });
  });

  describe('Recent Unlocks', () => {
    it('should track recent unlocks', () => {
      // Unlock an achievement
      const trigger: AchievementTrigger = { type: 'trade_complete', data: {} };
      const playerStats = { trade_complete: 1 };
      achievementManager.processAchievementTrigger(trigger, playerStats);
      
      const recentUnlocks = achievementManager.getRecentUnlocks();
      expect(recentUnlocks).toHaveLength(1);
      expect(recentUnlocks[0].achievement.id).toBe('first_trade');
      expect(recentUnlocks[0].dateEarned).toBeInstanceOf(Date);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize achievement data', () => {
      // Unlock some achievements
      const trigger: AchievementTrigger = { type: 'trade_complete', data: {} };
      const playerStats = { trade_complete: 1, profitable_trades: 25 };
      achievementManager.processAchievementTrigger(trigger, playerStats);
      
      // Serialize
      const saveData = achievementManager.serialize();
      expect(saveData.playerAchievements.unlocked).toContain('first_trade');
      expect(saveData.playerAchievements.totalPoints).toBe(10);
      
      // Create new manager and deserialize
      const newManager = new AchievementManager();
      newManager.deserialize(saveData);
      
      // Check that data was restored
      expect(newManager.hasAchievement('first_trade')).toBe(true);
      const restoredAchievements = newManager.getPlayerAchievements();
      expect(restoredAchievements.totalPoints).toBe(10);
      expect(restoredAchievements.unlocked).toContain('first_trade');
    });
  });

  describe('Event System', () => {
    it('should emit events for achievement unlocks', () => {
      let eventFired = false;
      let receivedNotification: any = null;
      
      achievementManager.addEventListener('achievement_unlocked', (notification) => {
        eventFired = true;
        receivedNotification = notification;
      });
      
      // Unlock an achievement
      const trigger: AchievementTrigger = { type: 'trade_complete', data: {} };
      const playerStats = { trade_complete: 1 };
      achievementManager.processAchievementTrigger(trigger, playerStats);
      
      expect(eventFired).toBe(true);
      expect(receivedNotification.achievement.id).toBe('first_trade');
      expect(receivedNotification.isNew).toBe(true);
    });

    it('should remove event listeners', () => {
      let eventCount = 0;
      const callback = () => { eventCount++; };
      
      achievementManager.addEventListener('achievement_unlocked', callback);
      achievementManager.removeEventListener('achievement_unlocked', callback);
      
      // Unlock an achievement
      const trigger: AchievementTrigger = { type: 'trade_complete', data: {} };
      const playerStats = { trade_complete: 1 };
      achievementManager.processAchievementTrigger(trigger, playerStats);
      
      expect(eventCount).toBe(0); // Event should not have fired
    });
  });

  describe('Technical Achievements', () => {
    it('should track repair-based achievements', () => {
      const trigger: AchievementTrigger = { type: 'ship_repair', data: {} };
      const playerStats = { ship_repair: 1 };
      const notifications = achievementManager.processAchievementTrigger(trigger, playerStats);
      
      const unlockNotification = notifications.find(n => n.isNew && n.achievement.id === 'first_repair');
      expect(unlockNotification).toBeDefined();
      expect(achievementManager.hasAchievement('first_repair')).toBe(true);
    });

    it('should track skill-based achievements', () => {
      const trigger: AchievementTrigger = { type: 'skill_increase', data: {} };
      const playerStats = { engineering_skill: 50 };
      const notifications = achievementManager.processAchievementTrigger(trigger, playerStats);
      
      const unlockNotification = notifications.find(n => n.isNew && n.achievement.id === 'master_engineer');
      expect(unlockNotification).toBeDefined();
      expect(achievementManager.hasAchievement('master_engineer')).toBe(true);
      
      const playerAchievements = achievementManager.getPlayerAchievements();
      expect(playerAchievements.totalPoints).toBe(40); // Master engineer is worth 40 points
    });
  });

  describe('Exploration Achievements', () => {
    it('should track system visits', () => {
      const trigger: AchievementTrigger = { type: 'system_visit', data: {} };
      const playerStats = { systems_visited: 2 };
      const notifications = achievementManager.processAchievementTrigger(trigger, playerStats);
      
      const unlockNotification = notifications.find(n => n.isNew && n.achievement.id === 'first_jump');
      expect(unlockNotification).toBeDefined();
      expect(achievementManager.hasAchievement('first_jump')).toBe(true);
    });
  });

  describe('Milestone Achievements', () => {
    it('should track credit milestones', () => {
      const trigger: AchievementTrigger = { type: 'credits_earned', data: {} };
      const playerStats = { current_credits: 1000000 };
      const notifications = achievementManager.processAchievementTrigger(trigger, playerStats);
      
      const unlockNotification = notifications.find(n => n.isNew && n.achievement.id === 'first_million');
      expect(unlockNotification).toBeDefined();
      expect(achievementManager.hasAchievement('first_million')).toBe(true);
    });
  });
});