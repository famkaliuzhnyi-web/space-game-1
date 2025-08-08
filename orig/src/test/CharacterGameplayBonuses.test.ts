/**
 * Character Gameplay Bonuses Tests
 * Tests that character attributes and skills actually affect gameplay mechanics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EconomicSystem } from '../systems/EconomicSystem';
import { MaintenanceManager } from '../systems/MaintenanceManager';
import { TimeManager } from '../systems/TimeManager';
import { CharacterManager } from '../systems/CharacterManager';
import { getCommodity } from '../data/commodities';
import { CharacterAppearance } from '../types/character';

describe('Character Gameplay Bonuses', () => {
  let economicSystem: EconomicSystem;
  let maintenanceManager: MaintenanceManager;
  let characterManager: CharacterManager;
  let timeManager: TimeManager;

  beforeEach(() => {
    economicSystem = new EconomicSystem();
    timeManager = new TimeManager();
    maintenanceManager = new MaintenanceManager(timeManager);
    characterManager = new CharacterManager();
  });

  describe('Trading Bonuses', () => {
    it('should apply charisma bonus to trading prices', () => {
      // Create characters with different charisma levels
      const appearance: CharacterAppearance = {
        gender: 'female',
        skinTone: 'medium',
        hairColor: 'black',
        eyeColor: 'brown',
        age: 25,
        portrait: 'default-female'
      };

      const lowCharismaCharacter = characterManager.createCharacter(
        'low-charisma',
        'Low Charisma Trader',
        appearance,
        'merchant',
        { charisma: 0 }, // Total: 10 + 5 (merchant) + 0 = 15
        {}
      );

      const highCharismaCharacter = characterManager.createCharacter(
        'high-charisma',
        'High Charisma Trader',
        appearance,
        'merchant',
        { charisma: 10 }, // Total: 10 + 5 (merchant) + 10 = 25
        {}
      );

      // Create a test market
      const commodity = getCommodity('electronics');
      if (!commodity) throw new Error('Electronics commodity not found');

      const testMarket = {
        stationId: 'test-station',
        commodities: new Map(),
        demandFactors: {
          stationType: 1.0,
          population: 0.5,
          securityLevel: 0.8,
          factionControl: 1.0
        },
        lastUpdate: Date.now()
      };

      // Calculate prices with different characters
      const basePrice = economicSystem.calculatePriceWithCharacterBonusStable(commodity, testMarket, null);
      const lowCharismaPrice = economicSystem.calculatePriceWithCharacterBonusStable(commodity, testMarket, lowCharismaCharacter);
      const highCharismaPrice = economicSystem.calculatePriceWithCharacterBonusStable(commodity, testMarket, highCharismaCharacter);

      // Higher charisma should result in better (lower) prices when buying
      expect(highCharismaPrice).toBeLessThan(lowCharismaPrice);
      expect(lowCharismaPrice).toBeLessThan(basePrice * 1.1); // Should be close to base price
    });

    it('should apply trading skill bonus to prices', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        skinTone: 'light',
        hairColor: 'brown',
        eyeColor: 'blue',
        age: 30,
        portrait: 'default-male'
      };

      const noviceTrader = characterManager.createCharacter(
        'novice-trader',
        'Novice Trader',
        appearance,
        'pilot', // No trading bonus from background
        {},
        { trading: 5 }
      );

      const expertTrader = characterManager.createCharacter(
        'expert-trader',
        'Expert Trader',
        appearance,
        'pilot',
        {},
        { trading: 25 }
      );

      const commodity = getCommodity('rare-earth-elements');
      if (!commodity) throw new Error('Rare earth elements commodity not found');

      const testMarket = {
        stationId: 'test-station',
        commodities: new Map(),
        demandFactors: {
          stationType: 1.0,
          population: 0.5,
          securityLevel: 0.8,
          factionControl: 1.0
        },
        lastUpdate: Date.now()
      };

      const novicePrice = economicSystem.calculatePriceWithCharacterBonusStable(commodity, testMarket, noviceTrader);
      const expertPrice = economicSystem.calculatePriceWithCharacterBonusStable(commodity, testMarket, expertTrader);

      // Expert trader should get better prices
      expect(expertPrice).toBeLessThan(novicePrice);
    });
  });

  describe('Maintenance Bonuses', () => {
    it('should apply engineering skill bonus to maintenance costs', () => {
      const appearance: CharacterAppearance = {
        gender: 'other',
        skinTone: 'dark',
        hairColor: 'black',
        eyeColor: 'green',
        age: 35,
        portrait: 'default-other'
      };

      const noviceEngineer = characterManager.createCharacter(
        'novice-engineer',
        'Novice Engineer',
        appearance,
        'pilot',
        {},
        { engineering: 5 }
      );

      const expertEngineer = characterManager.createCharacter(
        'expert-engineer',
        'Expert Engineer',
        appearance,
        'engineer',
        {},
        { engineering: 20 } // Plus background bonus
      );

      // Test maintenance costs for hull damage
      const baseMaintenanceCost = maintenanceManager.calculateMaintenanceCostWithCharacter('hull', 0.5, null);
      const noviceCost = maintenanceManager.calculateMaintenanceCostWithCharacter('hull', 0.5, noviceEngineer);
      const expertCost = maintenanceManager.calculateMaintenanceCostWithCharacter('hull', 0.5, expertEngineer);

      // Expert engineer should have significantly lower costs
      expect(expertCost).toBeLessThan(noviceCost);
      expect(noviceCost).toBeLessThan(baseMaintenanceCost);
      expect(expertCost).toBeLessThan(baseMaintenanceCost * 0.8); // Should be at least 20% cheaper
    });

    it('should apply intelligence bonus to maintenance costs', () => {
      const appearance: CharacterAppearance = {
        gender: 'female',
        skinTone: 'medium',
        hairColor: 'red',
        eyeColor: 'hazel',
        age: 28,
        portrait: 'default-female'
      };

      const lowIntelligence = characterManager.createCharacter(
        'low-int',
        'Low Intelligence Character',
        appearance,
        'pilot',
        { intelligence: 0 }, // Total: 10 + 0 = 10
        { engineering: 10 }
      );

      const highIntelligence = characterManager.createCharacter(
        'high-int',
        'High Intelligence Character',
        appearance,
        'pilot',
        { intelligence: 10 }, // Total: 10 + 10 = 20
        { engineering: 10 }
      );

      // Test equipment maintenance costs
      const testEquipment = {
        id: 'test-shield',
        name: 'Test Shield',
        type: 'shield',
        rarity: 'common' as const,
        cost: 1000,
        durability: 1.0,
        maxDurability: 1.0,
        condition: 0.3, // Needs significant repair
        effects: {}
      };

      const lowIntCost = maintenanceManager.calculateEquipmentMaintenanceCostWithCharacter(testEquipment, lowIntelligence);
      const highIntCost = maintenanceManager.calculateEquipmentMaintenanceCostWithCharacter(testEquipment, highIntelligence);

      // Higher intelligence should result in lower maintenance costs
      expect(highIntCost).toBeLessThan(lowIntCost);
    });

    it('should ensure maintenance costs never drop below 50% of base cost', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        skinTone: 'light',
        hairColor: 'blonde',
        eyeColor: 'blue',
        age: 45,
        portrait: 'default-male'
      };

      // Create a character with maximum engineering and intelligence bonuses
      const masterEngineer = characterManager.createCharacter(
        'master-engineer',
        'Master Engineer',
        appearance,
        'engineer',
        { intelligence: 20 }, // Maximum possible
        { engineering: 50 } // Very high skill
      );

      const baseMaintenanceCost = maintenanceManager.calculateMaintenanceCostWithCharacter('engines', 0.1, null);
      const masterCost = maintenanceManager.calculateMaintenanceCostWithCharacter('engines', 0.1, masterEngineer);

      // Even with maximum bonuses, cost should not drop below 50% of base
      expect(masterCost).toBeGreaterThanOrEqual(baseMaintenanceCost * 0.5);
      expect(masterCost).toBeLessThan(baseMaintenanceCost);
    });
  });

  describe('Character Bonus Calculations', () => {
    it('should handle characters without skills gracefully', () => {
      // Create a character but manipulate it to have null skills
      const appearance: CharacterAppearance = {
        gender: 'male',
        skinTone: 'medium',
        hairColor: 'black',
        eyeColor: 'brown',
        age: 25,
        portrait: 'default-male'
      };

      const character = characterManager.createCharacter(
        'null-skills',
        'Null Skills Character',
        appearance,
        'pilot'
      );

      // Clear skills to test null handling
      (character as any).skills = null;

      const commodity = getCommodity('protein-rations');
      if (!commodity) throw new Error('Protein rations commodity not found');

      const testMarket = {
        stationId: 'test-station',
        commodities: new Map(),
        demandFactors: {
          stationType: 1.0,
          population: 0.5,
          securityLevel: 0.8,
          factionControl: 1.0
        },
        lastUpdate: Date.now()
      };

      // Should not throw error and should return base price
      const price = economicSystem.calculatePriceWithCharacterBonusStable(commodity, testMarket, character);
      const basePrice = economicSystem.calculatePriceWithCharacterBonusStable(commodity, testMarket, null);

      expect(price).toBeCloseTo(basePrice, 0);
    });

    it('should handle null character gracefully', () => {
      const commodity = getCommodity('art-objects');
      if (!commodity) throw new Error('Art objects commodity not found');

      const testMarket = {
        stationId: 'test-station',
        commodities: new Map(),
        demandFactors: {
          stationType: 1.0,
          population: 0.5,
          securityLevel: 0.8,
          factionControl: 1.0
        },
        lastUpdate: Date.now()
      };

      // Should not throw error with null character
      expect(() => {
        const price = economicSystem.calculatePriceWithCharacterBonusStable(commodity, testMarket, null);
        expect(typeof price).toBe('number');
        expect(price).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });
});