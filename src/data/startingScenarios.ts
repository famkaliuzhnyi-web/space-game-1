/**
 * Predefined Starting Scenarios Data
 * Contains pre-configured starting scenarios similar to X4 or Kenshi starting scenarios
 */

import { StartingScenario } from '../types/startingScenarios';

export const STARTING_SCENARIOS: Record<string, StartingScenario> = {
  'merchant-trader': {
    id: 'merchant-trader',
    name: 'Merchant Trader',
    description: 'Start as an established trader with good credits, a reliable ship, and positive trade relations.',
    difficulty: 'easy',
    category: 'trading',
    
    characterSetup: {
      backgroundId: 'merchant',
      attributeModifiers: {
        charisma: 2,
        intelligence: 1
      },
      skillModifiers: {
        trading: 5,
        negotiation: 3,
        economics: 2
      },
      startingEquipment: ['merchant-datapad', 'trader-suit']
    },
    
    startingCredits: 25000,
    startingLocation: 'terra-prime-station',
    
    startingShip: {
      shipClassId: 'light-freighter',
      shipName: 'Trading Venture',
      condition: {
        hull: 0.95,
        engines: 0.90,
        cargo: 1.0,
        shields: 0.85
      },
      equipment: {
        engines: ['standard-engine'],
        cargo: ['expanded-cargo-hold', 'cargo-scanner'],
        shields: ['basic-shields'],
        weapons: ['light-laser'],
        utility: ['nav-computer']
      }
    },
    
    factionStandings: {
      'traders-guild': 25,
      'security-forces': 10,
      'outer-colonies': 15,
      'corporate-alliance': 20
    },
    
    startingCargo: {
      'consumer-goods': 20,
      'food-rations': 15
    },
    
    backgroundStory: 'You have built a solid reputation as a reliable trader in the inner systems. Your ship is well-maintained, your credit is good, and trade opportunities await.',
    objectives: [
      'Establish profitable trade routes between major systems',
      'Build reputation with trading factions',
      'Expand your fleet with additional cargo ships',
      'Discover high-value commodity routes'
    ],
    
    specialConditions: {
      tradeDiscountPercent: 5, // 5% better trade prices
      contractPayoutModifier: 1.1 // 10% bonus to contract rewards
    }
  },
  
  'young-pilot': {
    id: 'young-pilot',
    name: 'Young Pilot',
    description: 'Fresh pilot academy graduate with excellent flying skills but limited experience and resources.',
    difficulty: 'normal',
    category: 'balanced',
    
    characterSetup: {
      backgroundId: 'pilot',
      attributeModifiers: {
        dexterity: 3,
        perception: 2
      },
      skillModifiers: {
        piloting: 8,
        navigation: 5
      },
      startingEquipment: ['pilot-suit'],
      forcedAppearance: {
        age: 25
      }
    },
    
    startingCredits: 5000,
    startingLocation: 'pilot-academy-station',
    
    startingShip: {
      shipClassId: 'courier-ship',
      shipName: 'First Flight',
      condition: {
        hull: 1.0,
        engines: 1.0,
        cargo: 1.0,
        shields: 1.0
      },
      equipment: {
        engines: ['high-performance-engine'],
        cargo: ['basic-cargo-hold'],
        shields: ['light-shields'],
        weapons: [],
        utility: ['basic-nav-computer']
      }
    },
    
    factionStandings: {
      'pilots-federation': 15,
      'security-forces': 5,
      'traders-guild': 0
    },
    
    backgroundStory: 'Fresh from the pilot academy with top marks in flight training, you\'re eager to make your mark in the galaxy. Your ship is new but your bank account is nearly empty.',
    objectives: [
      'Complete courier missions to build reputation',
      'Save credits to upgrade your ship',
      'Explore different career paths',
      'Build relationships with various factions'
    ]
  },
  
  'exile-outcast': {
    id: 'exile-outcast',
    name: 'Exile Outcast',
    description: 'Banished from civilized space with a damaged ship and hostile relations. Start with significant challenges.',
    difficulty: 'hard',
    category: 'challenge',
    
    characterSetup: {
      backgroundId: 'explorer',
      attributeModifiers: {
        endurance: 5,
        strength: 2
      },
      skillModifiers: {
        navigation: 3,
        security: 5,
        combat: 4
      },
      startingEquipment: ['survival-suit']
    },
    
    startingCredits: 800,
    startingLocation: 'frontier-outpost',
    
    startingShip: {
      shipClassId: 'light-freighter',
      shipName: 'Last Hope',
      condition: {
        hull: 0.60,
        engines: 0.45,
        cargo: 0.70,
        shields: 0.30
      },
      equipment: {
        engines: ['damaged-engine'],
        cargo: ['basic-cargo-hold'],
        shields: [],
        weapons: ['salvaged-weapon'],
        utility: []
      }
    },
    
    factionStandings: {
      'security-forces': -30,
      'corporate-alliance': -20,
      'traders-guild': -15,
      'outer-colonies': 5
    },
    
    backgroundStory: 'Falsely accused of a crime you didn\'t commit, you\'ve been exiled to the frontier with nothing but a damaged ship and a burning desire for redemption.',
    objectives: [
      'Repair your ship to working condition',
      'Clear your name and restore your reputation',
      'Survive in the dangerous outer rim',
      'Build new alliances among outcasts and rebels'
    ],
    
    specialConditions: {
      tradeDiscountPercent: -10, // 10% worse trade prices due to reputation
      reputationGainModifier: 0.5, // Slower reputation recovery
      forbiddenStations: ['terra-prime-station', 'corporate-headquarters'],
      hasDebt: {
        amount: 15000,
        creditor: 'security-forces',
        deadline: 60 // 60 days to pay back
      }
    }
  },
  
  'salvage-hunter': {
    id: 'salvage-hunter',
    name: 'Salvage Hunter',
    description: 'Independent salvage operator with specialized equipment and knowledge of dangerous areas.',
    difficulty: 'normal',
    category: 'exploration',
    
    characterSetup: {
      backgroundId: 'engineer',
      attributeModifiers: {
        intelligence: 3,
        perception: 3
      },
      skillModifiers: {
        engineering: 8,
        investigation: 6,
        security: 4
      },
      startingEquipment: ['engineering-tool', 'salvage-scanner']
    },
    
    startingCredits: 12000,
    startingLocation: 'salvage-depot',
    
    startingShip: {
      shipClassId: 'heavy-freighter',
      shipName: 'Wreck Runner',
      condition: {
        hull: 0.80,
        engines: 0.85,
        cargo: 0.95,
        shields: 0.75
      },
      equipment: {
        engines: ['efficient-engine'],
        cargo: ['reinforced-cargo-hold', 'salvage-processor'],
        shields: ['reinforced-shields'],
        weapons: ['mining-laser'],
        utility: ['deep-scanner', 'tractor-beam']
      }
    },
    
    factionStandings: {
      'salvagers-union': 30,
      'outer-colonies': 10,
      'traders-guild': 5,
      'security-forces': -5
    },
    
    startingCargo: {
      'scrap-metal': 30,
      'salvaged-components': 15
    },
    
    backgroundStory: 'You make your living recovering valuable materials from derelict ships and abandoned stations. It\'s dangerous work, but the rewards can be substantial.',
    objectives: [
      'Locate valuable salvage sites in unexplored systems',
      'Build relationships with scrap dealers',
      'Upgrade your ship with better salvage equipment',
      'Discover ancient technologies in old wrecks'
    ],
    
    specialConditions: {
      forbiddenFactions: [], // Can trade with most factions
    }
  },
  
  'corporate-executive': {
    id: 'corporate-executive',
    name: 'Corporate Executive',
    description: 'High-ranking corporate officer with excellent resources but comes with political enemies.',
    difficulty: 'easy',
    category: 'trading',
    
    characterSetup: {
      backgroundId: 'merchant',
      attributeModifiers: {
        charisma: 4,
        intelligence: 3
      },
      skillModifiers: {
        trading: 6,
        negotiation: 8,
        leadership: 5,
        economics: 4
      },
      startingEquipment: ['executive-datapad', 'corporate-suit'],
      forcedAppearance: {
        age: 40
      }
    },
    
    startingCredits: 50000,
    startingLocation: 'corporate-headquarters',
    
    startingShip: {
      shipClassId: 'light-freighter',
      shipName: 'Corporate Asset',
      condition: {
        hull: 1.0,
        engines: 1.0,
        cargo: 1.0,
        shields: 1.0
      },
      equipment: {
        engines: ['premium-engine'],
        cargo: ['automated-cargo-system', 'secure-cargo-hold'],
        shields: ['premium-shields'],
        weapons: ['security-turret'],
        utility: ['advanced-nav-computer', 'communication-array']
      }
    },
    
    factionStandings: {
      'corporate-alliance': 40,
      'traders-guild': 25,
      'security-forces': 20,
      'outer-colonies': -10,
      'pirates-syndicate': -25
    },
    
    startingCargo: {
      'luxury-goods': 25,
      'high-tech-components': 20
    },
    
    backgroundStory: 'As a senior executive in a major corporation, you have access to significant resources and trade connections, but your corporate ties also create enemies.',
    objectives: [
      'Maintain corporate interests while building personal wealth',
      'Navigate complex political relationships',
      'Expand corporate influence to new systems',
      'Defend against industrial espionage and sabotage'
    ],
    
    specialConditions: {
      tradeDiscountPercent: 10, // 10% better prices with corporate partners
      contractPayoutModifier: 1.25, // 25% bonus to corporate contracts
      hasContracts: {
        contractIds: ['corporate-supply-route-1', 'executive-transport-1']
      }
    }
  },

  'debug-tester': {
    id: 'debug-tester',
    name: 'Debug Tester',
    description: 'Development/testing scenario with maximum resources, all faction relationships positive, and best equipment for comprehensive testing.',
    difficulty: 'easy',
    category: 'balanced',
    
    characterSetup: {
      backgroundId: 'merchant',
      attributeModifiers: {
        strength: 15,
        intelligence: 15, 
        charisma: 15,
        endurance: 15,
        dexterity: 15,
        perception: 15
      },
      skillModifiers: {
        trading: 20,
        negotiation: 20,
        economics: 20,
        engineering: 20,
        piloting: 20,
        navigation: 20,
        combat: 20,
        tactics: 20,
        security: 20,
        networking: 20,
        investigation: 20,
        leadership: 20
      },
      startingEquipment: ['executive-datapad', 'corporate-suit', 'engineering-tool', 'salvage-scanner']
    },
    
    startingCredits: 1000000,
    startingLocation: 'terra-prime-station',
    
    startingShip: {
      shipClassId: 'heavy-freighter',
      shipName: 'Debug Explorer',
      condition: {
        hull: 1.0,
        engines: 1.0,
        cargo: 1.0,
        shields: 1.0
      },
      equipment: {
        engines: ['premium-engine', 'high-performance-engine'],
        cargo: ['automated-cargo-system', 'secure-cargo-hold', 'expanded-cargo-hold'],
        shields: ['premium-shields', 'reinforced-shields'],
        weapons: ['security-turret', 'mining-laser'],
        utility: ['advanced-nav-computer', 'communication-array', 'deep-scanner', 'tractor-beam']
      }
    },
    
    factionStandings: {
      'traders-guild': 50,
      'security-forces': 50,
      'outer-colonies': 50,
      'corporate-alliance': 50,
      'pilots-federation': 50,
      'salvagers-union': 50,
      'pirates-syndicate': 25 // Even pirates like debug testers
    },
    
    startingCargo: {
      'consumer-goods': 50,
      'food-rations': 50,
      'luxury-goods': 50,
      'high-tech-components': 50,
      'scrap-metal': 50,
      'salvaged-components': 50
    },
    
    startingQuests: ['debug-test-quest-1', 'debug-trade-route', 'debug-exploration'],
    
    backgroundStory: 'You are a debug tester with access to unlimited resources and maximum skills. Use this start to test all game systems, mechanics, and features comprehensively.',
    objectives: [
      'Test all trading systems and market mechanics',
      'Verify combat and security systems',
      'Test character progression and skill systems',
      'Validate faction interactions and reputation',
      'Test ship management and fleet operations',
      'Explore quest and event systems',
      'Test all UI panels and interactions'
    ],
    
    specialConditions: {
      tradeDiscountPercent: 25, // 25% better trade prices
      contractPayoutModifier: 2.0, // Double contract rewards
      reputationGainModifier: 2.0, // Faster reputation gains
      hasContracts: {
        contractIds: ['debug-high-value-contract', 'debug-exploration-contract']
      }
    }
  }
};

// Helper function to get scenarios by category
export function getScenariosByCategory(category: string): StartingScenario[] {
  return Object.values(STARTING_SCENARIOS).filter(scenario => scenario.category === category);
}

// Helper function to get scenarios by difficulty
export function getScenariosByDifficulty(difficulty: string): StartingScenario[] {
  return Object.values(STARTING_SCENARIOS).filter(scenario => scenario.difficulty === difficulty);
}

// Default scenario selection configuration
export const DEFAULT_SCENARIO_CONFIG = {
  defaultScenarioId: 'young-pilot',
  allowCustomStart: true,
  categorySorting: ['balanced', 'trading', 'exploration', 'combat', 'challenge']
};