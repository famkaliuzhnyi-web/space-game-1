/**
 * Enhanced Faction Storylines - Phase 7.1 Content Creation
 * 
 * This module contains rich, multi-arc faction storylines with branching narratives,
 * character development opportunities, and meaningful player choices.
 */

import { StoryQuest, FactionStoryline, StoryArc } from '../types/quests';

/**
 * ENHANCED MEGACORPORATION STORYLINES
 * Multi-arc progression within major corporate factions
 */

/**
 * RAIJIN CORPORATION STORYLINES
 * Military technology and defense systems
 */
export const RAIJIN_CORP_STORYLINES: StoryQuest[] = [
  // Arc 1: Defense Technology Specialist
  {
    id: 'raijin_first_contract',
    title: 'Weapons Testing Initiative',
    description: 'Raijin Corporation requires field testing of their latest energy weapon systems. Prove your combat capabilities and reliability.',
    type: 'faction_storyline',
    category: 'combat',
    status: 'available',
    requirements: {
      reputation: { 'raijin-corp': 0 }
    },
    objectives: [
      {
        id: 'test_weapons',
        description: 'Field test Thunder Strike energy weapons in combat scenarios',
        type: 'combat',
        quantity: 5,
        completed: false
      },
      {
        id: 'collect_data',
        description: 'Gather performance data from weapon systems',
        type: 'collect',
        quantity: 10,
        completed: false
      }
    ],
    rewards: {
      credits: 12000,
      experience: 200,
      reputation: { 'raijin-corp': 20 }
    },
    giver: 'Admiral Yukiko Tanaka',
    location: 'Titan Industrial Complex',
    factionId: 'raijin-corp',
    storyArc: 'raijin_specialist_arc',
    nextQuest: 'raijin_defense_systems',
    priority: 8,
    repeatable: false,
    timeLimit: 72,
    dialogue: {
      intro: "Welcome to Raijin Corporation. I'm Admiral Tanaka. We need pilots who can handle our advanced weapon systems.",
      success: "Excellent performance! Your combat data will help us refine our weapons technology.",
      failure: "Our weapons require skilled operators. Perhaps you need more training before handling Raijin technology."
    }
  },

  {
    id: 'raijin_defense_systems',
    title: 'Shield Network Installation',
    description: 'Help Raijin install their new modular defense platform systems at key strategic locations throughout the system.',
    type: 'faction_storyline',
    category: 'construction',
    status: 'locked',
    requirements: {
      completedQuests: ['raijin_first_contract'],
      reputation: { 'raijin-corp': 20 }
    },
    objectives: [
      {
        id: 'install_platforms',
        description: 'Install defense platforms at 3 strategic locations',
        type: 'build',
        quantity: 3,
        completed: false
      },
      {
        id: 'test_systems',
        description: 'Test integrated defense network functionality',
        type: 'technical',
        completed: false
      }
    ],
    rewards: {
      credits: 18000,
      experience: 300,
      reputation: { 'raijin-corp': 25 },
      unlocks: ['advanced_weapon_systems', 'defense_contractor_license']
    },
    giver: 'Director Kenji Matsumoto',
    location: 'Titan Industrial Complex',
    factionId: 'raijin-corp',
    storyArc: 'raijin_specialist_arc',
    nextQuest: 'raijin_corporate_warfare',
    priority: 7,
    repeatable: false,
    timeLimit: 96,
    dialogue: {
      intro: "Our modular defense systems represent the future of space security. Help us demonstrate their effectiveness.",
      success: "The defense network is operational. Your technical expertise is valuable to Raijin Corporation.",
      failure: "Defense systems require precision installation. The network integrity has been compromised."
    }
  },

  // Arc 2: Corporate Military Operations
  {
    id: 'raijin_corporate_warfare',
    title: 'Military Technology Espionage',
    description: 'Investigate competitors attempting to steal Raijin proprietary weapon designs and prevent industrial espionage.',
    type: 'faction_storyline',
    category: 'investigation',
    status: 'locked',
    requirements: {
      completedQuests: ['raijin_defense_systems'],
      reputation: { 'raijin-corp': 45 },
      skills: { 'combat': 30, 'investigation': 25 }
    },
    objectives: [
      {
        id: 'identify_spies',
        description: 'Identify corporate spies attempting to steal technology',
        type: 'investigation',
        quantity: 3,
        completed: false
      },
      {
        id: 'neutralize_threats',
        description: 'Neutralize espionage attempts through combat or negotiation',
        type: 'combat',
        quantity: 2,
        completed: false
      },
      {
        id: 'protect_secrets',
        description: 'Ensure proprietary weapon designs remain secure',
        type: 'stealth',
        completed: false,
        hidden: true
      }
    ],
    rewards: {
      credits: 35000,
      experience: 450,
      reputation: { 
        'raijin-corp': 40,
        'pirates': -20
      },
      unlocks: ['corporate_security_clearance', 'advanced_energy_weapons']
    },
    giver: 'Security Chief Lin Zhang',
    location: 'Raijin Security Division',
    factionId: 'raijin-corp',
    storyArc: 'raijin_warfare_arc',
    nextQuest: 'raijin_fleet_command',
    priority: 9,
    repeatable: false,
    consequences: {
      success: ['raijin_technology_secured', 'competitor_operations_disrupted'],
      failure: ['technology_leak', 'corporate_reputation_damage']
    }
  }
];

/**
 * INDEPENDENT SYSTEMS STORYLINES
 * Freedom and self-governance narratives
 */
export const INDEPENDENT_SYSTEMS_STORYLINES: StoryQuest[] = [
  {
    id: 'ind_freedom_fighter',
    title: 'Defender of Independence',
    description: 'Help Independent Systems resist corporate encroachment and maintain their freedom from megacorporation control.',
    type: 'faction_storyline',
    category: 'combat',
    status: 'available',
    requirements: {
      reputation: { 'independents': 0 },
      attributes: { 'integrity': 15 }
    },
    objectives: [
      {
        id: 'defend_colonies',
        description: 'Defend 3 independent colonies from corporate takeover attempts',
        type: 'combat',
        quantity: 3,
        completed: false
      },
      {
        id: 'supply_resistance',
        description: 'Deliver weapons and supplies to resistance movements',
        type: 'deliver',
        quantity: 5,
        completed: false
      }
    ],
    rewards: {
      credits: 15000,
      experience: 250,
      reputation: { 'independents': 25 },
      unlocks: ['freedom_fighter_badge']
    },
    giver: 'Governor Maria Volkov',
    location: 'Freedom Station',
    factionId: 'independents',
    storyArc: 'ind_resistance_arc',
    nextQuest: 'ind_corporate_espionage',
    priority: 7,
    repeatable: false
  },

  {
    id: 'ind_pirate_alliance',
    title: 'Unlikely Alliance',
    description: 'Form temporary alliances with reformed pirates to protect independent systems from corporate aggression.',
    type: 'faction_storyline',
    category: 'diplomacy',
    status: 'locked',
    requirements: {
      completedQuests: ['ind_freedom_fighter'],
      reputation: { 'independents': 25, 'pirates': -10 },
      skills: { 'negotiation': 20, 'leadership': 15 }
    },
    objectives: [
      {
        id: 'negotiate_alliance',
        description: 'Negotiate temporary ceasefire with Void Reapers',
        type: 'diplomacy',
        completed: false
      },
      {
        id: 'coordinate_defense',
        description: 'Coordinate joint defense operations',
        type: 'leadership',
        quantity: 2,
        completed: false
      },
      {
        id: 'maintain_trust',
        description: 'Maintain alliance without compromising independent values',
        type: 'diplomacy',
        completed: false
      }
    ],
    rewards: {
      credits: 25000,
      experience: 400,
      reputation: { 'independents': 30, 'pirates': 15 },
      unlocks: ['diplomatic_immunity', 'reformed_pirate_contacts']
    },
    giver: 'Admiral Sarah Chen',
    location: 'Independent Fleet Command',
    factionId: 'independents',
    storyArc: 'ind_resistance_arc',
    priority: 9,
    repeatable: false,
    branches: [
      {
        id: 'trust_pirates',
        description: 'Place full trust in pirate alliance',
        requirements: { skills: { 'courage': 25 } },
        outcomes: {
          success: { reputation: { 'pirates': 20 }, unlocks: ['pirate_fleet_support'] },
          failure: { consequences: ['betrayal_by_pirates', 'independent_losses'] }
        }
      },
      {
        id: 'limited_cooperation',
        description: 'Maintain cautious, limited cooperation',
        requirements: { skills: { 'wisdom': 20 } },
        outcomes: {
          success: { reputation: { 'independents': 15 }, unlocks: ['tactical_alliance'] },
          failure: { consequences: ['alliance_breakdown', 'missed_opportunities'] }
        }
      }
    ]
  }
];

/**
 * CRIMSON FLEET PIRATES STORYLINES
 * Criminal organization and black market operations
 */
export const PIRATES_STORYLINES: StoryQuest[] = [
  {
    id: 'pirates_initiation',
    title: 'Blood and Steel Initiation',
    description: 'Prove your worth to the Void Reapers through acts of piracy and loyalty to the code of the void.',
    type: 'faction_storyline',
    category: 'piracy',
    status: 'available',
    requirements: {
      reputation: { 'pirates': 0 },
      attributes: { 'ruthlessness': 10 }
    },
    objectives: [
      {
        id: 'piracy_raids',
        description: 'Successfully raid 3 corporate cargo convoys',
        type: 'piracy',
        quantity: 3,
        completed: false
      },
      {
        id: 'fence_goods',
        description: 'Sell stolen goods through black market channels',
        type: 'trading',
        quantity: 50,
        completed: false
      },
      {
        id: 'avoid_capture',
        description: 'Evade security forces during operations',
        type: 'stealth',
        completed: false,
        hidden: true
      }
    ],
    rewards: {
      credits: 20000,
      experience: 200,
      reputation: { 
        'pirates': 30, 
        'raijin-corp': -10,
        'bellator-corp': -15
      },
      unlocks: ['void_reaper_membership', 'black_market_access']
    },
    giver: 'Captain Red Morgan',
    location: 'Hidden Asteroid Base',
    factionId: 'pirates',
    storyArc: 'pirates_crew_arc',
    nextQuest: 'pirates_territory_war',
    priority: 6,
    repeatable: false,
    dialogue: {
      intro: "The void is harsh, but the Void Reapers take care of their own. Prove you can take what you need to survive.",
      success: "You've got steel in your spine and fire in your belly. Welcome to the Reapers, pirate.",
      failure: "The galaxy is full of weaklings who can't do what's necessary. Maybe you're one of them."
    }
  }
];

/**
 * STORY ARC DEFINITIONS
 * Defines the progression and relationships between quest chains
 */
export const ENHANCED_STORY_ARCS: StoryArc[] = [
  {
    id: 'raijin_specialist_arc',
    title: 'Defense Technology Specialist',
    description: 'Your journey from weapon tester to military technology expert',
    factionId: 'raijin-corp',
    quests: ['raijin_first_contract', 'raijin_defense_systems'],
    status: 'available',
    prerequisites: {
      reputation: { 'raijin-corp': 0 }
    },
    rewards: {
      credits: 5000,
      unlocks: ['raijin_specialist_certification']
    }
  },

  {
    id: 'raijin_warfare_arc',
    title: 'Corporate Military Operations',
    description: 'Navigate the dangerous world of corporate espionage and military contracts',
    factionId: 'raijin-corp',
    quests: ['raijin_corporate_warfare', 'raijin_fleet_command'],
    status: 'locked',
    prerequisites: {
      completedArcs: ['raijin_specialist_arc'],
      reputation: { 'raijin-corp': 45 }
    },
    rewards: {
      credits: 25000,
      unlocks: ['corporate_military_specialist']
    }
  },

  {
    id: 'ind_resistance_arc',
    title: 'Freedom Fighter',
    description: 'Fight for independence against corporate domination',
    factionId: 'independents',
    quests: ['ind_freedom_fighter', 'ind_pirate_alliance'],
    status: 'available',
    prerequisites: {
      reputation: { 'independents': 0 }
    }
  },

  {
    id: 'pirates_crew_arc',
    title: 'Void Reapers Initiation',
    description: 'Rise through the ranks of the galaxy\'s most notorious pirate organization',
    factionId: 'pirates',
    quests: ['pirates_initiation', 'pirates_territory_war'],
    status: 'available',
    prerequisites: {
      reputation: { 'pirates': 0 }
    }
  }
];

/**
 * FACTION STORYLINE COLLECTION
 * Complete storyline definitions for all major factions
 */
export const ENHANCED_FACTION_STORYLINES: FactionStoryline[] = [
  {
    factionId: 'raijin-corp',
    title: 'Master of War Technology',
    description: 'Rise from weapon tester to military technology expert in the galaxy\'s premier defense corporation.',
    arcs: [
      {
        id: 'raijin_specialist_arc',
        title: 'Defense Technology Specialist',
        description: 'Learn advanced weapon systems and prove your combat capabilities',
        factionId: 'raijin-corp',
        quests: ['raijin_first_contract', 'raijin_defense_systems'],
        status: 'available'
      },
      {
        id: 'raijin_warfare_arc',
        title: 'Corporate Military Operations',
        description: 'Master corporate espionage and advanced military tactics',
        factionId: 'raijin-corp',
        quests: ['raijin_corporate_warfare'],
        status: 'locked'
      }
    ],
    reputation_requirements: {
      friendly: 30,
      allied: 70,
      trusted: 150
    },
    unlocks: {
      allied: ['advanced_energy_weapons', 'defense_contractor_privileges'],
      trusted: ['military_technology_access', 'corporate_fleet_command']
    }
  },

  {
    factionId: 'independents',
    title: 'Champion of Freedom',
    description: 'Fight for independence and self-governance against corporate domination.',
    arcs: [
      {
        id: 'ind_resistance_arc',
        title: 'Freedom Fighter',
        description: 'Defend independent systems from corporate takeover',
        factionId: 'independents',
        quests: ['ind_freedom_fighter', 'ind_pirate_alliance'],
        status: 'available'
      }
    ],
    reputation_requirements: {
      friendly: 25,
      allied: 60,
      trusted: 120
    },
    unlocks: {
      allied: ['freedom_fighter_status', 'independent_fleet_access'],
      trusted: ['resistance_leader_title', 'liberation_authority']
    }
  },

  {
    factionId: 'pirates',
    title: 'Void Reapers Captain',
    description: 'Rise through the ranks of the galaxy\'s most notorious pirate organization.',
    arcs: [
      {
        id: 'pirates_crew_arc',
        title: 'Pirate Initiation',
        description: 'Prove your worth through acts of piracy and loyalty to the Fleet',
        factionId: 'pirates',
        quests: ['pirates_initiation'],
        status: 'available'
      }
    ],
    reputation_requirements: {
      friendly: 20,
      allied: 50,
      trusted: 100
    },
    unlocks: {
      allied: ['black_market_dealer_license', 'pirate_fleet_support'],
      trusted: ['void_reaper_captain', 'underworld_influence']
    }
  }
];