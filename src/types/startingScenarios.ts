/**
 * Starting Scenarios System Types
 * Defines pre-configured game starting conditions similar to X4 or Kenshi starting scenarios
 */

import { CharacterAttributes, CharacterSkills } from './character';

// Main starting scenario definition
export interface StartingScenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  category: 'trading' | 'exploration' | 'combat' | 'balanced' | 'challenge';
  
  // Character setup
  characterSetup: ScenarioCharacterSetup;
  
  // Economic starting conditions
  startingCredits: number;
  startingLocation: string; // Station ID where player starts
  
  // Ship configuration
  startingShip: ScenarioShipSetup;
  
  // Faction relationships
  factionStandings: Record<string, number>; // faction ID -> standing (-100 to 100)
  
  // Optional starting cargo
  startingCargo?: Record<string, number>; // commodityId -> quantity
  
  // Optional starting quests
  startingQuests?: string[]; // quest IDs to auto-start
  
  // Narrative context
  backgroundStory: string; // Rich text description of the scenario's story
  objectives: string[]; // Suggested objectives for this start
  
  // Gameplay modifiers
  specialConditions?: ScenarioConditions;
}

// Character setup overrides for scenarios
export interface ScenarioCharacterSetup {
  // Override character background
  backgroundId?: string;
  
  // Attribute bonuses/penalties on top of background
  attributeModifiers: Partial<CharacterAttributes>;
  
  // Skill bonuses/penalties on top of background  
  skillModifiers: Partial<CharacterSkills>;
  
  // Starting personal equipment IDs
  startingEquipment: string[];
  
  // Force certain appearance settings
  forcedAppearance?: {
    gender?: 'male' | 'female' | 'other';
    age?: number;
    portrait?: string;
  };
}

// Ship configuration for scenarios
export interface ScenarioShipSetup {
  shipClassId: string; // Which ship class to start with
  shipName: string; // Default name for the starting ship
  condition: {
    hull: number; // 0-1, ship condition
    engines: number;
    cargo: number;
    shields: number;
  };
  
  // Starting equipment installed
  equipment: {
    engines: string[]; // Equipment IDs
    cargo: string[];
    shields: string[];
    weapons: string[];
    utility: string[];
  };
  
  // Ship customization
  paintJob?: string; // Visual customization
}

// Special conditions and modifiers
export interface ScenarioConditions {
  // Economic modifiers
  tradeDiscountPercent?: number; // Bonus/penalty to trade prices
  contractPayoutModifier?: number; // Multiplier for contract rewards
  
  // Reputation modifiers
  reputationGainModifier?: number; // Faster/slower reputation changes
  
  // Gameplay restrictions
  forbiddenStations?: string[]; // Stations player cannot dock at initially
  forbiddenFactions?: string[]; // Factions that are hostile from start
  
  // Starting status effects
  hasDebt?: {
    amount: number;
    creditor: string; // Faction or entity owed
    deadline: number; // Days to pay back
  };
  
  isWanted?: {
    factions: string[]; // Which factions have bounties
    bountyAmount: number;
  };
  
  hasContracts?: {
    contractIds: string[]; // Pre-signed contracts
  };
}

// Configuration for the scenario selection system
export interface ScenarioSelectionConfig {
  defaultScenarioId: string; // Fallback if none selected
  allowCustomStart: boolean; // Whether to show "Custom" option
  categorySorting: string[]; // Order to display categories
}

// Runtime state for scenario selection
export interface ScenarioSelectionState {
  selectedScenarioId: string | null;
  isConfirmed: boolean;
  previewData: ScenarioPreviewData | null;
}

// Data for previewing scenario effects
export interface ScenarioPreviewData {
  finalCredits: number;
  finalAttributes: CharacterAttributes;
  finalSkills: CharacterSkills;
  shipDetails: {
    className: string;
    cargoCapacity: number;
    condition: number; // Overall condition 0-1
  };
  factionSummary: {
    hostile: string[]; // Faction names
    neutral: string[];
    friendly: string[];
  };
  startingAdvantages: string[]; // Human-readable benefits
  startingChallenges: string[]; // Human-readable drawbacks
}

// Events fired by scenario system
export interface ScenarioEvent {
  type: 'scenario-selected' | 'scenario-applied' | 'scenario-cancelled';
  scenarioId?: string;
  timestamp: number;
}