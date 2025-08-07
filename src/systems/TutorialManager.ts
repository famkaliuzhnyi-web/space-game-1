import {
  TutorialStep,
  TutorialFlow,
  TutorialState,
  TutorialProgress,
  TutorialSettings,
  TutorialTooltip
} from '../types/tutorial';
import { PlayerManager } from './PlayerManager';
import { CharacterManager } from './CharacterManager';

/**
 * TutorialManager handles comprehensive tutorial system for guiding new players
 * through game mechanics and advanced features.
 * 
 * Key Features:
 * - Progressive tutorial flows for different game systems
 * - Context-sensitive hints and tooltips
 * - Player progress tracking and rewards
 * - Adaptive tutorial based on player actions
 * - Skip and replay functionality
 */
export class TutorialManager {
  private playerManager: PlayerManager;
  private characterManager: CharacterManager;
  
  private tutorialState: TutorialState = {
    completedFlows: [],
    completedSteps: [],
    skippedFlows: [],
    settings: {
      enabled: true,
      showHints: true,
      autoAdvance: false,
      highlightElements: true,
      tooltipsEnabled: true
    }
  };
  
  private availableFlows: Map<string, TutorialFlow> = new Map();
  private tooltips: Map<string, TutorialTooltip> = new Map();
  private progressHistory: TutorialProgress[] = [];

  constructor(playerManager: PlayerManager, characterManager: CharacterManager) {
    this.playerManager = playerManager;
    this.characterManager = characterManager;
    this.initializeTutorialFlows();
    this.initializeTooltips();
  }

  /**
   * Initialize all tutorial flows
   */
  private initializeTutorialFlows(): void {
    // Basic Tutorial Flow
    this.createBasicTutorialFlow();
    
    // Navigation Tutorial Flow
    this.createNavigationTutorialFlow();
    
    // Trading Tutorial Flow
    this.createTradingTutorialFlow();
    
    // Character Development Tutorial Flow
    this.createCharacterTutorialFlow();
    
    // Advanced Systems Tutorial Flow
    this.createAdvancedSystemsFlow();
    
    // Investment Tutorial Flow
    this.createInvestmentTutorialFlow();
  }

  /**
   * Create basic tutorial flow for new players
   */
  private createBasicTutorialFlow(): void {
    const basicFlow: TutorialFlow = {
      id: 'basics',
      name: 'Welcome to Space',
      description: 'Learn the fundamentals of space trading and navigation',
      category: 'basics',
      priority: 1,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome, Captain!',
          description: 'Welcome to the vast universe of space trading! This tutorial will guide you through the basics.',
          optional: false,
          skipable: false
        },
        {
          id: 'interface_overview',
          title: 'Game Interface',
          description: 'These are your main control panels. Each button opens a different system.',
          target: '.game-controls',
          position: 'bottom'
        },
        {
          id: 'navigation_intro',
          title: 'Navigation System',
          description: 'Click the Navigation button to see the galaxy map and plan your routes.',
          target: 'button[data-panel="navigation"]',
          position: 'bottom',
          action: 'click'
        },
        {
          id: 'market_intro',
          title: 'Market System',
          description: 'The Market panel shows commodity prices and trading opportunities.',
          target: 'button[data-panel="market"]',
          position: 'bottom',
          action: 'click'
        },
        {
          id: 'character_intro',
          title: 'Character Development',
          description: 'Your character skills affect trading prices, maintenance costs, and other bonuses.',
          target: 'button[data-panel="character"]',
          position: 'bottom'
        }
      ],
      rewards: [
        {
          type: 'credits',
          amount: 5000,
          description: 'Completion bonus: 5,000 Credits'
        },
        {
          type: 'experience',
          amount: 100,
          description: 'Tutorial completion: 100 XP'
        }
      ]
    };

    this.availableFlows.set(basicFlow.id, basicFlow);
  }

  /**
   * Create navigation tutorial flow
   */
  private createNavigationTutorialFlow(): void {
    const navigationFlow: TutorialFlow = {
      id: 'navigation',
      name: 'Navigation Mastery',
      description: 'Learn to navigate the galaxy and plan efficient routes',
      category: 'navigation',
      priority: 2,
      unlockConditions: ['basics_completed'],
      steps: [
        {
          id: 'galaxy_overview',
          title: 'Galaxy Map',
          description: 'This is the galaxy map. You can see sectors, systems, and stations.',
          target: '.navigation-panel',
          position: 'right'
        },
        {
          id: 'route_planning',
          title: 'Route Planning',
          description: 'Use the Routes panel to analyze and plan profitable trading routes.',
          target: 'button[data-panel="routes"]',
          position: 'bottom',
          action: 'click'
        },
        {
          id: 'travel_mechanics',
          title: 'Travel & Fuel',
          description: 'Traveling costs fuel and time. Plan your routes carefully to maximize profits.',
          target: '.route-analyzer',
          position: 'left'
        }
      ],
      rewards: [
        {
          type: 'credits',
          amount: 3000,
          description: 'Navigation mastery: 3,000 Credits'
        }
      ]
    };

    this.availableFlows.set(navigationFlow.id, navigationFlow);
  }

  /**
   * Create trading tutorial flow
   */
  private createTradingTutorialFlow(): void {
    const tradingFlow: TutorialFlow = {
      id: 'trading',
      name: 'Trading Fundamentals',
      description: 'Master the art of interstellar commerce',
      category: 'trading',
      priority: 3,
      unlockConditions: ['navigation_completed'],
      steps: [
        {
          id: 'market_analysis',
          title: 'Market Analysis',
          description: 'Study commodity prices to identify profitable trading opportunities.',
          target: '.market-panel',
          position: 'right'
        },
        {
          id: 'buy_low_sell_high',
          title: 'Buy Low, Sell High',
          description: 'The key to trading: buy commodities where they\'re cheap, sell where they\'re expensive.',
          target: '.commodity-list',
          position: 'top'
        },
        {
          id: 'contracts_system',
          title: 'Contract Trading',
          description: 'Accept contracts for guaranteed profits with specific requirements.',
          target: 'button[data-panel="contracts"]',
          position: 'bottom',
          action: 'click'
        },
        {
          id: 'reputation_effects',
          title: 'Faction Reputation',
          description: 'Good reputation with factions leads to better prices and exclusive contracts.',
          target: 'button[data-panel="factions"]',
          position: 'bottom'
        }
      ],
      rewards: [
        {
          type: 'credits',
          amount: 10000,
          description: 'Trading mastery: 10,000 Credits'
        },
        {
          type: 'experience',
          amount: 200,
          description: 'Trading experience: 200 XP'
        }
      ]
    };

    this.availableFlows.set(tradingFlow.id, tradingFlow);
  }

  /**
   * Create character development tutorial flow
   */
  private createCharacterTutorialFlow(): void {
    const characterFlow: TutorialFlow = {
      id: 'character',
      name: 'Character Development',
      description: 'Develop your character skills and attributes for better performance',
      category: 'character',
      priority: 4,
      unlockConditions: ['trading_completed'],
      steps: [
        {
          id: 'character_sheet',
          title: 'Character Overview',
          description: 'Your character sheet shows attributes, skills, and bonuses that affect gameplay.',
          target: 'button[data-panel="character"]',
          position: 'bottom',
          action: 'click'
        },
        {
          id: 'skill_progression',
          title: 'Skill Development',
          description: 'Gain experience through activities and spend skill points to improve abilities.',
          target: '.character-skills',
          position: 'right'
        },
        {
          id: 'gameplay_bonuses',
          title: 'Character Bonuses',
          description: 'Higher skills provide tangible bonuses: better prices, lower costs, new opportunities.',
          target: '.character-bonuses',
          position: 'left'
        },
        {
          id: 'achievements',
          title: 'Achievements',
          description: 'Complete achievements to earn rewards and track your progress.',
          target: 'button[data-panel="achievements"]',
          position: 'bottom',
          action: 'click'
        }
      ],
      rewards: [
        {
          type: 'experience',
          amount: 500,
          description: 'Character mastery: 500 XP'
        }
      ]
    };

    this.availableFlows.set(characterFlow.id, characterFlow);
  }

  /**
   * Create advanced systems tutorial flow
   */
  private createAdvancedSystemsFlow(): void {
    const advancedFlow: TutorialFlow = {
      id: 'advanced',
      name: 'Advanced Systems',
      description: 'Master complex game systems like security, hacking, and combat',
      category: 'advanced',
      priority: 5,
      unlockConditions: ['character_completed'],
      steps: [
        {
          id: 'security_system',
          title: 'Security & Law Enforcement',
          description: 'Different sectors have varying security levels affecting crime and enforcement.',
          target: 'button[data-panel="security"]',
          position: 'bottom',
          action: 'click'
        },
        {
          id: 'hacking_basics',
          title: 'Hacking & Electronic Warfare',
          description: 'Use hacking skills for data theft and electronic warfare capabilities.',
          target: 'button[data-panel="hacking"]',
          position: 'bottom',
          action: 'click'
        },
        {
          id: 'combat_system',
          title: 'Combat & Weapons',
          description: 'Engage in tactical combat with various weapons and defense systems.',
          target: 'button[data-panel="combat"]',
          position: 'bottom',
          action: 'click'
        },
        {
          id: 'events_system',
          title: 'Dynamic Events',
          description: 'Random events create opportunities and challenges throughout your journey.',
          target: 'button[data-panel="events"]',
          position: 'bottom',
          action: 'click'
        }
      ],
      rewards: [
        {
          type: 'credits',
          amount: 15000,
          description: 'Advanced systems mastery: 15,000 Credits'
        }
      ]
    };

    this.availableFlows.set(advancedFlow.id, advancedFlow);
  }

  /**
   * Create investment tutorial flow
   */
  private createInvestmentTutorialFlow(): void {
    const investmentFlow: TutorialFlow = {
      id: 'investment',
      name: 'Investment & Economic Warfare',
      description: 'Learn advanced economic systems and market manipulation',
      category: 'investment',
      priority: 6,
      unlockConditions: ['advanced_completed', 'credits_50000'],
      steps: [
        {
          id: 'investment_overview',
          title: 'Investment Opportunities',
          description: 'Invest in stations and faction ventures for long-term returns.',
          target: 'button[data-panel="investment"]',
          position: 'bottom',
          action: 'click'
        },
        {
          id: 'speculation_system',
          title: 'Market Speculation',
          description: 'Trade commodity futures with leverage for high-risk, high-reward opportunities.',
          target: '.speculation-tab',
          position: 'top'
        },
        {
          id: 'supply_chains',
          title: 'Supply Chain Analysis',
          description: 'Understand complex supply chains to predict market movements.',
          target: '.supply-chain-analysis',
          position: 'left'
        },
        {
          id: 'economic_warfare',
          title: 'Economic Warfare',
          description: 'Build market influence to enable powerful economic warfare actions.',
          target: '.economic-warfare-panel',
          position: 'right'
        }
      ],
      rewards: [
        {
          type: 'credits',
          amount: 25000,
          description: 'Investment mastery: 25,000 Credits'
        },
        {
          type: 'achievement',
          amount: 1,
          description: 'Economic Mastermind achievement'
        }
      ]
    };

    this.availableFlows.set(investmentFlow.id, investmentFlow);
  }

  /**
   * Initialize tooltips for UI elements
   */
  private initializeTooltips(): void {
    const tooltips: TutorialTooltip[] = [
      {
        element: 'button[data-panel="navigation"]',
        title: 'Navigation',
        content: 'Open the galaxy map to plan routes and navigate between systems.',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        element: 'button[data-panel="market"]',
        title: 'Market',
        content: 'View commodity prices and trading opportunities at your current location.',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        element: 'button[data-panel="contracts"]',
        title: 'Contracts',
        content: 'Accept trading contracts for guaranteed profits with specific requirements.',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        element: 'button[data-panel="character"]',
        title: 'Character',
        content: 'Manage your character attributes, skills, and view gameplay bonuses.',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        element: 'button[data-panel="investment"]',
        title: 'Investment',
        content: 'Advanced economic features: investments, speculation, and economic warfare.',
        position: 'bottom',
        trigger: 'hover'
      },
      {
        element: 'button[data-panel="security"]',
        title: 'Security',
        content: 'Monitor legal status, security levels, and law enforcement activities.',
        position: 'bottom',
        trigger: 'hover'
      }
    ];

    tooltips.forEach(tooltip => {
      this.tooltips.set(tooltip.element, tooltip);
    });
  }

  /**
   * Start a tutorial flow
   */
  public startTutorialFlow(flowId: string): boolean {
    const flow = this.availableFlows.get(flowId);
    if (!flow) return false;

    // Check unlock conditions
    if (flow.unlockConditions && !this.checkUnlockConditions(flow.unlockConditions)) {
      return false;
    }

    this.tutorialState.currentFlow = flowId;
    this.tutorialState.currentStep = 0;
    
    return true;
  }

  /**
   * Check if unlock conditions are met
   */
  private checkUnlockConditions(conditions: string[]): boolean {
    for (const condition of conditions) {
      if (condition.endsWith('_completed')) {
        const flowId = condition.replace('_completed', '');
        if (!this.tutorialState.completedFlows.includes(flowId)) {
          return false;
        }
      } else if (condition.startsWith('credits_')) {
        const requiredCredits = parseInt(condition.replace('credits_', ''));
        if (this.playerManager.getCredits() < requiredCredits) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Advance to next tutorial step
   */
  public nextStep(): boolean {
    if (!this.tutorialState.currentFlow || this.tutorialState.currentStep === undefined) {
      return false;
    }

    const flow = this.availableFlows.get(this.tutorialState.currentFlow);
    if (!flow) return false;

    const currentStep = flow.steps[this.tutorialState.currentStep];
    if (currentStep) {
      // Record step completion
      this.recordStepProgress(flow.id, currentStep.id, true);
    }

    this.tutorialState.currentStep++;

    // Check if flow is complete
    if (this.tutorialState.currentStep >= flow.steps.length) {
      this.completeTutorialFlow(flow.id);
      return false;
    }

    return true;
  }

  /**
   * Complete a tutorial flow
   */
  private completeTutorialFlow(flowId: string): void {
    if (!this.tutorialState.completedFlows.includes(flowId)) {
      this.tutorialState.completedFlows.push(flowId);
    }

    const flow = this.availableFlows.get(flowId);
    if (flow?.rewards) {
      this.grantTutorialRewards(flow.rewards);
    }

    this.tutorialState.currentFlow = undefined;
    this.tutorialState.currentStep = undefined;
  }

  /**
   * Grant tutorial rewards
   */
  private grantTutorialRewards(rewards: any[]): void {
    for (const reward of rewards) {
      switch (reward.type) {
        case 'credits':
          this.playerManager.addCredits(reward.amount);
          break;
        case 'experience':
          this.characterManager.awardExperience(reward.amount, 'Tutorial completion', 'social');
          break;
        case 'achievement':
          // Achievement system integration would go here
          break;
      }
    }
  }

  /**
   * Record step progress
   */
  private recordStepProgress(flowId: string, stepId: string, completed: boolean): void {
    const progress: TutorialProgress = {
      flowId,
      stepId,
      completed,
      timestamp: Date.now(),
      timeSpent: 0 // Could track actual time spent
    };
    
    this.progressHistory.push(progress);
    
    if (completed && !this.tutorialState.completedSteps.includes(stepId)) {
      this.tutorialState.completedSteps.push(stepId);
    }
  }

  /**
   * Get current tutorial step
   */
  public getCurrentStep(): TutorialStep | null {
    if (!this.tutorialState.currentFlow || this.tutorialState.currentStep === undefined) {
      return null;
    }

    const flow = this.availableFlows.get(this.tutorialState.currentFlow);
    if (!flow) return null;

    return flow.steps[this.tutorialState.currentStep] || null;
  }

  /**
   * Get tutorial state for UI
   */
  public getTutorialState(): TutorialState {
    return { ...this.tutorialState };
  }

  /**
   * Get available tutorial flows
   */
  public getAvailableFlows(): TutorialFlow[] {
    return Array.from(this.availableFlows.values())
      .filter(flow => !this.tutorialState.completedFlows.includes(flow.id))
      .filter(flow => !flow.unlockConditions || this.checkUnlockConditions(flow.unlockConditions))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Skip current tutorial flow
   */
  public skipTutorialFlow(): void {
    if (this.tutorialState.currentFlow) {
      this.tutorialState.skippedFlows.push(this.tutorialState.currentFlow);
      this.tutorialState.currentFlow = undefined;
      this.tutorialState.currentStep = undefined;
    }
  }

  /**
   * Update tutorial settings
   */
  public updateSettings(settings: Partial<TutorialSettings>): void {
    this.tutorialState.settings = { ...this.tutorialState.settings, ...settings };
  }

  /**
   * Get tooltip for element
   */
  public getTooltip(element: string): TutorialTooltip | undefined {
    return this.tooltips.get(element);
  }

  /**
   * Serialize tutorial state for saving
   */
  public serialize(): any {
    return {
      tutorialState: this.tutorialState,
      progressHistory: this.progressHistory
    };
  }

  /**
   * Deserialize tutorial state from save data
   */
  public deserialize(data: any): void {
    if (data.tutorialState) {
      this.tutorialState = { ...this.tutorialState, ...data.tutorialState };
    }
    if (data.progressHistory) {
      this.progressHistory = data.progressHistory;
    }
  }
}