/**
 * Enhanced Faction Storylines - Phase 7.1 Content Creation
 * 
 * This module contains rich, multi-arc faction storylines with branching narratives,
 * character development opportunities, and meaningful player choices.
 */

import { StoryQuest, FactionStoryline, StoryArc } from '../types/quests';

/**
 * ENHANCED TRADERS GUILD STORYLINES
 * Multi-arc progression from merchant to guild leader
 */
export const TRADERS_GUILD_STORYLINES: StoryQuest[] = [
  // Arc 1: The Apprentice Merchant
  {
    id: 'tg_first_contract',
    title: 'First Steps in Commerce',
    description: 'Your contact at the Traders Guild has arranged a simple delivery contract to test your capabilities. Success here will open doors to greater opportunities.',
    type: 'faction_storyline',
    category: 'trading',
    status: 'available',
    requirements: {
      reputation: { 'traders_guild': 0 }
    },
    objectives: [
      {
        id: 'deliver_electronics',
        description: 'Deliver 10 units of Electronics to Vega Station',
        type: 'deliver',
        target: 'vega-station',
        quantity: 10,
        completed: false
      }
    ],
    rewards: {
      credits: 8000,
      experience: 150,
      reputation: { 'traders_guild': 15 }
    },
    giver: 'Marcus Chen',
    location: 'Earth Station Alpha',
    factionId: 'traders_guild',
    storyArc: 'tg_apprentice_arc',
    nextQuest: 'tg_market_analysis',
    priority: 8,
    repeatable: false,
    timeLimit: 72, // hours
    dialogue: {
      intro: "Welcome to the Guild, pilot. I'm Marcus Chen, and I'll be your liaison for now. We have a simple delivery that will test your reliability.",
      success: "Excellent work! You've proven yourself capable. The Guild has bigger plans for merchants like you.",
      failure: "Disappointing. The Guild expects reliability above all else. Perhaps you're not ready for bigger opportunities."
    }
  },

  {
    id: 'tg_market_analysis',
    title: 'Market Intelligence',
    description: 'The Guild needs detailed market data from three frontier stations. This intelligence will help identify profitable trade routes and potential expansion opportunities.',
    type: 'faction_storyline',
    category: 'exploration',
    status: 'locked',
    requirements: {
      completedQuests: ['tg_first_contract'],
      reputation: { 'traders_guild': 15 }
    },
    objectives: [
      {
        id: 'scan_markets',
        description: 'Perform market analysis at Kepler-442, Gliese 667C, and TRAPPIST-1 stations',
        type: 'visit',
        quantity: 3,
        completed: false
      },
      {
        id: 'collect_price_data',
        description: 'Collect commodity price data for at least 5 different goods',
        type: 'collect',
        quantity: 5,
        completed: false
      }
    ],
    rewards: {
      credits: 12000,
      experience: 200,
      reputation: { 'traders_guild': 20 },
      unlocks: ['advanced_market_scanner', 'price_prediction_algorithms']
    },
    giver: 'Dr. Sarah Kim',
    location: 'Earth Station Alpha',
    factionId: 'traders_guild',
    storyArc: 'tg_apprentice_arc',
    nextQuest: 'tg_corporate_sabotage',
    priority: 7,
    repeatable: false,
    timeLimit: 96,
    dialogue: {
      intro: "The Guild is expanding, but we need data. These frontier stations hold the key to our next phase of growth.",
      success: "Outstanding! This data reveals significant opportunities. You're ready for more... sensitive assignments.",
      failure: "Without proper market intelligence, the Guild cannot make strategic decisions. This setback affects our expansion plans."
    }
  },

  // Arc 2: Corporate Warfare
  {
    id: 'tg_corporate_sabotage',
    title: 'Industrial Espionage',
    description: 'Industrial Consortium is undercutting Guild prices using illegal dumping. Investigate their operations and gather evidence of their violations.',
    type: 'faction_storyline',
    category: 'investigation',
    status: 'locked',
    requirements: {
      completedQuests: ['tg_market_analysis'],
      reputation: { 'traders_guild': 35 },
      skills: { 'hacking': 25, 'stealth': 20 }
    },
    objectives: [
      {
        id: 'infiltrate_facility',
        description: 'Access Industrial Consortium facility database',
        type: 'hacking',
        completed: false
      },
      {
        id: 'gather_evidence',
        description: 'Obtain proof of illegal dumping practices',
        type: 'collect',
        quantity: 3,
        completed: false
      },
      {
        id: 'avoid_detection',
        description: 'Complete mission without triggering security alerts',
        type: 'stealth',
        completed: false,
        hidden: true
      }
    ],
    rewards: {
      credits: 25000,
      experience: 350,
      reputation: { 
        'traders_guild': 30,
        'industrial_consortium': -15
      },
      unlocks: ['corporate_intelligence_network']
    },
    giver: 'Commander Elena Vasquez',
    location: 'Guild Headquarters',
    factionId: 'traders_guild',
    storyArc: 'tg_corporate_warfare_arc',
    nextQuest: 'tg_economic_warfare',
    priority: 9,
    repeatable: false,
    consequences: {
      success: ['industrial_consortium_prices_increase', 'guild_market_share_growth'],
      failure: ['security_investigation', 'guild_reputation_loss']
    }
  }
];

/**
 * SECURITY FORCES STORYLINES
 * Law enforcement and peacekeeping narratives
 */
export const SECURITY_FORCES_STORYLINES: StoryQuest[] = [
  {
    id: 'sf_patrol_duty',
    title: 'Patrol Officer',
    description: 'Join Security Forces on routine patrol duty to demonstrate your commitment to law and order.',
    type: 'faction_storyline',
    category: 'combat',
    status: 'available',
    requirements: {
      reputation: { 'security_forces': 0 },
      attributes: { 'courage': 15 }
    },
    objectives: [
      {
        id: 'complete_patrols',
        description: 'Complete 3 patrol circuits in Core Worlds Sector',
        type: 'visit',
        quantity: 3,
        completed: false
      },
      {
        id: 'respond_to_incidents',
        description: 'Respond to at least 2 security incidents',
        type: 'interact',
        quantity: 2,
        completed: false
      }
    ],
    rewards: {
      credits: 15000,
      experience: 250,
      reputation: { 'security_forces': 20 },
      unlocks: ['security_clearance_level_1']
    },
    giver: 'Captain Rodriguez',
    location: 'Security Station Bravo',
    factionId: 'security_forces',
    storyArc: 'sf_officer_arc',
    nextQuest: 'sf_pirate_investigation',
    priority: 6,
    repeatable: false
  },

  {
    id: 'sf_organized_crime',
    title: 'Shadow Network',
    description: 'Intelligence suggests a sophisticated criminal organization is operating across multiple sectors. Investigate their activities and dismantle their network.',
    type: 'faction_storyline',
    category: 'investigation',
    status: 'locked',
    requirements: {
      completedQuests: ['sf_patrol_duty'],
      reputation: { 'security_forces': 40 },
      skills: { 'investigation': 30, 'combat': 25 }
    },
    objectives: [
      {
        id: 'identify_network',
        description: 'Identify key members of the criminal organization',
        type: 'investigation',
        quantity: 5,
        completed: false
      },
      {
        id: 'disrupt_operations',
        description: 'Disrupt 3 criminal operations',
        type: 'combat',
        quantity: 3,
        completed: false
      },
      {
        id: 'capture_leader',
        description: 'Capture the organization leader alive',
        type: 'combat',
        completed: false
      }
    ],
    rewards: {
      credits: 50000,
      experience: 500,
      reputation: { 'security_forces': 50 },
      unlocks: ['detective_badge', 'organized_crime_database']
    },
    giver: 'Detective Sarah Chen',
    location: 'Security Headquarters',
    factionId: 'security_forces',
    storyArc: 'sf_detective_arc',
    priority: 10,
    repeatable: false,
    branches: [
      {
        id: 'negotiate_surrender',
        description: 'Attempt to negotiate the leader\'s surrender',
        requirements: { skills: { 'negotiation': 35 } },
        outcomes: {
          success: { reputation: { 'security_forces': 10 }, unlocks: ['peaceful_resolution_commendation'] },
          failure: { consequences: ['leader_escapes', 'additional_casualties'] }
        }
      },
      {
        id: 'direct_assault',
        description: 'Launch a direct assault on the criminal stronghold',
        requirements: { skills: { 'combat': 40 } },
        outcomes: {
          success: { reputation: { 'security_forces': 5 }, unlocks: ['tactical_assault_commendation'] },
          failure: { consequences: ['civilian_casualties', 'public_relations_damage'] }
        }
      }
    ]
  }
];

/**
 * OUTER COLONIES COALITION STORYLINES
 * Frontier survival and independence themes
 */
export const OUTER_COLONIES_STORYLINES: StoryQuest[] = [
  {
    id: 'oc_supply_run',
    title: 'Lifeline to the Frontier',
    description: 'Remote colonies depend on supply runs for essential materials. Help keep the frontier alive.',
    type: 'faction_storyline',
    category: 'humanitarian',
    status: 'available',
    requirements: {
      reputation: { 'outer_colonies_coalition': 0 }
    },
    objectives: [
      {
        id: 'deliver_supplies',
        description: 'Deliver medical supplies and food to 3 remote colonies',
        type: 'deliver',
        quantity: 3,
        completed: false
      },
      {
        id: 'emergency_rescue',
        description: 'Respond to emergency distress calls',
        type: 'interact',
        quantity: 2,
        completed: false
      }
    ],
    rewards: {
      credits: 18000,
      experience: 280,
      reputation: { 'outer_colonies_coalition': 25 },
      unlocks: ['frontier_supply_contracts']
    },
    giver: 'Governor Maria Santos',
    location: 'Frontier Command Station',
    factionId: 'outer_colonies_coalition',
    storyArc: 'oc_frontier_hero_arc',
    nextQuest: 'oc_independence_movement',
    priority: 7,
    repeatable: false,
    dialogue: {
      intro: "These colonies are the future of humanity, but they need support to survive. Are you willing to help?",
      success: "You've saved lives today. The frontier remembers its friends.",
      failure: "Without these supplies, people will suffer. The colonies can't afford unreliable partners."
    }
  }
];

/**
 * STORY ARC DEFINITIONS
 * Defines the progression and relationships between quest chains
 */
export const ENHANCED_STORY_ARCS: StoryArc[] = [
  {
    id: 'tg_apprentice_arc',
    title: 'Guild Apprenticeship',
    description: 'Your journey from independent pilot to Guild member',
    factionId: 'traders_guild',
    quests: ['tg_first_contract', 'tg_market_analysis'],
    status: 'available',
    prerequisites: {
      reputation: { 'traders_guild': 0 }
    },
    rewards: {
      credits: 5000,
      unlocks: ['guild_membership_card']
    }
  },

  {
    id: 'tg_corporate_warfare_arc',
    title: 'Economic Warfare',
    description: 'Navigate the dangerous world of corporate espionage and economic manipulation',
    factionId: 'traders_guild',
    quests: ['tg_corporate_sabotage', 'tg_economic_warfare', 'tg_market_manipulation'],
    status: 'locked',
    prerequisites: {
      completedArcs: ['tg_apprentice_arc'],
      reputation: { 'traders_guild': 35 }
    },
    rewards: {
      credits: 25000,
      unlocks: ['corporate_warfare_specialist']
    }
  },

  {
    id: 'sf_officer_arc',
    title: 'Security Officer Training',
    description: 'Learn the fundamentals of law enforcement and peacekeeping',
    factionId: 'security_forces',
    quests: ['sf_patrol_duty', 'sf_pirate_investigation'],
    status: 'available',
    prerequisites: {
      reputation: { 'security_forces': 0 }
    }
  },

  {
    id: 'sf_detective_arc',
    title: 'Criminal Investigation Unit',
    description: 'Join the elite detective unit tackling organized crime',
    factionId: 'security_forces',
    quests: ['sf_organized_crime', 'sf_corruption_investigation'],
    status: 'locked',
    prerequisites: {
      completedArcs: ['sf_officer_arc'],
      reputation: { 'security_forces': 40 }
    }
  },

  {
    id: 'oc_frontier_hero_arc',
    title: 'Hero of the Frontier',
    description: 'Become a legendary figure in the outer colonies',
    factionId: 'outer_colonies_coalition',
    quests: ['oc_supply_run', 'oc_independence_movement', 'oc_colonial_defense'],
    status: 'available',
    prerequisites: {
      reputation: { 'outer_colonies_coalition': 0 }
    }
  }
];

/**
 * FACTION STORYLINE COLLECTION
 * Complete storyline definitions for all major factions
 */
export const ENHANCED_FACTION_STORYLINES: FactionStoryline[] = [
  {
    factionId: 'traders_guild',
    title: 'Rise of the Merchant Prince',
    description: 'Ascend from humble trader to economic powerbroker in the galaxy\'s most influential commercial organization.',
    arcs: [
      {
        id: 'tg_apprentice_arc',
        title: 'Guild Apprenticeship',
        description: 'Learn the fundamentals of Guild operations and prove your worth',
        factionId: 'traders_guild',
        quests: ['tg_first_contract', 'tg_market_analysis'],
        status: 'available'
      },
      {
        id: 'tg_corporate_warfare_arc',
        title: 'Economic Warfare Specialist',
        description: 'Master the art of corporate espionage and market manipulation',
        factionId: 'traders_guild',
        quests: ['tg_corporate_sabotage', 'tg_economic_warfare'],
        status: 'locked'
      }
    ],
    reputation_requirements: {
      friendly: 25,
      allied: 60,
      trusted: 120
    },
    unlocks: {
      allied: ['guild_executive_privileges', 'advanced_trading_algorithms'],
      trusted: ['merchant_prince_title', 'economic_warfare_authorization']
    }
  },

  {
    factionId: 'security_forces',
    title: 'Guardian of Order',
    description: 'Rise through the ranks of Security Forces to become a defender of galactic law and order.',
    arcs: [
      {
        id: 'sf_officer_arc',
        title: 'Officer Training',
        description: 'Complete basic training and prove yourself as a capable officer',
        factionId: 'security_forces',
        quests: ['sf_patrol_duty', 'sf_pirate_investigation'],
        status: 'available'
      },
      {
        id: 'sf_detective_arc',
        title: 'Detective Division',
        description: 'Join the elite detective unit and tackle organized crime',
        factionId: 'security_forces',
        quests: ['sf_organized_crime'],
        status: 'locked'
      }
    ],
    reputation_requirements: {
      friendly: 30,
      allied: 70,
      trusted: 150
    },
    unlocks: {
      allied: ['security_clearance_level_2', 'advanced_weapons_permit'],
      trusted: ['commander_rank', 'classified_mission_access']
    }
  },

  {
    factionId: 'outer_colonies_coalition',
    title: 'Champion of the Frontier',
    description: 'Become a legendary hero of the outer colonies and champion of frontier independence.',
    arcs: [
      {
        id: 'oc_frontier_hero_arc',
        title: 'Hero of the Frontier',
        description: 'Help the colonies survive and thrive in the dangerous frontier',
        factionId: 'outer_colonies_coalition',
        quests: ['oc_supply_run', 'oc_independence_movement'],
        status: 'available'
      }
    ],
    reputation_requirements: {
      friendly: 20,
      allied: 50,
      trusted: 100
    },
    unlocks: {
      allied: ['frontier_hero_status', 'emergency_priority_contracts'],
      trusted: ['colonial_governor_influence', 'independence_leader_title']
    }
  }
];