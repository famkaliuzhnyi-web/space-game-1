/**
 * Starting Scenarios System Tests
 * Tests for scenario data, selection, and application functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { STARTING_SCENARIOS, getScenariosByCategory, getScenariosByDifficulty } from '../data/startingScenarios';
import { StartingScenarioManager } from '../systems/StartingScenarioManager';
import { CharacterManager } from '../systems/CharacterManager';

describe('Starting Scenarios Data', () => {
  it('should have valid scenario definitions', () => {
    const scenarioIds = Object.keys(STARTING_SCENARIOS);
    expect(scenarioIds.length).toBeGreaterThan(0);
    
    scenarioIds.forEach(scenarioId => {
      const scenario = STARTING_SCENARIOS[scenarioId];
      
      // Required fields
      expect(scenario.id).toBe(scenarioId);
      expect(scenario.name).toBeTruthy();
      expect(scenario.description).toBeTruthy();
      expect(scenario.difficulty).toMatch(/^(easy|normal|hard|extreme)$/);
      expect(scenario.category).toMatch(/^(trading|exploration|combat|balanced|challenge)$/);
      
      // Character setup
      expect(scenario.characterSetup).toBeDefined();
      expect(scenario.characterSetup.attributeModifiers).toBeDefined();
      expect(scenario.characterSetup.skillModifiers).toBeDefined();
      expect(Array.isArray(scenario.characterSetup.startingEquipment)).toBe(true);
      
      // Economic setup
      expect(typeof scenario.startingCredits).toBe('number');
      expect(scenario.startingCredits).toBeGreaterThanOrEqual(0);
      expect(scenario.startingLocation).toBeTruthy();
      
      // Ship setup
      expect(scenario.startingShip).toBeDefined();
      expect(scenario.startingShip.shipClassId).toBeTruthy();
      expect(scenario.startingShip.shipName).toBeTruthy();
      expect(scenario.startingShip.condition).toBeDefined();
      expect(scenario.startingShip.equipment).toBeDefined();
      
      // Faction standings
      expect(scenario.factionStandings).toBeDefined();
      expect(typeof scenario.factionStandings).toBe('object');
      
      // Narrative
      expect(scenario.backgroundStory).toBeTruthy();
      expect(Array.isArray(scenario.objectives)).toBe(true);
      expect(scenario.objectives.length).toBeGreaterThan(0);
    });
  });

  it('should have scenarios with reasonable credit ranges', () => {
    Object.values(STARTING_SCENARIOS).forEach(scenario => {
      expect(scenario.startingCredits).toBeGreaterThanOrEqual(500);
      
      // Allow higher limits for debug scenarios
      if (scenario.id.includes('debug') || scenario.name.toLowerCase().includes('debug')) {
        expect(scenario.startingCredits).toBeLessThanOrEqual(2000000); // 2M for debug
      } else {
        expect(scenario.startingCredits).toBeLessThanOrEqual(100000);
      }
    });
  });

  it('should have valid ship condition values', () => {
    Object.values(STARTING_SCENARIOS).forEach(scenario => {
      const condition = scenario.startingShip.condition;
      
      expect(condition.hull).toBeGreaterThan(0);
      expect(condition.hull).toBeLessThanOrEqual(1);
      expect(condition.engines).toBeGreaterThan(0);
      expect(condition.engines).toBeLessThanOrEqual(1);
      expect(condition.cargo).toBeGreaterThan(0);
      expect(condition.cargo).toBeLessThanOrEqual(1);
      expect(condition.shields).toBeGreaterThanOrEqual(0);
      expect(condition.shields).toBeLessThanOrEqual(1);
    });
  });

  it('should have valid faction standings', () => {
    Object.values(STARTING_SCENARIOS).forEach(scenario => {
      Object.values(scenario.factionStandings).forEach(standing => {
        expect(standing).toBeGreaterThanOrEqual(-100);
        expect(standing).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe('Scenario Filtering', () => {
  it('should filter scenarios by category', () => {
    const tradingScenarios = getScenariosByCategory('trading');
    expect(tradingScenarios.length).toBeGreaterThan(0);
    tradingScenarios.forEach(scenario => {
      expect(scenario.category).toBe('trading');
    });

    const explorationScenarios = getScenariosByCategory('exploration');
    expect(explorationScenarios.length).toBeGreaterThan(0);
    explorationScenarios.forEach(scenario => {
      expect(scenario.category).toBe('exploration');
    });
  });

  it('should filter scenarios by difficulty', () => {
    const easyScenarios = getScenariosByDifficulty('easy');
    expect(easyScenarios.length).toBeGreaterThan(0);
    easyScenarios.forEach(scenario => {
      expect(scenario.difficulty).toBe('easy');
    });

    const hardScenarios = getScenariosByDifficulty('hard');
    expect(hardScenarios.length).toBeGreaterThan(0);
    hardScenarios.forEach(scenario => {
      expect(scenario.difficulty).toBe('hard');
    });
  });

  it('should handle empty filter results gracefully', () => {
    const nonExistentCategory = getScenariosByCategory('nonexistent');
    expect(Array.isArray(nonExistentCategory)).toBe(true);
    expect(nonExistentCategory.length).toBe(0);
  });
});

describe('Specific Scenarios', () => {
  it('should have a merchant trader scenario', () => {
    const scenario = STARTING_SCENARIOS['merchant-trader'];
    expect(scenario).toBeDefined();
    expect(scenario.category).toBe('trading');
    expect(scenario.difficulty).toBe('easy');
    expect(scenario.startingCredits).toBeGreaterThan(20000);
    expect(scenario.characterSetup.backgroundId).toBe('merchant');
  });

  it('should have a young pilot scenario', () => {
    const scenario = STARTING_SCENARIOS['young-pilot'];
    expect(scenario).toBeDefined();
    expect(scenario.category).toBe('balanced');
    expect(scenario.difficulty).toBe('normal');
    expect(scenario.characterSetup.backgroundId).toBe('pilot');
    expect(scenario.characterSetup.forcedAppearance?.age).toBe(25);
  });

  it('should have an exile outcast scenario', () => {
    const scenario = STARTING_SCENARIOS['exile-outcast'];
    expect(scenario).toBeDefined();
    expect(scenario.category).toBe('challenge');
    expect(scenario.difficulty).toBe('hard');
    expect(scenario.startingCredits).toBeLessThan(5000);
    expect(scenario.specialConditions?.hasDebt).toBeDefined();
  });

  it('should have special conditions for challenging scenarios', () => {
    const exileScenario = STARTING_SCENARIOS['exile-outcast'];
    expect(exileScenario.specialConditions?.tradeDiscountPercent).toBeLessThan(0);
    expect(exileScenario.specialConditions?.hasDebt?.amount).toBeGreaterThan(0);
    expect(exileScenario.specialConditions?.forbiddenStations?.length).toBeGreaterThan(0);
  });
});

describe('StartingScenarioManager', () => {
  let characterManager: CharacterManager;
  let scenarioManager: StartingScenarioManager;

  beforeEach(() => {
    characterManager = new CharacterManager();
    scenarioManager = new StartingScenarioManager(characterManager);
  });

  it('should create scenario manager instance', () => {
    expect(scenarioManager).toBeInstanceOf(StartingScenarioManager);
  });

  it('should validate scenario application results', () => {
    const scenario = STARTING_SCENARIOS['young-pilot'];
    const mockCharacter = {
      id: 'test-char',
      name: 'Test Character',
      appearance: {},
      background: {},
      attributes: {},
      skills: {},
      progression: {},
      personalEquipment: {},
      achievements: [],
      skillHistory: []
    } as any;

    const mockPlayer = {
      id: 'test-player',
      name: 'test-char',
      credits: scenario.startingCredits,
      currentStationId: scenario.startingLocation,
      characterId: 'test-char',
      currentShipId: 'test-ship',
      ownedShips: new Map(),
      reputation: new Map(),
      contracts: [],
      achievements: [],
      statistics: {}
    } as any;

    const isValid = scenarioManager.validateScenarioApplication(scenario, mockCharacter, mockPlayer);
    expect(isValid).toBe(true);
  });

  it('should detect invalid scenario application', () => {
    const scenario = STARTING_SCENARIOS['young-pilot'];
    const mockCharacter = {
      id: 'test-char',
      name: 'Test Character'
    } as any;

    const mockPlayer = {
      id: 'test-player',
      credits: 99999, // Wrong credits amount
      currentStationId: scenario.startingLocation,
      characterId: 'test-char'
    } as any;

    const isValid = scenarioManager.validateScenarioApplication(scenario, mockCharacter, mockPlayer);
    expect(isValid).toBe(false);
  });
});

describe('Scenario Balance', () => {
  it('should have a good distribution of difficulties', () => {
    const difficulties = Object.values(STARTING_SCENARIOS).map(s => s.difficulty);
    const difficultyCount = {
      easy: difficulties.filter(d => d === 'easy').length,
      normal: difficulties.filter(d => d === 'normal').length,
      hard: difficulties.filter(d => d === 'hard').length,
      extreme: difficulties.filter(d => d === 'extreme').length
    };

    expect(difficultyCount.easy).toBeGreaterThan(0);
    expect(difficultyCount.normal).toBeGreaterThan(0);
    expect(difficultyCount.hard).toBeGreaterThan(0);
    // Extreme scenarios are optional
  });

  it('should have a good distribution of categories', () => {
    const categories = Object.values(STARTING_SCENARIOS).map(s => s.category);
    const categoryCount = {
      trading: categories.filter(c => c === 'trading').length,
      exploration: categories.filter(c => c === 'exploration').length,
      combat: categories.filter(c => c === 'combat').length,
      balanced: categories.filter(c => c === 'balanced').length,
      challenge: categories.filter(c => c === 'challenge').length
    };

    expect(categoryCount.trading).toBeGreaterThan(0);
    expect(categoryCount.balanced).toBeGreaterThan(0);
    // Other categories are optional but nice to have
  });

  it('should have scenarios with varying credit amounts', () => {
    const credits = Object.values(STARTING_SCENARIOS).map(s => s.startingCredits);
    const minCredits = Math.min(...credits);
    const maxCredits = Math.max(...credits);
    
    expect(maxCredits).toBeGreaterThan(minCredits * 5); // At least 5x difference
  });
});