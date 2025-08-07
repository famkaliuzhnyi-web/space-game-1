/**
 * CharacterManager Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterManager } from '../systems/CharacterManager';
import { CharacterAppearance, PersonalItem } from '../types/character';

describe('CharacterManager', () => {
  let characterManager: CharacterManager;
  let testAppearance: CharacterAppearance;

  beforeEach(() => {
    characterManager = new CharacterManager();
    testAppearance = {
      gender: 'male',
      skinTone: 'medium',
      hairColor: 'brown',
      eyeColor: 'blue',
      age: 30,
      portrait: 'default-male'
    };
  });

  describe('Character Creation', () => {
    it('should create a character with default values', () => {
      const character = characterManager.createCharacter(
        'test-char-1',
        'Test Pilot',
        testAppearance,
        'pilot'
      );

      expect(character).toBeDefined();
      expect(character.id).toBe('test-char-1');
      expect(character.name).toBe('Test Pilot');
      expect(character.appearance).toEqual(testAppearance);
      expect(character.background.id).toBe('pilot');
    });

    it('should apply background bonuses correctly', () => {
      const character = characterManager.createCharacter(
        'merchant-test',
        'Merchant Test',
        testAppearance,
        'merchant'
      );

      // Merchant background gives charisma +5, intelligence +3
      expect(character.attributes.charisma).toBe(15); // 10 base + 5 bonus
      expect(character.attributes.intelligence).toBe(13); // 10 base + 3 bonus
      
      // Merchant skills: trading +15, negotiation +10, economics +8
      expect(character.skills.trading).toBe(15);
      expect(character.skills.negotiation).toBe(10);
      expect(character.skills.economics).toBe(8);
    });

    it('should apply allocated attribute points correctly', () => {
      const allocatedAttributes = {
        strength: 10,
        dexterity: 5
      };

      const character = characterManager.createCharacter(
        'test-char-2',
        'Strong Pilot',
        testAppearance,
        'pilot',
        allocatedAttributes
      );

      // Pilot gives dexterity +8, perception +5, plus our allocation
      expect(character.attributes.strength).toBe(20); // 10 base + 10 allocated
      expect(character.attributes.dexterity).toBe(23); // 10 base + 8 pilot bonus + 5 allocated
      expect(character.progression.totalAttributePointsSpent).toBe(15);
    });

    it('should apply allocated skill points correctly', () => {
      const allocatedSkills = {
        trading: 20,
        combat: 15
      };

      const character = characterManager.createCharacter(
        'test-char-3',
        'Trader Fighter',
        testAppearance,
        'merchant',
        {},
        allocatedSkills
      );

      // Merchant gives trading +15, plus our 20 allocation
      expect(character.skills.trading).toBe(35); // 15 background + 20 allocated
      expect(character.skills.combat).toBe(15); // 0 background + 15 allocated
      expect(character.progression.totalSkillPointsSpent).toBe(35);
    });

    it('should set initial progression values correctly', () => {
      const character = characterManager.createCharacter(
        'test-char-4',
        'New Pilot',
        testAppearance,
        'pilot'
      );

      expect(character.progression.level).toBe(1);
      expect(character.progression.experience).toBe(0);
      expect(character.progression.experienceToNext).toBe(300); // 100 * 2 * 1.5
      expect(character.progression.skillPoints).toBe(0);
      expect(character.progression.attributePoints).toBe(0);
    });
  });

  describe('Experience and Leveling', () => {
    beforeEach(() => {
      characterManager.createCharacter('test-char', 'Test', testAppearance, 'pilot');
    });

    it('should award experience correctly', () => {
      const awarded = characterManager.awardExperience(100, 'Test Trade', 'trading');
      
      expect(awarded).toBe(false); // No level up yet
      const character = characterManager.getCharacter()!;
      expect(character.progression.experience).toBe(100);
    });

    it('should handle level up correctly', () => {
      const leveledUp = characterManager.awardExperience(300, 'Big Trade', 'trading');
      
      expect(leveledUp).toBe(true);
      const character = characterManager.getCharacter()!;
      expect(character.progression.level).toBe(2);
      expect(character.progression.skillPoints).toBe(3); // 3 points per level
      expect(character.progression.attributePoints).toBe(0); // Only every 3 levels
    });

    it('should award attribute points every 3 levels', () => {
      // With new formula: Level 2 needs 300 XP, Level 3 needs 450 XP, Level 4 needs 600 XP  
      // To reach level 3: need 300 + 150 = 450 XP
      characterManager.awardExperience(450, 'Massive XP', 'trading');
      
      const character = characterManager.getCharacter()!;
      expect(character.progression.level).toBe(3);
      expect(character.progression.attributePoints).toBe(1); // Should get 1 at level 3
      expect(character.progression.skillPoints).toBe(6); // 3 per level × 2 level ups
    });

    it('should handle multiple level ups in one experience award', () => {
      // Award enough XP to go from level 1 to 4
      characterManager.awardExperience(1000, 'Huge XP Gain', 'trading');
      
      const character = characterManager.getCharacter()!;
      expect(character.progression.level).toBeGreaterThanOrEqual(4);
      expect(character.progression.skillPoints).toBeGreaterThan(6);
      expect(character.progression.attributePoints).toBeGreaterThan(0);
    });
  });

  describe('Skill Advancement', () => {
    beforeEach(() => {
      const character = characterManager.createCharacter('test-char', 'Test', testAppearance, 'pilot');
      // Give some skill points
      character.progression.skillPoints = 20;
    });

    it('should increase skills correctly', () => {
      const success = characterManager.increaseSkill('trading', 10);
      
      expect(success).toBe(true);
      const character = characterManager.getCharacter()!;
      expect(character.skills.trading).toBe(10);
      expect(character.progression.skillPoints).toBe(10);
      expect(character.skillHistory.length).toBe(1);
    });

    it('should reject skill increases without enough points', () => {
      const success = characterManager.increaseSkill('trading', 25);
      
      expect(success).toBe(false);
      const character = characterManager.getCharacter()!;
      expect(character.skills.trading).toBe(0);
      expect(character.progression.skillPoints).toBe(20);
    });

    it('should cap skills at 100', () => {
      const character = characterManager.getCharacter()!;
      character.skills.trading = 95;
      
      const success = characterManager.increaseSkill('trading', 10);
      
      expect(success).toBe(true);
      expect(character.skills.trading).toBe(100); // Capped at 100
      expect(character.progression.skillPoints).toBe(15); // Only spent 5 points
    });

    it('should record skill history correctly', () => {
      characterManager.increaseSkill('combat', 5);
      characterManager.increaseSkill('combat', 3);
      
      const character = characterManager.getCharacter()!;
      expect(character.skillHistory.length).toBe(2);
      expect(character.skillHistory[0].skillName).toBe('combat');
      expect(character.skillHistory[0].oldValue).toBe(0);
      expect(character.skillHistory[0].newValue).toBe(5);
      expect(character.skillHistory[1].oldValue).toBe(5);
      expect(character.skillHistory[1].newValue).toBe(8);
    });
  });

  describe('Attribute Advancement', () => {
    beforeEach(() => {
      const character = characterManager.createCharacter('test-char', 'Test', testAppearance, 'pilot');
      character.progression.attributePoints = 10;
    });

    it('should increase attributes correctly', () => {
      const success = characterManager.increaseAttribute('strength', 5);
      
      expect(success).toBe(true);
      const character = characterManager.getCharacter()!;
      expect(character.attributes.strength).toBe(15); // 10 base + 5
      expect(character.progression.attributePoints).toBe(5);
    });

    it('should reject attribute increases without enough points', () => {
      const success = characterManager.increaseAttribute('strength', 15);
      
      expect(success).toBe(false);
      const character = characterManager.getCharacter()!;
      expect(character.attributes.strength).toBe(10);
      expect(character.progression.attributePoints).toBe(10);
    });

    it('should cap attributes at 100', () => {
      const character = characterManager.getCharacter()!;
      character.attributes.strength = 95;
      
      const success = characterManager.increaseAttribute('strength', 10);
      
      expect(success).toBe(true);
      expect(character.attributes.strength).toBe(100);
      expect(character.progression.attributePoints).toBe(5); // Only spent 5 points
    });
  });

  describe('Personal Equipment', () => {
    let testItem: PersonalItem;

    beforeEach(() => {
      characterManager.createCharacter('test-char', 'Test', testAppearance, 'pilot');
      testItem = {
        id: 'test-suit',
        name: 'Test Space Suit',
        type: 'suit',
        description: 'A test suit',
        rarity: 'common',
        effects: {
          strengthBonus: 5,
          enduranceBonus: 3
        },
        cost: 1000,
        durability: 1.0,
        maxDurability: 1.0
      };
    });

    it('should equip personal items correctly', () => {
      const success = characterManager.equipPersonalItem(testItem);
      
      expect(success).toBe(true);
      const character = characterManager.getCharacter()!;
      expect(character.personalEquipment.suit).toEqual(testItem);
    });

    it('should unequip personal items correctly', () => {
      characterManager.equipPersonalItem(testItem);
      const unequipped = characterManager.unequipPersonalItem('suit');
      
      expect(unequipped).toEqual(testItem);
      const character = characterManager.getCharacter()!;
      expect(character.personalEquipment.suit).toBe(null);
    });

    it('should calculate equipment bonuses correctly', () => {
      characterManager.equipPersonalItem(testItem);
      const bonuses = characterManager.getEquipmentAttributeBonuses();
      
      expect(bonuses.strength).toBe(5);
      expect(bonuses.endurance).toBe(3);
    });

    it('should calculate effective attributes with equipment', () => {
      characterManager.equipPersonalItem(testItem);
      const effective = characterManager.getEffectiveAttributes();
      
      // Base pilot attributes + equipment bonuses
      const character = characterManager.getCharacter()!;
      expect(effective.strength).toBe(character.attributes.strength + 5);
      expect(effective.endurance).toBe(character.attributes.endurance + 3);
    });
  });

  describe('Background System', () => {
    it('should provide available backgrounds', () => {
      const backgrounds = characterManager.getAvailableBackgrounds();
      
      expect(backgrounds.length).toBeGreaterThan(0);
      expect(backgrounds.some(bg => bg.id === 'merchant')).toBe(true);
      expect(backgrounds.some(bg => bg.id === 'pilot')).toBe(true);
      expect(backgrounds.some(bg => bg.id === 'engineer')).toBe(true);
      expect(backgrounds.some(bg => bg.id === 'explorer')).toBe(true);
    });

    it('should have valid background data', () => {
      const backgrounds = characterManager.getAvailableBackgrounds();
      
      backgrounds.forEach(bg => {
        expect(bg.id).toBeTruthy();
        expect(bg.name).toBeTruthy();
        expect(bg.description).toBeTruthy();
        expect(bg.startingAttributeBonus).toBeDefined();
        expect(bg.startingSkillBonus).toBeDefined();
        expect(Array.isArray(bg.startingEquipment)).toBe(true);
        expect(typeof bg.startingCredits).toBe('number');
      });
    });
  });

  describe('Serialization', () => {
    beforeEach(() => {
      characterManager.createCharacter('test-char', 'Test', testAppearance, 'pilot');
      characterManager.awardExperience(100, 'Test XP', 'trading');
    });

    it('should serialize character data correctly', () => {
      const serialized = characterManager.serialize();
      
      expect(serialized).toBeDefined();
      if (serialized) {
        expect(serialized.character).toBeDefined();
        expect(serialized.character.id).toBe('test-char');
        expect(serialized.experienceHistory).toBeDefined();
        expect(serialized.experienceHistory.length).toBe(1);
      }
    });

    it('should deserialize character data correctly', () => {
      const originalData = characterManager.serialize();
      const newManager = new CharacterManager();
      
      if (originalData) {
        const success = newManager.deserialize(originalData);
        
        expect(success).toBe(true);
        const restoredCharacter = newManager.getCharacter();
        expect(restoredCharacter?.id).toBe('test-char');
        expect(restoredCharacter?.progression.experience).toBe(100);
      }
    });

    it('should handle invalid serialization data gracefully', () => {
      const success = characterManager.deserialize({} as any);
      
      expect(success).toBe(true); // Should not crash, just not load anything
    });
  });

  describe('Experience History', () => {
    beforeEach(() => {
      characterManager.createCharacter('test-char', 'Test', testAppearance, 'pilot');
    });

    it('should track experience history', () => {
      characterManager.awardExperience(50, 'Trade 1', 'trading');
      characterManager.awardExperience(75, 'Combat 1', 'combat');
      
      const history = characterManager.getExperienceHistory();
      
      expect(history.length).toBe(2);
      expect(history[0].amount).toBe(50);
      expect(history[0].source).toBe('Trade 1');
      expect(history[0].category).toBe('trading');
      expect(history[1].amount).toBe(75);
      expect(history[1].category).toBe('combat');
    });

    it('should limit experience history results', () => {
      // Add many experience gains
      for (let i = 0; i < 100; i++) {
        characterManager.awardExperience(10, `Gain ${i}`, 'trading');
      }
      
      const limitedHistory = characterManager.getExperienceHistory(10);
      
      expect(limitedHistory.length).toBe(10);
      expect(limitedHistory[9].source).toBe('Gain 99'); // Should be the most recent
    });
  });

  describe('Creation Configuration', () => {
    it('should provide creation configuration', () => {
      const config = characterManager.getCreationConfig();
      
      expect(config.startingAttributePoints).toBeGreaterThan(0);
      expect(config.startingSkillPoints).toBeGreaterThan(0);
      expect(config.maxAttributeValue).toBeGreaterThan(0);
      expect(config.maxSkillValue).toBeGreaterThan(0);
      expect(Array.isArray(config.availableBackgrounds)).toBe(true);
    });
  });
});