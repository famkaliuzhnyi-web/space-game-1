/**
 * Quest and Storyline system types for the Space Game
 * Defines structures for faction storylines, major questlines, and narrative content
 */

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'locked';

export type QuestType = 
  | 'main_story'
  | 'faction_storyline'
  | 'side_quest'
  | 'chain_quest'
  | 'repeatable'
  | 'seasonal'
  | 'endgame';

export type QuestCategory = 
  | 'trading'
  | 'combat'
  | 'exploration'
  | 'diplomacy'
  | 'investigation'
  | 'construction'
  | 'mystery'
  | 'character';

export interface QuestObjective {
  id: string;
  description: string;
  type: 'deliver' | 'eliminate' | 'visit' | 'collect' | 'interact' | 'build' | 'achieve';
  target?: string;
  quantity?: number;
  currentProgress?: number;
  completed: boolean;
  hidden?: boolean; // For mystery objectives revealed during quest
}

export interface QuestReward {
  credits?: number;
  experience?: number;
  items?: string[];
  reputation?: { [factionId: string]: number };
  unlocks?: string[]; // Unlocked features, areas, or quests
  ships?: string[];
  blueprints?: string[];
}

export interface QuestRequirement {
  level?: number;
  reputation?: { [factionId: string]: number };
  completedQuests?: string[];
  skills?: { [skillName: string]: number };
  credits?: number;
  items?: string[];
  achievements?: string[];
}

export interface DialogueOption {
  id: string;
  text: string;
  requirements?: QuestRequirement;
  consequences?: {
    reputation?: { [factionId: string]: number };
    nextDialogue?: string;
    setFlag?: string;
    removeFlag?: string;
    startQuest?: string;
    completeObjective?: string;
  };
}

export interface Dialogue {
  id: string;
  speaker: string;
  text: string;
  options: DialogueOption[];
  conditions?: {
    flags?: string[];
    questStatus?: { [questId: string]: QuestStatus };
    reputation?: { [factionId: string]: number };
  };
}

export interface StoryQuest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  category: QuestCategory;
  status: QuestStatus;
  
  // Prerequisites and requirements
  requirements: QuestRequirement;
  
  // Quest objectives
  objectives: QuestObjective[];
  
  // Rewards
  rewards: QuestReward;
  
  // Story and dialogue
  giver: string; // NPC or faction ID
  startDialogue?: string;
  progressDialogues?: { [objectiveId: string]: string };
  completionDialogue?: string;
  
  // Quest chain information
  chainId?: string;
  previousQuest?: string;
  nextQuest?: string;
  
  // Temporal aspects
  startDate?: number;
  deadline?: number;
  timeLimit?: number;
  
  // Faction and story context
  factionId?: string;
  storyArc?: string;
  
  // Metadata
  priority: number; // Higher priority quests show first
  repeatable: boolean;
  seasonal?: {
    startMonth: number;
    endMonth: number;
  };
  
  // Progress tracking
  startedAt?: number;
  completedAt?: number;
  failedAt?: number;
}

export interface StoryArc {
  id: string;
  title: string;
  description: string;
  factionId?: string;
  quests: string[]; // Quest IDs in order
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  unlockRequirements?: QuestRequirement;
}

export interface QuestFlag {
  id: string;
  value: boolean | string | number;
  setAt: number;
  description?: string;
}

export interface QuestSystemState {
  activeQuests: Map<string, StoryQuest>;
  completedQuests: string[];
  failedQuests: string[];
  availableQuests: string[];
  questFlags: Map<string, QuestFlag>;
  storyArcs: Map<string, StoryArc>;
  dialogueHistory: Map<string, number>; // NPC ID -> last dialogue timestamp
}

// Storyline definitions for different factions
export interface FactionStoryline {
  factionId: string;
  title: string;
  description: string;
  arcs: StoryArc[];
  reputation_requirements: {
    friendly: number;
    allied: number;
    trusted: number;
  };
}

// Pre-defined major storylines
export type MajorStoryline = 
  | 'traders_guild_rise'
  | 'federation_conspiracy'
  | 'outer_colonies_rebellion'
  | 'ancient_technology'
  | 'pirate_wars'
  | 'corporate_espionage'
  | 'alien_contact'
  | 'economic_collapse';

// Seasonal content
export interface SeasonalContent {
  id: string;
  name: string;
  description: string;
  startMonth: number;
  endMonth: number;
  quests: string[];
  events: string[];
  rewards: QuestReward[];
  unlocks: string[];
}