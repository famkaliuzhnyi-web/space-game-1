/**
 * Enhanced Tutorial Content Manager
 * 
 * This file contains comprehensive tutorial content for Phase 7 implementation
 * Provides detailed, step-by-step guidance for all major game systems
 */

import { TutorialFlow } from '../types/tutorial';

/**
 * Enhanced Basic Tutorial Flow - Complete beginner experience
 */
export const createEnhancedBasicTutorial = (): TutorialFlow => ({
  id: 'enhanced-basics',
  name: '🚀 Space Trading Fundamentals',
  description: 'Complete guide for new space traders - covers movement, trading, and core mechanics',
  category: 'basics',
  priority: 1,
  rewards: [
    {
      type: 'credits',
      amount: 1000,
      description: 'Starter bonus: 1,000 credits'
    },
    {
      type: 'achievement',
      amount: 1,
      description: 'Tutorial Graduate achievement'
    }
  ],
  steps: [
    {
      id: 'welcome-enhanced',
      title: 'Welcome to Your Trading Career!',
      description: 'Congratulations on starting your journey as a space trader! In this universe, you\'ll buy low, sell high, upgrade your ships, and build your reputation across the galaxy.',
      optional: false,
      skipable: false
    },
    {
      id: 'understand-ui',
      title: 'Understanding Your Interface',
      description: 'Your interface has several key areas:\n• Game view (center) - shows your ship and surroundings\n• Control buttons (bottom) - access different game systems\n• Status displays - show your resources and ship status',
      target: '.game-canvas',
      position: 'bottom'
    },
    {
      id: 'navigation-deep',
      title: 'Navigation - Finding Your Way',
      description: 'Navigation is crucial for space trading. Here you can:\n• View nearby stations and their services\n• Plan efficient trade routes\n• Track fuel consumption and travel times\n• Identify profitable trading opportunities',
      target: 'button:contains("Navigation")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'market-fundamentals',
      title: 'Markets - The Heart of Trading',
      description: 'Markets are where you make money! Key concepts:\n• Buy commodities when prices are low\n• Sell them where prices are high\n• Different stations have different needs\n• Supply and demand affect prices constantly',
      target: 'button:contains("Market")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'cargo-basics',
      title: 'Managing Your Cargo',
      description: 'Your ship has limited cargo space. Learn to:\n• Check available cargo capacity\n• Load and unload efficiently\n• Prioritize high-value goods\n• Manage cargo between multiple ships',
      target: 'button:contains("Inventory")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'ship-systems',
      title: 'Ship Management Essentials',
      description: 'Your ship is your lifeline. Monitor:\n• Fuel levels for travel\n• Cargo capacity and current load\n• Ship condition and maintenance needs\n• Equipment and upgrades available',
      target: 'button:contains("Ship")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'character-growth',
      title: 'Character Development',
      description: 'As you trade and explore, you gain experience and skills:\n• Trading skills improve profit margins\n• Navigation skills reduce travel time\n• Social skills help with contracts and reputation\n• Technical skills reduce maintenance costs',
      target: 'button:contains("Character")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'first-trade',
      title: 'Your First Trade Mission',
      description: 'Ready for your first trade? Here\'s how:\n1. Check Navigation for nearby stations\n2. Look at Market prices for profitable goods\n3. Buy low-priced commodities\n4. Travel to stations that need those goods\n5. Sell for profit and repeat!',
      optional: false,
      skipable: false
    },
    {
      id: 'basics-complete',
      title: 'Tutorial Complete!',
      description: 'Congratulations! You\'ve learned the fundamentals of space trading. Continue practicing these basics, and when ready, try the specialized tutorials for advanced features like combat, investment, and faction relationships.',
      optional: false,
      skipable: false
    }
  ]
});

/**
 * Advanced Navigation Tutorial Flow
 */
export const createAdvancedNavigationTutorial = (): TutorialFlow => ({
  id: 'advanced-navigation',
  name: '🗺️ Master Navigator',
  description: 'Advanced navigation techniques for efficient trading routes and exploration',
  category: 'navigation',
  priority: 2,
  unlockConditions: ['enhanced-basics'],
  rewards: [
    {
      type: 'experience',
      amount: 100,
      description: 'Navigation experience bonus'
    }
  ],
  steps: [
    {
      id: 'route-planning',
      title: 'Efficient Route Planning',
      description: 'Learn to plan multi-stop trading routes that maximize profit while minimizing fuel costs. Consider distance, fuel consumption, and market demands.',
      target: 'button:contains("Routes")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'fuel-optimization',
      title: 'Fuel Management',
      description: 'Fuel is a major expense. Learn to:\n• Calculate fuel costs for routes\n• Find the best fuel prices\n• Plan refueling stops efficiently\n• Upgrade engines for better fuel economy',
      optional: false
    },
    {
      id: 'market-discovery',
      title: 'Discovering New Markets',
      description: 'Explore unknown systems to find:\n• Unexploited trading opportunities\n• Rare commodities and high prices\n• New stations and services\n• Secret routes with less competition',
      optional: false
    },
    {
      id: 'navigation-tools',
      title: 'Navigation Tools Mastery',
      description: 'Use advanced navigation features:\n• Filters to find specific station types\n• Distance and profit calculators\n• Route optimization algorithms\n• Market price tracking over time',
      target: 'button:contains("Navigation")',
      position: 'bottom',
      action: 'click'
    }
  ]
});

/**
 * Character Relationships and Social Systems Tutorial
 */
export const createSocialSystemsTutorial = (): TutorialFlow => ({
  id: 'social-systems',
  name: '🤝 Galactic Diplomacy',
  description: 'Master faction relationships, contacts, and social interactions for better opportunities',
  category: 'character',
  priority: 3,
  unlockConditions: ['enhanced-basics'],
  rewards: [
    {
      type: 'experience',
      amount: 150,
      description: 'Social skills experience'
    }
  ],
  steps: [
    {
      id: 'faction-intro',
      title: 'Understanding Factions',
      description: 'The galaxy is divided into different factions:\n• Each has unique goals and values\n• Your reputation affects available missions\n• Some factions conflict with others\n• Higher reputation unlocks exclusive content',
      target: 'button:contains("Factions")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'building-contacts',
      title: 'Building Your Contact Network',
      description: 'Contacts provide valuable opportunities:\n• Special trading contracts\n• Market information\n• Equipment access\n• Mission opportunities\n\nInteract regularly to build relationships.',
      target: 'button:contains("Contacts")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'reputation-management',
      title: 'Managing Your Reputation',
      description: 'Your actions affect how factions view you:\n• Completing missions builds trust\n• Trading with enemies can damage relationships\n• Some choices have moral implications\n• Balance relationships carefully',
      optional: false
    },
    {
      id: 'social-benefits',
      title: 'Benefits of Good Relationships',
      description: 'Strong relationships provide:\n• Better trading prices\n• Access to exclusive equipment\n• Priority mission assignments\n• Protection in dangerous areas\n• Information about profitable opportunities',
      optional: false
    }
  ]
});

/**
 * Combat and Security Tutorial
 */
export const createCombatTutorial = (): TutorialFlow => ({
  id: 'combat-security',
  name: '⚔️ Combat and Security',
  description: 'Learn combat basics, security systems, and how to handle dangerous situations',
  category: 'combat',
  priority: 4,
  unlockConditions: ['enhanced-basics'],
  rewards: [
    {
      type: 'item',
      amount: 1,
      description: 'Basic weapon upgrade'
    }
  ],
  steps: [
    {
      id: 'security-overview',
      title: 'Understanding Security',
      description: 'Different areas have different security levels:\n• High-security systems are safer but more regulated\n• Low-security areas offer better profits but more risk\n• Your actions affect your legal standing\n• Security forces respond to crimes',
      target: 'button:contains("Security")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'combat-basics',
      title: 'Basic Combat Mechanics',
      description: 'When diplomacy fails, be prepared to fight:\n• Different weapon types have different effects\n• Shields protect against damage\n• Ship size affects maneuverability\n• Retreat is often the best option',
      target: 'button:contains("Combat")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'avoiding-trouble',
      title: 'Avoiding Dangerous Situations',
      description: 'Prevention is better than cure:\n• Check security reports before traveling\n• Avoid carrying valuable cargo in dangerous areas\n• Build relationships with security forces\n• Plan escape routes for emergencies',
      optional: false
    },
    {
      id: 'legal-trading',
      title: 'Legal Trading Practices',
      description: 'Stay on the right side of the law:\n• Some commodities are restricted or illegal\n• Weapon licenses are required in many systems\n• Smuggling is profitable but very risky\n• Legal troubles can ruin your reputation',
      optional: false
    }
  ]
});

/**
 * Investment and Advanced Economy Tutorial
 */
export const createInvestmentTutorial = (): TutorialFlow => ({
  id: 'advanced-economy',
  name: '💰 Investment and Finance',
  description: 'Advanced economic systems: investments, market manipulation, and long-term wealth building',
  category: 'investment',
  priority: 5,
  unlockConditions: ['enhanced-basics', 'advanced-navigation'],
  rewards: [
    {
      type: 'credits',
      amount: 5000,
      description: 'Investment seed money'
    }
  ],
  steps: [
    {
      id: 'investment-basics',
      title: 'Understanding Investments',
      description: 'Beyond trading, you can invest in:\n• Station construction and upgrades\n• Mining operations and factories\n• Fleet expansion and ship upgrades\n• Research and development projects\n\nInvestments provide passive income over time.',
      target: 'button:contains("Investment")',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis and Prediction',
      description: 'Successful investors study market trends:\n• Track price histories and patterns\n• Understand supply and demand cycles\n• Identify emerging market opportunities\n• Time your investments for maximum return',
      optional: false
    },
    {
      id: 'risk-management',
      title: 'Investment Risk Management',
      description: 'Protect your wealth through diversification:\n• Don\'t put all money in one investment\n• Balance high-risk/high-reward opportunities\n• Keep emergency funds for unexpected events\n• Monitor investments regularly',
      optional: false
    },
    {
      id: 'passive-income',
      title: 'Building Passive Income Streams',
      description: 'Create income that works while you sleep:\n• Station ownership provides rent income\n• Fleet management generates trading profits\n• Research patents provide royalties\n• Smart investments compound over time',
      optional: false
    }
  ]
});

/**
 * Endgame Content Tutorial
 */
export const createEndgameTutorial = (): TutorialFlow => ({
  id: 'endgame-mastery',
  name: '👑 Master Trader',
  description: 'Advanced strategies for experienced players: empire building, faction leadership, and galactic influence',
  category: 'advanced',
  priority: 10,
  unlockConditions: ['enhanced-basics', 'advanced-navigation', 'social-systems', 'combat-security', 'advanced-economy'],
  rewards: [
    {
      type: 'achievement',
      amount: 1,
      description: 'Master Trader title'
    },
    {
      type: 'credits',
      amount: 50000,
      description: 'Master Trader bonus'
    }
  ],
  steps: [
    {
      id: 'empire-building',
      title: 'Building Your Trading Empire',
      description: 'Transition from single-ship trading to empire management:\n• Own multiple ships and trading routes\n• Establish permanent trading posts\n• Build supply chain networks\n• Become a major economic force',
      optional: false
    },
    {
      id: 'faction-leadership',
      title: 'Faction Leadership and Politics',
      description: 'Influence the galaxy through politics:\n• Gain leadership positions in factions\n• Shape faction policies and goals\n• Mediate conflicts between groups\n• Drive major storyline developments',
      optional: false
    },
    {
      id: 'galactic-influence',
      title: 'Shaping the Galaxy',
      description: 'Your choices affect the entire universe:\n• Economic policies you support affect all traders\n• Military actions can start or end conflicts\n• Research funding drives technological progress\n• Your legacy shapes the future of space trading',
      optional: false
    },
    {
      id: 'mastery-complete',
      title: 'Master Trader Status Achieved',
      description: 'Congratulations! You\'ve mastered all aspects of space trading. You now have the knowledge and experience to:\n• Dominate any market\n• Navigate complex political situations\n• Build lasting business empires\n• Shape the future of the galaxy\n\nThe universe is yours to command!',
      optional: false,
      skipable: false
    }
  ]
});

// Export all tutorial flows for use in TutorialManager
export const ENHANCED_TUTORIAL_FLOWS = [
  createEnhancedBasicTutorial(),
  createAdvancedNavigationTutorial(),
  createSocialSystemsTutorial(),
  createCombatTutorial(),
  createInvestmentTutorial(),
  createEndgameTutorial()
];