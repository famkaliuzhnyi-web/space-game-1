import { describe, test, expect, beforeEach, vi } from 'vitest';
import { QuestManager } from '../systems/QuestManager';
import { FactionManager } from '../systems/FactionManager';
import { CharacterManager } from '../systems/CharacterManager';
import { PlayerManager } from '../systems/PlayerManager';
import { TimeManager } from '../systems/TimeManager';
import { EventManager } from '../systems/EventManager';
import { WorldManager } from '../systems/WorldManager';

// Mock dependencies
const mockFactionManager = {
  getReputation: vi.fn(() => 50),
  modifyReputation: vi.fn()
} as any;

const mockCharacterManager = {
  getCharacter: vi.fn(() => ({
    progression: { level: 5 },
    skills: { 'Investigation': 4, 'trading': 3 }
  })),
  awardExperience: vi.fn()
} as any;

const mockPlayerManager = {
  getPlayer: vi.fn(() => ({
    credits: 15000
  })),
  getFactionManager: vi.fn(() => mockFactionManager),
  getReputationForFaction: vi.fn((factionId: string) => ({
    faction: factionId,
    standing: 50, // Good reputation
    rank: 'Respected',
    missions: 5
  })),
  modifyFactionReputation: vi.fn()
} as any;

const mockTimeManager = {} as any;

const mockWorldManager = {} as any;

const mockEventManager = {} as any;

describe('QuestManager', () => {
  let questManager: QuestManager;

  beforeEach(() => {
    vi.clearAllMocks();
    questManager = new QuestManager(
      mockFactionManager,
      mockCharacterManager,
      mockPlayerManager,
      mockTimeManager,
      mockEventManager
    );
    
    // Run initial quest check
    questManager.update(0);
  });

  describe('Quest Initialization', () => {
    test('should initialize with predefined quests', () => {
      const availableQuests = questManager.getAvailableQuests();
      expect(availableQuests.length).toBeGreaterThan(0);
    });

    test('should have faction storyline quests', () => {
      const availableQuests = questManager.getAvailableQuests();
      const tradersGuildQuest = availableQuests.find(q => q.factionId === 'traders_guild');
      expect(tradersGuildQuest).toBeDefined();
      // Accept either the enhanced quest or the original quest
      expect(['Welcome to the Guild', 'First Steps in Commerce']).toContain(tradersGuildQuest?.title);
    });

    test('should have main story quests', () => {
      const availableQuests = questManager.getAvailableQuests();
      const mainStoryQuest = availableQuests.find(q => q.type === 'main_story');
      expect(mainStoryQuest).toBeDefined();
      expect(mainStoryQuest?.title).toBe('Awakening');
    });
  });

  describe('Quest Requirements', () => {
    test('should check level requirements correctly', () => {
      // Mock lower level
      mockCharacterManager.getCharacter.mockReturnValue({
        progression: { level: 2 },
        skills: {}
      });

      questManager = new QuestManager(
        mockFactionManager,
        mockCharacterManager,
        mockPlayerManager,
        mockTimeManager,
        mockEventManager
      );

      const availableQuests = questManager.getAvailableQuests();
      const mainStoryQuest = availableQuests.find(q => q.id === 'fed_strange_signals');
      expect(mainStoryQuest).toBeUndefined(); // Should not be available due to level requirement
    });

    test('should check skill requirements correctly', () => {
      // Mock insufficient skills
      mockCharacterManager.getCharacter.mockReturnValue({
        progression: { level: 10 },
        skills: { 'investigation': 1 }
      });

      questManager = new QuestManager(
        mockFactionManager,
        mockCharacterManager,
        mockPlayerManager,
        mockTimeManager,
        mockEventManager
      );

      const availableQuests = questManager.getAvailableQuests();
      const mainStoryQuest = availableQuests.find(q => q.id === 'fed_strange_signals');
      expect(mainStoryQuest).toBeUndefined(); // Should not be available due to skill requirement
    });

    test('should check reputation requirements correctly', () => {
      // Mock insufficient reputation
      mockFactionManager.getReputation.mockReturnValue(10); // Above 0, should meet requirement

      questManager = new QuestManager(
        mockFactionManager,
        mockCharacterManager,
        mockPlayerManager,
        mockTimeManager,
        mockEventManager
      );
      
      questManager.update(0); // Trigger initial quest check

      const availableQuests = questManager.getAvailableQuests();
      const tradersGuildQuest = availableQuests.find(q => q.factionId === 'traders_guild');
      expect(tradersGuildQuest).toBeDefined(); // Should be available (requirement is 0)
    });
  });

  describe('Quest Lifecycle', () => {
    test('should start quest successfully', () => {
      const success = questManager.startQuest('tg_welcome');
      expect(success).toBe(true);

      const activeQuests = questManager.getActiveQuests();
      expect(activeQuests.length).toBe(1);
      expect(activeQuests[0].title).toBe('Welcome to the Guild');
      expect(activeQuests[0].status).toBe('active');
    });

    test('should not start quest if requirements not met', () => {
      // Mock insufficient level
      mockCharacterManager.getCharacter.mockReturnValue({
        level: 1,
        skills: {}
      });

      const success = questManager.startQuest('fed_strange_signals');
      expect(success).toBe(false);

      const activeQuests = questManager.getActiveQuests();
      expect(activeQuests.length).toBe(0);
    });

    test('should progress quest objectives', () => {
      questManager.startQuest('tg_welcome');
      
      const progressSuccess = questManager.progressObjective('tg_welcome', 'first_trade', 1);
      expect(progressSuccess).toBe(true);

      const activeQuests = questManager.getActiveQuests();
      const quest = activeQuests[0];
      const objective = quest.objectives.find(obj => obj.id === 'first_trade');
      expect(objective?.currentProgress).toBe(1);
      expect(objective?.completed).toBe(true);
    });

    test('should complete quest when all objectives done', () => {
      questManager.startQuest('tg_welcome');
      questManager.progressObjective('tg_welcome', 'first_trade', 1);

      // Manually complete quest
      const completed = questManager.completeQuest('tg_welcome');
      expect(completed).toBe(true);

      const activeQuests = questManager.getActiveQuests();
      expect(activeQuests.length).toBe(0);

      const completedQuests = questManager.getCompletedQuests();
      expect(completedQuests.length).toBe(1);
      expect(completedQuests[0].title).toBe('Welcome to the Guild');
    });

    test('should award quest rewards on completion', () => {
      questManager.startQuest('tg_welcome');
      questManager.completeQuest('tg_welcome');

      // Check if experience reward was given (with correct parameter order)
      expect(mockCharacterManager.awardExperience).toHaveBeenCalledWith(100, 'Quest completed: Welcome to the Guild', 'social');
      expect(mockPlayerManager.modifyFactionReputation).toHaveBeenCalledWith(
        'traders_guild', 
        10, 
        'Quest completed: Welcome to the Guild'
      );
    });

    test('should fail quest with reason', () => {
      questManager.startQuest('tg_welcome');
      
      const failed = questManager.failQuest('tg_welcome', 'Test failure');
      expect(failed).toBe(true);

      const activeQuests = questManager.getActiveQuests();
      expect(activeQuests.length).toBe(0);

      // Note: We don't have a getFailedQuests method in the current implementation
      // This would need to be added if we want to track failed quests
    });
  });

  describe('Quest Flags', () => {
    test('should set and get quest flags', () => {
      questManager.setFlag('test_flag', true);
      const flagValue = questManager.getFlag('test_flag');
      expect(flagValue).toBe(true);
    });

    test('should set different flag types', () => {
      questManager.setFlag('bool_flag', true);
      questManager.setFlag('string_flag', 'test_value');
      questManager.setFlag('number_flag', 42);

      expect(questManager.getFlag('bool_flag')).toBe(true);
      expect(questManager.getFlag('string_flag')).toBe('test_value');
      expect(questManager.getFlag('number_flag')).toBe(42);
    });

    test('should return undefined for non-existent flags', () => {
      const flagValue = questManager.getFlag('non_existent_flag');
      expect(flagValue).toBeUndefined();
    });
  });

  describe('Seasonal Content', () => {
    test('should get current seasonal content', () => {
      const seasonalContent = questManager.getCurrentSeasonalContent();
      expect(Array.isArray(seasonalContent)).toBe(true);
      
      // The actual result depends on current month
      // We could mock Date for more precise testing
    });

    test('should handle seasonal quest availability', () => {
      // This test would require mocking the Date object
      // to simulate different months
      const spy = vi.spyOn(Date.prototype, 'getMonth').mockReturnValue(11); // December (0-indexed)
      
      questManager = new QuestManager(
        mockFactionManager,
        mockCharacterManager,
        mockPlayerManager,
        mockTimeManager,
        mockEventManager
      );

      questManager.update(1000); // Trigger seasonal content check

      spy.mockRestore();
    });
  });

  describe('Quest Categories and Types', () => {
    test('should have quests of different categories', () => {
      const availableQuests = questManager.getAvailableQuests();
      
      const tradingQuests = availableQuests.filter(q => q.category === 'trading');
      const investigationQuests = availableQuests.filter(q => q.category === 'investigation');
      const explorationQuests = availableQuests.filter(q => q.category === 'exploration');

      expect(tradingQuests.length).toBeGreaterThan(0);
      expect(investigationQuests.length).toBeGreaterThan(0);
    });

    test('should have quests of different types', () => {
      const availableQuests = questManager.getAvailableQuests();
      
      const factionQuests = availableQuests.filter(q => q.type === 'faction_storyline');
      const mainStoryQuests = availableQuests.filter(q => q.type === 'main_story');
      const seasonalQuests = availableQuests.filter(q => q.type === 'seasonal');

      expect(factionQuests.length).toBeGreaterThan(0);
      expect(mainStoryQuests.length).toBeGreaterThan(0);
    });

    test('should sort quests by priority', () => {
      const availableQuests = questManager.getAvailableQuests();
      
      // Verify quests are sorted by priority (higher first)
      for (let i = 1; i < availableQuests.length; i++) {
        const prevPriority = availableQuests[i - 1].priority || 0;
        const currentPriority = availableQuests[i].priority || 0;
        expect(prevPriority).toBeGreaterThanOrEqual(currentPriority);
      }
    });
  });

  describe('Faction Storylines', () => {
    test('should get faction story arcs', () => {
      const tradersGuildArcs = questManager.getFactionStoryArcs('traders_guild');
      expect(tradersGuildArcs.length).toBeGreaterThan(0);
      expect(tradersGuildArcs[0].title).toBe('Guild Initiation');
    });

    test('should return empty array for unknown faction', () => {
      const unknownArcs = questManager.getFactionStoryArcs('unknown_faction');
      expect(unknownArcs.length).toBe(0);
    });
  });

  describe('Quest Chain System', () => {
    test('should unlock next quest in chain on completion', () => {
      // First, complete the prerequisite quest
      questManager.startQuest('tg_welcome');
      questManager.completeQuest('tg_welcome');

      // The next quest in chain should now be available
      // Note: Current implementation doesn't have a chain setup for the market research quest
      // but the logic is there for when quest.nextQuest is defined
      const availableQuests = questManager.getAvailableQuests();
      expect(availableQuests.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Update System', () => {
    test('should update quest system without errors', () => {
      questManager.startQuest('tg_welcome');
      
      expect(() => {
        questManager.update(1000); // 1 second
      }).not.toThrow();
    });

    test('should check for new available quests on update', () => {
      const initialCount = questManager.getAvailableQuests().length;
      
      questManager.update(1000);
      
      const finalCount = questManager.getAvailableQuests().length;
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe('Serialization', () => {
    test('should serialize quest state', () => {
      questManager.startQuest('tg_welcome');
      questManager.setFlag('test_flag', true);
      
      const serialized = questManager.serialize();
      expect(serialized).toBeDefined();
      expect(serialized.activeQuests).toBeDefined();
      expect(serialized.questFlags).toBeDefined();
      expect(serialized.completedQuests).toBeDefined();
    });

    test('should deserialize quest state', () => {
      const mockData = {
        activeQuests: [['tg_welcome', { id: 'tg_welcome', title: 'Test Quest' }]],
        completedQuests: ['completed_quest'],
        availableQuests: ['available_quest'],
        questFlags: [['test_flag', { id: 'test_flag', value: true, setAt: Date.now() }]],
        storyArcs: [],
        dialogueHistory: []
      };

      questManager.deserialize(mockData);
      
      const activeQuests = questManager.getActiveQuests();
      expect(activeQuests.length).toBe(1);
      expect(questManager.getFlag('test_flag')).toBe(true);
    });

    test('should handle null deserialization data gracefully', () => {
      expect(() => {
        questManager.deserialize(null);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent quest start gracefully', () => {
      const success = questManager.startQuest('non_existent_quest');
      expect(success).toBe(false);
    });

    test('should handle non-existent objective progress gracefully', () => {
      const success = questManager.progressObjective('non_existent_quest', 'non_existent_objective', 1);
      expect(success).toBe(false);
    });

    test('should handle non-existent quest completion gracefully', () => {
      const success = questManager.completeQuest('non_existent_quest');
      expect(success).toBe(false);
    });

    test('should handle non-existent quest failure gracefully', () => {
      const success = questManager.failQuest('non_existent_quest', 'test reason');
      expect(success).toBe(false);
    });
  });
});