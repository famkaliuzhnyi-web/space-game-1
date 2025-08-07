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
    globalEventRate: 0.1, // Events per minute of game time
    maxActiveEvents: 5,
    eventCooldowns: {
      'space_encounter': 300, // 5 minutes
      'station_event': 600,   // 10 minutes
      'system_crisis': 1800,  // 30 minutes
      'emergency_contract': 900 // 15 minutes
    },
    difficultyScaling: [
      { playerLevel: 1, threatMultiplier: 0.5, rewardMultiplier: 1.0 },
      { playerLevel: 5, threatMultiplier: 0.8, rewardMultiplier: 1.2 },
      { playerLevel: 10, threatMultiplier: 1.0, rewardMultiplier: 1.5 },
      { playerLevel: 20, threatMultiplier: 1.5, rewardMultiplier: 2.0 },
      { playerLevel: 50, threatMultiplier: 2.0, rewardMultiplier: 3.0 }
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
    
    // Check for new events periodically (every 30 seconds of game time)
    if (currentTime - this.lastEventCheck >= 30000) { // 30 seconds in milliseconds
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
    
    // Base probabilities adjusted by context
    const baseProbability = this.config.globalEventRate / 60; // Per second
    
    // Space encounters are more likely when traveling (simplified check)
    const isTraveling = !currentStationId; // If no current station, assume traveling
    if (isTraveling) {
      probabilities.set('space_encounter', baseProbability * 2.0);
    } else {
      probabilities.set('space_encounter', baseProbability * 0.1);
    }
    
    // Station events only when docked
    if (currentStationId) {
      probabilities.set('station_event', baseProbability * 1.5);
    } else {
      probabilities.set('station_event', 0);
    }
    
    // System crises are rare but can happen anywhere
    probabilities.set('system_crisis', baseProbability * 0.2);
    
    // Emergency contracts more likely in outer systems (simplified)
    const isOuterSystem = Math.random() > 0.7; // Placeholder logic
    probabilities.set('emergency_contract', baseProbability * (isOuterSystem ? 1.5 : 0.8));
    
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
  
  // Event content methods (to be expanded)
  private getEncounterTitle(type: string): string {
    const titles = {
      pirate: 'Pirate Intercept',
      merchant: 'Merchant Encounter', 
      derelict: 'Derelict Discovery',
      patrol: 'Security Patrol',
      distress: 'Distress Signal'
    };
    return titles[type as keyof typeof titles] || 'Unknown Encounter';
  }
  
  private getEncounterDescription(type: string): string {
    const descriptions = {
      pirate: 'A hostile vessel has intercepted your ship. They demand tribute.',
      merchant: 'A friendly merchant vessel hails you with trade opportunities.',
      derelict: 'You discover an abandoned ship drifting in space.',
      patrol: 'A security patrol requests to inspect your ship.',
      distress: 'You receive a distress signal from a nearby ship.'
    };
    return descriptions[type as keyof typeof descriptions] || 'An unknown event occurs.';
  }
  
  private getEncounterChoices(_type: string): any[] {
    // Simplified choices for now - will be expanded
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
  
  private getStationEventTitle(type: string): string {
    const titles = {
      social: 'Social Gathering',
      commercial: 'Business Opportunity',
      technical: 'Technical Issue',
      security: 'Security Incident'
    };
    return titles[type as keyof typeof titles] || 'Station Event';
  }
  
  private getStationEventDescription(type: string): string {
    const descriptions = {
      social: 'There\'s a social event happening at the station.',
      commercial: 'A business opportunity has presented itself.',
      technical: 'Technical difficulties require attention.',
      security: 'A security situation needs handling.'
    };
    return descriptions[type as keyof typeof descriptions] || 'Something is happening at the station.';
  }
  
  private getStationEventChoices(_type: string): any[] {
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
    
    // Check credits
    if (choice.requirements.credits && player.credits < choice.requirements.credits) {
      return false;
    }
    
    // Check reputation (simplified)
    if (choice.requirements.reputation) {
      // Would check with faction manager
    }
    
    return true;
  }
  
  private applyChoiceConsequences(choice: any): void {
    if (!choice.consequences) return;
    
    // Apply credit changes
    if (choice.consequences.credits) {
      this.playerManager.addCredits(choice.consequences.credits);
    }
    
    // Apply experience
    if (choice.consequences.experience) {
      // Would apply experience through character system
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