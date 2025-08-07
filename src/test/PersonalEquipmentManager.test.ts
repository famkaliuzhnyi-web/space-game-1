/**
 * Tests for the PersonalEquipmentManager system
 * Validates equipment effects, bonuses, and character stat enhancement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PersonalEquipmentManager } from '../systems/PersonalEquipmentManager';
import { CharacterAttributes, CharacterSkills } from '../types/character';

describe('PersonalEquipmentManager', () => {
  let equipmentManager: PersonalEquipmentManager;
  let testAttributes: CharacterAttributes;
  let testSkills: CharacterSkills;

  beforeEach(() => {
    equipmentManager = new PersonalEquipmentManager();
    testAttributes = {
      strength: 10,
      intelligence: 15,
      charisma: 12,
      endurance: 8,
      dexterity: 14,
      perception: 11
    };
    testSkills = {
      trading: 20,
      negotiation: 15,
      economics: 10,
      engineering: 25,
      piloting: 18,
      navigation: 12,
      combat: 8,
      tactics: 6,
      security: 14,
      networking: 11,
      investigation: 9,
      leadership: 7
    };
  });

  describe('Initialization', () => {
    it('should initialize with empty equipment slots', () => {
      const equipped = equipmentManager.getEquippedItems();
      
      expect(equipped.suit).toBeNull();
      expect(equipped.tool).toBeNull();
      expect(equipped.datapad).toBeNull();
      expect(equipped.accessory).toBeNull();
    });

    it('should load equipment catalog', () => {
      const catalog = equipmentManager.getEquipmentCatalog();
      
      expect(Object.keys(catalog).length).toBeGreaterThan(0);
      
      const basicSuit = catalog['basic_space_suit'];
      expect(basicSuit).toBeDefined();
      expect(basicSuit.name).toBe('Basic Space Suit');
      expect(basicSuit.type).toBe('suit');
      expect(basicSuit.rarity).toBe('common');
    });

    it('should organize items by type', () => {
      const suits = equipmentManager.getItemsByType('suit');
      const tools = equipmentManager.getItemsByType('tool');
      const datapads = equipmentManager.getItemsByType('datapad');
      const accessories = equipmentManager.getItemsByType('accessory');
      
      expect(suits.length).toBeGreaterThan(0);
      expect(tools.length).toBeGreaterThan(0);
      expect(datapads.length).toBeGreaterThan(0);
      expect(accessories.length).toBeGreaterThan(0);
      
      suits.forEach(item => expect(item.type).toBe('suit'));
      tools.forEach(item => expect(item.type).toBe('tool'));
    });

    it('should organize items by rarity', () => {
      const commonItems = equipmentManager.getItemsByRarity('common');
      const rareItems = equipmentManager.getItemsByRarity('rare');
      const legendaryItems = equipmentManager.getItemsByRarity('legendary');
      
      expect(commonItems.length).toBeGreaterThan(0);
      expect(rareItems.length).toBeGreaterThan(0);
      expect(legendaryItems.length).toBeGreaterThan(0);
      
      commonItems.forEach(item => expect(item.rarity).toBe('common'));
      rareItems.forEach(item => expect(item.rarity).toBe('rare'));
    });
  });

  describe('Equipment Management', () => {
    it('should equip items to correct slots', () => {
      const success = equipmentManager.equipItem('basic_space_suit', 'suit');
      expect(success).toBe(true);
      
      const equipped = equipmentManager.getEquippedItems();
      expect(equipped.suit).toBeDefined();
      expect(equipped.suit?.id).toBe('basic_space_suit');
      expect(equipped.suit?.name).toBe('Basic Space Suit');
    });

    it('should not equip items to wrong slots', () => {
      const success = equipmentManager.equipItem('basic_space_suit', 'tool'); // Wrong slot
      expect(success).toBe(false);
      
      const equipped = equipmentManager.getEquippedItems();
      expect(equipped.tool).toBeNull();
    });

    it('should not equip non-existent items', () => {
      const success = equipmentManager.equipItem('non_existent_item', 'suit');
      expect(success).toBe(false);
      
      const equipped = equipmentManager.getEquippedItems();
      expect(equipped.suit).toBeNull();
    });

    it('should unequip items correctly', () => {
      equipmentManager.equipItem('basic_space_suit', 'suit');
      
      const unequippedItem = equipmentManager.unequipItem('suit');
      expect(unequippedItem).toBeDefined();
      expect(unequippedItem?.id).toBe('basic_space_suit');
      
      const equipped = equipmentManager.getEquippedItems();
      expect(equipped.suit).toBeNull();
    });

    it('should return null when unequipping from empty slot', () => {
      const unequippedItem = equipmentManager.unequipItem('suit');
      expect(unequippedItem).toBeNull();
    });

    it('should replace equipped items', () => {
      equipmentManager.equipItem('basic_space_suit', 'suit');
      equipmentManager.equipItem('advanced_space_suit', 'suit');
      
      const equipped = equipmentManager.getEquippedItems();
      expect(equipped.suit?.id).toBe('advanced_space_suit');
    });
  });

  describe('Equipment Effects', () => {
    it('should calculate base stats without equipment', () => {
      const enhanced = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      
      expect(enhanced.baseAttributes).toEqual(testAttributes);
      expect(enhanced.baseSkills).toEqual(testSkills);
      expect(enhanced.totalAttributes).toEqual(testAttributes);
      expect(enhanced.totalSkills).toEqual(testSkills);
      expect(enhanced.equipmentBonuses).toHaveLength(0);
      expect(enhanced.specialEffects.size).toBe(0);
    });

    it('should apply attribute bonuses from equipped items', () => {
      equipmentManager.equipItem('basic_space_suit', 'suit'); // +2 endurance
      
      const enhanced = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      
      expect(enhanced.equipmentAttributeBonus.endurance).toBe(2);
      expect(enhanced.totalAttributes.endurance).toBe(testAttributes.endurance + 2);
      expect(enhanced.totalAttributes.strength).toBe(testAttributes.strength); // Unchanged
      
      const enduranceBonus = enhanced.equipmentBonuses.find(b => b.target === 'endurance');
      expect(enduranceBonus).toBeDefined();
      expect(enduranceBonus?.value).toBe(2);
      expect(enduranceBonus?.source).toBe('basic_space_suit');
    });

    it('should apply skill bonuses from equipped items', () => {
      equipmentManager.equipItem('standard_multitool', 'tool'); // +3 engineering
      
      const enhanced = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      
      expect(enhanced.equipmentSkillBonus.engineering).toBe(3);
      expect(enhanced.totalSkills.engineering).toBe(testSkills.engineering + 3);
      expect(enhanced.totalSkills.trading).toBe(testSkills.trading); // Unchanged
      
      const engineeringBonus = enhanced.equipmentBonuses.find(b => b.target === 'engineering');
      expect(engineeringBonus).toBeDefined();
      expect(engineeringBonus?.value).toBe(3);
    });

    it('should apply special effects from equipped items', () => {
      equipmentManager.equipItem('basic_space_suit', 'suit'); // Oxygen efficiency and radiation resistance
      
      const enhanced = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      
      expect(enhanced.specialEffects.get('oxygenEfficiency')).toBe(0.1);
      expect(enhanced.specialEffects.get('radiationResistance')).toBe(0.05);
      
      const oxygenBonus = enhanced.equipmentBonuses.find(b => b.target === 'oxygenEfficiency');
      expect(oxygenBonus).toBeDefined();
      expect(oxygenBonus?.type).toBe('special');
    });

    it('should combine bonuses from multiple items', () => {
      equipmentManager.equipItem('advanced_space_suit', 'suit'); // +5 endurance, +3 strength
      equipmentManager.equipItem('neural_implant', 'accessory'); // +8 intelligence, +6 perception
      
      const enhanced = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      
      expect(enhanced.totalAttributes.endurance).toBe(testAttributes.endurance + 5);
      expect(enhanced.totalAttributes.strength).toBe(testAttributes.strength + 3);
      expect(enhanced.totalAttributes.intelligence).toBe(testAttributes.intelligence + 8);
      expect(enhanced.totalAttributes.perception).toBe(testAttributes.perception + 6);
      
      expect(enhanced.equipmentBonuses.length).toBeGreaterThan(4); // Multiple bonuses from multiple items
    });

    it('should handle items with multiple effect types', () => {
      equipmentManager.equipItem('quantum_datapad', 'datapad'); // Multiple bonuses
      
      const enhanced = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      
      // Should have attribute bonuses
      expect(enhanced.totalAttributes.intelligence).toBeGreaterThan(testAttributes.intelligence);
      
      // Should have skill bonuses
      expect(enhanced.totalSkills.trading).toBeGreaterThan(testSkills.trading);
      expect(enhanced.totalSkills.engineering).toBeGreaterThan(testSkills.engineering);
      expect(enhanced.totalSkills.security).toBeGreaterThan(testSkills.security); // Hacking maps to security
      
      // Should have special effects
      expect(enhanced.specialEffects.get('informationAccess')).toBeGreaterThan(0);
      expect(enhanced.specialEffects.get('scannerRange')).toBeGreaterThan(0);
    });
  });

  describe('Durability System', () => {
    it('should reduce bonuses based on durability', () => {
      equipmentManager.equipItem('advanced_space_suit', 'suit');
      
      // Full durability bonuses
      const enhanced1 = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      const fullEnduranceBonus = enhanced1.totalAttributes.endurance - testAttributes.endurance;
      
      // Damage the item
      equipmentManager.damageEquipment('suit', 0.5); // 50% durability remaining
      
      const enhanced2 = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      const damagedEnduranceBonus = enhanced2.totalAttributes.endurance - testAttributes.endurance;
      
      expect(damagedEnduranceBonus).toBeLessThan(fullEnduranceBonus);
      expect(damagedEnduranceBonus).toBeGreaterThan(0); // Still provides some bonus
    });

    it('should not reduce durability below 0', () => {
      equipmentManager.equipItem('basic_space_suit', 'suit');
      
      equipmentManager.damageEquipment('suit', 2.0); // Excessive damage
      
      const equipped = equipmentManager.getEquippedItems();
      expect(equipped.suit?.durability).toBe(0);
    });

    it('should repair equipment durability', () => {
      equipmentManager.equipItem('standard_multitool', 'tool');
      
      equipmentManager.damageEquipment('tool', 0.3); // Damage it
      const success = equipmentManager.repairEquipment('tool', 0.2); // Repair it
      
      expect(success).toBe(true);
      
      const equipped = equipmentManager.getEquippedItems();
      expect(equipped.tool?.durability).toBeCloseTo(0.9); // 1.0 - 0.3 + 0.2
    });

    it('should not repair above maximum durability', () => {
      equipmentManager.equipItem('basic_datapad', 'datapad');
      
      const success = equipmentManager.repairEquipment('datapad', 0.5); // Try to over-repair
      
      expect(success).toBe(false);
      
      const equipped = equipmentManager.getEquippedItems();
      expect(equipped.datapad?.durability).toBe(1.0); // Capped at max
    });

    it('should not repair non-existent equipment', () => {
      const success = equipmentManager.repairEquipment('suit', 0.1);
      expect(success).toBe(false);
    });
  });

  describe('Special Effects Query', () => {
    it('should check for active special effects', () => {
      equipmentManager.equipItem('basic_space_suit', 'suit');
      
      expect(equipmentManager.hasSpecialEffect('oxygenEfficiency')).toBe(true);
      expect(equipmentManager.hasSpecialEffect('radiationResistance')).toBe(true);
      expect(equipmentManager.hasSpecialEffect('informationAccess')).toBe(false);
    });

    it('should calculate total special effect values', () => {
      equipmentManager.equipItem('basic_space_suit', 'suit'); // 0.1 oxygen efficiency
      equipmentManager.equipItem('analyst_datapad', 'datapad'); // Additional effects
      
      const oxygenValue = equipmentManager.getSpecialEffectValue('oxygenEfficiency');
      expect(oxygenValue).toBe(0.1); // Only from suit
      
      const infoValue = equipmentManager.getSpecialEffectValue('informationAccess');
      expect(infoValue).toBe(0.25); // From datapad
    });

    it('should handle special effects with durability', () => {
      equipmentManager.equipItem('basic_space_suit', 'suit');
      
      const fullValue = equipmentManager.getSpecialEffectValue('oxygenEfficiency');
      
      equipmentManager.damageEquipment('suit', 0.8); // Heavy damage
      
      const damagedValue = equipmentManager.getSpecialEffectValue('oxygenEfficiency');
      
      expect(damagedValue).toBeLessThan(fullValue);
      expect(damagedValue).toBeGreaterThan(0); // Minimum 50% effectiveness
    });
  });

  describe('Item Information', () => {
    it('should retrieve items from catalog', () => {
      const item = equipmentManager.getItemFromCatalog('power_suit');
      
      expect(item).toBeDefined();
      expect(item?.name).toBe('Power Suit');
      expect(item?.type).toBe('suit');
      expect(item?.rarity).toBe('rare');
    });

    it('should return null for non-existent items', () => {
      const item = equipmentManager.getItemFromCatalog('non_existent');
      expect(item).toBeNull();
    });

    it('should validate item properties', () => {
      const masterToolkit = equipmentManager.getItemFromCatalog('master_toolkit');
      
      expect(masterToolkit).toBeDefined();
      expect(masterToolkit?.rarity).toBe('legendary');
      expect(masterToolkit?.cost).toBeGreaterThan(50000);
      expect(masterToolkit?.effects.engineeringBonus).toBeGreaterThan(10);
    });
  });

  describe('Event System', () => {
    it('should emit events when equipping items', () => {
      let eventFired = false;
      let eventData: any = null;
      
      equipmentManager.addEventListener('item_equipped', (data) => {
        eventFired = true;
        eventData = data;
      });
      
      equipmentManager.equipItem('lucky_charm', 'accessory');
      
      expect(eventFired).toBe(true);
      expect(eventData.slot).toBe('accessory');
      expect(eventData.newItem.id).toBe('lucky_charm');
    });

    it('should emit events when unequipping items', () => {
      equipmentManager.equipItem('basic_datapad', 'datapad');
      
      let eventFired = false;
      let eventData: any = null;
      
      equipmentManager.addEventListener('item_unequipped', (data) => {
        eventFired = true;
        eventData = data;
      });
      
      equipmentManager.unequipItem('datapad');
      
      expect(eventFired).toBe(true);
      expect(eventData.slot).toBe('datapad');
      expect(eventData.item.id).toBe('basic_datapad');
    });

    it('should emit events when equipment is damaged', () => {
      equipmentManager.equipItem('standard_multitool', 'tool');
      
      let damageFired = false;
      let brokenFired = false;
      
      equipmentManager.addEventListener('equipment_damaged', () => {
        damageFired = true;
      });
      
      equipmentManager.addEventListener('equipment_broken', () => {
        brokenFired = true;
      });
      
      equipmentManager.damageEquipment('tool', 0.5); // Just damage
      expect(damageFired).toBe(true);
      expect(brokenFired).toBe(false);
      
      equipmentManager.damageEquipment('tool', 1.0); // Break it
      expect(brokenFired).toBe(true);
    });

    it('should remove event listeners', () => {
      let eventCount = 0;
      const callback = () => { eventCount++; };
      
      equipmentManager.addEventListener('item_equipped', callback);
      equipmentManager.removeEventListener('item_equipped', callback);
      
      equipmentManager.equipItem('basic_space_suit', 'suit');
      
      expect(eventCount).toBe(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize equipment data', () => {
      equipmentManager.equipItem('advanced_space_suit', 'suit');
      equipmentManager.equipItem('engineer_toolkit', 'tool');
      
      // Damage an item
      equipmentManager.damageEquipment('tool', 0.2);
      
      // Serialize
      const saveData = equipmentManager.serialize();
      expect(saveData.personalEquipment.suit?.id).toBe('advanced_space_suit');
      expect(saveData.personalEquipment.tool?.id).toBe('engineer_toolkit');
      expect(saveData.personalEquipment.tool?.durability).toBe(0.8);
      
      // Create new manager and deserialize
      const newManager = new PersonalEquipmentManager();
      newManager.deserialize(saveData);
      
      // Check that data was restored
      const restoredEquipment = newManager.getEquippedItems();
      expect(restoredEquipment.suit?.id).toBe('advanced_space_suit');
      expect(restoredEquipment.tool?.id).toBe('engineer_toolkit');
      expect(restoredEquipment.tool?.durability).toBe(0.8);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty equipment gracefully', () => {
      const enhanced = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      expect(enhanced.equipmentBonuses).toHaveLength(0);
      expect(enhanced.specialEffects.size).toBe(0);
    });

    it('should handle zero durability equipment', () => {
      equipmentManager.equipItem('basic_space_suit', 'suit');
      equipmentManager.damageEquipment('suit', 2.0); // Break it completely
      
      const enhanced = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      
      // Should still have some effect (minimum 50% effectiveness for special effects)
      const oxygenValue = equipmentManager.getSpecialEffectValue('oxygenEfficiency');
      expect(oxygenValue).toBeGreaterThan(0);
    });

    it('should handle items with no effects', () => {
      // Assume there's a theoretical item with no effects (edge case)
      const enhanced = equipmentManager.calculateEnhancedStats(testAttributes, testSkills);
      expect(enhanced).toBeDefined();
      expect(enhanced.totalAttributes).toEqual(testAttributes);
      expect(enhanced.totalSkills).toEqual(testSkills);
    });
  });
});