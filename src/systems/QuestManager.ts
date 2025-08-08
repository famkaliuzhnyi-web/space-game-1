import { 
  StoryQuest, 
  QuestSystemState, 
  StoryArc, 
  FactionStoryline,
  SeasonalContent,
  Dialogue,
} from '../types/quests';
import { FactionManager } from './FactionManager';
import { CharacterManager } from './CharacterManager';
import { PlayerManager } from './PlayerManager';
import { TimeManager } from './TimeManager';
import { EventManager } from './EventManager';

/**
 * QuestManager handles faction storylines, major questlines, and narrative content.
 * 
 * Responsibilities:
 * - Managing active, completed, and available quests
 * - Processing quest objectives and progression
 * - Handling dialogue systems and story branching
 * - Coordinating with faction and character progression systems
 * - Managing seasonal and time-limited content
 * - Creating dynamic storylines based on player choices
 * 
 * Features:
 * - Multi-arc faction storylines with reputation gating
 * - Dynamic quest generation based on player progression
 * - Dialogue trees with faction and character state awareness
 * - Seasonal events and time-limited content
 * - Save/load support for quest progress and story flags
 */
export class QuestManager {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _factionManager: FactionManager;
  private characterManager: CharacterManager;
  private playerManager: PlayerManager;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _timeManager: TimeManager;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _eventManager: EventManager;

  private questSystemState: QuestSystemState = {
    activeQuests: new Map(),
    completedQuests: [],
    failedQuests: [],
    availableQuests: [],
    questFlags: new Map(),
    storyArcs: new Map(),
    dialogueHistory: new Map()
  };

  private questDefinitions: Map<string, StoryQuest> = new Map();
  private _storyArcDefinitions: Map<string, StoryArc> = new Map();
  private factionStorylines: Map<string, FactionStoryline> = new Map();
  private seasonalContent: Map<string, SeasonalContent> = new Map();
  private _dialogues: Map<string, Dialogue> = new Map();

  constructor(
    factionManager: FactionManager,
    characterManager: CharacterManager,
    playerManager: PlayerManager,
    timeManager: TimeManager,
    eventManager: EventManager
  ) {
    this._factionManager = factionManager;
    this.characterManager = characterManager;
    this.playerManager = playerManager;
    this._timeManager = timeManager;
    this._eventManager = eventManager;

    this.initializeQuestDefinitions();
    this.initializeFactionStorylines();
    this.initializeSeasonalContent();
    this.initializeDialogues();
    
    // Debug log showing initialization
    console.log('QuestManager initialized with', {
      factionManager: !!this._factionManager,
      timeManager: !!this._timeManager,
      eventManager: !!this._eventManager,
      storyArcs: this._storyArcDefinitions.size,
      dialogues: this._dialogues.size
    });
  }

  /**
   * Update quest system - check for new quests, progress objectives, handle time limits
   */
  update(deltaTime: number): void {
    this.checkForNewQuests();
    this.updateActiveQuests(deltaTime);
    this.checkSeasonalContent();
    this.cleanupExpiredQuests();
  }

  /**
   * Check if player meets requirements for new quests
   */
  private checkForNewQuests(): void {
    for (const [questId, quest] of this.questDefinitions) {
      if (this.questSystemState.availableQuests.includes(questId) ||
          this.questSystemState.activeQuests.has(questId) ||
          this.questSystemState.completedQuests.includes(questId)) {
        continue;
      }

      if (this.meetsRequirements(quest.requirements)) {
        this.questSystemState.availableQuests.push(questId);
      }
    }
  }

  /**
   * Update active quest progress and objectives
   */
  private updateActiveQuests(_deltaTime: number): void {
    for (const [questId, quest] of this.questSystemState.activeQuests) {
      // Check time limits
      if (quest.timeLimit && quest.startedAt) {
        const elapsed = Date.now() - quest.startedAt;
        if (elapsed > quest.timeLimit) {
          this.failQuest(questId, 'Time limit exceeded');
          continue;
        }
      }

      // Check deadlines
      if (quest.deadline && Date.now() > quest.deadline) {
        this.failQuest(questId, 'Deadline missed');
        continue;
      }

      // Check if all objectives are completed
      const allCompleted = quest.objectives.every(obj => obj.completed);
      if (allCompleted) {
        this.completeQuest(questId);
      }
    }
  }

  /**
   * Check seasonal content availability
   */
  private checkSeasonalContent(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

    for (const [_contentId, content] of this.seasonalContent) {
      const isActive = currentMonth >= content.startMonth && currentMonth <= content.endMonth;
      
      if (isActive) {
        // Add seasonal quests to available quests
        content.quests.forEach(questId => {
          if (!this.questSystemState.availableQuests.includes(questId) &&
              !this.questSystemState.activeQuests.has(questId) &&
              !this.questSystemState.completedQuests.includes(questId)) {
            
            const quest = this.questDefinitions.get(questId);
            if (quest && this.meetsRequirements(quest.requirements)) {
              this.questSystemState.availableQuests.push(questId);
            }
          }
        });
      }
    }
  }

  /**
   * Start a quest
   */
  startQuest(questId: string): boolean {
    const quest = this.questDefinitions.get(questId);
    if (!quest) {
      console.warn(`Quest not found: ${questId}`);
      return false;
    }

    if (!this.meetsRequirements(quest.requirements)) {
      console.warn(`Requirements not met for quest: ${questId}`);
      return false;
    }

    // Remove from available quests
    const availableIndex = this.questSystemState.availableQuests.indexOf(questId);
    if (availableIndex >= 0) {
      this.questSystemState.availableQuests.splice(availableIndex, 1);
    }

    // Create a copy of the quest and add to active quests
    const activeQuest: StoryQuest = {
      ...quest,
      status: 'active',
      startedAt: Date.now(),
      objectives: quest.objectives.map(obj => ({ ...obj, currentProgress: 0, completed: false }))
    };

    this.questSystemState.activeQuests.set(questId, activeQuest);

    console.log(`Quest started: ${quest.title}`);
    return true;
  }

  /**
   * Complete a quest
   */
  completeQuest(questId: string): boolean {
    const quest = this.questSystemState.activeQuests.get(questId);
    if (!quest) {
      return false;
    }

    quest.status = 'completed';
    quest.completedAt = Date.now();

    // Award rewards
    this.awardQuestRewards(quest);

    // Move to completed quests
    this.questSystemState.activeQuests.delete(questId);
    this.questSystemState.completedQuests.push(questId);

    // Check if this unlocks next quest in chain
    if (quest.nextQuest) {
      const nextQuest = this.questDefinitions.get(quest.nextQuest);
      if (nextQuest && this.meetsRequirements(nextQuest.requirements)) {
        this.questSystemState.availableQuests.push(quest.nextQuest);
      }
    }

    // Update story arc progress
    if (quest.storyArc) {
      this.updateStoryArcProgress(quest.storyArc);
    }

    console.log(`Quest completed: ${quest.title}`);
    return true;
  }

  /**
   * Fail a quest
   */
  failQuest(questId: string, reason: string): boolean {
    const quest = this.questSystemState.activeQuests.get(questId);
    if (!quest) {
      return false;
    }

    quest.status = 'failed';
    quest.failedAt = Date.now();

    this.questSystemState.activeQuests.delete(questId);
    this.questSystemState.failedQuests.push(questId);

    console.log(`Quest failed: ${quest.title} - ${reason}`);
    return true;
  }

  /**
   * Progress a specific objective
   */
  progressObjective(questId: string, objectiveId: string, amount: number = 1): boolean {
    const quest = this.questSystemState.activeQuests.get(questId);
    if (!quest) {
      return false;
    }

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) {
      return false;
    }

    objective.currentProgress = (objective.currentProgress || 0) + amount;
    
    if (objective.quantity && objective.currentProgress >= objective.quantity) {
      objective.completed = true;
      console.log(`Objective completed: ${objective.description}`);
    }

    return true;
  }

  /**
   * Set a quest flag
   */
  setFlag(flagId: string, value: boolean | string | number): void {
    this.questSystemState.questFlags.set(flagId, {
      id: flagId,
      value: value,
      setAt: Date.now()
    });
  }

  /**
   * Get a quest flag value
   */
  getFlag(flagId: string): boolean | string | number | undefined {
    const flag = this.questSystemState.questFlags.get(flagId);
    return flag?.value;
  }

  /**
   * Check if player meets quest requirements
   */
  private meetsRequirements(requirements: any): boolean {
    // Check level requirement
    if (requirements.level) {
      const character = this.characterManager.getCharacter();
      if (!character || character.progression.level < requirements.level) {
        return false;
      }
    }

    // Check reputation requirements
    if (requirements.reputation) {
      for (const [factionId, requiredRep] of Object.entries(requirements.reputation)) {
        const currentRep = this.playerManager.getReputationForFaction(factionId)?.standing || 0;
        if (currentRep < (requiredRep as number)) {
          return false;
        }
      }
    }

    // Check completed quests
    if (requirements.completedQuests) {
      for (const questId of requirements.completedQuests) {
        if (!this.questSystemState.completedQuests.includes(questId)) {
          return false;
        }
      }
    }

    // Check skills
    if (requirements.skills) {
      const character = this.characterManager.getCharacter();
      if (!character) return false;

      for (const [skillName, requiredLevel] of Object.entries(requirements.skills)) {
        const currentLevel = character.skills[skillName as keyof typeof character.skills] || 0;
        if (currentLevel < (requiredLevel as number)) {
          return false;
        }
      }
    }

    // Check credits
    if (requirements.credits && this.playerManager.getPlayer()?.credits < requirements.credits) {
      return false;
    }

    return true;
  }

  /**
   * Award quest rewards to player
   */
  private awardQuestRewards(quest: StoryQuest): void {
    const player = this.playerManager.getPlayer();
    if (!player) return;

    // Award credits
    if (quest.rewards.credits) {
      player.credits += quest.rewards.credits;
    }

    // Award experience
    if (quest.rewards.experience) {
      this.characterManager.awardExperience(quest.rewards.experience, `Quest completed: ${quest.title}`, 'social');
    }

    // Award reputation
    if (quest.rewards.reputation) {
      for (const [factionId, rep] of Object.entries(quest.rewards.reputation)) {
        this.playerManager.modifyFactionReputation(factionId, rep, `Quest completed: ${quest.title}`);
      }
    }

    // Unlock features/areas/quests
    if (quest.rewards.unlocks) {
      quest.rewards.unlocks.forEach(unlock => {
        this.setFlag(`unlocked_${unlock}`, true);
      });
    }
  }

  /**
   * Update story arc progress
   */
  private updateStoryArcProgress(storyArcId: string): void {
    const arc = this.questSystemState.storyArcs.get(storyArcId);
    if (!arc) return;

    // Check if all quests in arc are completed
    const allCompleted = arc.quests.every(questId => 
      this.questSystemState.completedQuests.includes(questId)
    );

    if (allCompleted) {
      arc.status = 'completed';
      console.log(`Story arc completed: ${arc.title}`);
    }
  }

  /**
   * Get available quests for player
   */
  getAvailableQuests(): StoryQuest[] {
    return this.questSystemState.availableQuests
      .map(questId => this.questDefinitions.get(questId))
      .filter(quest => quest !== undefined)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get active quests for player
   */
  getActiveQuests(): StoryQuest[] {
    return Array.from(this.questSystemState.activeQuests.values())
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get completed quests for player
   */
  getCompletedQuests(): StoryQuest[] {
    return this.questSystemState.completedQuests
      .map(questId => this.questDefinitions.get(questId))
      .filter(quest => quest !== undefined);
  }

  /**
   * Get story arcs for a faction
   */
  getFactionStoryArcs(factionId: string): StoryArc[] {
    const storyline = this.factionStorylines.get(factionId);
    return storyline ? storyline.arcs : [];
  }

  /**
   * Get current seasonal content
   */
  getCurrentSeasonalContent(): SeasonalContent[] {
    const currentMonth = new Date().getMonth() + 1;
    return Array.from(this.seasonalContent.values())
      .filter(content => currentMonth >= content.startMonth && currentMonth <= content.endMonth);
  }

  /**
   * Clean up expired quests
   */
  private cleanupExpiredQuests(): void {
    for (const [questId, quest] of this.questSystemState.activeQuests) {
      if (quest.deadline && Date.now() > quest.deadline) {
        this.failQuest(questId, 'Quest expired');
      }
    }
  }

  /**
   * Initialize quest definitions
   */
  private initializeQuestDefinitions(): void {
    // Traders Guild Storyline Quests
    this.addQuest({
      id: 'tg_welcome',
      title: 'Welcome to the Guild',
      description: 'Complete your first trade to prove yourself as a capable merchant.',
      type: 'faction_storyline',
      category: 'trading',
      status: 'available',
      requirements: {
        reputation: { 'traders_guild': 0 }
      },
      objectives: [
        {
          id: 'first_trade',
          description: 'Complete a profitable trade',
          type: 'achieve',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 5000,
        experience: 100,
        reputation: { 'traders_guild': 10 }
      },
      giver: 'guild_representative',
      factionId: 'traders_guild',
      storyArc: 'tg_rise_arc_1',
      priority: 5,
      repeatable: false
    });

    this.addQuest({
      id: 'tg_market_research',
      title: 'Market Intelligence',
      description: 'Gather market data from 3 different stations to help the Guild understand trade patterns.',
      type: 'faction_storyline',
      category: 'exploration',
      status: 'locked',
      requirements: {
        completedQuests: ['tg_welcome'],
        reputation: { 'traders_guild': 25 }
      },
      objectives: [
        {
          id: 'visit_stations',
          description: 'Visit 3 different stations and analyze their markets',
          type: 'visit',
          quantity: 3,
          completed: false
        }
      ],
      rewards: {
        credits: 8000,
        experience: 150,
        reputation: { 'traders_guild': 15 },
        unlocks: ['market_analysis_tool']
      },
      giver: 'guild_analyst',
      factionId: 'traders_guild',
      storyArc: 'tg_rise_arc_1',
      priority: 4,
      repeatable: false
    });

    // Federation Conspiracy Questline
    this.addQuest({
      id: 'fed_strange_signals',
      title: 'Strange Signals',
      description: 'Investigate mysterious transmissions detected near the outer rim.',
      type: 'main_story',
      category: 'investigation',
      status: 'available',
      requirements: {
        level: 5,
        skills: { 'Investigation': 3 }
      },
      objectives: [
        {
          id: 'investigate_signals',
          description: 'Investigate 3 signal sources',
          type: 'visit',
          quantity: 3,
          completed: false
        },
        {
          id: 'decode_transmissions',
          description: 'Decode mysterious transmissions',
          type: 'interact',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 12000,
        experience: 250,
        unlocks: ['conspiracy_arc']
      },
      giver: 'mysterious_contact',
      storyArc: 'federation_conspiracy_arc_1',
      priority: 8,
      repeatable: false
    });

    // Seasonal Quest Example
    this.addQuest({
      id: 'winter_festival',
      title: 'Winter Festival Delivery',
      description: 'Deliver festival supplies to stations celebrating the annual Winter Festival.',
      type: 'seasonal',
      category: 'trading',
      status: 'locked',
      requirements: {},
      objectives: [
        {
          id: 'deliver_supplies',
          description: 'Deliver festival supplies to 5 stations',
          type: 'deliver',
          quantity: 5,
          completed: false
        }
      ],
      rewards: {
        credits: 15000,
        experience: 200,
        items: ['festival_badge', 'winter_decoration']
      },
      giver: 'festival_coordinator',
      seasonal: {
        startMonth: 11,
        endMonth: 1
      },
      priority: 3,
      repeatable: true
    });
  }

  /**
   * Add a quest definition
   */
  private addQuest(quest: StoryQuest): void {
    this.questDefinitions.set(quest.id, quest);
  }

  /**
   * Initialize faction storylines
   */
  private initializeFactionStorylines(): void {
    // Traders Guild storyline
    const tradersGuildStoryline: FactionStoryline = {
      factionId: 'traders_guild',
      title: 'Rise of the Guild',
      description: 'Help the Traders Guild expand their influence and become a dominant force in interstellar commerce.',
      arcs: [
        {
          id: 'tg_rise_arc_1',
          title: 'Guild Initiation',
          description: 'Prove yourself as a valuable member of the Traders Guild.',
          factionId: 'traders_guild',
          quests: ['tg_welcome', 'tg_market_research'],
          status: 'available'
        }
      ],
      reputation_requirements: {
        friendly: 25,
        allied: 50,
        trusted: 100
      }
    };
    
    this.factionStorylines.set('traders_guild', tradersGuildStoryline);
  }

  /**
   * Initialize seasonal content
   */
  private initializeSeasonalContent(): void {
    const winterFestival: SeasonalContent = {
      id: 'winter_festival_2024',
      name: 'Winter Festival',
      description: 'Annual celebration across the galaxy with special trading opportunities.',
      startMonth: 11,
      endMonth: 1,
      quests: ['winter_festival'],
      events: ['festival_market_boom'],
      rewards: [
        {
          credits: 5000,
          items: ['festival_badge']
        }
      ],
      unlocks: ['winter_decorations', 'festival_music']
    };

    this.seasonalContent.set('winter_festival', winterFestival);
  }

  /**
   * Initialize dialogue system
   */
  private initializeDialogues(): void {
    // This would be expanded with actual dialogue trees
    // For now, just basic structure
  }

  /**
   * Serialize quest system state for saving
   */
  serialize(): any {
    return {
      activeQuests: Array.from(this.questSystemState.activeQuests.entries()),
      completedQuests: this.questSystemState.completedQuests,
      failedQuests: this.questSystemState.failedQuests,
      availableQuests: this.questSystemState.availableQuests,
      questFlags: Array.from(this.questSystemState.questFlags.entries()),
      storyArcs: Array.from(this.questSystemState.storyArcs.entries()),
      dialogueHistory: Array.from(this.questSystemState.dialogueHistory.entries())
    };
  }

  /**
   * Deserialize quest system state for loading
   */
  deserialize(data: any): void {
    if (!data) return;

    this.questSystemState.activeQuests = new Map(data.activeQuests || []);
    this.questSystemState.completedQuests = data.completedQuests || [];
    this.questSystemState.failedQuests = data.failedQuests || [];
    this.questSystemState.availableQuests = data.availableQuests || [];
    this.questSystemState.questFlags = new Map(data.questFlags || []);
    this.questSystemState.storyArcs = new Map(data.storyArcs || []);
    this.questSystemState.dialogueHistory = new Map(data.dialogueHistory || []);
  }
}