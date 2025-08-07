/**
 * PersonalEquipmentManager
 * Manages character personal equipment, effects, and gameplay bonuses
 */

import {
  PersonalEquipment,
  PersonalItem,
  PersonalItemEffects,
  CharacterAttributes,
  CharacterSkills
} from '../types/character';

export interface EquipmentBonus {
  source: string;                   // Equipment item ID
  type: 'attribute' | 'skill' | 'special';
  target: string;                   // Attribute/skill/special effect name
  value: number;
  durabilityAffected: boolean;      // Whether bonus is reduced by durability
  description: string;
}

export interface EnhancedCharacterStats {
  baseAttributes: CharacterAttributes;
  baseSkills: CharacterSkills;
  equipmentAttributeBonus: Partial<CharacterAttributes>;
  equipmentSkillBonus: Partial<CharacterSkills>;
  totalAttributes: CharacterAttributes;
  totalSkills: CharacterSkills;
  equipmentBonuses: EquipmentBonus[];
  specialEffects: Map<string, number>; // Special effect name -> value
}

export interface EquipmentCatalog {
  [itemId: string]: PersonalItem;
}

interface PersonalEquipmentManagerSaveData {
  personalEquipment: PersonalEquipment;
  equipmentCatalog: EquipmentCatalog;
}

export class PersonalEquipmentManager {
  private personalEquipment: PersonalEquipment;
  private equipmentCatalog: EquipmentCatalog = {};
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.personalEquipment = {
      suit: null,
      tool: null,
      datapad: null,
      accessory: null
    };
    this.initializeEquipmentCatalog();
  }

  /**
   * Initialize the catalog of available personal equipment
   */
  private initializeEquipmentCatalog(): void {
    const items: PersonalItem[] = [
      // Space Suits
      {
        id: 'basic_space_suit',
        name: 'Basic Space Suit',
        type: 'suit',
        description: 'Standard issue environmental protection suit',
        rarity: 'common',
        effects: {
          enduranceBonus: 2,
          oxygenEfficiency: 0.1,
          radiationResistance: 0.05
        },
        cost: 5000,
        durability: 1.0,
        maxDurability: 1.0
      },
      {
        id: 'advanced_space_suit',
        name: 'Advanced Space Suit', 
        type: 'suit',
        description: 'High-tech environmental suit with enhanced protection',
        rarity: 'uncommon',
        effects: {
          enduranceBonus: 5,
          strengthBonus: 3,
          oxygenEfficiency: 0.25,
          radiationResistance: 0.15
        },
        cost: 15000,
        durability: 1.0,
        maxDurability: 1.0
      },
      {
        id: 'power_suit',
        name: 'Power Suit',
        type: 'suit',
        description: 'Military-grade powered exoskeleton with comprehensive protection',
        rarity: 'rare',
        effects: {
          strengthBonus: 10,
          enduranceBonus: 8,
          combatBonus: 5,
          oxygenEfficiency: 0.4,
          radiationResistance: 0.3
        },
        cost: 50000,
        durability: 1.0,
        maxDurability: 1.0
      },

      // Multi-Tools
      {
        id: 'standard_multitool',
        name: 'Standard Multi-Tool',
        type: 'tool',
        description: 'Basic engineering tool for ship maintenance',
        rarity: 'common',
        effects: {
          engineeringBonus: 3,
          repairEfficiency: 0.1
        },
        cost: 2500,
        durability: 1.0,
        maxDurability: 1.0
      },
      {
        id: 'engineer_toolkit',
        name: 'Engineer\'s Toolkit',
        type: 'tool',
        description: 'Professional-grade tools for advanced repairs',
        rarity: 'uncommon',
        effects: {
          engineeringBonus: 7,
          intelligenceBonus: 3,
          repairEfficiency: 0.25
        },
        cost: 8000,
        durability: 1.0,
        maxDurability: 1.0
      },
      {
        id: 'master_toolkit',
        name: 'Master Craftsman\'s Toolkit',
        type: 'tool',
        description: 'Legendary tools used by the galaxy\'s finest engineers',
        rarity: 'legendary',
        effects: {
          engineeringBonus: 15,
          intelligenceBonus: 8,
          dexterityBonus: 5,
          repairEfficiency: 0.5
        },
        cost: 100000,
        durability: 1.0,
        maxDurability: 1.0
      },

      // Datapads
      {
        id: 'basic_datapad',
        name: 'Basic Datapad',
        type: 'datapad',
        description: 'Standard information terminal with basic analysis',
        rarity: 'common',
        effects: {
          intelligenceBonus: 2,
          informationAccess: 0.1
        },
        cost: 1500,
        durability: 1.0,
        maxDurability: 1.0
      },
      {
        id: 'analyst_datapad',
        name: 'Market Analyst Datapad',
        type: 'datapad',
        description: 'Specialized terminal with advanced market analysis',
        rarity: 'uncommon',
        effects: {
          intelligenceBonus: 5,
          tradingBonus: 4,
          informationAccess: 0.25,
          scannerRange: 0.2
        },
        cost: 12000,
        durability: 1.0,
        maxDurability: 1.0
      },
      {
        id: 'quantum_datapad',
        name: 'Quantum Analysis Datapad',
        type: 'datapad',
        description: 'Cutting-edge quantum computer with unlimited processing power',
        rarity: 'legendary',
        effects: {
          intelligenceBonus: 12,
          tradingBonus: 8,
          engineeringBonus: 6,
          hackingBonus: 10,
          informationAccess: 0.6,
          scannerRange: 0.5
        },
        cost: 200000,
        durability: 1.0,
        maxDurability: 1.0
      },

      // Accessories
      {
        id: 'lucky_charm',
        name: 'Lucky Charm',
        type: 'accessory',
        description: 'A small trinket that seems to bring good fortune',
        rarity: 'common',
        effects: {
          charismaBonus: 3
        },
        cost: 500,
        durability: 1.0,
        maxDurability: 1.0
      },
      {
        id: 'neural_implant',
        name: 'Neural Enhancement Implant',
        type: 'accessory',
        description: 'Cybernetic implant that enhances cognitive function',
        rarity: 'rare',
        effects: {
          intelligenceBonus: 8,
          perceptionBonus: 6,
          hackingBonus: 5
        },
        cost: 75000,
        durability: 1.0,
        maxDurability: 1.0
      },
      {
        id: 'diplomatic_badge',
        name: 'Diplomatic Credentials',
        type: 'accessory',
        description: 'Official diplomatic status granting special privileges',
        rarity: 'rare',
        effects: {
          charismaBonus: 10,
          tradingBonus: 6,
          informationAccess: 0.3
        },
        cost: 50000,
        durability: 1.0,
        maxDurability: 1.0
      }
    ];

    // Register all items in catalog
    items.forEach(item => {
      this.equipmentCatalog[item.id] = item;
    });
  }

  /**
   * Equip an item to a specific slot
   */
  equipItem(itemId: string, slot: keyof PersonalEquipment): boolean {
    const item = this.equipmentCatalog[itemId];
    if (!item) {
      return false;
    }

    // Check if item type matches slot
    const slotTypeMapping: Record<keyof PersonalEquipment, string> = {
      suit: 'suit',
      tool: 'tool', 
      datapad: 'datapad',
      accessory: 'accessory'
    };

    if (item.type !== slotTypeMapping[slot]) {
      return false;
    }

    // Store previously equipped item (for potential return to inventory)
    const previousItem = this.personalEquipment[slot];

    // Equip the new item (create a copy to avoid shared references)
    this.personalEquipment[slot] = {
      ...item,
      durability: item.durability // Preserve current durability
    };

    // Emit equipment change event
    this.emitEvent('item_equipped', {
      slot,
      newItem: item,
      previousItem
    });

    return true;
  }

  /**
   * Unequip an item from a slot
   */
  unequipItem(slot: keyof PersonalEquipment): PersonalItem | null {
    const item = this.personalEquipment[slot];
    if (!item) {
      return null;
    }

    this.personalEquipment[slot] = null;

    // Emit equipment change event
    this.emitEvent('item_unequipped', {
      slot,
      item
    });

    return item;
  }

  /**
   * Calculate comprehensive character stats with equipment bonuses
   */
  calculateEnhancedStats(
    baseAttributes: CharacterAttributes,
    baseSkills: CharacterSkills
  ): EnhancedCharacterStats {
    const equipmentAttributeBonus: Partial<CharacterAttributes> = {};
    const equipmentSkillBonus: Partial<CharacterSkills> = {};
    const equipmentBonuses: EquipmentBonus[] = [];
    const specialEffects: Map<string, number> = new Map();

    // Process each equipped item
    Object.entries(this.personalEquipment).forEach(([slot, item]) => {
      if (!item) return;

      const durabilityMultiplier = item.durability;
      const effects = item.effects;

      // Process attribute bonuses
      const attributeBonuses: (keyof CharacterAttributes)[] = [
        'strengthBonus', 'intelligenceBonus', 'charismaBonus',
        'enduranceBonus', 'dexterityBonus', 'perceptionBonus'
      ];

      attributeBonuses.forEach(bonusKey => {
        if (effects[bonusKey]) {
          const attributeName = bonusKey.replace('Bonus', '') as keyof CharacterAttributes;
          const bonusValue = Math.floor(effects[bonusKey]! * durabilityMultiplier);
          
          equipmentAttributeBonus[attributeName] = 
            (equipmentAttributeBonus[attributeName] || 0) + bonusValue;

          equipmentBonuses.push({
            source: item.id,
            type: 'attribute',
            target: attributeName,
            value: bonusValue,
            durabilityAffected: true,
            description: `${bonusKey}: +${bonusValue} from ${item.name}`
          });
        }
      });

      // Process skill bonuses
      const skillBonuses: Array<{ effectKey: keyof PersonalItemEffects, skillKey: keyof CharacterSkills }> = [
        { effectKey: 'tradingBonus', skillKey: 'trading' },
        { effectKey: 'engineeringBonus', skillKey: 'engineering' },
        { effectKey: 'pilotingBonus', skillKey: 'piloting' },
        { effectKey: 'combatBonus', skillKey: 'combat' },
        { effectKey: 'hackingBonus', skillKey: 'security' } // Map hacking to security skill
      ];

      skillBonuses.forEach(({ effectKey, skillKey }) => {
        if (effects[effectKey]) {
          const bonusValue = Math.floor(effects[effectKey]! * durabilityMultiplier);
          
          equipmentSkillBonus[skillKey] = 
            (equipmentSkillBonus[skillKey] || 0) + bonusValue;

          equipmentBonuses.push({
            source: item.id,
            type: 'skill',
            target: skillKey,
            value: bonusValue,
            durabilityAffected: true,
            description: `${effectKey}: +${bonusValue} from ${item.name}`
          });
        }
      });

      // Process special effects (these are usually percentages, so less affected by durability)
      const specialEffectKeys: (keyof PersonalItemEffects)[] = [
        'oxygenEfficiency', 'radiationResistance', 'repairEfficiency',
        'scannerRange', 'informationAccess'
      ];

      specialEffectKeys.forEach(effectKey => {
        if (effects[effectKey]) {
          const effectValue = effects[effectKey]! * Math.max(0.5, durabilityMultiplier); // Min 50% effectiveness
          
          const currentValue = specialEffects.get(effectKey) || 0;
          specialEffects.set(effectKey, currentValue + effectValue);

          equipmentBonuses.push({
            source: item.id,
            type: 'special',
            target: effectKey,
            value: effectValue,
            durabilityAffected: true,
            description: `${effectKey}: +${Math.round(effectValue * 100)}% from ${item.name}`
          });
        }
      });
    });

    // Calculate total stats
    const totalAttributes: CharacterAttributes = {
      strength: baseAttributes.strength + (equipmentAttributeBonus.strength || 0),
      intelligence: baseAttributes.intelligence + (equipmentAttributeBonus.intelligence || 0),
      charisma: baseAttributes.charisma + (equipmentAttributeBonus.charisma || 0),
      endurance: baseAttributes.endurance + (equipmentAttributeBonus.endurance || 0),
      dexterity: baseAttributes.dexterity + (equipmentAttributeBonus.dexterity || 0),
      perception: baseAttributes.perception + (equipmentAttributeBonus.perception || 0)
    };

    const totalSkills: CharacterSkills = {
      trading: baseSkills.trading + (equipmentSkillBonus.trading || 0),
      negotiation: baseSkills.negotiation + (equipmentSkillBonus.negotiation || 0),
      economics: baseSkills.economics + (equipmentSkillBonus.economics || 0),
      engineering: baseSkills.engineering + (equipmentSkillBonus.engineering || 0),
      piloting: baseSkills.piloting + (equipmentSkillBonus.piloting || 0),
      navigation: baseSkills.navigation + (equipmentSkillBonus.navigation || 0),
      combat: baseSkills.combat + (equipmentSkillBonus.combat || 0),
      tactics: baseSkills.tactics + (equipmentSkillBonus.tactics || 0),
      security: baseSkills.security + (equipmentSkillBonus.security || 0),
      networking: baseSkills.networking + (equipmentSkillBonus.networking || 0),
      investigation: baseSkills.investigation + (equipmentSkillBonus.investigation || 0),
      leadership: baseSkills.leadership + (equipmentSkillBonus.leadership || 0)
    };

    return {
      baseAttributes,
      baseSkills,
      equipmentAttributeBonus,
      equipmentSkillBonus,
      totalAttributes,
      totalSkills,
      equipmentBonuses,
      specialEffects
    };
  }

  /**
   * Apply durability damage to an equipped item
   */
  damageEquipment(slot: keyof PersonalEquipment, damageAmount: number): void {
    const item = this.personalEquipment[slot];
    if (!item) return;

    item.durability = Math.max(0, item.durability - damageAmount);

    // Emit durability change event
    this.emitEvent('equipment_damaged', {
      slot,
      item,
      damageAmount,
      newDurability: item.durability
    });

    // Check if item is broken
    if (item.durability <= 0) {
      this.emitEvent('equipment_broken', {
        slot,
        item
      });
    }
  }

  /**
   * Repair equipment durability
   */
  repairEquipment(slot: keyof PersonalEquipment, repairAmount: number): boolean {
    const item = this.personalEquipment[slot];
    if (!item) return false;

    const oldDurability = item.durability;
    item.durability = Math.min(item.maxDurability, item.durability + repairAmount);

    if (item.durability > oldDurability) {
      this.emitEvent('equipment_repaired', {
        slot,
        item,
        repairAmount: item.durability - oldDurability,
        newDurability: item.durability
      });
      return true;
    }

    return false;
  }

  /**
   * Get currently equipped items
   */
  getEquippedItems(): PersonalEquipment {
    return { ...this.personalEquipment };
  }

  /**
   * Get item from catalog
   */
  getItemFromCatalog(itemId: string): PersonalItem | null {
    return this.equipmentCatalog[itemId] || null;
  }

  /**
   * Get all available items from catalog
   */
  getEquipmentCatalog(): EquipmentCatalog {
    return { ...this.equipmentCatalog };
  }

  /**
   * Get items from catalog by type
   */
  getItemsByType(type: PersonalItem['type']): PersonalItem[] {
    return Object.values(this.equipmentCatalog).filter(item => item.type === type);
  }

  /**
   * Get items from catalog by rarity
   */
  getItemsByRarity(rarity: PersonalItem['rarity']): PersonalItem[] {
    return Object.values(this.equipmentCatalog).filter(item => item.rarity === rarity);
  }

  /**
   * Check if a specific special effect is active
   */
  hasSpecialEffect(effectName: string): boolean {
    return Array.from(Object.values(this.personalEquipment))
      .some(item => item && item.effects[effectName as keyof PersonalItemEffects]);
  }

  /**
   * Get the total value of a special effect across all equipment
   */
  getSpecialEffectValue(effectName: string): number {
    let totalValue = 0;
    
    Object.values(this.personalEquipment).forEach(item => {
      if (item && item.effects[effectName as keyof PersonalItemEffects]) {
        const effectValue = item.effects[effectName as keyof PersonalItemEffects]!;
        const durabilityMultiplier = Math.max(0.5, item.durability);
        totalValue += effectValue * durabilityMultiplier;
      }
    });

    return totalValue;
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (data: any) => void): void {
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
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  /**
   * Serialize equipment data for save/load
   */
  serialize(): PersonalEquipmentManagerSaveData {
    return {
      personalEquipment: {
        suit: this.personalEquipment.suit ? { ...this.personalEquipment.suit } : null,
        tool: this.personalEquipment.tool ? { ...this.personalEquipment.tool } : null,
        datapad: this.personalEquipment.datapad ? { ...this.personalEquipment.datapad } : null,
        accessory: this.personalEquipment.accessory ? { ...this.personalEquipment.accessory } : null
      },
      equipmentCatalog: { ...this.equipmentCatalog }
    };
  }

  /**
   * Load equipment data from save
   */
  deserialize(data: PersonalEquipmentManagerSaveData): void {
    if (data.personalEquipment) {
      this.personalEquipment = {
        suit: data.personalEquipment.suit ? { ...data.personalEquipment.suit } : null,
        tool: data.personalEquipment.tool ? { ...data.personalEquipment.tool } : null,
        datapad: data.personalEquipment.datapad ? { ...data.personalEquipment.datapad } : null,
        accessory: data.personalEquipment.accessory ? { ...data.personalEquipment.accessory } : null
      };
    }

    if (data.equipmentCatalog) {
      this.equipmentCatalog = { ...data.equipmentCatalog };
    }
  }
}