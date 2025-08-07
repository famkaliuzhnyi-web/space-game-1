/**
 * Character Progression System Tests
 * Tests the experience award system for various gameplay activities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterManager } from '../systems/CharacterManager';
import { CharacterProgressionSystem } from '../systems/CharacterProgressionSystem';
import { CharacterAppearance } from '../types/character';

describe('CharacterProgressionSystem', () => {
  let characterManager: CharacterManager;
  let progressionSystem: CharacterProgressionSystem;

  beforeEach(() => {
    characterManager = new CharacterManager();
    progressionSystem = new CharacterProgressionSystem(characterManager);
    
    // Create a test character
    const appearance: CharacterAppearance = {
      gender: 'female',
      skinTone: 'medium',
      hairColor: 'brown',
      eyeColor: 'green',
      age: 28,
      portrait: 'test-portrait'
    };

    const character = characterManager.createCharacter(
      'test-character',
      'Test Character',
      appearance,
      'merchant',
      { charisma: 10 },
      { trading: 5 }
    );
    
    // Load the character so it becomes active
    characterManager.loadCharacter(character);
  });

  describe('Experience Sources', () => {
    it('should have all defined experience sources', () => {
      const sources = progressionSystem.getExperienceSources();
      expect(sources).toBeDefined();
      expect(sources.length).toBeGreaterThan(0);

      // Check for key trading sources
      const tradingSources = sources.filter(s => s.category === 'trading');
      expect(tradingSources.some(s => s.source === 'trade_buy')).toBe(true);
      expect(tradingSources.some(s => s.source === 'trade_sell')).toBe(true);
      expect(tradingSources.some(s => s.source === 'contract_complete')).toBe(true);

      // Check for technical sources
      const technicalSources = sources.filter(s => s.category === 'technical');
      expect(technicalSources.some(s => s.source === 'ship_repair')).toBe(true);
      expect(technicalSources.some(s => s.source === 'ship_maintenance')).toBe(true);

      // Check for social sources
      const socialSources = sources.filter(s => s.category === 'social');
      expect(socialSources.some(s => s.source === 'reputation_gain')).toBe(true);
      expect(socialSources.some(s => s.source === 'contact_made')).toBe(true);
    });
  });

  describe('Trading Experience', () => {
    it('should award experience for basic buying', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardTradingExperience('trade_buy', { value: 1000 });
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
    });

    it('should award experience for selling', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardTradingExperience('trade_sell', { value: 1000 });
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
    });

    it('should give more experience for high-value trades', () => {
      const lowValueXP = progressionSystem.calculateExperiencePreview('trade_buy', { value: 100 });
      const highValueXP = progressionSystem.calculateExperiencePreview('trade_buy', { value: 10000 });
      
      expect(highValueXP).toBeGreaterThan(lowValueXP);
    });

    it('should give bonus experience for profitable trades', () => {
      const unprofitableXP = progressionSystem.calculateExperiencePreview('trade_sell', { 
        value: 1000,
        profitMargin: -10 
      });
      const profitableXP = progressionSystem.calculateExperiencePreview('trade_sell', { 
        value: 1000,
        profitMargin: 50 
      });
      
      expect(profitableXP).toBeGreaterThan(unprofitableXP);
    });

    it('should award experience for contract completion', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardTradingExperience('contract_complete', { value: 5000 });
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
      
      // Contract completion should award significant experience
      expect(finalXP - initialXP).toBeGreaterThan(20);
    });
  });

  describe('Technical Experience', () => {
    it('should award experience for maintenance work', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardTechnicalExperience('ship_maintenance', { 
        value: 500,
        complexity: 3 
      });
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
    });

    it('should award experience for repairs', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardTechnicalExperience('ship_repair', { 
        value: 1000,
        complexity: 5 
      });
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
    });

    it('should give more experience for complex technical work', () => {
      const simpleXP = progressionSystem.calculateExperiencePreview('ship_repair', { 
        value: 500,
        complexity: 1 
      });
      const complexXP = progressionSystem.calculateExperiencePreview('ship_repair', { 
        value: 500,
        complexity: 8 
      });
      
      expect(complexXP).toBeGreaterThan(simpleXP);
    });

    it('should award experience for ship construction', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardTechnicalExperience('ship_construction', { 
        value: 10000,
        complexity: 7 
      });
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
      
      // Construction should award significant experience
      expect(finalXP - initialXP).toBeGreaterThan(10);
    });
  });

  describe('Social Experience', () => {
    it('should award experience for reputation gains', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardSocialExperience('reputation_gain', { value: 15 });
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
    });

    it('should award experience for making new contacts', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardSocialExperience('contact_made', {});
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
      
      // Making contacts should award substantial experience
      expect(finalXP - initialXP).toBeGreaterThan(8);
    });

    it('should give more experience for significant reputation changes', () => {
      const smallChangeXP = progressionSystem.calculateExperiencePreview('reputation_gain', { value: 5 });
      const largeChangeXP = progressionSystem.calculateExperiencePreview('reputation_gain', { value: 25 });
      
      expect(largeChangeXP).toBeGreaterThan(smallChangeXP);
    });
  });

  describe('Exploration Experience', () => {
    it('should award experience for visiting new systems', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardExplorationExperience('system_visit', { riskLevel: 2 });
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
    });

    it('should award experience for discovering stations', () => {
      const initialXP = characterManager.getCharacter()!.progression.experience;
      
      const success = progressionSystem.awardExplorationExperience('station_discovery', { riskLevel: 3 });
      
      expect(success).toBe(true);
      const finalXP = characterManager.getCharacter()!.progression.experience;
      expect(finalXP).toBeGreaterThan(initialXP);
      
      // Station discovery should award significant experience
      expect(finalXP - initialXP).toBeGreaterThan(10);
    });

    it('should give more experience for riskier exploration', () => {
      const safeXP = progressionSystem.calculateExperiencePreview('system_visit', { riskLevel: 1 });
      const riskyXP = progressionSystem.calculateExperiencePreview('system_visit', { riskLevel: 8 });
      
      expect(riskyXP).toBeGreaterThan(safeXP);
    });
  });

  describe('Experience Preview Calculation', () => {
    it('should calculate accurate experience preview for trading', () => {
      const previewXP = progressionSystem.calculateExperiencePreview('trade_buy', { value: 2000 });
      
      const initialXP = characterManager.getCharacter()!.progression.experience;
      progressionSystem.awardTradingExperience('trade_buy', { value: 2000 });
      const finalXP = characterManager.getCharacter()!.progression.experience;
      
      expect(finalXP - initialXP).toBe(previewXP);
    });

    it('should return 0 for unknown activities', () => {
      const previewXP = progressionSystem.calculateExperiencePreview('unknown_activity', {});
      expect(previewXP).toBe(0);
    });
  });

  describe('Progression State', () => {
    it('should track character progression state', () => {
      const state = progressionSystem.getProgressionState();
      
      expect(state).toBeDefined();
      expect(state!.level).toBe(1);
      expect(state!.experience).toBeGreaterThanOrEqual(0);
      expect(state!.experienceToNext).toBeGreaterThan(0);
      expect(state!.skillPoints).toBeGreaterThanOrEqual(0);
      expect(state!.attributePoints).toBeGreaterThanOrEqual(0);
    });

    it('should return null when no character exists', () => {
      const emptyCharacterManager = new CharacterManager();
      const emptyProgressionSystem = new CharacterProgressionSystem(emptyCharacterManager);
      
      const state = emptyProgressionSystem.getProgressionState();
      expect(state).toBeNull();
    });
  });

  describe('Level Up Integration', () => {
    it('should trigger level ups from experience awards', () => {
      const character = characterManager.getCharacter()!;
      const initialLevel = character.progression.level;
      const initialXP = character.progression.experience;
      const requiredXP = character.progression.experienceToNext;
      
      console.log(`Initial: Level ${initialLevel}, XP ${initialXP}/${requiredXP}`);
      
      // Award enough experience to trigger level up (300 XP needed for level 2)
      // Each contract should give ~50 XP, so 6 contracts should give 300+ XP
      for (let i = 0; i < 6; i++) {
        progressionSystem.awardTradingExperience('contract_complete', { value: 10000 });
        const currentXP = character.progression.experience;
        console.log(`After award ${i + 1}: XP ${currentXP}, Level ${character.progression.level}`);
      }
      
      const finalLevel = character.progression.level;
      const finalXP = character.progression.experience;
      console.log(`Final: Level ${finalLevel}, XP ${finalXP}`);
      
      expect(finalLevel).toBeGreaterThan(initialLevel);
    });
  });
});