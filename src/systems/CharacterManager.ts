/**
 * CharacterManager
 * Manages character creation, progression, skills, and personal equipment
 */

import { 
  Character,
  CharacterAttributes,
  CharacterSkills,
  CharacterProgression,
  CharacterBackground,
  CharacterAppearance,
  PersonalEquipment,
  PersonalItem,
  ExperienceGain,
  SkillChangeRecord,
  CharacterCreationConfig
} from '../types/character';

interface CharacterManagerSaveData {
  character: Character;
  experienceHistory: ExperienceGain[];
}

export class CharacterManager {
  private character: Character | null = null;
  private experienceHistory: ExperienceGain[] = [];
  private config: CharacterCreationConfig;

  constructor() {
    this.config = this.getDefaultCreationConfig();
  }

  /**
   * Create a new character with default values
   */
  createCharacter(
    id: string,
    name: string,
    appearance: CharacterAppearance,
    backgroundId: string,
    allocatedAttributes: Partial<CharacterAttributes> = {},
    allocatedSkills: Partial<CharacterSkills> = {}
  ): Character {
    const background = this.getBackground(backgroundId);
    const baseAttributes = this.getBaseAttributes();
    const baseSkills = this.getBaseSkills();

    // Apply background bonuses
    const attributes: CharacterAttributes = {
      strength: (baseAttributes.strength + (background.startingAttributeBonus.strength || 0) + (allocatedAttributes.strength || 0)),
      intelligence: (baseAttributes.intelligence + (background.startingAttributeBonus.intelligence || 0) + (allocatedAttributes.intelligence || 0)),
      charisma: (baseAttributes.charisma + (background.startingAttributeBonus.charisma || 0) + (allocatedAttributes.charisma || 0)),
      endurance: (baseAttributes.endurance + (background.startingAttributeBonus.endurance || 0) + (allocatedAttributes.endurance || 0)),
      dexterity: (baseAttributes.dexterity + (background.startingAttributeBonus.dexterity || 0) + (allocatedAttributes.dexterity || 0)),
      perception: (baseAttributes.perception + (background.startingAttributeBonus.perception || 0) + (allocatedAttributes.perception || 0))
    };

    const skills: CharacterSkills = {
      trading: (baseSkills.trading + (background.startingSkillBonus.trading || 0) + (allocatedSkills.trading || 0)),
      negotiation: (baseSkills.negotiation + (background.startingSkillBonus.negotiation || 0) + (allocatedSkills.negotiation || 0)),
      economics: (baseSkills.economics + (background.startingSkillBonus.economics || 0) + (allocatedSkills.economics || 0)),
      engineering: (baseSkills.engineering + (background.startingSkillBonus.engineering || 0) + (allocatedSkills.engineering || 0)),
      piloting: (baseSkills.piloting + (background.startingSkillBonus.piloting || 0) + (allocatedSkills.piloting || 0)),
      navigation: (baseSkills.navigation + (background.startingSkillBonus.navigation || 0) + (allocatedSkills.navigation || 0)),
      combat: (baseSkills.combat + (background.startingSkillBonus.combat || 0) + (allocatedSkills.combat || 0)),
      tactics: (baseSkills.tactics + (background.startingSkillBonus.tactics || 0) + (allocatedSkills.tactics || 0)),
      security: (baseSkills.security + (background.startingSkillBonus.security || 0) + (allocatedSkills.security || 0)),
      networking: (baseSkills.networking + (background.startingSkillBonus.networking || 0) + (allocatedSkills.networking || 0)),
      investigation: (baseSkills.investigation + (background.startingSkillBonus.investigation || 0) + (allocatedSkills.investigation || 0)),
      leadership: (baseSkills.leadership + (background.startingSkillBonus.leadership || 0) + (allocatedSkills.leadership || 0))
    };

    const progression: CharacterProgression = {
      level: 1,
      experience: 0,
      experienceToNext: this.getExperienceForLevel(2),
      skillPoints: 0,
      attributePoints: 0,
      totalAttributePointsSpent: this.getTotalAllocatedPoints(allocatedAttributes),
      totalSkillPointsSpent: this.getTotalAllocatedPoints(allocatedSkills)
    };

    this.character = {
      id,
      name,
      appearance,
      background,
      attributes,
      skills,
      progression,
      personalEquipment: this.getEmptyPersonalEquipment(),
      achievements: [],
      skillHistory: []
    };

    return this.character;
  }

  /**
   * Get current character
   */
  getCharacter(): Character | null {
    return this.character;
  }

  /**
   * Load existing character data
   */
  loadCharacter(characterData: Character): void {
    this.character = { ...characterData };
  }

  /**
   * Award experience points and handle level ups
   */
  awardExperience(amount: number, source: string, category: ExperienceGain['category']): boolean {
    if (!this.character) return false;

    const experienceGain: ExperienceGain = {
      source,
      amount,
      category,
      timestamp: Date.now()
    };

    this.experienceHistory.push(experienceGain);
    this.character.progression.experience += amount;

    // Check for level up (but don't base success on it)
    this.checkLevelUp();
    
    // Return true if experience was successfully awarded
    return true;
  }

  /**
   * Check if character should level up and apply benefits
   */
  private checkLevelUp(): boolean {
    if (!this.character) return false;

    let leveledUp = false;
    while (this.character.progression.experience >= this.character.progression.experienceToNext) {
      this.character.progression.level += 1;
      this.character.progression.skillPoints += 3; // 3 skill points per level
      
      // Attribute points every 3 levels
      if (this.character.progression.level % 3 === 0) {
        this.character.progression.attributePoints += 1;
      }

      this.character.progression.experienceToNext = this.getExperienceForLevel(this.character.progression.level + 1);
      leveledUp = true;
    }

    return leveledUp;
  }

  /**
   * Spend skill points to increase a skill
   */
  increaseSkill(skillName: keyof CharacterSkills, points: number): boolean {
    if (!this.character) return false;
    if (points <= 0 || this.character.progression.skillPoints < points) return false;

    const currentValue = this.character.skills[skillName];
    const maxIncrease = Math.min(points, 100 - currentValue); // Cap at 100

    if (maxIncrease <= 0) return false;

    const oldValue = currentValue;
    this.character.skills[skillName] = currentValue + maxIncrease;
    this.character.progression.skillPoints -= maxIncrease;
    this.character.progression.totalSkillPointsSpent += maxIncrease;

    // Record skill change
    const record: SkillChangeRecord = {
      skillName,
      oldValue,
      newValue: this.character.skills[skillName],
      source: 'Skill Points Allocation',
      timestamp: Date.now()
    };
    this.character.skillHistory.push(record);

    return true;
  }

  /**
   * Spend attribute points to increase an attribute
   */
  increaseAttribute(attributeName: keyof CharacterAttributes, points: number): boolean {
    if (!this.character) return false;
    if (points <= 0 || this.character.progression.attributePoints < points) return false;

    const currentValue = this.character.attributes[attributeName];
    const maxIncrease = Math.min(points, 100 - currentValue); // Cap at 100

    if (maxIncrease <= 0) return false;

    this.character.attributes[attributeName] = currentValue + maxIncrease;
    this.character.progression.attributePoints -= maxIncrease;
    this.character.progression.totalAttributePointsSpent += maxIncrease;

    return true;
  }

  /**
   * Equip personal equipment
   */
  equipPersonalItem(item: PersonalItem): boolean {
    if (!this.character) return false;

    // Unequip existing item of same type if any
    this.character.personalEquipment[item.type] = item;
    return true;
  }

  /**
   * Unequip personal equipment
   */
  unequipPersonalItem(type: keyof PersonalEquipment): PersonalItem | null {
    if (!this.character) return null;

    const item = this.character.personalEquipment[type];
    this.character.personalEquipment[type] = null;
    return item;
  }

  /**
   * Get calculated attribute bonuses from equipment
   */
  getEquipmentAttributeBonuses(): Partial<CharacterAttributes> {
    if (!this.character) return {};

    const bonuses: Partial<CharacterAttributes> = {};
    Object.values(this.character.personalEquipment).forEach(item => {
      if (item && item.effects) {
        if (item.effects.strengthBonus) bonuses.strength = (bonuses.strength || 0) + item.effects.strengthBonus;
        if (item.effects.intelligenceBonus) bonuses.intelligence = (bonuses.intelligence || 0) + item.effects.intelligenceBonus;
        if (item.effects.charismaBonus) bonuses.charisma = (bonuses.charisma || 0) + item.effects.charismaBonus;
        if (item.effects.enduranceBonus) bonuses.endurance = (bonuses.endurance || 0) + item.effects.enduranceBonus;
        if (item.effects.dexterityBonus) bonuses.dexterity = (bonuses.dexterity || 0) + item.effects.dexterityBonus;
        if (item.effects.perceptionBonus) bonuses.perception = (bonuses.perception || 0) + item.effects.perceptionBonus;
      }
    });

    return bonuses;
  }

  /**
   * Get total effective attributes (base + equipment bonuses)
   */
  getEffectiveAttributes(): CharacterAttributes {
    if (!this.character) return this.getBaseAttributes();

    const base = this.character.attributes;
    const bonuses = this.getEquipmentAttributeBonuses();

    return {
      strength: Math.min(100, base.strength + (bonuses.strength || 0)),
      intelligence: Math.min(100, base.intelligence + (bonuses.intelligence || 0)),
      charisma: Math.min(100, base.charisma + (bonuses.charisma || 0)),
      endurance: Math.min(100, base.endurance + (bonuses.endurance || 0)),
      dexterity: Math.min(100, base.dexterity + (bonuses.dexterity || 0)),
      perception: Math.min(100, base.perception + (bonuses.perception || 0))
    };
  }

  /**
   * Get experience history
   */
  getExperienceHistory(limit: number = 50): ExperienceGain[] {
    return this.experienceHistory.slice(-limit);
  }

  /**
   * Calculate experience required for a specific level
   */
  private getExperienceForLevel(level: number): number {
    if (level <= 1) return 0;
    // More balanced progression: 150, 300, 475, 675, etc.
    return Math.floor(100 * level * 1.5);
  }

  /**
   * Get available character backgrounds
   */
  getAvailableBackgrounds(): CharacterBackground[] {
    return [
      {
        id: 'merchant',
        name: 'Merchant',
        description: 'Started as a trader, skilled in commerce and negotiation.',
        startingAttributeBonus: { charisma: 5, intelligence: 3 },
        startingSkillBonus: { trading: 15, negotiation: 10, economics: 8 },
        startingEquipment: ['merchant-datapad'],
        startingCredits: 2000
      },
      {
        id: 'pilot',
        name: 'Pilot',
        description: 'Experienced spaceship pilot with superior flying skills.',
        startingAttributeBonus: { dexterity: 8, perception: 5 },
        startingSkillBonus: { piloting: 18, navigation: 12, tactics: 5 },
        startingEquipment: ['pilot-suit'],
        startingCredits: 500
      },
      {
        id: 'engineer',
        name: 'Engineer',
        description: 'Technical expert specializing in ship systems and maintenance.',
        startingAttributeBonus: { intelligence: 8, strength: 2 },
        startingSkillBonus: { engineering: 20, security: 8, investigation: 5 },
        startingEquipment: ['engineering-tool'],
        startingCredits: 1000
      },
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Adventurous soul with knowledge of distant systems.',
        startingAttributeBonus: { endurance: 5, perception: 8 },
        startingSkillBonus: { navigation: 15, investigation: 12, networking: 8 },
        startingEquipment: ['explorer-scanner'],
        startingCredits: 800
      }
    ];
  }

  /**
   * Get specific background by ID
   */
  private getBackground(backgroundId: string): CharacterBackground {
    const background = this.getAvailableBackgrounds().find(bg => bg.id === backgroundId);
    if (!background) {
      throw new Error(`Background with ID ${backgroundId} not found`);
    }
    return background;
  }

  /**
   * Get base attribute values
   */
  private getBaseAttributes(): CharacterAttributes {
    return {
      strength: 10,
      intelligence: 10,
      charisma: 10,
      endurance: 10,
      dexterity: 10,
      perception: 10
    };
  }

  /**
   * Get base skill values
   */
  private getBaseSkills(): CharacterSkills {
    return {
      trading: 0,
      negotiation: 0,
      economics: 0,
      engineering: 0,
      piloting: 0,
      navigation: 0,
      combat: 0,
      tactics: 0,
      security: 0,
      networking: 0,
      investigation: 0,
      leadership: 0
    };
  }

  /**
   * Get empty personal equipment set
   */
  private getEmptyPersonalEquipment(): PersonalEquipment {
    return {
      suit: null,
      tool: null,
      datapad: null,
      accessory: null
    };
  }

  /**
   * Get default character creation configuration
   */
  private getDefaultCreationConfig(): CharacterCreationConfig {
    return {
      startingAttributePoints: 20,
      startingSkillPoints: 30,
      maxAttributeValue: 40,
      maxSkillValue: 50,
      availableBackgrounds: ['merchant', 'pilot', 'engineer', 'explorer']
    };
  }

  /**
   * Get total allocated points from partial attributes/skills
   */
  private getTotalAllocatedPoints(allocated: Partial<CharacterAttributes> | Partial<CharacterSkills>): number {
    return Object.values(allocated).reduce((sum, value) => sum + (value || 0), 0);
  }

  /**
   * Get character creation configuration
   */
  getCreationConfig(): CharacterCreationConfig {
    return { ...this.config };
  }

  /**
   * Serialize character data for saving
   */
  serialize(): CharacterManagerSaveData | null {
    if (!this.character) return null;

    return {
      character: {
        ...this.character,
        skillHistory: this.character.skillHistory.slice(-100) // Limit history size
      },
      experienceHistory: this.experienceHistory.slice(-200) // Limit history size
    };
  }

  /**
   * Deserialize character data from save
   */
  deserialize(data: CharacterManagerSaveData): boolean {
    try {
      if (data.character) {
        this.character = data.character;
      }
      if (data.experienceHistory) {
        this.experienceHistory = data.experienceHistory;
      }
      return true;
    } catch (error) {
      console.error('Failed to deserialize character data:', error);
      return false;
    }
  }
}