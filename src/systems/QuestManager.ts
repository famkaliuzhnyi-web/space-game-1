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
import { RAIJIN_CORP_STORYLINES, INDEPENDENT_SYSTEMS_STORYLINES, PIRATES_STORYLINES, ENHANCED_STORY_ARCS, ENHANCED_FACTION_STORYLINES } from '../data/factionStorylines';
import { ENHANCED_SEASONAL_EVENTS } from '../data/seasonalEvents';
import { ENDGAME_QUESTS } from '../data/endgameContent';

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
   
  private _factionManager: FactionManager;
  private characterManager: CharacterManager;
  private playerManager: PlayerManager;
   
  private _timeManager: TimeManager;
   
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
      if (!character || !character.progression || character.progression.level < requirements.level) {
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
    // Load enhanced faction storylines
    this.loadEnhancedFactionStorylines();
    
    // Keep existing quest for backwards compatibility
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
    // Add starter quests with no requirements for early game
    this.addQuest({
      id: 'main_awakening',
      title: 'Awakening',
      description: 'You wake up in a med-bay with no memory of how you got here. Start your journey among the stars.',
      type: 'main_story',
      category: 'investigation',
      status: 'available',
      requirements: {},
      objectives: [
        {
          id: 'check_identity',
          description: 'Check your identity records and ship registration',
          type: 'interact',
          quantity: 1,
          completed: false
        },
        {
          id: 'investigate_memory',
          description: 'Investigate clues about your past',
          type: 'investigation',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 1000,
        experience: 50,
        unlocks: ['investigation_tutorial']
      },
      giver: 'station_medic',
      priority: 10,
      repeatable: false,
      nextQuest: 'main_first_contact'
    });

    this.addQuest({
      id: 'main_first_contact',
      title: 'First Contact',
      description: 'Make contact with the local authorities and begin establishing your identity.',
      type: 'main_story', 
      category: 'investigation',
      status: 'locked',
      requirements: {
        completedQuests: ['main_awakening']
      },
      objectives: [
        {
          id: 'talk_to_authorities',
          description: 'Speak with station security about your situation',
          type: 'investigation',
          quantity: 1,
          completed: false
        },
        {
          id: 'gather_basic_info',
          description: 'Gather basic information about current galactic situation',
          type: 'investigation',
          quantity: 3,
          completed: false
        }
      ],
      rewards: {
        credits: 2000,
        experience: 75,
        reputation: { 'security_forces': 5 }
      },
      giver: 'security_chief',
      priority: 9,
      repeatable: false,
      nextQuest: 'fed_strange_signals'
    });

    this.addQuest({
      id: 'fed_strange_signals',
      title: 'Strange Signals',
      description: 'Investigate mysterious transmissions detected near the outer rim.',
      type: 'main_story',
      category: 'investigation',
      status: 'locked',
      requirements: {
        completedQuests: ['main_first_contact'],
        level: 3,
        skills: { 'Investigation': 2 }
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

    // Simple investigation side quests available early
    this.addQuest({
      id: 'investigation_missing_cargo',
      title: 'Missing Cargo Investigation',
      description: 'A trader has lost contact with their cargo shipment. Help investigate what happened.',
      type: 'side_quest',
      category: 'investigation',
      status: 'available',
      requirements: {},
      objectives: [
        {
          id: 'interview_witnesses',
          description: 'Interview station staff about the missing cargo',
          type: 'investigation',
          quantity: 2,
          completed: false
        },
        {
          id: 'examine_evidence',
          description: 'Examine the evidence at the cargo bay',
          type: 'investigation',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 1500,
        experience: 25,
        reputation: { 'traders_guild': 2 }
      },
      giver: 'distressed_trader',
      priority: 3,
      repeatable: false
    });

    this.addQuest({
      id: 'investigation_suspicious_behavior',
      title: 'Suspicious Activities',
      description: 'Station security has noticed unusual behavior from some visitors. Discreetly investigate.',
      type: 'side_quest',
      category: 'investigation',
      status: 'available',
      requirements: {},
      objectives: [
        {
          id: 'observe_suspects',
          description: 'Observe suspicious individuals without being detected',
          type: 'investigation',
          quantity: 3,
          completed: false
        },
        {
          id: 'gather_intel',
          description: 'Gather intelligence about their activities',
          type: 'investigation',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 2000,
        experience: 40,
        reputation: { 'security_forces': 3 }
      },
      giver: 'station_security',
      priority: 3,
      repeatable: true
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

    // ================================
    // EXPANDED FACTION STORYLINES
    // ================================

    // === STELLAR INDUSTRIES CORPORATION STORYLINE ===
    this.addQuest({
      id: 'si_manufacturing_opportunity',
      title: 'Manufacturing Partnership',
      description: 'Tekton Corporation is looking for reliable contractors to help with their manufacturing operations.',
      type: 'faction_storyline',
      category: 'trading',
      status: 'available',
      requirements: {
        reputation: { 'stellar_industries': 0 },
        credits: 10000
      },
      objectives: [
        {
          id: 'deliver_raw_materials',
          description: 'Deliver raw materials to Tekton Corporation manufacturing facility',
          type: 'deliver',
          quantity: 3,
          completed: false
        }
      ],
      rewards: {
        credits: 15000,
        experience: 150,
        reputation: { 'stellar_industries': 15 },
        unlocks: ['manufacturing_contracts']
      },
      giver: 'si_procurement_manager',
      factionId: 'stellar_industries',
      storyArc: 'si_industrial_rise',
      priority: 4,
      repeatable: false
    });

    this.addQuest({
      id: 'si_mining_expansion',
      title: 'Asteroid Mining Expansion',
      description: 'Help Tekton Corporation establish a new mining operation in a contested asteroid belt.',
      type: 'faction_storyline',
      category: 'exploration',
      status: 'locked',
      requirements: {
        completedQuests: ['si_manufacturing_opportunity'],
        reputation: { 'stellar_industries': 20 },
        level: 8
      },
      objectives: [
        {
          id: 'survey_asteroids',
          description: 'Survey potential mining sites',
          type: 'visit',
          quantity: 5,
          completed: false
        },
        {
          id: 'clear_pirates',
          description: 'Eliminate pirate threats in the area',
          type: 'combat',
          quantity: 3,
          completed: false
        }
      ],
      rewards: {
        credits: 25000,
        experience: 300,
        reputation: { 'stellar_industries': 20 },
        items: ['mining_permit', 'si_commendation']
      },
      giver: 'si_mining_director',
      factionId: 'stellar_industries',
      storyArc: 'si_industrial_rise',
      priority: 3,
      repeatable: false
    });

    this.addQuest({
      id: 'si_corporate_espionage',
      title: 'Industrial Secrets',
      description: 'Tekton Corporation suspects corporate espionage. Help them investigate and protect their operations.',
      type: 'faction_storyline',
      category: 'investigation',
      status: 'locked',
      requirements: {
        completedQuests: ['si_mining_expansion'],
        reputation: { 'stellar_industries': 35 },
        skills: { 'Investigation': 5, 'Electronics': 4 }
      },
      objectives: [
        {
          id: 'investigate_security_breaches',
          description: 'Investigate security breaches at SI facilities',
          type: 'investigation',
          quantity: 1,
          completed: false
        },
        {
          id: 'trace_corporate_spy',
          description: 'Identify and expose the corporate spy',
          type: 'investigation',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 40000,
        experience: 500,
        reputation: { 'stellar_industries': 25 },
        items: ['si_security_clearance', 'corporate_datapad']
      },
      giver: 'si_security_chief',
      factionId: 'stellar_industries',
      storyArc: 'si_industrial_rise',
      priority: 2,
      repeatable: false
    });

    // === QUANTUM DYNAMICS CORPORATION STORYLINE ===
    this.addQuest({
      id: 'qd_research_delivery',
      title: 'Classified Research Transport',
      description: 'Yūgen Corporation needs a discrete pilot to transport sensitive research materials.',
      type: 'faction_storyline',
      category: 'trading',
      status: 'available',
      requirements: {
        reputation: { 'quantum_dynamics': 0 },
        skills: { 'Piloting': 4 }
      },
      objectives: [
        {
          id: 'secure_transport',
          description: 'Safely transport research materials without inspection',
          type: 'deliver',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 18000,
        experience: 200,
        reputation: { 'quantum_dynamics': 12 },
        unlocks: ['research_contracts']
      },
      giver: 'qd_research_coordinator',
      factionId: 'quantum_dynamics',
      storyArc: 'qd_tech_advancement',
      priority: 4,
      repeatable: false
    });

    this.addQuest({
      id: 'qd_prototype_testing',
      title: 'Advanced Weapon Systems Test',
      description: 'Test Raijin Corporation latest weapon prototypes in controlled combat scenarios.',
      type: 'faction_storyline',
      category: 'combat',
      status: 'locked',
      requirements: {
        completedQuests: ['qd_research_delivery'],
        reputation: { 'quantum_dynamics': 25 },
        skills: { 'Combat': 6, 'Engineering': 5 }
      },
      objectives: [
        {
          id: 'test_kinetic_weapons',
          description: 'Test new kinetic weapon systems',
          type: 'combat',
          quantity: 3,
          completed: false
        },
        {
          id: 'test_shield_tech',
          description: 'Test magnetic shield improvements',
          type: 'combat',
          quantity: 2,
          completed: false
        }
      ],
      rewards: {
        credits: 30000,
        experience: 400,
        reputation: { 'quantum_dynamics': 20 },
        items: ['prototype_weapon', 'qd_test_license']
      },
      giver: 'qd_weapons_engineer',
      factionId: 'quantum_dynamics',
      storyArc: 'qd_tech_advancement',
      priority: 3,
      repeatable: false
    });

    this.addQuest({
      id: 'qd_ai_conspiracy',
      title: 'The AI Conspiracy',
      description: 'Uncover a conspiracy involving rogue AI development within Yūgen Corporation.',
      type: 'faction_storyline',
      category: 'investigation',
      status: 'locked',
      requirements: {
        completedQuests: ['qd_prototype_testing'],
        reputation: { 'quantum_dynamics': 40 },
        skills: { 'Investigation': 7, 'Electronics': 6, 'Hacking': 5 }
      },
      objectives: [
        {
          id: 'infiltrate_research_lab',
          description: 'Infiltrate the classified AI research laboratory',
          type: 'stealth',
          quantity: 1,
          completed: false
        },
        {
          id: 'gather_ai_evidence',
          description: 'Collect evidence of unauthorized AI development',
          type: 'investigation',
          quantity: 1,
          completed: false
        },
        {
          id: 'confront_rogue_scientist',
          description: 'Confront the scientist behind the conspiracy',
          type: 'dialogue',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 50000,
        experience: 600,
        reputation: { 'quantum_dynamics': 30 },
        items: ['ai_research_data', 'qd_executive_access']
      },
      giver: 'qd_board_member',
      factionId: 'quantum_dynamics',
      storyArc: 'qd_tech_advancement',
      priority: 1,
      repeatable: false
    });

    // === GALACTIC COMMERCE GUILD (Enhanced) ===
    this.addQuest({
      id: 'gcg_trade_route_expansion',
      title: 'New Trade Route Initiative',
      description: 'Help the Commerce Guild establish profitable new trade routes through dangerous sectors.',
      type: 'faction_storyline',
      category: 'exploration',
      status: 'locked',
      requirements: {
        completedQuests: ['tg_market_research'],
        reputation: { 'traders_guild': 30 },
        level: 10
      },
      objectives: [
        {
          id: 'scout_dangerous_sectors',
          description: 'Scout potential routes through 3 dangerous sectors',
          type: 'visit',
          quantity: 3,
          completed: false
        },
        {
          id: 'negotiate_safe_passage',
          description: 'Negotiate safe passage agreements with local factions',
          type: 'dialogue',
          quantity: 2,
          completed: false
        }
      ],
      rewards: {
        credits: 35000,
        experience: 450,
        reputation: { 'traders_guild': 25 },
        unlocks: ['dangerous_sector_routes']
      },
      giver: 'gcg_route_planner',
      factionId: 'traders_guild',
      storyArc: 'tg_rise_arc_2',
      priority: 3,
      repeatable: false
    });

    this.addQuest({
      id: 'gcg_financial_crisis',
      title: 'Economic Warfare',
      description: 'The Commerce Guild faces a coordinated economic attack. Help them fight back.',
      type: 'faction_storyline',
      category: 'trading',
      status: 'locked',
      requirements: {
        completedQuests: ['gcg_trade_route_expansion'],
        reputation: { 'traders_guild': 50 },
        skills: { 'Trading': 8, 'Economics': 6 }
      },
      objectives: [
        {
          id: 'stabilize_markets',
          description: 'Execute market stabilization trades',
          type: 'trading',
          quantity: 10,
          completed: false
        },
        {
          id: 'counter_economic_attacks',
          description: 'Counter hostile economic warfare tactics',
          type: 'economic_warfare',
          quantity: 3,
          completed: false
        }
      ],
      rewards: {
        credits: 75000,
        experience: 700,
        reputation: { 'traders_guild': 35 },
        items: ['guild_master_license', 'economic_warfare_tools']
      },
      giver: 'gcg_financial_director',
      factionId: 'traders_guild',
      storyArc: 'tg_rise_arc_2',
      priority: 2,
      repeatable: false
    });

    // === NEXUS CORPORATION STORYLINE ===
    this.addQuest({
      id: 'nx_information_network',
      title: 'Network Integration',
      description: 'Help Shiden Corporation expand their delivery network by installing communication relays.',
      type: 'faction_storyline',
      category: 'exploration',
      status: 'available',
      requirements: {
        reputation: { 'nexus_corp': 0 },
        skills: { 'Electronics': 4 }
      },
      objectives: [
        {
          id: 'install_comm_relays',
          description: 'Install communication relays at remote locations',
          type: 'technical',
          quantity: 4,
          completed: false
        }
      ],
      rewards: {
        credits: 20000,
        experience: 250,
        reputation: { 'nexus_corp': 15 },
        unlocks: ['nexus_data_access']
      },
      giver: 'nx_network_engineer',
      factionId: 'nexus_corp',
      storyArc: 'nx_data_dominance',
      priority: 4,
      repeatable: false
    });

    this.addQuest({
      id: 'nx_cyber_warfare',
      title: 'Digital Battlefield',
      description: 'Engage in cyber warfare operations to protect Nexus networks from hostile intrusion.',
      type: 'faction_storyline',
      category: 'hacking',
      status: 'locked',
      requirements: {
        completedQuests: ['nx_information_network'],
        reputation: { 'nexus_corp': 30 },
        skills: { 'Hacking': 6, 'Electronics': 5 }
      },
      objectives: [
        {
          id: 'defend_network_nodes',
          description: 'Defend critical network nodes from cyber attacks',
          type: 'hacking',
          quantity: 5,
          completed: false
        },
        {
          id: 'counter_hack_enemies',
          description: 'Launch counter-attacks against hostile hackers',
          type: 'hacking',
          quantity: 3,
          completed: false
        }
      ],
      rewards: {
        credits: 45000,
        experience: 550,
        reputation: { 'nexus_corp': 25 },
        items: ['advanced_hacking_tools', 'nx_cyber_warrior_badge']
      },
      giver: 'nx_cyber_security_chief',
      factionId: 'nexus_corp',
      storyArc: 'nx_data_dominance',
      priority: 3,
      repeatable: false
    });

    this.addQuest({
      id: 'nx_corporate_takeover',
      title: 'Information War',
      description: 'Use logistics expertise to help Volans Corporation execute efficient supply chain operations.',
      type: 'faction_storyline',
      category: 'investigation',
      status: 'locked',
      requirements: {
        completedQuests: ['nx_cyber_warfare'],
        reputation: { 'nexus_corp': 45 },
        skills: { 'Investigation': 7, 'Hacking': 7, 'Social': 5 }
      },
      objectives: [
        {
          id: 'gather_corporate_secrets',
          description: 'Gather damaging information about the target corporation',
          type: 'investigation',
          quantity: 1,
          completed: false
        },
        {
          id: 'manipulate_stock_prices',
          description: 'Use information to manipulate market conditions',
          type: 'economic_warfare',
          quantity: 1,
          completed: false
        },
        {
          id: 'execute_takeover',
          description: 'Support the hostile takeover operation',
          type: 'social',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 100000,
        experience: 800,
        reputation: { 'nexus_corp': 40 },
        items: ['corporate_insider_access', 'nx_board_membership']
      },
      giver: 'nx_ceo',
      factionId: 'nexus_corp',
      storyArc: 'nx_data_dominance',
      priority: 1,
      repeatable: false
    });

    // === INDEPENDENT SYSTEMS ALLIANCE STORYLINE ===
    this.addQuest({
      id: 'isa_refugee_crisis',
      title: 'Colonial Refugee Crisis',
      description: 'Help transport refugees from corporate-controlled systems to independent colonies.',
      type: 'faction_storyline',
      category: 'humanitarian',
      status: 'available',
      requirements: {
        reputation: { 'independent_alliance': 0 }
      },
      objectives: [
        {
          id: 'transport_refugees',
          description: 'Safely transport refugee families to sanctuary colonies',
          type: 'deliver',
          quantity: 5,
          completed: false
        }
      ],
      rewards: {
        credits: 12000,
        experience: 300,
        reputation: { 'independent_alliance': 20 },
        items: ['humanitarian_medal']
      },
      giver: 'isa_refugee_coordinator',
      factionId: 'independent_alliance',
      storyArc: 'isa_freedom_struggle',
      priority: 4,
      repeatable: false
    });

    this.addQuest({
      id: 'isa_resistance_supply',
      title: 'Underground Railroad',
      description: 'Supply the resistance movement fighting corporate oppression in occupied systems.',
      type: 'faction_storyline',
      category: 'smuggling',
      status: 'locked',
      requirements: {
        completedQuests: ['isa_refugee_crisis'],
        reputation: { 'independent_alliance': 25 },
        skills: { 'Smuggling': 5 }
      },
      objectives: [
        {
          id: 'smuggle_weapons',
          description: 'Smuggle weapons to resistance cells',
          type: 'smuggle',
          quantity: 3,
          completed: false
        },
        {
          id: 'evade_corporate_patrols',
          description: 'Avoid detection by corporate security forces',
          type: 'stealth',
          quantity: 5,
          completed: false
        }
      ],
      rewards: {
        credits: 25000,
        experience: 450,
        reputation: { 'independent_alliance': 25 },
        reputation_loss: { 'stellar_industries': -10, 'quantum_dynamics': -10 },
        items: ['resistance_contact_codes']
      },
      giver: 'isa_resistance_leader',
      factionId: 'independent_alliance',
      storyArc: 'isa_freedom_struggle',
      priority: 3,
      repeatable: false
    });

    this.addQuest({
      id: 'isa_liberation_war',
      title: 'Liberation War',
      description: 'Lead the final assault to liberate an occupied system from corporate control.',
      type: 'faction_storyline',
      category: 'combat',
      status: 'locked',
      requirements: {
        completedQuests: ['isa_resistance_supply'],
        reputation: { 'independent_alliance': 40 },
        skills: { 'Combat': 8, 'Leadership': 6 }
      },
      objectives: [
        {
          id: 'coordinate_fleet_attack',
          description: 'Coordinate multi-ship assault on corporate stronghold',
          type: 'combat',
          quantity: 1,
          completed: false
        },
        {
          id: 'capture_corporate_station',
          description: 'Lead the assault to capture the corporate station',
          type: 'combat',
          quantity: 1,
          completed: false
        },
        {
          id: 'establish_new_government',
          description: 'Help establish independent government',
          type: 'social',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 80000,
        experience: 1000,
        reputation: { 'independent_alliance': 50 },
        reputation_loss: { 'stellar_industries': -25, 'quantum_dynamics': -25, 'nexus_corp': -20 },
        items: ['freedom_fighter_medal', 'isa_fleet_commander_rank']
      },
      giver: 'isa_supreme_commander',
      factionId: 'independent_alliance',
      storyArc: 'isa_freedom_struggle',
      priority: 1,
      repeatable: false
    });

    // === THE VOID REAPERS (PIRATE) STORYLINE ===
    this.addQuest({
      id: 'cf_prove_yourself',
      title: 'Blood and Credits',
      description: 'Prove your worth to the Void Reapers by completing a daring raid.',
      type: 'faction_storyline',
      category: 'piracy',
      status: 'available',
      requirements: {
        reputation: { 'pirates': 0 },
        skills: { 'Combat': 5 }
      },
      objectives: [
        {
          id: 'raid_cargo_convoy',
          description: 'Successfully raid a corporate cargo convoy',
          type: 'piracy',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 15000,
        experience: 250,
        reputation: { 'pirates': 15 },
        reputation_loss: { 'stellar_industries': -15, 'quantum_dynamics': -15, 'traders_guild': -15 },
        unlocks: ['pirate_fence_access']
      },
      giver: 'cf_raid_captain',
      factionId: 'pirates',
      storyArc: 'cf_pirate_ascension',
      priority: 4,
      repeatable: false
    });

    this.addQuest({
      id: 'cf_pirate_war',
      title: 'Fleet War',
      description: 'Join a massive pirate fleet battle against corporate forces.',
      type: 'faction_storyline',
      category: 'combat',
      status: 'locked',
      requirements: {
        completedQuests: ['cf_prove_yourself'],
        reputation: { 'pirates': 30 },
        skills: { 'Combat': 7, 'Piloting': 6 }
      },
      objectives: [
        {
          id: 'fleet_battle_participation',
          description: 'Participate in major fleet battle',
          type: 'combat',
          quantity: 1,
          completed: false
        },
        {
          id: 'destroy_corporate_ships',
          description: 'Destroy enemy corporate vessels',
          type: 'combat',
          quantity: 5,
          completed: false
        }
      ],
      rewards: {
        credits: 40000,
        experience: 600,
        reputation: { 'pirates': 25 },
        reputation_loss: { 'stellar_industries': -20, 'quantum_dynamics': -20, 'nexus_corp': -15 },
        items: ['pirate_fleet_medal', 'captured_corporate_tech']
      },
      giver: 'cf_fleet_admiral',
      factionId: 'pirates',
      storyArc: 'cf_pirate_ascension',
      priority: 2,
      repeatable: false
    });

    this.addQuest({
      id: 'cf_pirate_king',
      title: 'Rise to Power',
      description: 'Challenge the current Pirate King and seize control of the Void Reapers.',
      type: 'faction_storyline',
      category: 'leadership',
      status: 'locked',
      requirements: {
        completedQuests: ['cf_pirate_war'],
        reputation: { 'pirates': 50 },
        skills: { 'Combat': 9, 'Leadership': 8, 'Social': 7 }
      },
      objectives: [
        {
          id: 'challenge_pirate_king',
          description: 'Formally challenge the Pirate King to single combat',
          type: 'combat',
          quantity: 1,
          completed: false
        },
        {
          id: 'unite_pirate_factions',
          description: 'Unite the various pirate factions under your leadership',
          type: 'social',
          quantity: 1,
          completed: false
        },
        {
          id: 'establish_pirate_empire',
          description: 'Establish your pirate empire and territorial control',
          type: 'leadership',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 150000,
        experience: 1200,
        reputation: { 'pirates': 75 },
        reputation_loss: { 'stellar_industries': -50, 'quantum_dynamics': -50, 'nexus_corp': -40, 'traders_guild': -40 },
        items: ['pirate_king_crown', 'void_reaper_command', 'legendary_pirate_ship']
      },
      giver: 'cf_council_of_captains',
      factionId: 'pirates',
      storyArc: 'cf_pirate_ascension',
      priority: 1,
      repeatable: false
    });

    // === ENDGAME CONTENT ===
    
    // Master Trader - Economic Dominance
    this.addQuest({
      id: 'endgame_trade_emperor',
      title: 'The Trade Emperor',
      description: 'Achieve ultimate economic dominance by controlling major trade routes and market forces across the galaxy.',
      type: 'endgame',
      category: 'trading',
      status: 'locked',
      requirements: {
        level: 25,
        credits: 100000000, // 100 million credits
        reputation: { 'traders_guild': 100 },
        completedQuests: ['tg_market_research', 'gcg_trade_route_expansion', 'gcg_financial_crisis'],
        achievements: ['master_trader', 'market_manipulator', 'trade_route_king']
      },
      objectives: [
        {
          id: 'control_major_routes',
          description: 'Establish control over 10 major trade routes',
          type: 'economic_warfare',
          quantity: 10,
          completed: false
        },
        {
          id: 'trade_empire_valuation',
          description: 'Achieve a trade empire valuation of 1 billion credits',
          type: 'achieve',
          quantity: 1000000000,
          completed: false
        },
        {
          id: 'economic_crisis_resolution',
          description: 'Single-handedly resolve a galaxy-wide economic crisis',
          type: 'leadership',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 500000,
        experience: 5000,
        reputation: { 'traders_guild': 50 },
        items: ['trade_emperor_crown', 'galactic_commerce_charter', 'ultimate_market_analyzer'],
        unlocks: ['galactic_trade_authority', 'economic_superpower_status']
      },
      giver: 'galactic_trade_council',
      factionId: 'traders_guild',
      storyArc: 'endgame_trade_mastery',
      priority: 1,
      repeatable: false
    });

    // Fleet Admiral - Military Supremacy
    this.addQuest({
      id: 'endgame_fleet_admiral',
      title: 'Supreme Fleet Admiral',
      description: 'Rise to become the supreme military commander, leading vast fleets in defense of galactic civilization.',
      type: 'endgame',
      category: 'combat',
      status: 'locked',
      requirements: {
        level: 25,
        reputation: { 'earth_federation': 100 },
        completedQuests: ['fed_strange_signals', 'main_first_contact'],
        skills: { 'Combat': 15, 'Leadership': 15 },
        achievements: ['combat_veteran', 'fleet_commander', 'hero_of_the_galaxy']
      },
      objectives: [
        {
          id: 'command_grand_fleet',
          description: 'Command a grand fleet of 50+ ships in a major battle',
          type: 'combat',
          quantity: 1,
          completed: false
        },
        {
          id: 'defeat_alien_threat',
          description: 'Defeat the mysterious alien threat to galactic civilization',
          type: 'combat',
          quantity: 1,
          completed: false
        },
        {
          id: 'establish_galactic_peace',
          description: 'Establish lasting peace between all major factions',
          type: 'diplomacy',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 1000000,
        experience: 7500,
        reputation: { 'earth_federation': 75 },
        items: ['supreme_admiral_insignia', 'legendary_flagship', 'galactic_peace_treaty'],
        unlocks: ['supreme_military_authority', 'galactic_protector_status']
      },
      giver: 'galactic_defense_council',
      factionId: 'earth_federation',
      storyArc: 'endgame_military_supremacy',
      priority: 1,
      repeatable: false
    });

    // Galactic Explorer - Discovery Master
    this.addQuest({
      id: 'endgame_cosmic_explorer',
      title: 'Master of the Unknown',
      description: 'Explore the deepest mysteries of space and make discoveries that reshape our understanding of the universe.',
      type: 'endgame',
      category: 'exploration',
      status: 'locked',
      requirements: {
        level: 20,
        completedQuests: ['investigation_missing_cargo', 'investigation_suspicious_behavior'],
        skills: { 'Investigation': 12, 'Technical': 12, 'Social': 10 },
        achievements: ['master_explorer', 'cosmic_cartographer', 'xenoarchaeologist']
      },
      objectives: [
        {
          id: 'discover_ancient_civilization',
          description: 'Discover evidence of an ancient precursor civilization',
          type: 'exploration',
          quantity: 1,
          completed: false
        },
        {
          id: 'map_unknown_sectors',
          description: 'Chart and map 5 previously unknown sectors',
          type: 'exploration',
          quantity: 5,
          completed: false
        },
        {
          id: 'cosmic_phenomenon_study',
          description: 'Study and catalog 20 unique cosmic phenomena',
          type: 'research',
          quantity: 20,
          completed: false
        }
      ],
      rewards: {
        credits: 750000,
        experience: 6000,
        items: ['cosmic_explorer_medallion', 'precursor_technology', 'universal_star_charts'],
        unlocks: ['precursor_tech_access', 'cosmic_explorer_status', 'deep_space_expedition_rights']
      },
      giver: 'scientific_exploration_council',
      factionId: 'scientific_alliance',
      storyArc: 'endgame_cosmic_discovery',
      priority: 1,
      repeatable: false
    });

    // Shadow Broker - Information Mastery
    this.addQuest({
      id: 'endgame_shadow_broker',
      title: 'The Ultimate Shadow Broker',
      description: 'Become the galaxy\'s most powerful information broker, controlling secrets and intelligence networks.',
      type: 'endgame',
      category: 'hacking',
      status: 'locked',
      requirements: {
        level: 22,
        skills: { 'Hacking': 15, 'Social': 12, 'Investigation': 10 },
        achievements: ['master_hacker', 'information_broker', 'shadow_network_controller'],
        completedQuests: ['investigation_suspicious_behavior']
      },
      objectives: [
        {
          id: 'control_information_networks',
          description: 'Establish control over major information networks in 8 sectors',
          type: 'hacking',
          quantity: 8,
          completed: false
        },
        {
          id: 'broker_faction_secrets',
          description: 'Successfully broker critical secrets between major factions',
          type: 'social',
          quantity: 5,
          completed: false
        },
        {
          id: 'prevent_galactic_war',
          description: 'Use information to prevent a devastating galactic war',
          type: 'diplomacy',
          quantity: 1,
          completed: false
        }
      ],
      rewards: {
        credits: 2000000,
        experience: 8000,
        items: ['shadow_broker_cypher', 'galactic_intelligence_network', 'ultimate_data_vault'],
        unlocks: ['shadow_broker_status', 'galactic_information_authority', 'faction_puppet_master']
      },
      giver: 'the_conclave_of_shadows',
      factionId: 'neutral',
      storyArc: 'endgame_information_mastery',
      priority: 1,
      repeatable: false
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
    // ===============================
    // GALACTIC COMMERCE GUILD
    // ===============================
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
        },
        {
          id: 'tg_rise_arc_2',
          title: 'Commercial Expansion',
          description: 'Help the Guild establish dominance in dangerous sectors and fight economic warfare.',
          factionId: 'traders_guild',
          quests: ['gcg_trade_route_expansion', 'gcg_financial_crisis'],
          status: 'locked'
        }
      ],
      reputation_requirements: {
        friendly: 25,
        allied: 50,
        trusted: 100
      }
    };

    // ===============================
    // STELLAR INDUSTRIES CORPORATION
    // ===============================
    const stellarIndustriesStoryline: FactionStoryline = {
      factionId: 'stellar_industries',
      title: 'Industrial Dominion',
      description: 'Rise through the ranks of Tekton Corporation and help them achieve industrial supremacy.',
      arcs: [
        {
          id: 'si_industrial_rise',
          title: 'From Contractor to Corporate Partner',
          description: 'Start as a contractor and become a trusted corporate partner in manufacturing and mining operations.',
          factionId: 'stellar_industries',
          quests: ['si_manufacturing_opportunity', 'si_mining_expansion', 'si_corporate_espionage'],
          status: 'available'
        }
      ],
      reputation_requirements: {
        friendly: 20,
        allied: 40,
        trusted: 80
      }
    };

    // ===============================
    // QUANTUM DYNAMICS CORPORATION
    // ===============================
    const quantumDynamicsStoryline: FactionStoryline = {
      factionId: 'quantum_dynamics',
      title: 'Technological Supremacy',
      description: 'Advance cutting-edge technology and uncover dark secrets in Yūgen Corporation research programs.',
      arcs: [
        {
          id: 'qd_tech_advancement',
          title: 'Research and Revolution',
          description: 'From research contractor to uncovering a conspiracy that threatens the galaxy.',
          factionId: 'quantum_dynamics',
          quests: ['qd_research_delivery', 'qd_prototype_testing', 'qd_ai_conspiracy'],
          status: 'available'
        }
      ],
      reputation_requirements: {
        friendly: 25,
        allied: 45,
        trusted: 85
      }
    };

    // ===============================
    // NEXUS CORPORATION
    // ===============================
    const nexusCorpStoryline: FactionStoryline = {
      factionId: 'nexus_corp',
      title: 'Information War',
      description: 'Master the art of logistics management and help Shiden Corporation dominate through fast delivery.',
      arcs: [
        {
          id: 'nx_data_dominance',
          title: 'Digital Empire',
          description: 'Build and defend digital infrastructure, then use information as a weapon of corporate warfare.',
          factionId: 'nexus_corp',
          quests: ['nx_information_network', 'nx_cyber_warfare', 'nx_corporate_takeover'],
          status: 'available'
        }
      ],
      reputation_requirements: {
        friendly: 30,
        allied: 50,
        trusted: 90
      }
    };

    // ===============================
    // INDEPENDENT SYSTEMS ALLIANCE
    // ===============================
    const independentAllianceStoryline: FactionStoryline = {
      factionId: 'independent_alliance',
      title: 'Freedom\'s Price',
      description: 'Fight for freedom and independence against corporate oppression across the galaxy.',
      arcs: [
        {
          id: 'isa_freedom_struggle',
          title: 'Liberation War',
          description: 'From humanitarian aid to leading the resistance in a war for independence.',
          factionId: 'independent_alliance',
          quests: ['isa_refugee_crisis', 'isa_resistance_supply', 'isa_liberation_war'],
          status: 'available'
        }
      ],
      reputation_requirements: {
        friendly: 20,
        allied: 35,
        trusted: 70
      }
    };

    // ===============================
    // THE CRIMSON FLEET (PIRATES)
    // ===============================
    const crimsonFleetStoryline: FactionStoryline = {
      factionId: 'pirates',
      title: 'Blood and Plunder',
      description: 'Rise from petty criminal to Pirate King, building a criminal empire among the stars.',
      arcs: [
        {
          id: 'cf_pirate_ascension',
          title: 'Path to the Pirate Throne',
          description: 'Prove yourself in raids, lead fleets in battle, and ultimately challenge for the crown of Pirate King.',
          factionId: 'pirates',
          quests: ['cf_prove_yourself', 'cf_pirate_war', 'cf_pirate_king'],
          status: 'available'
        }
      ],
      reputation_requirements: {
        friendly: 15,
        allied: 30,
        trusted: 60
      }
    };

    // Add all storylines to the map
    this.factionStorylines.set('traders_guild', tradersGuildStoryline);
    this.factionStorylines.set('stellar_industries', stellarIndustriesStoryline);
    this.factionStorylines.set('quantum_dynamics', quantumDynamicsStoryline);
    this.factionStorylines.set('nexus_corp', nexusCorpStoryline);
    this.factionStorylines.set('independent_alliance', independentAllianceStoryline);
    this.factionStorylines.set('pirates', crimsonFleetStoryline);
  }

  /**
   * Initialize seasonal content
   */
  private initializeSeasonalContent(): void {
    // Load enhanced seasonal events
    this.loadEnhancedSeasonalEvents();
    
    // Keep existing winter festival for backwards compatibility
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

    // Spring Trade Expo - Commerce and Industry Focus
    const springExpo: SeasonalContent = {
      id: 'spring_trade_expo',
      name: 'Galactic Trade Expo',
      description: 'The largest trade exposition in the galaxy, featuring new technologies and trade partnerships.',
      startMonth: 3,
      endMonth: 5,
      quests: ['trade_expo_showcase', 'innovation_challenge', 'corporate_networking'],
      events: ['new_tech_releases', 'bulk_trading_contracts', 'startup_investments'],
      rewards: [
        {
          credits: 15000,
          items: ['trade_expo_pass', 'prototype_scanner', 'corporate_contacts_list']
        }
      ],
      unlocks: ['advanced_trading_algorithms', 'industrial_partnerships', 'tech_preview_access']
    };

    // Summer Security Crisis - Combat and Law Enforcement Focus
    const summerCrisis: SeasonalContent = {
      id: 'summer_security_crisis',
      name: 'The Great Pirate Surge',
      description: 'A coordinated pirate offensive threatens shipping lanes across multiple sectors.',
      startMonth: 6,
      endMonth: 8,
      quests: ['defend_trade_routes', 'hunt_pirate_leaders', 'coordinate_fleet_defense'],
      events: ['pirate_raids', 'security_contracts_surge', 'emergency_military_procurement'],
      rewards: [
        {
          credits: 25000,
          items: ['hero_of_the_lanes_medal', 'military_commendation', 'advanced_weapons_license']
        }
      ],
      unlocks: ['elite_security_missions', 'military_grade_equipment', 'fleet_command_access']
    };

    // Autumn Harvest - Agricultural and Medical Focus  
    const autumnHarvest: SeasonalContent = {
      id: 'autumn_harvest_season',
      name: 'Galactic Harvest Season',
      description: 'Peak harvest season brings agricultural bounty and medical supply shortages.',
      startMonth: 9,
      endMonth: 11,
      quests: ['emergency_food_delivery', 'medical_supply_shortage', 'harvest_moon_celebration'],
      events: ['agricultural_surplus', 'medical_supply_crisis', 'harvest_festivals'],
      rewards: [
        {
          credits: 12000,
          items: ['harvest_coordinator_badge', 'medical_corps_recognition', 'agricultural_scanner']
        }
      ],
      unlocks: ['priority_medical_contracts', 'agricultural_investment_opportunities', 'humanitarian_missions']
    };

    // Special Anniversary Event - Multi-Faction Focus
    const galaxyDay: SeasonalContent = {
      id: 'galaxy_day_celebration',
      name: 'Galaxy Day Celebration',
      description: 'The anniversary of the first interstellar colony brings unprecedented cooperation.',
      startMonth: 7,
      endMonth: 7, // Single month event
      quests: ['unity_summit', 'historical_artifact_recovery', 'peace_treaty_negotiation'],
      events: ['faction_peace_talks', 'historical_exhibitions', 'diplomatic_breakthrough'],
      rewards: [
        {
          credits: 50000,
          items: ['galaxy_day_commemorative', 'diplomatic_immunity_pass', 'historical_archive_access']
        }
      ],
      unlocks: ['cross_faction_missions', 'diplomatic_career_path', 'historical_research_access']
    };

    this.seasonalContent.set('winter_festival', winterFestival);
    this.seasonalContent.set('spring_trade_expo', springExpo);
    this.seasonalContent.set('summer_security_crisis', summerCrisis);
    this.seasonalContent.set('autumn_harvest_season', autumnHarvest);
    this.seasonalContent.set('galaxy_day_celebration', galaxyDay);
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

  /**
   * Load enhanced faction storylines from data files
   */
  private loadEnhancedFactionStorylines(): void {
    // Load Raijin Corporation storylines
    RAIJIN_CORP_STORYLINES.forEach(quest => {
      this.questDefinitions.set(quest.id, quest);
    });

    // Load Independent Systems storylines
    INDEPENDENT_SYSTEMS_STORYLINES.forEach(quest => {
      this.questDefinitions.set(quest.id, quest);
    });

    // Load Pirates storylines
    PIRATES_STORYLINES.forEach(quest => {
      this.questDefinitions.set(quest.id, quest);
    });

    // Load enhanced story arcs
    ENHANCED_STORY_ARCS.forEach(arc => {
      this._storyArcDefinitions.set(arc.id, arc);
    });

    // Load enhanced faction storylines
    ENHANCED_FACTION_STORYLINES.forEach(storyline => {
      this.factionStorylines.set(storyline.factionId, storyline);
    });

    // Load endgame quests
    ENDGAME_QUESTS.forEach(quest => {
      this.questDefinitions.set(quest.id, quest);
    });

    console.log('Enhanced faction storylines loaded', {
      raijinCorpQuests: RAIJIN_CORP_STORYLINES.length,
      independentSystemsQuests: INDEPENDENT_SYSTEMS_STORYLINES.length,
      piratesQuests: PIRATES_STORYLINES.length,
      storyArcs: ENHANCED_STORY_ARCS.length,
      factionStorylines: ENHANCED_FACTION_STORYLINES.length,
      endgameQuests: ENDGAME_QUESTS.length
    });
  }

  /**
   * Load enhanced seasonal events from data files
   */
  private loadEnhancedSeasonalEvents(): void {
    ENHANCED_SEASONAL_EVENTS.forEach(event => {
      this.seasonalContent.set(event.id, event);
    });

    console.log('Enhanced seasonal events loaded', {
      seasonalEvents: ENHANCED_SEASONAL_EVENTS.length
    });
  }
}