/**
 * Enhanced Seasonal Events - Phase 7.1 Content Creation
 * 
 * Rich seasonal content with meaningful gameplay impacts, unique rewards,
 * and time-limited opportunities that encourage player engagement.
 */

import { SeasonalContent } from '../types/quests';

/**
 * GALACTIC TRADE FESTIVALS
 * Annual celebrations that impact economy and trading
 */
export const TRADE_FESTIVALS: SeasonalContent[] = [
  {
    id: 'galactic_commerce_week',
    name: 'Megacorp Commerce Week',
    description: 'The annual celebration of interstellar trade brings unprecedented opportunities for profit and networking across the galaxy.',
    startMonth: 4,
    endMonth: 4, // April only
    quests: [
      'commerce_week_trading_challenge',
      'exclusive_trade_negotiations',
      'merchant_networking_gala',
      'new_route_discovery_contest'
    ],
    events: [
      'bulk_trading_discounts',
      'rare_commodity_auctions',
      'corporate_partnership_opportunities',
      'trade_route_expansion_grants'
    ],
    rewards: [
      {
        credits: 50000,
        experience: 750,
        items: ['golden_trader_badge', 'commerce_week_medal', 'exclusive_trade_algorithms'],
        reputation: {
          'volans-corp': 30,
          'shiden-corp': 25,
          'tekton-corp': 20
        }
      }
    ],
    unlocks: [
      'bulk_trading_contracts',
      'exclusive_supplier_access',
      'advanced_market_analysis',
      'corporate_partnership_deals'
    ],
    economicEffects: {
      commodityPriceModifiers: {
        'luxury_goods': 1.3,
        'electronics': 1.2,
        'art_objects': 1.5
      },
      tradingVolumeIncrease: 2.0,
      specialContracts: ['bulk_luxury_delivery', 'corporate_showcase_supply']
    },
    specialFeatures: [
      'Reduced trading fees across all stations',
      'Double reputation gains from trading activities',
      'Exclusive access to rare commodities',
      'VIP trading floor privileges'
    ]
  },

  {
    id: 'autumn_harvest_festival',
    name: 'Galactic Harvest Festival',
    description: 'Agricultural worlds celebrate the galactic harvest season with festivals, trade fairs, and humanitarian missions to address food distribution challenges.',
    startMonth: 9,
    endMonth: 10,
    quests: [
      'harvest_festival_supply_run',
      'food_distribution_crisis',
      'agricultural_technology_showcase',
      'interstellar_cooking_competition'
    ],
    events: [
      'agricultural_surplus_sales',
      'food_shortage_emergency_contracts',
      'farming_technology_demonstrations',
      'cultural_exchange_festivals'
    ],
    rewards: [
      {
        credits: 35000,
        experience: 500,
        items: ['harvest_coordinator_badge', 'agricultural_scanner', 'festival_decorations'],
        reputation: {
          'outer_colonies_coalition': 40,
          'earth_federation': 20
        }
      }
    ],
    unlocks: [
      'priority_food_contracts',
      'agricultural_investment_opportunities',
      'humanitarian_mission_access',
      'farming_colony_partnerships'
    ],
    economicEffects: {
      commodityPriceModifiers: {
        'food': 0.8,
        'medical_supplies': 1.4,
        'agricultural_equipment': 1.1
      },
      specialContracts: ['emergency_food_delivery', 'medical_aid_transport']
    },
    specialFeatures: [
      'Increased humanitarian mission availability',
      'Agricultural technology showcases',
      'Cultural festival participation',
      'Food shortage crisis response opportunities'
    ]
  }
];

/**
 * SECURITY CRISIS EVENTS
 * Temporary conflicts that create combat and security opportunities
 */
export const SECURITY_EVENTS: SeasonalContent[] = [
  {
    id: 'pirate_surge_crisis',
    name: 'The Great Pirate Surge',
    description: 'A coordinated pirate offensive threatens major shipping lanes, creating opportunities for heroic pilots to defend commerce and earn significant rewards.',
    startMonth: 6,
    endMonth: 8,
    quests: [
      'defend_shipping_lanes',
      'hunt_pirate_commanders',
      'escort_vulnerable_convoys',
      'destroy_pirate_strongholds',
      'rescue_captured_merchants'
    ],
    events: [
      'pirate_raid_warnings',
      'emergency_defense_contracts',
      'convoy_protection_missions',
      'bounty_hunting_opportunities'
    ],
    rewards: [
      {
        credits: 75000,
        experience: 1000,
        items: [
          'hero_of_the_lanes_medal',
          'pirate_hunter_license',
          'combat_veteran_recognition',
          'advanced_weapons_permit'
        ],
        reputation: {
          'security_forces': 60,
          'traders_guild': 40,
          'pirate_factions': -50
        }
      }
    ],
    unlocks: [
      'elite_security_contracts',
      'military_grade_equipment_access',
      'bounty_hunter_guild_membership',
      'convoy_command_authorization'
    ],
    economicEffects: {
      commodityPriceModifiers: {
        'weapons': 1.5,
        'shields': 1.4,
        'security_equipment': 1.3
      },
      specialContracts: [
        'emergency_convoy_escort',
        'pirate_base_assault',
        'merchant_rescue_operation'
      ]
    },
    specialFeatures: [
      'Increased pirate encounters in space',
      'Emergency distress calls from merchants',
      'Temporary security force alliances',
      'Hero status recognition ceremonies'
    ]
  },

  {
    id: 'corporate_war_winter',
    name: 'Winter of Corporate Warfare',
    description: 'Industrial espionage and corporate sabotage reach unprecedented levels as major corporations battle for market dominance.',
    startMonth: 12,
    endMonth: 2,
    quests: [
      'corporate_espionage_investigation',
      'industrial_sabotage_prevention',
      'executive_protection_detail',
      'trade_secret_theft_case',
      'corporate_merger_security'
    ],
    events: [
      'corporate_facility_attacks',
      'industrial_espionage_attempts',
      'executive_kidnapping_plots',
      'market_manipulation_schemes'
    ],
    rewards: [
      {
        credits: 60000,
        experience: 800,
        items: [
          'corporate_security_badge',
          'industrial_espionage_detector',
          'executive_protection_certification',
          'corporate_warfare_manual'
        ],
        reputation: {
          'industrial_consortium': 50,
          'stellar_industries': 50,
          'criminal_organizations': -30
        }
      }
    ],
    unlocks: [
      'corporate_security_clearance',
      'industrial_espionage_missions',
      'executive_protection_contracts',
      'corporate_warfare_specialist_status'
    ],
    economicEffects: {
      commodityPriceModifiers: {
        'security_equipment': 1.6,
        'electronics': 1.3,
        'information': 2.0
      },
      specialContracts: [
        'corporate_facility_defense',
        'executive_transport_security',
        'industrial_counter_espionage'
      ]
    },
    specialFeatures: [
      'Corporate facility security alerts',
      'Industrial espionage mini-games',
      'Executive protection assignments',
      'Corporate boardroom intrigue'
    ]
  }
];

/**
 * EXPLORATION EVENTS
 * Discovery-focused seasonal content for adventurous players
 */
export const EXPLORATION_EVENTS: SeasonalContent[] = [
  {
    id: 'stellar_cartography_expedition',
    name: 'Great Stellar Cartography Expedition',
    description: 'An ambitious galaxy-wide effort to map unknown regions, discover new phenomena, and establish first contact with alien civilizations.',
    startMonth: 5,
    endMonth: 7,
    quests: [
      'uncharted_system_exploration',
      'alien_artifact_discovery',
      'stellar_phenomenon_investigation',
      'first_contact_preparation',
      'deep_space_rescue_mission'
    ],
    events: [
      'new_system_discoveries',
      'alien_signal_detections',
      'stellar_anomaly_investigations',
      'exploration_fleet_formations'
    ],
    rewards: [
      {
        credits: 40000,
        experience: 600,
        items: [
          'stellar_cartographer_badge',
          'deep_space_explorer_license',
          'alien_artifact_scanner',
          'first_contact_protocols_manual'
        ],
        reputation: {
          'explorers_guild': 70,
          'scientific_consortium': 45
        }
      }
    ],
    unlocks: [
      'deep_space_exploration_permits',
      'alien_technology_research_access',
      'first_contact_specialist_training',
      'stellar_cartography_equipment'
    ],
    economicEffects: {
      commodityPriceModifiers: {
        'exploration_equipment': 1.2,
        'scientific_instruments': 1.3,
        'alien_artifacts': 2.5
      },
      specialContracts: [
        'deep_space_survey_mission',
        'alien_artifact_retrieval',
        'stellar_phenomenon_study'
      ]
    },
    specialFeatures: [
      'New systems temporarily accessible',
      'Alien artifact discovery opportunities',
      'Scientific research collaborations',
      'First contact scenario simulations'
    ]
  }
];

/**
 * LUXURY AND ENTERTAINMENT EVENTS
 * High-society events for wealthy players
 */
export const LUXURY_EVENTS: SeasonalContent[] = [
  {
    id: 'galactic_grand_prix',
    name: 'Galactic Grand Prix Racing Season',
    description: 'The most prestigious racing event in the galaxy brings together the fastest ships and most skilled pilots for ultimate bragging rights.',
    startMonth: 3,
    endMonth: 3,
    quests: [
      'racing_qualification_trials',
      'grand_prix_championship_race',
      'celebrity_pilot_escort',
      'luxury_racing_equipment_delivery',
      'racing_circuit_security'
    ],
    events: [
      'qualifying_time_trials',
      'celebrity_pilot_appearances',
      'luxury_vendor_exhibitions',
      'high_stakes_racing_bets'
    ],
    rewards: [
      {
        credits: 100000,
        experience: 1200,
        items: [
          'grand_prix_champion_trophy',
          'racing_legend_certification',
          'luxury_ship_modifications',
          'celebrity_pilot_autographs'
        ],
        reputation: {
          'racing_guild': 100,
          'luxury_entertainment': 60
        }
      }
    ],
    unlocks: [
      'professional_racing_license',
      'luxury_racing_modifications',
      'celebrity_pilot_connections',
      'high_stakes_racing_circuits'
    ],
    economicEffects: {
      commodityPriceModifiers: {
        'luxury_goods': 1.8,
        'racing_equipment': 2.0,
        'entertainment': 1.4
      },
      specialContracts: [
        'celebrity_transport',
        'luxury_equipment_delivery',
        'racing_circuit_support'
      ]
    },
    specialFeatures: [
      'Ship racing mini-games',
      'Celebrity pilot interactions',
      'Luxury vendor exhibitions',
      'High-stakes gambling opportunities'
    ]
  }
];

/**
 * HUMANITARIAN CRISIS EVENTS
 * Events focused on helping others and moral choices
 */
export const HUMANITARIAN_EVENTS: SeasonalContent[] = [
  {
    id: 'refugee_crisis_response',
    name: 'Galactic Refugee Crisis Response',
    description: 'Political upheaval and natural disasters have created a galaxy-wide refugee crisis requiring immediate humanitarian intervention.',
    startMonth: 11,
    endMonth: 1,
    quests: [
      'refugee_evacuation_mission',
      'humanitarian_supply_delivery',
      'refugee_camp_establishment',
      'medical_aid_distribution',
      'resettlement_program_support'
    ],
    events: [
      'mass_evacuation_operations',
      'emergency_medical_missions',
      'refugee_camp_supply_shortages',
      'resettlement_coordination_efforts'
    ],
    rewards: [
      {
        credits: 30000,
        experience: 500,
        items: [
          'humanitarian_hero_medal',
          'refugee_aid_coordinator_badge',
          'emergency_medical_certification',
          'cultural_sensitivity_training'
        ],
        reputation: {
          'humanitarian_alliance': 80,
          'outer_colonies_coalition': 45,
          'medical_consortium': 35
        }
      }
    ],
    unlocks: [
      'humanitarian_mission_priority_access',
      'refugee_transport_authorization',
      'emergency_medical_contracts',
      'cultural_liaison_certification'
    ],
    economicEffects: {
      commodityPriceModifiers: {
        'food': 1.3,
        'medical_supplies': 1.5,
        'basic_shelter_materials': 1.4
      },
      specialContracts: [
        'emergency_evacuation_transport',
        'humanitarian_supply_delivery',
        'refugee_medical_support'
      ]
    },
    specialFeatures: [
      'Moral choice scenarios',
      'Emergency evacuation mini-games',
      'Cultural sensitivity training',
      'Long-term impact tracking'
    ]
  }
];

/**
 * COMPLETE SEASONAL EVENTS COLLECTION
 */
export const ENHANCED_SEASONAL_EVENTS: SeasonalContent[] = [
  ...TRADE_FESTIVALS,
  ...SECURITY_EVENTS,
  ...EXPLORATION_EVENTS,
  ...LUXURY_EVENTS,
  ...HUMANITARIAN_EVENTS
];

/**
 * SEASONAL EVENT UTILITIES
 */
export function getCurrentSeasonalEvents(currentMonth: number): SeasonalContent[] {
  return ENHANCED_SEASONAL_EVENTS.filter(event => {
    if (event.startMonth <= event.endMonth) {
      // Same year event
      return currentMonth >= event.startMonth && currentMonth <= event.endMonth;
    } else {
      // Cross-year event (e.g., December to February)
      return currentMonth >= event.startMonth || currentMonth <= event.endMonth;
    }
  });
}

export function getUpcomingSeasonalEvents(currentMonth: number): SeasonalContent[] {
  return ENHANCED_SEASONAL_EVENTS.filter(event => {
    const nextMonth = (currentMonth % 12) + 1;
    const monthAfter = (nextMonth % 12) + 1;
    
    return event.startMonth === nextMonth || event.startMonth === monthAfter;
  });
}

export function getSeasonalEventsByType(category: string): SeasonalContent[] {
  return ENHANCED_SEASONAL_EVENTS.filter(event => 
    event.quests.some(quest => quest.includes(category)) ||
    event.events.some(eventType => eventType.includes(category))
  );
}