import { 
  GameEvent, 
  EventType, 
  EventSystemState, 
  EventConfig, 
  EventTrigger, 
  EventChain, 
  EventHistory,
  SpaceEncounter,
  StationEvent,
  SystemCrisis,
  EmergencyContract 
} from '../types/events';
import { TimeManager } from './TimeManager';
import { WorldManager } from './WorldManager';
import { PlayerManager } from './PlayerManager';
import { FactionManager } from './FactionManager';

/**
 * EventManager handles all random events and dynamic content in the space game.
 * 
 * Responsibilities:
 * - Event scheduling and triggering based on time, location, and conditions
 * - Managing active events and their lifecycle
 * - Processing event choices and consequences
 * - Coordinating with other game systems for event effects
 * - Maintaining event history and statistics
 * 
 * Event Types:
 * - Space Encounters: Pirates, merchants, derelicts, patrols
 * - Station Events: Social interactions, commercial opportunities
 * - System Crises: Economic, political, environmental emergencies
 * - Emergency Contracts: Time-sensitive high-reward missions
 * 
 * Features:
 * - Dynamic probability calculation based on player state
 * - Event chains for complex storylines
 * - Cooldown system to prevent event spam
 * - Save/load support for persistent events
 */
export class EventManager {
  private timeManager: TimeManager;
  // private worldManager: WorldManager; // Will be used later for location-based events
  private playerManager: PlayerManager;
  private factionManager: FactionManager;
  
  private activeEvents: Map<string, GameEvent> = new Map();
  private eventHistory: EventHistory[] = [];
  private eventTriggers: EventTrigger[] = [];
  private eventChains: Map<string, EventChain> = new Map();
  // private eventTemplates: Map<string, GameEvent> = new Map(); // Will be used for loading event templates
  
  private config: EventConfig = {
    globalEventRate: 0.8, // Increased from 0.1 - Events per minute of game time
    maxActiveEvents: 8, // Increased from 5 to allow more concurrent events
    eventCooldowns: {
      'space_encounter': 120, // Reduced from 300 - 2 minutes
      'station_event': 240,   // Reduced from 600 - 4 minutes
      'system_crisis': 900,   // Reduced from 1800 - 15 minutes
      'emergency_contract': 300 // Reduced from 900 - 5 minutes
    },
    difficultyScaling: [
      { playerLevel: 1, threatMultiplier: 0.3, rewardMultiplier: 1.0 },
      { playerLevel: 5, threatMultiplier: 0.6, rewardMultiplier: 1.3 },
      { playerLevel: 10, threatMultiplier: 1.0, rewardMultiplier: 1.8 },
      { playerLevel: 20, threatMultiplier: 1.8, rewardMultiplier: 2.5 },
      { playerLevel: 50, threatMultiplier: 2.5, rewardMultiplier: 4.0 }
    ]
  };
  
  private lastEventCheck: number = 0;
  private eventCounters: Map<EventType, number> = new Map();
  private eventCallbacks: Map<string, (event: GameEvent) => void> = new Map();
  
  constructor(
    timeManager: TimeManager,
    _worldManager: WorldManager, // Will be used later for location-based events
    playerManager: PlayerManager,
    factionManager: FactionManager
  ) {
    this.timeManager = timeManager;
    // this.worldManager = worldManager; // Will be used later for location-based events
    this.playerManager = playerManager;
    this.factionManager = factionManager;
    
    // Initialize event counters
    this.initializeEventCounters();
    
    // Load event templates
    this.loadEventTemplates();
    
    // Set up periodic event checking
    this.lastEventCheck = this.timeManager.getCurrentDate().getTime();
  }
  
  /**
   * Main update loop for the event system.
   * Called every frame to check for new events and update active ones.
   */
  public update(_deltaTime: number): void {
    const currentTime = this.timeManager.getCurrentDate().getTime();
    
    // Check for new events more frequently (every 10 seconds of game time) for better responsiveness
    if (currentTime - this.lastEventCheck >= 10000) { // 10 seconds in milliseconds
      this.checkForNewEvents();
      this.lastEventCheck = currentTime;
    }
    
    // Update active events
    this.updateActiveEvents(currentTime);
    
    // Process event triggers
    this.processEventTriggers(currentTime);
    
    // Update event chains
    this.updateEventChains(currentTime);
  }
  
  /**
   * Check if new events should be triggered based on current game state.
   */
  private checkForNewEvents(): void {
    if (this.activeEvents.size >= this.config.maxActiveEvents) {
      return; // Too many active events
    }
    
    // Calculate event probabilities based on context
    const eventProbabilities = this.calculateEventProbabilities();
    
    // Try to trigger events
    for (const [eventType, probability] of eventProbabilities) {
      if (Math.random() < probability && this.canTriggerEventType(eventType as EventType)) {
        const event = this.generateEvent(eventType as EventType);
        if (event) {
          this.triggerEvent(event);
        }
      }
    }
  }
  
  /**
   * Calculate event probabilities based on current game state.
   */
  private calculateEventProbabilities(): Map<string, number> {
    const probabilities = new Map<string, number>();
    const currentStationId = this.playerManager.getCurrentStation();
    const character = this.playerManager.getCharacter();
    const playerLevel = character ? character.progression.level : 1;
    
    // Enhanced base probability calculation with player level scaling
    const baseProbability = this.config.globalEventRate / 60; // Per second
    const levelMultiplier = 1 + (playerLevel * 0.1); // 10% increase per level
    const adjustedBaseProbability = baseProbability * levelMultiplier;
    
    // Space encounters are more likely when traveling (simplified check)
    const isTraveling = !currentStationId; // If no current station, assume traveling
    if (isTraveling) {
      probabilities.set('space_encounter', adjustedBaseProbability * 3.0); // Increased from 2.0
      // Add variety to space encounters when traveling
      probabilities.set('discovery', adjustedBaseProbability * 1.5);
    } else {
      probabilities.set('space_encounter', adjustedBaseProbability * 0.2); // Reduced when docked
    }
    
    // Station events only when docked, more frequent at higher levels
    if (currentStationId) {
      probabilities.set('station_event', adjustedBaseProbability * 2.5); // Increased from 1.5
      probabilities.set('social_interaction', adjustedBaseProbability * 1.8);
    } else {
      probabilities.set('station_event', 0);
      probabilities.set('social_interaction', 0);
    }
    
    // System crises are rare but scale with player level
    probabilities.set('system_crisis', adjustedBaseProbability * 0.4); // Increased from 0.2
    
    // Emergency contracts more likely in outer systems and for higher level players
    const isOuterSystem = Math.random() > 0.6; // Adjusted probability
    const contractMultiplier = isOuterSystem ? 2.5 : 1.2; // Increased multipliers
    probabilities.set('emergency_contract', adjustedBaseProbability * contractMultiplier);
    
    return probabilities;
  }
  
  /**
   * Check if an event type can be triggered (cooldown check).
   */
  private canTriggerEventType(eventType: EventType): boolean {
    const cooldown = this.config.eventCooldowns[eventType];
    if (!cooldown) return true;
    
    const lastTrigger = this.getLastEventTime(eventType);
    const currentTime = this.timeManager.getCurrentDate().getTime();
    
    return !lastTrigger || (currentTime - lastTrigger) >= (cooldown * 1000); // Convert cooldown to milliseconds
  }
  
  /**
   * Generate a new event of the specified type.
   */
  private generateEvent(eventType: EventType): GameEvent | null {
    switch (eventType) {
      case 'space_encounter':
        return this.generateSpaceEncounter();
      case 'station_event':
        return this.generateStationEvent();
      case 'system_crisis':
        return this.generateSystemCrisis();
      case 'emergency_contract':
        return this.generateEmergencyContract();
      default:
        return null;
    }
  }
  
  /**
   * Generate a space encounter event.
   */
  private generateSpaceEncounter(): SpaceEncounter {
    const encounterTypes = ['pirate', 'merchant', 'derelict', 'patrol', 'distress'] as const;
    const encounterType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
    
    const event: SpaceEncounter = {
      id: this.generateEventId(),
      type: 'space_encounter',
      encounterType,
      title: this.getEncounterTitle(encounterType),
      description: this.getEncounterDescription(encounterType),
      priority: 'normal',
      status: 'pending',
      triggerTime: this.timeManager.getCurrentDate().getTime(),
      baseProbability: 0.1,
      choices: this.getEncounterChoices(encounterType),
      coordinates: { x: Math.random() * 1000, y: Math.random() * 1000 }, // Placeholder coordinates
      threatLevel: this.calculateThreatLevel(),
      shipData: this.generateEncounterShipData(encounterType)
    };
    
    return event;
  }
  
  /**
   * Generate a station event.
   */
  private generateStationEvent(): StationEvent {
    const eventTypes = ['social', 'commercial', 'technical', 'security'] as const;
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const event: StationEvent = {
      id: this.generateEventId(),
      type: 'station_event',
      eventType,
      title: this.getStationEventTitle(eventType),
      description: this.getStationEventDescription(eventType),
      priority: 'normal',
      status: 'pending',
      triggerTime: this.timeManager.getCurrentDate().getTime(),
      baseProbability: 0.05,
      choices: this.getStationEventChoices(eventType),
      locationId: this.playerManager.getCurrentStation()
    };
    
    return event;
  }
  
  /**
   * Generate a system crisis event.
   */
  private generateSystemCrisis(): SystemCrisis {
    const crisisTypes = ['economic', 'political', 'environmental', 'military'] as const;
    const crisisType = crisisTypes[Math.floor(Math.random() * crisisTypes.length)];
    
    const event: SystemCrisis = {
      id: this.generateEventId(),
      type: 'system_crisis',
      crisisType,
      title: this.getCrisisTitle(crisisType),
      description: this.getCrisisDescription(crisisType),
      priority: 'high',
      status: 'pending',
      triggerTime: this.timeManager.getCurrentDate().getTime(),
      baseProbability: 0.02,
      choices: this.getCrisisChoices(crisisType),
      affectedSystems: this.getAffectedSystems(),
      severity: Math.floor(Math.random() * 10) + 1
    };
    
    return event;
  }
  
  /**
   * Generate an emergency contract event.
   */
  private generateEmergencyContract(): EmergencyContract {
    const contractTypes = ['rescue', 'supply', 'evacuation', 'repair'] as const;
    const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
    
    const currentTime = this.timeManager.getCurrentDate().getTime();
    
    const event: EmergencyContract = {
      id: this.generateEventId(),
      type: 'emergency_contract',
      contractType,
      title: this.getContractTitle(contractType),
      description: this.getContractDescription(contractType),
      priority: 'high',
      status: 'pending',
      triggerTime: currentTime,
      expiryTime: currentTime + (1800 * 1000), // 30 minute expiry in milliseconds
      baseProbability: 0.03,
      choices: this.getContractChoices(contractType),
      urgency: Math.floor(Math.random() * 10) + 1,
      baseReward: this.calculateContractReward(),
      timeMultiplier: 2.0
    };
    
    return event;
  }
  
  // Helper methods for event generation
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getLastEventTime(eventType: EventType): number | null {
    const lastEvent = this.eventHistory
      .filter(h => h.eventId.includes(eventType))
      .sort((a, b) => b.triggeredAt - a.triggeredAt)[0];
    
    return lastEvent ? lastEvent.triggeredAt : null;
  }
  
  private calculateThreatLevel(): number {
    const character = this.playerManager.getCharacter();
    const playerLevel = character ? character.progression.level : 1;
    const baseLevel = Math.floor(Math.random() * 5) + 1;
    return Math.max(1, Math.min(10, baseLevel + Math.floor(playerLevel / 10)));
  }
  
  private calculateContractReward(): number {
    const character = this.playerManager.getCharacter();
    const playerLevel = character ? character.progression.level : 1;
    const baseReward = 5000;
    return baseReward * (1 + playerLevel * 0.2) * (0.8 + Math.random() * 0.4);
  }
  
  // Event content methods (enhanced for Phase 5.1)
  private getEncounterTitle(type: string): string {
    const titles = {
      pirate: ['Pirate Ambush', 'Raider Intercept', 'Hostile Blockade', 'Pirate Squadron'][Math.floor(Math.random() * 4)],
      merchant: ['Trading Vessel', 'Merchant Convoy', 'Commercial Freighter', 'Trade Opportunity'][Math.floor(Math.random() * 4)],
      derelict: ['Derelict Discovery', 'Abandoned Hulk', 'Ghost Ship', 'Mysterious Wreckage'][Math.floor(Math.random() * 4)],
      patrol: ['Security Patrol', 'Military Escort', 'Border Guard', 'System Defense'][Math.floor(Math.random() * 4)],
      distress: ['Distress Signal', 'Emergency Beacon', 'Mayday Call', 'Rescue Request'][Math.floor(Math.random() * 4)]
    };
    return titles[type as keyof typeof titles] || 'Unknown Encounter';
  }
  
  private getEncounterDescription(type: string): string {
    const descriptions = {
      pirate: [
        'A heavily armed pirate vessel drops out of hyperspace, weapons hot and demanding tribute.',
        'Multiple raider ships surround your vessel. Their leader hails you with aggressive demands.',
        'A notorious pirate gang has set up a blockade. They\'re scanning all ships for valuable cargo.',
        'Warning klaxons sound as a pirate squadron locks weapons on your ship. They want everything you have.'
      ],
      merchant: [
        'A well-maintained trading vessel approaches with a friendly hail and cargo manifest.',
        'A merchant convoy signals for trade negotiations, offering rare goods from distant systems.',
        'A corporate freighter requests communication, their captain eager to discuss business opportunities.',
        'A traveling merchant broadcasts special deals on high-quality equipment and exotic commodities.'
      ],
      derelict: [
        'Long-range sensors detect a powerless ship drifting in the void. No life signs detected.',
        'An ancient vessel appears on your scanner, its hull scarred by time and unknown battles.',
        'You discover the twisted wreckage of what was once a magnificent starship, now a tomb in space.',
        'A ghost ship materializes from the cosmic dust, its empty corridors hiding untold secrets.'
      ],
      patrol: [
        'A military patrol vessel requests immediate compliance with standard security protocols.',
        'System Defense Forces hail your ship for a routine inspection of cargo and documentation.',
        'An armed patrol cruiser approaches, their captain demanding answers about your presence here.',
        'Border guards intercept your vessel, conducting enhanced security sweeps in this contested region.'
      ],
      distress: [
        'A desperate voice crackles through your communications array, pleading for immediate assistance.',
        'Emergency beacons flood your scanner as a damaged ship fights against system failures.',
        'A ship in distress broadcasts its final mayday call, life support systems failing rapidly.',
        'Survivors aboard a crippled vessel send out a rescue request, hoping someone will hear their plea.'
      ]
    };
    const typeDescriptions = descriptions[type as keyof typeof descriptions];
    return typeDescriptions ? typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)] : 'An unknown event occurs in space.';
  }
  
  private getEncounterChoices(type: string): any[] {
    const character = this.playerManager.getCharacter();
    
    switch (type) {
      case 'pirate':
        return [
          {
            id: 'pay_tribute',
            text: '💰 Pay Tribute',
            description: 'Give them what they want and avoid conflict',
            requirements: { credits: 1000 },
            consequences: { credits: -1500, reputation: { 'Security Forces': 2 } }
          },
          {
            id: 'negotiate',
            text: '🗣️ Negotiate',
            description: 'Try to talk your way out of this situation',
            requirements: { skills: { charisma: 15 } },
            consequences: { credits: -500, experience: 25, reputation: { 'Security Forces': 1 } }
          },
          {
            id: 'fight',
            text: '⚔️ Fight Back',
            description: 'Stand your ground and fight for your freedom',
            consequences: { experience: 50, reputation: { 'Security Forces': 5 } },
            probability: character?.skills.combat ? Math.min(0.8, character.skills.combat / 20) : 0.3
          },
          {
            id: 'flee',
            text: '🚀 Attempt Escape',
            description: 'Try to outrun them with superior piloting',
            consequences: { experience: 15 },
            probability: character?.skills.piloting ? Math.min(0.9, character.skills.piloting / 15) : 0.5
          }
        ];
        
      case 'merchant':
        return [
          {
            id: 'trade',
            text: '🛒 Open Trade',
            description: 'Negotiate fair prices for goods and services',
            consequences: { experience: 10, reputation: { 'Traders Guild': 3 } }
          },
          {
            id: 'info_trade',
            text: '📊 Trade Information',
            description: 'Exchange market intelligence and route data',
            requirements: { skills: { networking: 10 } },
            consequences: { experience: 20, credits: 200 }
          },
          {
            id: 'escort_offer',
            text: '🛡️ Offer Escort',
            description: 'Provide protection in exchange for payment',
            requirements: { skills: { combat: 12 } },
            consequences: { credits: 800, experience: 30, reputation: { 'Traders Guild': 5 } }
          },
          {
            id: 'polite_decline',
            text: '🙏 Politely Decline',
            description: 'Thank them and continue on your way',
            consequences: { reputation: { 'Traders Guild': 1 } }
          }
        ];
        
      case 'derelict':
        return [
          {
            id: 'investigate',
            text: '🔍 Full Investigation',
            description: 'Board the vessel and search thoroughly for salvage',
            consequences: { experience: 40, credits: 2000 },
            probability: 0.7
          },
          {
            id: 'scan_only',
            text: '📡 Scanner Sweep',
            description: 'Use sensors to analyze from a safe distance',
            requirements: { skills: { investigation: 8 } },
            consequences: { experience: 20, credits: 500 }
          },
          {
            id: 'salvage_external',
            text: '🔧 External Salvage',
            description: 'Strip valuable components from the hull',
            requirements: { skills: { engineering: 10 } },
            consequences: { experience: 25, credits: 1200 }
          },
          {
            id: 'report_discovery',
            text: '📢 Report to Authorities',
            description: 'Contact system security about the derelict',
            consequences: { experience: 15, reputation: { 'Security Forces': 8 } }
          }
        ];
        
      case 'patrol':
        return [
          {
            id: 'comply',
            text: '✅ Full Compliance',
            description: 'Submit to inspection and follow all procedures',
            consequences: { reputation: { 'Security Forces': 3 } }
          },
          {
            id: 'negotiate_inspection',
            text: '🤝 Limited Inspection',
            description: 'Negotiate scope of inspection using diplomatic skills',
            requirements: { skills: { negotiation: 12 } },
            consequences: { experience: 20, reputation: { 'Security Forces': 2 } }
          },
          {
            id: 'bribe',
            text: '💸 Discrete Payment',
            description: 'Offer compensation to expedite the process',
            requirements: { credits: 800 },
            consequences: { credits: -800, reputation: { 'Security Forces': -2 } },
            probability: 0.8
          },
          {
            id: 'show_credentials',
            text: '📋 Show Credentials',
            description: 'Present your reputation and trading licenses',
            requirements: { reputation: { 'Security Forces': 20 } },
            consequences: { reputation: { 'Security Forces': 1 } }
          }
        ];
        
      case 'distress':
        return [
          {
            id: 'full_rescue',
            text: '🚑 Full Rescue Mission',
            description: 'Mount a complete rescue operation for all survivors',
            consequences: { credits: -200, experience: 60, reputation: { 'Security Forces': 10, 'Traders Guild': 5 } }
          },
          {
            id: 'emergency_aid',
            text: '⚡ Emergency Assistance',
            description: 'Provide critical supplies and temporary repairs',
            requirements: { skills: { engineering: 8 } },
            consequences: { credits: -100, experience: 35, reputation: { 'Security Forces': 6 } }
          },
          {
            id: 'call_for_help',
            text: '📡 Coordinate Rescue',
            description: 'Contact authorities and coordinate professional rescue',
            requirements: { skills: { networking: 10 } },
            consequences: { experience: 25, reputation: { 'Security Forces': 8 } }
          },
          {
            id: 'ignore_distress',
            text: '❌ Ignore Signal',
            description: 'Continue on your mission without getting involved',
            consequences: { reputation: { 'Security Forces': -5, 'Traders Guild': -2 } }
          }
        ];
        
      default:
        return [
          {
            id: 'engage',
            text: 'Engage',
            description: 'Take action with this encounter'
          },
          {
            id: 'avoid',
            text: 'Avoid', 
            description: 'Try to avoid this encounter'
          }
        ];
    }
  }
  
  private getStationEventTitle(type: string): string {
    const titles = {
      social: ['Cantina Gathering', 'Cultural Festival', 'Traders\' Social Hour', 'Diplomatic Reception'][Math.floor(Math.random() * 4)],
      commercial: ['Business Partnership', 'Investment Opportunity', 'Market Speculation', 'Corporate Deal'][Math.floor(Math.random() * 4)],
      technical: ['Equipment Malfunction', 'System Upgrade', 'Technical Challenge', 'Engineering Crisis'][Math.floor(Math.random() * 4)],
      security: ['Security Alert', 'Suspicious Activity', 'Investigation Request', 'Safety Protocol'][Math.floor(Math.random() * 4)]
    };
    return titles[type as keyof typeof titles] || 'Station Event';
  }
  
  private getStationEventDescription(type: string): string {
    const descriptions = {
      social: [
        'A lively gathering in the station cantina offers opportunities to meet influential contacts.',
        'The station is celebrating a cultural festival with traders from across the sector.',
        'An exclusive social event brings together the most successful merchants and pilots.',
        'A diplomatic reception provides a chance to network with faction representatives.'
      ],
      commercial: [
        'A prominent trader approaches with a lucrative business partnership proposal.',
        'Market speculation creates a unique opportunity for significant profit.',
        'A corporate executive offers exclusive access to rare trading contracts.',
        'An investment opportunity promises substantial returns for the right entrepreneur.'
      ],
      technical: [
        'Station maintenance crew requests assistance with a complex technical problem.',
        'A system malfunction threatens station operations and needs immediate attention.',
        'An engineering challenge offers a chance to demonstrate your technical expertise.',
        'Critical station systems require emergency repairs using specialized knowledge.'
      ],
      security: [
        'Station security reports suspicious activity that requires investigation.',
        'A security alert has the entire station on high alert for potential threats.',
        'Authorities request assistance with a sensitive investigation.',
        'New safety protocols create complications for all docked vessels.'
      ]
    };
    const typeDescriptions = descriptions[type as keyof typeof descriptions];
    return typeDescriptions ? typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)] : 'Something is happening at the station.';
  }
  
  private getStationEventChoices(type: string): any[] {
    
    switch (type) {
      case 'social':
        return [
          {
            id: 'network_actively',
            text: '🤝 Network Actively',
            description: 'Engage with everyone and build valuable connections',
            requirements: { skills: { charisma: 12 } },
            consequences: { experience: 30, reputation: { 'Traders Guild': 5 }, credits: 300 }
          },
          {
            id: 'observe_quietly',
            text: '👁️ Observe Quietly',
            description: 'Listen carefully and gather valuable information',
            requirements: { skills: { investigation: 8 } },
            consequences: { experience: 20, credits: 200 }
          },
          {
            id: 'make_deals',
            text: '💼 Make Deals',
            description: 'Focus on immediate business opportunities',
            requirements: { skills: { negotiation: 10 } },
            consequences: { experience: 25, credits: 500 }
          },
          {
            id: 'polite_participation',
            text: '😊 Polite Participation',
            description: 'Participate respectfully without drawing attention',
            consequences: { experience: 15, reputation: { 'Traders Guild': 2 } }
          }
        ];
        
      case 'commercial':
        return [
          {
            id: 'invest_heavily',
            text: '💰 Major Investment',
            description: 'Commit significant resources for maximum returns',
            requirements: { credits: 5000 },
            consequences: { credits: -5000, experience: 40 },
            probability: 0.75
          },
          {
            id: 'negotiate_terms',
            text: '📋 Negotiate Terms',
            description: 'Use your business skills to improve the deal',
            requirements: { skills: { negotiation: 15 } },
            consequences: { credits: 1500, experience: 35, reputation: { 'Traders Guild': 4 } }
          },
          {
            id: 'small_investment',
            text: '🪙 Small Investment',
            description: 'Make a conservative investment to test the waters',
            requirements: { credits: 1000 },
            consequences: { credits: -1000, experience: 20 },
            probability: 0.85
          },
          {
            id: 'decline_offer',
            text: '❌ Decline Respectfully',
            description: 'Thank them but pass on this opportunity',
            consequences: { experience: 5, reputation: { 'Traders Guild': 1 } }
          }
        ];
        
      case 'technical':
        return [
          {
            id: 'lead_solution',
            text: '🔧 Lead Solution',
            description: 'Take charge and solve the technical problem yourself',
            requirements: { skills: { engineering: 18 } },
            consequences: { credits: 1200, experience: 45, reputation: { 'Industrial Consortium': 8 } }
          },
          {
            id: 'assist_engineers',
            text: '🛠️ Assist Engineers',
            description: 'Work alongside the technical team to help solve the issue',
            requirements: { skills: { engineering: 10 } },
            consequences: { credits: 600, experience: 30, reputation: { 'Industrial Consortium': 5 } }
          },
          {
            id: 'provide_expertise',
            text: '🧠 Provide Expertise',
            description: 'Offer technical knowledge and consultation',
            requirements: { skills: { engineering: 6 } },
            consequences: { credits: 300, experience: 20, reputation: { 'Industrial Consortium': 3 } }
          },
          {
            id: 'stay_uninvolved',
            text: '🚪 Stay Uninvolved',
            description: 'Remain in your ship and avoid the technical issues',
            consequences: { reputation: { 'Industrial Consortium': -1 } }
          }
        ];
        
      case 'security':
        return [
          {
            id: 'full_cooperation',
            text: '🔍 Full Cooperation',
            description: 'Provide complete assistance to security forces',
            consequences: { experience: 25, reputation: { 'Security Forces': 8 } }
          },
          {
            id: 'limited_help',
            text: '🤏 Limited Assistance',
            description: 'Help within reason while protecting your interests',
            requirements: { skills: { negotiation: 12 } },
            consequences: { experience: 20, reputation: { 'Security Forces': 4 } }
          },
          {
            id: 'investigate_independently',
            text: '🕵️ Independent Investigation',
            description: 'Conduct your own investigation using your skills',
            requirements: { skills: { investigation: 15 } },
            consequences: { credits: 800, experience: 35, reputation: { 'Security Forces': 6 } }
          },
          {
            id: 'minimal_compliance',
            text: '📋 Minimal Compliance',
            description: 'Follow procedures but avoid getting deeply involved',
            consequences: { experience: 10, reputation: { 'Security Forces': 1 } }
          }
        ];
        
      default:
        return [
          {
            id: 'participate',
            text: 'Participate',
            description: 'Get involved in this event'
          },
          {
            id: 'ignore',
            text: 'Ignore',
            description: 'Continue with your business'
          }
        ];
    }
  }
  
  private getCrisisTitle(type: string): string {
    const titles = {
      economic: 'Economic Crisis',
      political: 'Political Upheaval',
      environmental: 'Environmental Emergency',
      military: 'Military Conflict'
    };
    return titles[type as keyof typeof titles] || 'System Crisis';
  }
  
  private getCrisisDescription(type: string): string {
    const descriptions = {
      economic: 'A major economic crisis is affecting the system.',
      political: 'Political tensions are escalating in the system.',
      environmental: 'An environmental disaster threatens the system.',
      military: 'Military conflict has broken out in the system.'
    };
    return descriptions[type as keyof typeof descriptions] || 'A crisis is affecting the system.';
  }
  
  private getCrisisChoices(_type: string): any[] {
    return [
      {
        id: 'help',
        text: 'Offer Help',
        description: 'Assist with the crisis'
      },
      {
        id: 'profit',
        text: 'Seek Profit',
        description: 'Look for opportunities'
      },
      {
        id: 'leave',
        text: 'Leave System',
        description: 'Avoid the crisis'
      }
    ];
  }
  
  private getContractTitle(type: string): string {
    const titles = {
      rescue: 'Emergency Rescue',
      supply: 'Emergency Supply Run',
      evacuation: 'Emergency Evacuation',
      repair: 'Emergency Repairs'
    };
    return titles[type as keyof typeof titles] || 'Emergency Contract';
  }
  
  private getContractDescription(type: string): string {
    const descriptions = {
      rescue: 'Urgent rescue mission needs immediate response.',
      supply: 'Critical supplies needed urgently.',
      evacuation: 'Emergency evacuation required.',
      repair: 'Emergency repairs needed immediately.'
    };
    return descriptions[type as keyof typeof descriptions] || 'An emergency situation requires attention.';
  }
  
  private getContractChoices(_type: string): any[] {
    return [
      {
        id: 'accept',
        text: 'Accept Contract',
        description: 'Take on this emergency mission'
      },
      {
        id: 'decline',
        text: 'Decline',
        description: 'Pass on this opportunity'
      }
    ];
  }
  
  private generateEncounterShipData(_type: string): any {
    // Simplified ship data generation
    return {
      class: 'Fighter',
      condition: Math.random(),
      credits: Math.floor(Math.random() * 10000)
    };
  }
  
  private getAffectedSystems(): string[] {
    const currentStationId = this.playerManager.getCurrentStation();
    // For now, just return a placeholder system ID
    return currentStationId ? [currentStationId] : ['current_system'];
  }
  
  // Event lifecycle methods
  private triggerEvent(event: GameEvent): void {
    this.activeEvents.set(event.id, event);
    this.eventCounters.set(event.type, (this.eventCounters.get(event.type) || 0) + 1);
    
    // Add to history
    this.eventHistory.push({
      eventId: event.id,
      triggeredAt: event.triggerTime,
      choicesMade: [],
      outcome: null,
      playerLevel: this.playerManager.getCharacter()?.progression.level || 1,
      locationId: event.locationId
    });
    
    // Notify listeners
    const callback = this.eventCallbacks.get('event_triggered');
    if (callback) {
      callback(event);
    }
  }
  
  private updateActiveEvents(currentTime: number): void {
    for (const [eventId, event] of this.activeEvents) {
      // Check for expiry
      if (event.expiryTime && currentTime >= event.expiryTime) {
        event.status = 'expired';
        this.completeEvent(eventId, null);
      }
    }
  }
  
  private processEventTriggers(currentTime: number): void {
    // Process any pending event triggers
    this.eventTriggers
      .filter(trigger => trigger.isActive && !trigger.lastCheck || currentTime - trigger.lastCheck! >= 60)
      .forEach(trigger => {
        trigger.lastCheck = currentTime;
        // Check trigger conditions and potentially create events
      });
  }
  
  private updateEventChains(_currentTime: number): void {
    // Update active event chains
    for (const [_chainId, chain] of this.eventChains) {
      if (chain.isActive && chain.currentEventIndex < chain.events.length) {
        // Check if current event in chain is completed
        const currentEventId = chain.events[chain.currentEventIndex];
        const event = this.activeEvents.get(currentEventId);
        
        if (event && event.status === 'completed') {
          chain.currentEventIndex++;
          
          if (chain.currentEventIndex >= chain.events.length) {
            // Chain completed
            chain.isActive = false;
          }
        }
      }
    }
  }
  
  // Public API methods
  public makeEventChoice(eventId: string, choiceId: string): boolean {
    const event = this.activeEvents.get(eventId);
    if (!event) return false;
    
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return false;
    
    // Check requirements
    if (!this.checkChoiceRequirements(choice)) {
      return false;
    }
    
    // Apply consequences
    this.applyChoiceConsequences(choice);
    
    // Update event
    event.selectedChoice = choiceId;
    event.status = 'completed';
    
    // Complete the event
    this.completeEvent(eventId, choice);
    
    return true;
  }
  
  private checkChoiceRequirements(choice: any): boolean {
    if (!choice.requirements) return true;
    
    const player = this.playerManager.getPlayer();
    const character = this.playerManager.getCharacter();
    
    // Check credits requirement
    if (choice.requirements.credits && player.credits < choice.requirements.credits) {
      return false;
    }
    
    // Check skill requirements
    if (choice.requirements.skills && character) {
      for (const [skillName, requiredLevel] of Object.entries(choice.requirements.skills)) {
        const playerSkillLevel = character.skills[skillName as keyof typeof character.skills] || 0;
        if (playerSkillLevel < (requiredLevel as number)) {
          return false;
        }
      }
    }
    
    // Check reputation requirements
    if (choice.requirements.reputation) {
      // Simplified reputation check - would integrate with faction system
      for (const [, requiredRep] of Object.entries(choice.requirements.reputation)) {
        const currentRep = 0; // Placeholder - would get from faction manager
        if (currentRep < (requiredRep as number)) {
          return false;
        }
      }
    }
    
    // Check cargo requirements
    if (choice.requirements.cargo && character) {
      for (const [, requiredAmount] of Object.entries(choice.requirements.cargo)) {
        // Simplified cargo check - would integrate with inventory system
        const currentAmount = 0; // Placeholder - would get from player inventory
        if (currentAmount < (requiredAmount as number)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  private applyChoiceConsequences(choice: any): void {
    if (!choice.consequences) return;
    
    const character = this.playerManager.getCharacter();
    
    // Apply credit changes
    if (choice.consequences.credits) {
      this.playerManager.addCredits(choice.consequences.credits);
    }
    
    // Apply experience gain
    if (choice.consequences.experience && character) {
      const characterManager = this.playerManager.getCharacterManager();
      if (characterManager) {
        characterManager.awardExperience(choice.consequences.experience, 'Event choice', 'social');
      }
    }
    
    // Apply reputation changes
    if (choice.consequences.reputation) {
      const playerReputation = this.playerManager.getPlayerReputation();
      for (const [factionId, change] of Object.entries(choice.consequences.reputation)) {
        this.factionManager.modifyReputation(
          playerReputation,
          factionId,
          change as number,
          'Event choice'
        );
      }
    }
    
    // Apply cargo changes
    if (choice.consequences.cargo) {
      for (const [commodityId, amount] of Object.entries(choice.consequences.cargo)) {
        if ((amount as number) > 0) {
          // Add cargo - simplified implementation
          console.log(`Added ${amount} units of ${commodityId} to cargo`);
        } else {
          // Remove cargo - simplified implementation
          console.log(`Removed ${Math.abs(amount as number)} units of ${commodityId} from cargo`);
        }
      }
    }
    
    // Apply item rewards
    if (choice.consequences.items) {
      for (const itemId of choice.consequences.items) {
        // Add items to player inventory or equipment
        console.log(`Awarded item: ${itemId}`);
      }
    }
  }
  
  private completeEvent(eventId: string, choice: any): void {
    const event = this.activeEvents.get(eventId);
    if (!event) return;
    
    // Update history
    const historyEntry = this.eventHistory.find(h => h.eventId === eventId);
    if (historyEntry) {
      historyEntry.completedAt = this.timeManager.getCurrentDate().getTime();
      if (choice) {
        historyEntry.choicesMade.push(choice.id);
      }
      historyEntry.outcome = event.outcome;
    }
    
    // Remove from active events
    this.activeEvents.delete(eventId);
    
    // Notify completion
    const callback = this.eventCallbacks.get('event_completed');
    if (callback) {
      callback(event);
    }
  }
  
  // Event system initialization
  private initializeEventCounters(): void {
    const eventTypes: EventType[] = [
      'space_encounter', 'station_event', 'system_crisis', 
      'emergency_contract', 'social_interaction', 'discovery'
    ];
    
    for (const type of eventTypes) {
      this.eventCounters.set(type, 0);
    }
  }
  
  private loadEventTemplates(): void {
    // Would load event templates from data files
    // For now, templates are generated procedurally
  }
  
  // Public getters
  public getActiveEvents(): GameEvent[] {
    return Array.from(this.activeEvents.values());
  }
  
  public getEventHistory(): EventHistory[] {
    return [...this.eventHistory];
  }
  
  public getEventStats(): { [type: string]: number } {
    const stats: { [type: string]: number } = {};
    for (const [type, count] of this.eventCounters) {
      stats[type] = count;
    }
    return stats;
  }
  
  // Event callback registration
  public onEventTriggered(callback: (event: GameEvent) => void): void {
    this.eventCallbacks.set('event_triggered', callback);
  }
  
  public onEventCompleted(callback: (event: GameEvent) => void): void {
    this.eventCallbacks.set('event_completed', callback);
  }
  
  // Save/load support
  public getState(): EventSystemState {
    return {
      activeEvents: Array.from(this.activeEvents.values()),
      eventHistory: this.eventHistory,
      eventTriggers: this.eventTriggers,
      eventChains: Array.from(this.eventChains.values()),
      config: this.config,
      lastEventCheck: this.lastEventCheck,
      eventCounters: Object.fromEntries(this.eventCounters)
    };
  }
  
  public loadState(state: EventSystemState): void {
    // Load active events
    this.activeEvents.clear();
    for (const event of state.activeEvents) {
      this.activeEvents.set(event.id, event);
    }
    
    // Load other state
    this.eventHistory = state.eventHistory;
    this.eventTriggers = state.eventTriggers;
    this.eventChains.clear();
    for (const chain of state.eventChains) {
      this.eventChains.set(chain.id, chain);
    }
    
    this.config = state.config;
    this.lastEventCheck = state.lastEventCheck;
    this.eventCounters = new Map(Object.entries(state.eventCounters) as [EventType, number][]);
  }
}