/**
 * Endgame Content and Replayability - Phase 7.1 Content Creation
 * 
 * High-level content for experienced players including prestige systems,
 * legacy mechanics, and challenging endgame scenarios.
 */

import { StoryQuest } from '../types/quests';

export interface PrestigeSystem {
  id: string;
  name: string;
  description: string;
  requirements: {
    level?: number;
    reputation?: { [factionId: string]: number };
    achievements?: string[];
    credits?: number;
    completedQuests?: string[];
  };
  benefits: {
    title?: string;
    bonuses?: { [key: string]: number };
    unlocks?: string[];
    privileges?: string[];
  };
  legacyRewards: {
    nextGeneration: string[];
    permanentBonuses: { [key: string]: number };
  };
}

export interface EndgameQuest {
  id: string;
  title: string;
  description: string;
  type: 'prestige' | 'legacy' | 'galaxy_changing' | 'faction_mastery' | 'ultimate_challenge';
  requirements: {
    prestige?: string[];
    level?: number;
    reputation?: { [factionId: string]: number };
    completedArcs?: string[];
    specialUnlocks?: string[];
  };
  phases: EndgamePhase[];
  rewards: EndgameRewards;
  legacyImpact: string[];
  replayable?: boolean;
}

export interface EndgamePhase {
  id: string;
  title: string;
  description: string;
  objectives: EndgameObjective[];
  timeLimit?: number;
  consequences: {
    success: string[];
    failure: string[];
  };
}

export interface EndgameObjective {
  id: string;
  description: string;
  type: 'economic_dominance' | 'military_supremacy' | 'diplomatic_mastery' | 
        'technological_breakthrough' | 'cultural_influence' | 'galaxy_exploration';
  target?: string;
  quantity?: number;
  difficulty: 'challenging' | 'extremely_difficult' | 'legendary';
}

export interface EndgameRewards {
  credits?: number;
  experience?: number;
  prestige?: number;
  titles?: string[];
  unlocks?: string[];
  legacyBonuses?: { [key: string]: number };
  galaxyImpact?: string[];
}

/**
 * PRESTIGE SYSTEMS
 * Ways for players to achieve recognition and unlock new gameplay
 */
export const PRESTIGE_SYSTEMS: PrestigeSystem[] = [
  {
    id: 'merchant_emperor',
    name: 'Merchant Emperor',
    description: 'Achieve ultimate dominance in galactic commerce through wealth accumulation, market control, and economic influence.',
    requirements: {
      level: 50,
      reputation: {
        'traders_guild': 200,
        'industrial_consortium': 150
      },
      credits: 10000000,
      completedQuests: ['tg_economic_empire', 'tg_market_monopoly', 'tg_galactic_trade_summit']
    },
    benefits: {
      title: 'Merchant Emperor of the Galaxy',
      bonuses: {
        'trading_profit': 0.5, // +50% trading profits
        'contract_rewards': 0.3, // +30% contract rewards
        'market_influence': 2.0  // Double market influence
      },
      unlocks: [
        'galactic_trade_council_leadership',
        'economic_policy_influence',
        'private_trading_fleet',
        'merchant_emperor_quarters'
      ],
      privileges: [
        'Economic policy consultation',
        'Private trading agreements',
        'Exclusive luxury station access',
        'Personal merchant fleet command'
      ]
    },
    legacyRewards: {
      nextGeneration: [
        'inherited_trading_empire',
        'family_merchant_reputation',
        'exclusive_trade_routes'
      ],
      permanentBonuses: {
        'starting_credits': 100000,
        'trading_skill': 25
      }
    }
  },

  {
    id: 'galactic_guardian',
    name: 'Guardian of the Galaxy',
    description: 'Become the ultimate protector of galactic peace and security through heroic actions and military excellence.',
    requirements: {
      level: 50,
      reputation: {
        'security_forces': 250,
        'earth_federation': 200
      },
      achievements: [
        'pirate_scourge',
        'hero_of_the_lanes',
        'galactic_peacekeeper',
        'defender_of_the_innocent'
      ]
    },
    benefits: {
      title: 'Guardian of the Galaxy',
      bonuses: {
        'combat_effectiveness': 0.4, // +40% combat effectiveness
        'security_reputation_gain': 2.0, // Double security reputation gain
        'hero_mission_rewards': 0.5 // +50% heroic mission rewards
      },
      unlocks: [
        'galactic_defense_command',
        'elite_security_fleet',
        'heroic_intervention_authority',
        'galactic_guardian_base'
      ],
      privileges: [
        'Military fleet command authority',
        'Emergency intervention powers',
        'Access to classified security intelligence',
        'Galactic peace treaty participation'
      ]
    },
    legacyRewards: {
      nextGeneration: [
        'heroic_family_legacy',
        'security_force_connections',
        'guardian_training_access'
      ],
      permanentBonuses: {
        'combat_skill': 30,
        'security_reputation': 50
      }
    }
  },

  {
    id: 'cosmic_explorer',
    name: 'Cosmic Explorer Supreme',
    description: 'Achieve legendary status as the galaxy\'s greatest explorer and discoverer of new worlds.',
    requirements: {
      level: 45,
      reputation: {
        'explorers_guild': 300,
        'scientific_consortium': 150
      },
      achievements: [
        'first_contact_specialist',
        'stellar_cartographer',
        'deep_space_pioneer',
        'alien_artifact_hunter'
      ]
    },
    benefits: {
      title: 'Cosmic Explorer Supreme',
      bonuses: {
        'exploration_rewards': 0.6, // +60% exploration rewards
        'discovery_bonuses': 1.0, // Double discovery bonuses
        'alien_interaction_success': 0.3 // +30% alien interaction success
      },
      unlocks: [
        'deep_space_exploration_authority',
        'first_contact_diplomatic_immunity',
        'cosmic_explorer_research_station',
        'alien_technology_research_access'
      ],
      privileges: [
        'Unlimited exploration permits',
        'First contact authority',
        'Alien technology research privileges',
        'Deep space navigation priority'
      ]
    },
    legacyRewards: {
      nextGeneration: [
        'explorer_family_tradition',
        'cosmic_navigation_expertise',
        'alien_diplomatic_connections'
      ],
      permanentBonuses: {
        'exploration_skill': 35,
        'scientific_knowledge': 25
      }
    }
  }
];

/**
 * ENDGAME QUEST CHAINS
 * Ultimate challenges for master-level players - converted to StoryQuest format
 */
export const ENDGAME_QUESTS: StoryQuest[] = [
  {
    id: 'galactic_unification',
    title: 'The Great Unification',
    description: 'Attempt to unite the major factions under a single galactic government, fundamentally reshaping the political landscape.',
    type: 'endgame',
    category: 'diplomacy',
    status: 'locked',
    requirements: {
      level: 50,
      reputation: {
        'traders_guild': 200,
        'security_forces': 200,
        'earth_federation': 200,
        'outer_colonies_coalition': 150
      },
      completedArcs: ['tg_merchant_prince', 'sf_galactic_defender', 'ef_diplomatic_master'],
      specialUnlocks: ['diplomatic_immunity', 'economic_warfare_mastery', 'galactic_influence']
    },
    objectives: [
      {
        id: 'faction_leader_meetings',
        description: 'Conduct successful diplomatic meetings with all 5 major faction leaders',
        type: 'diplomacy',
        quantity: 5,
        completed: false
      },
      {
        id: 'treaty_framework',
        description: 'Develop a unification treaty framework acceptable to all parties',
        type: 'diplomacy',
        completed: false
      },
      {
        id: 'unified_currency',
        description: 'Implement a unified galactic currency system',
        type: 'economic_warfare',
        completed: false
      },
      {
        id: 'unified_defense_force',
        description: 'Establish unified military command structure and joint operations',
        type: 'leadership',
        completed: false
      }
    ],
    rewards: {
      credits: 5000000,
      experience: 10000,
      reputation: {
        'traders_guild': 100,
        'security_forces': 100,
        'earth_federation': 100,
        'outer_colonies_coalition': 75
      },
      unlocks: ['galactic_government_influence', 'unified_faction_benefits', 'galactic_chancellor_title']
    },
    giver: 'galactic_trade_council',
    location: 'Galactic Council Chambers',
    factionId: 'neutral',
    storyArc: 'endgame_galactic_unity',
    priority: 10,
    repeatable: false,
    consequences: {
      success: [
        'Galactic government establishment',
        'Inter-faction cooperation improvement',
        'Unified economic system creation',
        'Galactic peace treaty implementation'
      ],
      failure: [
        'Political chaos and instability',
        'Economic fragmentation',
        'Increased factional conflicts'
      ]
    }
  },

  {
    id: 'alien_first_contact',
    title: 'First Contact Protocol',
    description: 'Make first contact with an advanced alien civilization and navigate the complex process of establishing diplomatic relations.',
    type: 'endgame',
    category: 'exploration',
    status: 'locked',
    requirements: {
      level: 45,
      reputation: {
        'explorers_guild': 250,
        'scientific_consortium': 200
      },
      completedArcs: ['cosmic_explorer_supreme', 'scientific_pioneer'],
      specialUnlocks: ['deep_space_navigation', 'xenolinguistics', 'first_contact_protocols']
    },
    objectives: [
      {
        id: 'signal_triangulation',
        description: 'Triangulate the source of alien transmissions',
        type: 'research',
        completed: false
      },
      {
        id: 'communication_decoding',
        description: 'Successfully decode alien communication protocols',
        type: 'research',
        completed: false
      },
      {
        id: 'peaceful_approach',
        description: 'Demonstrate peaceful intentions to alien civilization',
        type: 'diplomacy',
        completed: false
      },
      {
        id: 'cultural_understanding',
        description: 'Develop comprehensive understanding of alien culture',
        type: 'social',
        completed: false
      }
    ],
    rewards: {
      credits: 2000000,
      experience: 8000,
      reputation: {
        'explorers_guild': 100,
        'scientific_consortium': 75
      },
      unlocks: [
        'alien_technology_access',
        'interspecies_communication',
        'xenoarchaeology_research',
        'first_contact_ambassador_title'
      ]
    },
    giver: 'scientific_exploration_council',
    location: 'Deep Space Observatory',
    factionId: 'scientific_consortium',
    storyArc: 'endgame_alien_contact',
    priority: 9,
    repeatable: false,
    consequences: {
      success: [
        'First alien contact achieved',
        'New alien faction introduced',
        'Technology exchange established',
        'Cultural revolution begun'
      ],
      failure: [
        'Diplomatic incident with alien civilization',
        'Lost opportunity for peaceful contact',
        'Potential alien hostility'
      ]
    }
  },

  {
    id: 'economic_empire_challenge',
    title: 'The Trillion Credit Empire',
    description: 'Build an economic empire worth over a trillion credits while maintaining ethical business practices.',
    type: 'endgame',
    category: 'trading',
    status: 'locked',
    requirements: {
      level: 40,
      reputation: {
        'traders_guild': 150
      },
      completedArcs: ['merchant_prince'],
      specialUnlocks: ['advanced_economics', 'market_manipulation_mastery']
    },
    objectives: [
      {
        id: 'trading_network',
        description: 'Establish trading networks across 10 different systems',
        type: 'trading',
        quantity: 10,
        completed: false
      },
      {
        id: 'manufacturing_facilities',
        description: 'Own or control 5 major manufacturing facilities',
        type: 'economic_warfare',
        quantity: 5,
        completed: false
      },
      {
        id: 'commodity_control',
        description: 'Control 60% market share in 3 different commodity markets',
        type: 'economic_warfare',
        quantity: 3,
        completed: false
      },
      {
        id: 'ethical_practices',
        description: 'Maintain ethical business practices throughout expansion',
        type: 'social',
        completed: false
      }
    ],
    rewards: {
      credits: 1000000000, // 1 billion credits
      experience: 5000,
      reputation: {
        'traders_guild': 75
      },
      unlocks: [
        'trillion_credit_club_membership',
        'galactic_economic_advisory_role',
        'economic_emperor_title'
      ]
    },
    giver: 'galactic_commerce_council',
    location: 'Galactic Trade Center',
    factionId: 'traders_guild',
    storyArc: 'endgame_economic_mastery',
    priority: 8,
    repeatable: true,
    consequences: {
      success: [
        'Economic empire established',
        'Market stability improved',
        'Ethical business standards raised'
      ],
      failure: [
        'Economic instability',
        'Market manipulation accusations',
        'Loss of business credibility'
      ]
    }
  }
];

/**
 * NEW GAME PLUS FEATURES
 * Replayability systems for experienced players
 */
export interface NewGamePlusFeature {
  id: string;
  name: string;
  description: string;
  unlockRequirements: {
    completedQuests?: string[];
    achievements?: string[];
    prestige?: string[];
  };
  benefits: {
    startingBonuses?: { [key: string]: number };
    retainedProgress?: string[];
    newOptions?: string[];
    challengeModifiers?: { [key: string]: number };
  };
}

export const NEW_GAME_PLUS_FEATURES: NewGamePlusFeature[] = [
  {
    id: 'merchant_legacy',
    name: 'Merchant Family Legacy',
    description: 'Start new games with inherited wealth and trading connections from your merchant empire.',
    unlockRequirements: {
      prestige: ['merchant_emperor']
    },
    benefits: {
      startingBonuses: {
        'credits': 500000,
        'trading_skill': 25,
        'reputation_traders_guild': 50
      },
      retainedProgress: [
        'advanced_trading_algorithms',
        'exclusive_trade_routes',
        'corporate_connections'
      ],
      newOptions: [
        'family_business_storyline',
        'inherited_trading_fleet',
        'merchant_dynasty_quests'
      ]
    }
  },

  {
    id: 'hero_bloodline',
    name: 'Hero\'s Bloodline',
    description: 'Children of galactic heroes start with enhanced combat abilities and heroic reputation.',
    unlockRequirements: {
      prestige: ['galactic_guardian']
    },
    benefits: {
      startingBonuses: {
        'combat_skill': 30,
        'courage': 20,
        'reputation_security_forces': 75
      },
      retainedProgress: [
        'heroic_recognition',
        'military_connections',
        'combat_training_access'
      ],
      newOptions: [
        'next_generation_hero_storyline',
        'family_military_tradition',
        'heroic_legacy_missions'
      ]
    }
  },

  {
    id: 'explorer_heritage',
    name: 'Explorer\'s Heritage',
    description: 'Descendants of legendary explorers have enhanced exploration abilities and cosmic knowledge.',
    unlockRequirements: {
      prestige: ['cosmic_explorer']
    },
    benefits: {
      startingBonuses: {
        'exploration_skill': 35,
        'scientific_knowledge': 25,
        'reputation_explorers_guild': 100
      },
      retainedProgress: [
        'cosmic_navigation_data',
        'alien_contact_protocols',
        'deep_space_permits'
      ],
      newOptions: [
        'family_exploration_tradition',
        'inherited_research_data',
        'cosmic_heritage_quests'
      ]
    }
  }
];

/**
 * CHALLENGE MODES
 * Special difficulty modes for experienced players
 */
export interface ChallengeMode {
  id: string;
  name: string;
  description: string;
  modifiers: {
    economic?: { [key: string]: number };
    combat?: { [key: string]: number };
    social?: { [key: string]: number };
  };
  specialRules: string[];
  rewards: {
    experienceMultiplier: number;
    prestigeMultiplier: number;
    exclusiveUnlocks: string[];
  };
}

export const CHALLENGE_MODES: ChallengeMode[] = [
  {
    id: 'iron_trader',
    name: 'Iron Trader Mode',
    description: 'Hardcore trading challenge with permanent consequences for failed contracts.',
    modifiers: {
      economic: {
        'contract_failure_penalty': 2.0,
        'market_volatility': 1.5,
        'trading_margins': 0.7
      }
    },
    specialRules: [
      'Failed contracts cause permanent reputation damage',
      'No contract retries allowed',
      'Market crashes have lasting effects',
      'Bankruptcy results in permanent character loss'
    ],
    rewards: {
      experienceMultiplier: 2.0,
      prestigeMultiplier: 3.0,
      exclusiveUnlocks: [
        'iron_trader_badge',
        'hardcore_merchant_title',
        'trading_master_recognition'
      ]
    }
  },

  {
    id: 'pacifist_run',
    name: 'Pacifist Challenge',
    description: 'Complete the game without engaging in combat, focusing on diplomacy and trade.',
    modifiers: {
      combat: {
        'combat_disabled': 1.0
      },
      social: {
        'diplomatic_success_bonus': 1.5,
        'reputation_gain_multiplier': 1.3
      }
    },
    specialRules: [
      'All combat options disabled',
      'Must resolve conflicts through diplomacy',
      'Enhanced dialogue options available',
      'Pacifist-specific quest branches unlock'
    ],
    rewards: {
      experienceMultiplier: 1.5,
      prestigeMultiplier: 2.0,
      exclusiveUnlocks: [
        'galactic_peacemaker_title',
        'diplomatic_immunity',
        'pacifist_philosopher_recognition'
      ]
    }
  }
];

/**
 * ENDGAME UTILITY FUNCTIONS
 */
export function getAvailablePrestigeSystems(playerProgress: any): PrestigeSystem[] {
  return PRESTIGE_SYSTEMS.filter(system => {
    // Check if player meets all requirements
    return Object.entries(system.requirements).every(([key, value]) => {
      switch (key) {
        case 'level':
          return playerProgress.level >= value;
        case 'credits':
          return playerProgress.credits >= value;
        case 'reputation':
          return Object.entries(value as Record<string, number>).every(
            ([factionId, requiredRep]) => (playerProgress.reputation?.[factionId] || 0) >= requiredRep
          );
        case 'achievements':
          return (value as string[]).every(achievement => 
            playerProgress.achievements?.includes(achievement)
          );
        case 'completedQuests':
          return (value as string[]).every(quest => 
            playerProgress.completedQuests?.includes(quest)
          );
        default:
          return true;
      }
    });
  });
}

export function calculateEndgameScore(playerProgress: any): number {
  let score = 0;
  
  // Base score from level and experience
  score += (playerProgress.level || 0) * 100;
  score += (playerProgress.experience || 0) / 10;
  
  // Credits (logarithmic scaling)
  score += Math.log10((playerProgress.credits || 1)) * 1000;
  
  // Reputation scores
  if (playerProgress.reputation) {
    score += Object.values(playerProgress.reputation).reduce((sum: number, rep: any) => sum + rep, 0);
  }
  
  // Achievement bonuses
  if (playerProgress.achievements) {
    score += playerProgress.achievements.length * 500;
  }
  
  // Completed quest bonuses
  if (playerProgress.completedQuests) {
    score += playerProgress.completedQuests.length * 100;
  }
  
  // Prestige multiplier
  if (playerProgress.prestige) {
    score *= (1 + playerProgress.prestige.length * 0.5);
  }
  
  return Math.floor(score);
}