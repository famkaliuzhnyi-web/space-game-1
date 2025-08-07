import { 
  NPCShip, 
  NPCAIData, 
  NPCGoal, 
  NPCPersonality,
  NPCConversation,
  ConversationNode,
  NPCMarketBehavior,
  NPCFleet 
} from '../types/npc';
import { TimeManager } from './TimeManager';
import { WorldManager } from './WorldManager';
import { PlayerManager } from './PlayerManager';
import { Station, StarSystem } from '../types/world';

/**
 * NPCAIManager handles all NPC ship behavior, AI decision-making, and interactions.
 * 
 * Responsibilities:
 * - Managing NPC ship spawning, movement, and lifecycle
 * - AI decision-making for trading, patrolling, and combat behavior  
 * - NPC conversation and interaction systems
 * - AI-driven market participation and economic impact
 * - Fleet coordination and group behaviors
 * - Integration with faction reputation and event systems
 * 
 * Features:
 * - Personality-driven AI behavior patterns
 * - Dynamic goal setting and priority management
 * - Realistic trading AI with profit optimization
 * - Combat AI for pirates and security forces
 * - Complex conversation trees with skill/reputation requirements
 * - Market manipulation through AI trading behavior
 */
export class NPCAIManager {
  private timeManager: TimeManager;
  private worldManager: WorldManager;
  private playerManager: PlayerManager;
  // These will be used in future updates
  // private factionManager: FactionManager;
  // private economicSystem: EconomicSystem;
  
  private npcShips: Map<string, NPCShip> = new Map();
  private activeConversations: Map<string, NPCConversation> = new Map();
  private marketBehaviors: Map<string, NPCMarketBehavior> = new Map();
  private npcFleets: Map<string, NPCFleet> = new Map();
  
  // AI configuration
  private readonly AI_UPDATE_INTERVAL = 5000; // 5 seconds between AI decisions
  private readonly MAX_NPCS_PER_SYSTEM = 8; // Limit for performance
  private readonly NPC_SPAWN_PROBABILITY = 0.1; // 10% chance per update cycle
  private readonly MARKET_PARTICIPATION_FREQUENCY = 300000; // 5 minutes
  
  // Personality templates for different NPC types
  private personalityTemplates: Map<string, NPCPersonality> = new Map();
  
  private lastUpdateTime = 0;
  private lastSpawnTime = 0;
  private lastMarketUpdateTime = 0;

  constructor(
    timeManager: TimeManager,
    worldManager: WorldManager,
    playerManager: PlayerManager
  ) {
    this.timeManager = timeManager;
    this.worldManager = worldManager;
    this.playerManager = playerManager;
    
    this.initializePersonalityTemplates();
    this.initializeStartingNPCs();
  }

  /**
   * Initialize personality templates for different NPC types
   */
  private initializePersonalityTemplates(): void {
    this.personalityTemplates.set('trader', {
      type: 'cautious',
      traits: [
        {
          id: 'risk-averse',
          name: 'Risk Averse',
          description: 'Prefers safe, profitable routes',
          effects: { riskTolerance: -20, tradingBonus: 10 }
        }
      ]
    });

    this.personalityTemplates.set('pirate', {
      type: 'aggressive',
      traits: [
        {
          id: 'opportunistic',
          name: 'Opportunistic',
          description: 'Attacks weak targets, avoids strong ones',
          effects: { aggression: 30, riskTolerance: 40 }
        }
      ]
    });

    this.personalityTemplates.set('patrol', {
      type: 'diplomatic',
      traits: [
        {
          id: 'law-enforcer',
          name: 'Law Enforcer',
          description: 'Maintains order and security',
          effects: { aggression: -10, reputationSensitivity: 50 }
        }
      ]
    });

    this.personalityTemplates.set('civilian', {
      type: 'friendly',
      traits: [
        {
          id: 'peaceful',
          name: 'Peaceful',
          description: 'Avoids conflict, helpful to others',
          effects: { aggression: -30, riskTolerance: -10 }
        }
      ]
    });
  }

  /**
   * Initialize starting NPC population
   */
  private initializeStartingNPCs(): void {
    const galaxy = this.worldManager.getGalaxy();
    
    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        // Add 2-4 NPCs per system initially
        const npcCount = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < npcCount; i++) {
          this.spawnNPCInSystem(system, this.getRandomNPCType());
        }
      }
    }
  }

  /**
   * Get random NPC type based on system characteristics
   */
  private getRandomNPCType(): string {
    const types = ['trader', 'civilian', 'patrol', 'pirate', 'transport'];
    const weights = [0.4, 0.3, 0.15, 0.1, 0.05]; // Weighted distribution
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return types[i];
      }
    }
    
    return 'civilian'; // Fallback
  }

  /**
   * Spawn an NPC ship in the specified system
   */
  private spawnNPCInSystem(system: StarSystem, npcType: string): NPCShip | null {
    // Check if system is at capacity
    const systemNPCs = Array.from(this.npcShips.values())
      .filter(npc => npc.position.systemId === system.id);
    
    if (systemNPCs.length >= this.MAX_NPCS_PER_SYSTEM) {
      return null;
    }

    // Choose random station in system for spawning
    if (system.stations.length === 0) {
      return null;
    }

    const spawnStation = system.stations[Math.floor(Math.random() * system.stations.length)];
    const npcId = `npc_${npcType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const npc: NPCShip = {
      id: npcId,
      name: this.generateNPCName(npcType),
      type: npcType as any,
      position: {
        systemId: system.id,
        stationId: spawnStation.id,
        coordinates: { ...spawnStation.position }
      },
      movement: {
        speed: this.getBaseSpeed(npcType),
        currentVelocity: { x: 0, y: 0 },
        lastMoveTime: this.timeManager.getCurrentTimestamp()
      },
      ai: this.createAIData(npcType),
      ship: this.createShipData(npcType),
      faction: this.getFactionForNPCType(npcType, spawnStation),
      reputation: this.getInitialReputation(),
      credits: this.getInitialCredits(npcType),
      lastActionTime: this.timeManager.getCurrentTimestamp()
    };

    this.npcShips.set(npcId, npc);
    
    // Initialize market behavior for traders
    if (npcType === 'trader') {
      this.initializeMarketBehavior(npc, system);
    }

    return npc;
  }

  /**
   * Generate appropriate name for NPC type
   */
  private generateNPCName(npcType: string): string {
    const prefixes = {
      trader: ['Merchant', 'Trader', 'Commerce'],
      pirate: ['Raider', 'Corsair', 'Outlaw'],
      patrol: ['Security', 'Guard', 'Patrol'],
      civilian: ['Freelancer', 'Independent', 'Wanderer'],
      transport: ['Transport', 'Cargo', 'Freight']
    };

    const suffixes = ['Alpha', 'Beta', 'Prime', 'One', 'Two', 'Seven', 'Nine', 'X', 'Z'];
    
    const prefix = prefixes[npcType as keyof typeof prefixes] || prefixes.civilian;
    const selectedPrefix = prefix[Math.floor(Math.random() * prefix.length)];
    const selectedSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${selectedPrefix} ${selectedSuffix}`;
  }

  /**
   * Get base movement speed for NPC type
   */
  private getBaseSpeed(npcType: string): number {
    const speeds = {
      trader: 25,
      pirate: 40,
      patrol: 35,
      civilian: 20,
      transport: 15
    };
    
    return speeds[npcType as keyof typeof speeds] || 20;
  }

  /**
   * Create AI data for NPC
   */
  private createAIData(npcType: string): NPCAIData {
    const personality = this.personalityTemplates.get(npcType) || this.personalityTemplates.get('civilian')!;
    
    return {
      personality,
      currentGoal: this.generateInitialGoal(npcType),
      goalHistory: [],
      decisionCooldown: 0,
      riskTolerance: Math.floor(Math.random() * 50) + 25, // 25-75
      aggressiveness: Math.floor(Math.random() * 50) + (npcType === 'pirate' ? 40 : 10),
      tradingSkill: Math.floor(Math.random() * 50) + (npcType === 'trader' ? 40 : 25),
      lastInteraction: null
    };
  }

  /**
   * Generate initial goal for NPC based on type
   */
  private generateInitialGoal(npcType: string): NPCGoal {
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const currentTime = this.timeManager.getCurrentTimestamp();
    
    switch (npcType) {
      case 'trader':
        return {
          id: goalId,
          type: 'trade',
          priority: 7,
          startTime: currentTime,
          parameters: new Map([['commodity', 'electronics']])
        };
        
      case 'pirate':
        return {
          id: goalId,
          type: 'pirate',
          priority: 8,
          startTime: currentTime,
          parameters: new Map([['huntType', 'trader']])
        };
        
      case 'patrol':
        return {
          id: goalId,
          type: 'patrol',
          priority: 6,
          startTime: currentTime,
          parameters: new Map([['patrolRadius', '500']])
        };
        
      default:
        return {
          id: goalId,
          type: 'idle',
          priority: 1,
          startTime: currentTime,
          parameters: new Map()
        };
    }
  }

  /**
   * Create ship data for NPC
   */
  private createShipData(npcType: string) {
    const baseData = {
      trader: { class: 'transport', cargo: 200, fuel: 100, condition: 85 },
      pirate: { class: 'courier', cargo: 50, fuel: 80, condition: 70 },
      patrol: { class: 'combat', cargo: 30, fuel: 120, condition: 95 },
      civilian: { class: 'courier', cargo: 80, fuel: 90, condition: 80 },
      transport: { class: 'heavy-freight', cargo: 500, fuel: 150, condition: 90 }
    };

    const data = baseData[npcType as keyof typeof baseData] || baseData.civilian;
    
    return {
      class: data.class,
      cargoCapacity: data.cargo,
      currentCargo: new Map<string, number>(),
      condition: data.condition,
      fuel: data.fuel,
      fuelCapacity: data.fuel
    };
  }

  /**
   * Get appropriate faction for NPC type and location
   */
  private getFactionForNPCType(npcType: string, station: Station): string {
    switch (npcType) {
      case 'patrol':
        return station.faction; // Patrols belong to station's faction
      case 'pirate':
        return 'Pirates'; // Generic pirate faction
      default:
        // Traders and civilians can be from various factions
        const factions = ['Traders Guild', 'Independent', station.faction];
        return factions[Math.floor(Math.random() * factions.length)];
    }
  }

  /**
   * Get initial reputation with player
   */
  private getInitialReputation(): number {
    return Math.floor(Math.random() * 21) - 10; // -10 to +10
  }

  /**
   * Get initial credits for NPC type
   */
  private getInitialCredits(npcType: string): number {
    const creditRanges = {
      trader: [10000, 50000],
      pirate: [1000, 10000],
      patrol: [5000, 15000],
      civilian: [2000, 8000],
      transport: [15000, 30000]
    };

    const range = creditRanges[npcType as keyof typeof creditRanges] || creditRanges.civilian;
    return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
  }

  /**
   * Initialize market behavior for trader NPCs
   */
  private initializeMarketBehavior(npc: NPCShip, system: StarSystem): void {
    if (npc.type !== 'trader' || system.stations.length === 0) return;

    const station = system.stations[0]; // Use first station for now
    
    const marketBehavior: NPCMarketBehavior = {
      npcId: npc.id,
      systemId: system.id,
      stationId: station.id,
      commodityPreferences: new Map([
        ['electronics', 80],
        ['medical_supplies', 70],
        ['luxury_goods', 85],
        ['machinery', 60]
      ]),
      buyingBehavior: {
        priceThreshold: 1.2, // Won't buy above 120% of base price
        quantityLimits: new Map([
          ['electronics', 50],
          ['medical_supplies', 30],
          ['luxury_goods', 20]
        ]),
        frequency: 600000 // 10 minutes
      },
      sellingBehavior: {
        priceThreshold: 0.9, // Won't sell below 90% of base price
        stockLimits: new Map([
          ['electronics', 100],
          ['medical_supplies', 80]
        ]),
        frequency: 900000 // 15 minutes
      },
      lastTradeTime: this.timeManager.getCurrentTimestamp(),
      currentOrders: []
    };

    this.marketBehaviors.set(`${npc.id}_${station.id}`, marketBehavior);
  }

  /**
   * Main update loop for all NPC AI
   */
  update(deltaTime: number): void {
    const currentTime = this.timeManager.getCurrentTimestamp();
    
    // Update AI decisions periodically
    if (currentTime - this.lastUpdateTime >= this.AI_UPDATE_INTERVAL) {
      this.updateNPCAI();
      this.lastUpdateTime = currentTime;
    }
    
    // Spawn new NPCs occasionally
    if (currentTime - this.lastSpawnTime >= 60000) { // Every minute
      this.maybeSpawnNewNPCs();
      this.lastSpawnTime = currentTime;
    }
    
    // Update market behaviors
    if (currentTime - this.lastMarketUpdateTime >= this.MARKET_PARTICIPATION_FREQUENCY) {
      this.updateMarketBehaviors();
      this.lastMarketUpdateTime = currentTime;
    }
    
    // Update NPC movement and positions
    this.updateNPCMovement(deltaTime);
  }

  /**
   * Update AI decision-making for all NPCs
   */
  private updateNPCAI(): void {
    const currentTime = this.timeManager.getCurrentTimestamp();
    
    for (const npc of this.npcShips.values()) {
      // Skip if NPC is on cooldown
      if (currentTime < npc.ai.decisionCooldown) continue;
      
      // Make AI decision based on current goal and situation
      this.makeAIDecision(npc);
      
      // Set next decision cooldown
      npc.ai.decisionCooldown = currentTime + (Math.random() * 10000) + 15000; // 15-25 seconds
    }
  }

  /**
   * Make AI decision for specific NPC
   */
  private makeAIDecision(npc: NPCShip): void {
    const currentGoal = npc.ai.currentGoal;
    
    switch (currentGoal.type) {
      case 'trade':
        this.processTradeGoal(npc);
        break;
      case 'patrol':
        this.processPatrolGoal(npc);
        break;
      case 'pirate':
        this.processPirateGoal(npc);
        break;
      case 'idle':
        this.processIdleGoal(npc);
        break;
    }
  }

  /**
   * Process trading AI goal
   */
  private processTradeGoal(npc: NPCShip): void {
    // For now, simple behavior: occasionally change target commodity
    if (Math.random() < 0.3) {
      const commodities = ['electronics', 'medical_supplies', 'luxury_goods', 'machinery'];
      const newCommodity = commodities[Math.floor(Math.random() * commodities.length)];
      npc.ai.currentGoal.parameters.set('commodity', newCommodity);
    }
  }

  /**
   * Process patrol AI goal
   */
  private processPatrolGoal(npc: NPCShip): void {
    // Patrol NPCs move between stations in their system
    const galaxy = this.worldManager.getGalaxy();
    const system = this.findSystemById(galaxy, npc.position.systemId);
    
    if (system && system.stations.length > 1) {
      // Choose a different station to patrol to
      const currentStation = npc.position.stationId;
      const availableStations = system.stations.filter(s => s.id !== currentStation);
      
      if (availableStations.length > 0) {
        const targetStation = availableStations[Math.floor(Math.random() * availableStations.length)];
        npc.movement.targetStationId = targetStation.id;
        npc.movement.targetCoordinates = { ...targetStation.position };
      }
    }
  }

  /**
   * Process pirate AI goal
   */
  private processPirateGoal(npc: NPCShip): void {
    // Pirates look for targets (other NPCs or player if in same system)
    const playerLocation = this.playerManager.getPlayer().currentStationId;
    const playerSystem = this.findSystemContainingStation(playerLocation);
    
    if (playerSystem && playerSystem.id === npc.position.systemId) {
      // Player is in same system - consider targeting them
      const playerReputation = npc.reputation;
      const securityLevel = playerSystem.securityLevel;
      
      // Higher security and better reputation reduce pirate aggression
      const attackProbability = Math.max(0, (npc.ai.aggressiveness / 100) - (securityLevel / 20) - (playerReputation / 200));
      
      if (Math.random() < attackProbability) {
        // Set goal to approach player
        const playerStation = this.findStationById(playerSystem, playerLocation);
        if (playerStation) {
          npc.movement.targetStationId = playerStation.id;
          npc.movement.targetCoordinates = { ...playerStation.position };
        }
      }
    }
  }

  /**
   * Process idle AI goal
   */
  private processIdleGoal(npc: NPCShip): void {
    // Occasionally choose a new goal based on personality
    if (Math.random() < 0.1) { // 10% chance
      const newGoal = this.generateInitialGoal(npc.type);
      npc.ai.currentGoal = newGoal;
      npc.ai.goalHistory.push(newGoal);
      
      // Keep history manageable
      if (npc.ai.goalHistory.length > 10) {
        npc.ai.goalHistory.shift();
      }
    }
  }

  /**
   * Update NPC movement and positions
   */
  private updateNPCMovement(deltaTime: number): void {
    const currentTime = this.timeManager.getCurrentTimestamp();
    
    for (const npc of this.npcShips.values()) {
      this.updateNPCPosition(npc, deltaTime, currentTime);
    }
  }

  /**
   * Update individual NPC position
   */
  private updateNPCPosition(npc: NPCShip, deltaTime: number, currentTime: number): void {
    // If NPC has a target, move toward it
    if (npc.movement.targetCoordinates) {
      const dx = npc.movement.targetCoordinates.x - npc.position.coordinates.x;
      const dy = npc.movement.targetCoordinates.y - npc.position.coordinates.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) { // Not yet at target
        const moveDistance = npc.movement.speed * (deltaTime / 1000);
        const normalizedDx = (dx / distance) * moveDistance;
        const normalizedDy = (dy / distance) * moveDistance;
        
        npc.position.coordinates.x += normalizedDx;
        npc.position.coordinates.y += normalizedDy;
        
        npc.movement.currentVelocity = {
          x: normalizedDx / (deltaTime / 1000),
          y: normalizedDy / (deltaTime / 1000)
        };
      } else {
        // Reached target
        npc.position.coordinates = { ...npc.movement.targetCoordinates };
        npc.movement.currentVelocity = { x: 0, y: 0 };
        
        // If target was a station, dock there
        if (npc.movement.targetStationId) {
          npc.position.stationId = npc.movement.targetStationId;
          npc.movement.targetStationId = undefined;
        }
        
        npc.movement.targetCoordinates = undefined;
      }
      
      npc.movement.lastMoveTime = currentTime;
    }
  }

  /**
   * Maybe spawn new NPCs to maintain population
   */
  private maybeSpawnNewNPCs(): void {
    if (Math.random() > this.NPC_SPAWN_PROBABILITY) return;
    
    const galaxy = this.worldManager.getGalaxy();
    
    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        const currentNPCCount = Array.from(this.npcShips.values())
          .filter(npc => npc.position.systemId === system.id).length;
        
        if (currentNPCCount < this.MAX_NPCS_PER_SYSTEM - 2) {
          this.spawnNPCInSystem(system, this.getRandomNPCType());
        }
      }
    }
  }

  /**
   * Update AI market behavior
   */
  private updateMarketBehaviors(): void {
    for (const behavior of this.marketBehaviors.values()) {
      this.processMarketBehavior(behavior);
    }
  }

  /**
   * Process individual market behavior
   */
  private processMarketBehavior(behavior: NPCMarketBehavior): void {
    const currentTime = this.timeManager.getCurrentTimestamp();
    
    // Check if it's time for this NPC to make a trade
    const timeSinceTrade = currentTime - behavior.lastTradeTime;
    const shouldTrade = timeSinceTrade >= behavior.buyingBehavior.frequency;
    
    if (!shouldTrade) return;
    
    // Simulate market participation by affecting economic system
    // This is a simplified version - full implementation would involve actual trades
    for (const [, preference] of behavior.commodityPreferences) {
      if (Math.random() * 100 < preference) {
        // Simulate buy/sell decision affecting market prices
        // Future: implement actual market impact
        // const impact = (Math.random() - 0.5) * 0.02; // ±1% price impact
        // We would call economicSystem.adjustPrice(commodityId, impact) if that method existed
      }
    }
    
    behavior.lastTradeTime = currentTime;
  }

  // Utility methods
  private findSystemById(galaxy: any, systemId: string): StarSystem | null {
    for (const sector of galaxy.sectors) {
      const system = sector.systems.find((s: StarSystem) => s.id === systemId);
      if (system) return system;
    }
    return null;
  }

  private findSystemContainingStation(stationId: string): StarSystem | null {
    const galaxy = this.worldManager.getGalaxy();
    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        if (system.stations.some(s => s.id === stationId)) {
          return system;
        }
      }
    }
    return null;
  }

  private findStationById(system: StarSystem, stationId: string): Station | null {
    return system.stations.find(s => s.id === stationId) || null;
  }

  // Public API methods
  
  /**
   * Get all NPCs in a specific system
   */
  getNPCsInSystem(systemId: string): NPCShip[] {
    return Array.from(this.npcShips.values())
      .filter(npc => npc.position.systemId === systemId);
  }

  /**
   * Get NPC by ID
   */
  getNPCById(npcId: string): NPCShip | null {
    return this.npcShips.get(npcId) || null;
  }

  /**
   * Start conversation with NPC
   */
  startConversation(npcId: string): NPCConversation | null {
    const npc = this.npcShips.get(npcId);
    if (!npc) return null;

    // Create conversation based on NPC type and current state
    const conversation = this.createConversation(npc);
    this.activeConversations.set(npcId, conversation);
    
    return conversation;
  }

  /**
   * Create conversation for NPC
   */
  private createConversation(npc: NPCShip): NPCConversation {
    const playerReputation = npc.reputation;
    
    return {
      id: `conv_${npc.id}_${Date.now()}`,
      npcId: npc.id,
      type: 'greeting',
      context: {
        playerReputation,
        npcMood: Math.floor(Math.random() * 201) - 100, // -100 to +100
        systemSecurity: 5, // Default security level
        recentEvents: []
      },
      dialogue: this.createDialogueNodes(npc),
      currentNodeId: 'greeting',
      startTime: this.timeManager.getCurrentTimestamp()
    };
  }

  /**
   * Create dialogue nodes for NPC conversation
   */
  private createDialogueNodes(npc: NPCShip): ConversationNode[] {
    const nodes: ConversationNode[] = [];
    
    // Greeting node
    nodes.push({
      id: 'greeting',
      text: this.getGreetingText(npc),
      speakerType: 'npc',
      choices: [
        {
          id: 'ask_trade',
          text: 'Looking to do some trading?',
          consequences: [],
          nextNodeId: 'trade_response'
        },
        {
          id: 'ask_info',
          text: 'Any interesting news?',
          consequences: [],
          nextNodeId: 'info_response'
        },
        {
          id: 'farewell',
          text: 'Safe travels.',
          consequences: [],
          nextNodeId: 'end'
        }
      ]
    });
    
    // Trade response node
    nodes.push({
      id: 'trade_response',
      text: this.getTradeResponseText(npc),
      speakerType: 'npc',
      nextNodeId: 'end'
    });
    
    // Info response node
    nodes.push({
      id: 'info_response',
      text: this.getInfoResponseText(),
      speakerType: 'npc',
      nextNodeId: 'end'
    });
    
    // End node
    nodes.push({
      id: 'end',
      text: 'Conversation ended.',
      speakerType: 'npc'
    });
    
    return nodes;
  }

  /**
   * Get greeting text based on NPC type and disposition
   */
  private getGreetingText(npc: NPCShip): string {
    const greetings = {
      trader: [
        "Greetings, fellow space trader! Looking for good deals?",
        "Hello there! I've got some quality goods if you're interested.",
        "Welcome! Always happy to meet another entrepreneur."
      ],
      pirate: [
        "Well, well... what have we here?",
        "You picked the wrong system to fly through, friend.",
        "Nice ship you've got there... shame if something happened to it."
      ],
      patrol: [
        "Citizen, please state your business in this system.",
        "This is system patrol. Everything looks in order.",
        "Safe travels, and remember to follow all trade regulations."
      ],
      civilian: [
        "Oh, hello there! Don't see many independent traders around here.",
        "Greetings! How are things in the shipping business?",
        "Good to see another friendly face out here."
      ],
      transport: [
        "Another hauler, eh? The routes are getting crowded these days.",
        "Hope you're not running the same cargo route as me!",
        "Safe flying out there - pirates have been active lately."
      ]
    };
    
    const typeGreetings = greetings[npc.type] || greetings.civilian;
    return typeGreetings[Math.floor(Math.random() * typeGreetings.length)];
  }

  /**
   * Get trade response text
   */
  private getTradeResponseText(npc: NPCShip): string {
    if (npc.type === 'trader') {
      return "Always! I specialize in high-value goods. Check the local markets - I might have left some good deals behind.";
    } else if (npc.type === 'pirate') {
      return "Trade? Hah! The only trading I do is your cargo for your life!";
    } else {
      return "I'm not much of a trader myself, but the local stations usually have what you need.";
    }
  }

  /**
   * Get info response text
   */
  private getInfoResponseText(): string {
    const infoResponses = [
      "I heard there's been some unusual activity in the outer systems.",
      "Commodity prices have been fluctuating wildly lately.",
      "The security forces have been cracking down on smuggling routes.",
      "Some traders have been reporting equipment failures - might be sabotage.",
      "Word is there's a new faction moving into this sector."
    ];
    
    return infoResponses[Math.floor(Math.random() * infoResponses.length)];
  }

  /**
   * Get all active conversations
   */
  getActiveConversations(): Map<string, NPCConversation> {
    return new Map(this.activeConversations);
  }

  /**
   * End conversation
   */
  endConversation(npcId: string): void {
    this.activeConversations.delete(npcId);
  }

  /**
   * Get serializable state for saving
   */
  getState(): any {
    return {
      npcShips: Array.from(this.npcShips.entries()),
      marketBehaviors: Array.from(this.marketBehaviors.entries()),
      npcFleets: Array.from(this.npcFleets.entries()),
      lastUpdateTime: this.lastUpdateTime,
      lastSpawnTime: this.lastSpawnTime,
      lastMarketUpdateTime: this.lastMarketUpdateTime
    };
  }

  /**
   * Load state from save data
   */
  loadState(state: any): void {
    if (state.npcShips) {
      this.npcShips = new Map(state.npcShips);
    }
    if (state.marketBehaviors) {
      this.marketBehaviors = new Map(state.marketBehaviors);
    }
    if (state.npcFleets) {
      this.npcFleets = new Map(state.npcFleets);
    }
    if (state.lastUpdateTime !== undefined) {
      this.lastUpdateTime = state.lastUpdateTime;
    }
    if (state.lastSpawnTime !== undefined) {
      this.lastSpawnTime = state.lastSpawnTime;
    }
    if (state.lastMarketUpdateTime !== undefined) {
      this.lastMarketUpdateTime = state.lastMarketUpdateTime;
    }
  }
}