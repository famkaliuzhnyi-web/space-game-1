import { 
  NPCShip, 
  NPCAIData, 
  NPCGoal, 
  NPCPersonality,
  NPCConversation,
  ConversationNode,
  NPCMarketBehavior,
  NPCFleet,
  TradeDecision,
  CombatDecision,
  AvoidanceTarget
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
        lastMoveTime: this.timeManager.getCurrentTimestamp(),
        // Enhanced movement properties for Phase 5.2
        pathfindingWaypoints: [],
        currentWaypoint: 0,
        avoidanceVector: { x: 0, y: 0 },
        maneuverability: Math.floor(Math.random() * 40) + 40, // 40-80
        maxAcceleration: this.getBaseSpeed(npcType) * 0.5, // Half of max speed per second
        brakingDistance: this.getBaseSpeed(npcType) * 2 // Distance needed to stop
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
      lastInteraction: null,
      // Enhanced AI properties for Phase 5.2
      combatSkill: Math.floor(Math.random() * 50) + (npcType === 'pirate' ? 30 : 15),
      navigationSkill: Math.floor(Math.random() * 40) + 30, // 30-70
      socialSkill: Math.floor(Math.random() * 40) + (npcType === 'civilian' ? 40 : 20),
      marketKnowledge: Math.floor(Math.random() * 50) + (npcType === 'trader' ? 35 : 15),
      threatAssessment: {
        nearbyThreats: [],
        currentThreatLevel: 0,
        lastThreatUpdate: this.timeManager.getCurrentTimestamp()
      },
      routeOptimization: {
        preferredRoutes: new Map(),
        avoidedSectors: [],
        knownProfitableRoutes: []
      }
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
    // Enhanced trading AI with profit optimization and market analysis
    const tradeDecision = this.makeTradeDecision(npc);
    
    switch (tradeDecision.action) {
      case 'travel':
        if (tradeDecision.targetStationId) {
          this.setNPCDestination(npc, tradeDecision.targetStationId);
        }
        break;
        
      case 'buy':
        this.attemptNPCPurchase(npc, tradeDecision.commodity!, tradeDecision.quantity!);
        break;
        
      case 'sell':
        this.attemptNPCSale(npc, tradeDecision.commodity!, tradeDecision.quantity!);
        break;
        
      case 'wait':
        // Wait at current location, maybe gather more market intelligence
        this.updateMarketKnowledge(npc);
        break;
    }
  }

  /**
   * Make intelligent trading decision based on AI skills and market data
   */
  private makeTradeDecision(npc: NPCShip): TradeDecision {
    const ai = npc.ai;
    const marketKnowledge = ai.marketKnowledge / 100;
    const tradingSkill = ai.tradingSkill / 100;
    
    // Analyze current market conditions (simplified for now)
    const currentSystem = this.findSystemById(this.worldManager.getGalaxy(), npc.position.systemId);
    if (!currentSystem) {
      return {
        action: 'wait',
        confidence: 0,
        reasoning: 'System not found'
      };
    }
    
    // If not at a station, travel to one
    if (!npc.position.stationId) {
      const nearestStation = this.findNearestStation(npc, currentSystem);
      return {
        action: 'travel',
        targetStationId: nearestStation?.id,
        confidence: 80,
        reasoning: 'Need to dock at a station to trade'
      };
    }
    
    // Check cargo space and decide whether to buy or sell
    const currentCargoUsed = Array.from(npc.ship.currentCargo.values()).reduce((sum, quantity) => sum + quantity, 0);
    const cargoSpaceLeft = npc.ship.cargoCapacity - currentCargoUsed;
    
    // If cargo is nearly full, prioritize selling
    if (cargoSpaceLeft < npc.ship.cargoCapacity * 0.2) {
      const bestCommodityToSell = this.findBestCommodityToSell(npc, currentSystem);
      if (bestCommodityToSell) {
        return {
          action: 'sell',
          commodity: bestCommodityToSell.commodity,
          quantity: Math.floor(bestCommodityToSell.quantity * (0.7 + 0.3 * tradingSkill)),
          confidence: bestCommodityToSell.confidence,
          reasoning: `Cargo full, selling ${bestCommodityToSell.commodity} for profit`
        };
      }
    }
    
    // If cargo has space and credits available, consider buying
    if (cargoSpaceLeft > 10 && npc.credits > 1000) {
      const bestCommodityToBuy = this.findBestCommodityToBuy(npc, currentSystem);
      if (bestCommodityToBuy) {
        return {
          action: 'buy',
          commodity: bestCommodityToBuy.commodity,
          quantity: Math.min(
            cargoSpaceLeft,
            Math.floor(npc.credits / bestCommodityToBuy.targetPrice!),
            Math.floor(20 * (0.5 + 0.5 * tradingSkill))
          ),
          targetPrice: bestCommodityToBuy.targetPrice,
          confidence: bestCommodityToBuy.confidence,
          reasoning: `Good buying opportunity for ${bestCommodityToBuy.commodity}`
        };
      }
    }
    
    // Consider traveling to a different station for better opportunities
    if (marketKnowledge > 0.3) {
      const profitableRoute = this.findProfitableRoute(npc, currentSystem);
      if (profitableRoute) {
        return {
          action: 'travel',
          targetStationId: profitableRoute.targetStation,
          confidence: profitableRoute.confidence,
          reasoning: `Traveling to ${profitableRoute.targetStation} for better prices`
        };
      }
    }
    
    return {
      action: 'wait',
      confidence: 20,
      reasoning: 'No profitable opportunities found, waiting'
    };
  }

  /**
   * Set NPC destination with pathfinding
   */
  private setNPCDestination(npc: NPCShip, targetStationId: string): void {
    const galaxy = this.worldManager.getGalaxy();
    const system = this.findSystemById(galaxy, npc.position.systemId);
    
    if (system) {
      const targetStation = this.findStationById(system, targetStationId);
      if (targetStation) {
        // Generate pathfinding waypoints
        npc.movement.pathfindingWaypoints = this.generatePathfindingWaypoints(
          npc.position.coordinates,
          targetStation.position,
          system.id
        );
        npc.movement.currentWaypoint = 0;
        npc.movement.targetStationId = targetStationId;
        
        // Clear simple target coordinates since we're using pathfinding
        npc.movement.targetCoordinates = undefined;
      }
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
    // Enhanced pirate AI with combat decision-making and tactical behavior
    const combatDecision = this.makeCombatDecision(npc);
    
    switch (combatDecision.action) {
      case 'engage':
        if (combatDecision.targetId && combatDecision.tacticalPosition) {
          this.initiateNPCCombat(npc, combatDecision.targetId, combatDecision.tacticalPosition);
        }
        break;
        
      case 'flee':
        this.initiateNPCFlee(npc);
        break;
        
      case 'intimidate':
        if (combatDecision.targetId) {
          this.attemptNPCIntimidation(npc, combatDecision.targetId);
        }
        break;
        
      case 'call_backup':
        this.requestNPCBackup(npc);
        break;
        
      case 'ignore':
        this.resumeNPCPatrol(npc);
        break;
    }
  }

  /**
   * Make intelligent combat decision for pirate NPCs
   */
  private makeCombatDecision(npc: NPCShip): CombatDecision {
    const ai = npc.ai;
    const currentSystem = this.findSystemById(this.worldManager.getGalaxy(), npc.position.systemId);
    
    if (!currentSystem) {
      return {
        action: 'ignore',
        confidence: 0,
        reasoning: 'System not found'
      };
    }
    
    // Assess threat level and decide on response
    const threatLevel = ai.threatAssessment.currentThreatLevel;
    const combatSkill = ai.combatSkill / 100;
    const aggressiveness = ai.aggressiveness / 100;
    const riskTolerance = ai.riskTolerance / 100;
    
    // Find potential targets
    const potentialTargets = this.findPirateTargets(npc, currentSystem);
    
    if (potentialTargets.length === 0) {
      return {
        action: 'ignore',
        confidence: 60,
        reasoning: 'No suitable targets found'
      };
    }
    
    // Evaluate best target
    const bestTarget = this.evaluateBestTarget(npc, potentialTargets);
    
    if (!bestTarget) {
      return {
        action: 'ignore',
        confidence: 50,
        reasoning: 'No profitable targets'
      };
    }
    
    // High threat level means consider fleeing
    if (threatLevel > 70 && riskTolerance < 0.4) {
      return {
        action: 'flee',
        confidence: 80,
        reasoning: 'High threat level, retreating to safety'
      };
    }
    
    // Low combat skill with dangerous targets means try intimidation first
    if (combatSkill < 0.5 && bestTarget.threatLevel > 40) {
      return {
        action: 'intimidate',
        targetId: bestTarget.id,
        confidence: 60,
        reasoning: 'Attempting intimidation before combat'
      };
    }
    
    // High aggressiveness and decent combat skill means engage
    if (aggressiveness > 0.6 && combatSkill > 0.3) {
      const tacticalPosition = this.calculateTacticalPosition(npc, bestTarget);
      return {
        action: 'engage',
        targetId: bestTarget.id,
        tacticalPosition,
        confidence: Math.min(90, combatSkill * 100 + aggressiveness * 20),
        reasoning: `Engaging ${bestTarget.type} - favorable odds`
      };
    }
    
    // Outnumbered but aggressive, call for backup
    if (potentialTargets.length > 2 && aggressiveness > 0.7) {
      return {
        action: 'call_backup',
        confidence: 70,
        reasoning: 'Multiple targets, requesting backup'
      };
    }
    
    return {
      action: 'ignore',
      confidence: 40,
      reasoning: 'Unfavorable engagement conditions'
    };
  }

  /**
   * Find potential targets for pirate NPCs
   */
  private findPirateTargets(pirate: NPCShip, system: any): Array<{id: string, type: string, position: {x: number, y: number}, threatLevel: number, value: number}> {
    const targets = [];
    
    // Check other NPCs in system
    for (const npc of this.npcShips.values()) {
      if (npc.id === pirate.id || npc.position.systemId !== system.id) {
        continue;
      }
      
      const distance = this.calculateDistance(pirate.position.coordinates, npc.position.coordinates);
      
      // Consider NPCs within reasonable range
      if (distance < 300) {
        let threatLevel = 0;
        let value = 0;
        
        // Calculate threat level
        if (npc.type === 'patrol' || npc.type === 'pirate') {
          threatLevel = npc.ai.combatSkill + npc.ai.aggressiveness;
        }
        
        // Calculate target value
        if (npc.type === 'trader' || npc.type === 'transport') {
          const cargoValue = Array.from(npc.ship.currentCargo.values())
            .reduce((sum, qty) => sum + qty, 0) * 50; // Rough estimate
          value = cargoValue + npc.credits * 0.1;
        }
        
        if (value > 100 || (npc.type === 'civilian' && pirate.ai.aggressiveness > 70)) {
          targets.push({
            id: npc.id,
            type: npc.type,
            position: npc.position.coordinates,
            threatLevel,
            value
          });
        }
      }
    }
    
    // Check for player in system (simplified)
    const playerLocation = this.playerManager.getPlayer().currentStationId;
    if (playerLocation) {
      const playerSystem = this.findSystemContainingStation(playerLocation);
      if (playerSystem && playerSystem.id === system.id) {
        const playerStation = this.findStationById(playerSystem, playerLocation);
        if (playerStation) {
          const distance = this.calculateDistance(pirate.position.coordinates, playerStation.position);
          if (distance < 300) {
            targets.push({
              id: 'player',
              type: 'player',
              position: playerStation.position,
              threatLevel: 50, // Assume moderate threat from player
              value: 500 // Players typically have valuable cargo
            });
          }
        }
      }
    }
    
    return targets;
  }

  /**
   * Evaluate and select the best target for pirate
   */
  private evaluateBestTarget(pirate: NPCShip, targets: any[]): any | null {
    if (targets.length === 0) return null;
    
    const combatSkill = pirate.ai.combatSkill / 100;
    const riskTolerance = pirate.ai.riskTolerance / 100;
    
    let bestTarget = null;
    let bestScore = 0;
    
    for (const target of targets) {
      // Score based on value vs risk
      const riskScore = Math.max(0, 100 - target.threatLevel);
      const valueScore = Math.min(100, target.value / 10);
      
      // Adjust for pirate's risk tolerance and skill
      const adjustedRisk = riskScore * (0.5 + 0.5 * riskTolerance);
      const adjustedValue = valueScore * (0.7 + 0.3 * combatSkill);
      
      const totalScore = (adjustedValue + adjustedRisk) / 2;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestTarget = target;
      }
    }
    
    return bestScore > 30 ? bestTarget : null;
  }

  /**
   * Calculate tactical position for combat
   */
  private calculateTacticalPosition(pirate: NPCShip, target: any): {x: number, y: number} {
    const navigationSkill = pirate.ai.navigationSkill / 100;
    
    // Basic tactical positioning - approach from optimal angle
    const dx = target.position.x - pirate.position.coordinates.x;
    const dy = target.position.y - pirate.position.coordinates.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const angle = Math.atan2(dy, dx) + (Math.PI / 4) * (0.5 - Math.random()) * navigationSkill;
      const tacticalDistance = 50 + navigationSkill * 30; // Closer with better navigation
      
      return {
        x: target.position.x - Math.cos(angle) * tacticalDistance,
        y: target.position.y - Math.sin(angle) * tacticalDistance
      };
    }
    
    return target.position;
  }

  /**
   * Initiate combat behavior for pirate NPC
   */
  private initiateNPCCombat(pirate: NPCShip, targetId: string, tacticalPosition: {x: number, y: number}): void {
    // Set movement toward tactical position
    pirate.movement.pathfindingWaypoints = this.generatePathfindingWaypoints(
      pirate.position.coordinates,
      tacticalPosition,
      pirate.position.systemId
    );
    pirate.movement.currentWaypoint = 0;
    
    // Update goal to reflect combat engagement
    pirate.ai.currentGoal.type = 'pirate';
    pirate.ai.currentGoal.parameters.set('target', targetId);
    pirate.ai.currentGoal.parameters.set('combatMode', 'engage');
    
    // Increase aggressiveness temporarily
    pirate.ai.aggressiveness = Math.min(100, pirate.ai.aggressiveness + 10);
  }

  /**
   * Initiate flee behavior for pirate NPC
   */
  private initiateNPCFlee(pirate: NPCShip): void {
    const galaxy = this.worldManager.getGalaxy();
    const currentSystem = this.findSystemById(galaxy, pirate.position.systemId);
    
    if (currentSystem) {
      // Find the farthest station from current position
      let farthestStation = null;
      let maxDistance = 0;
      
      for (const station of currentSystem.stations) {
        const distance = this.calculateDistance(pirate.position.coordinates, station.position);
        if (distance > maxDistance) {
          maxDistance = distance;
          farthestStation = station;
        }
      }
      
      if (farthestStation) {
        this.setNPCDestination(pirate, farthestStation.id);
        
        // Update goal
        pirate.ai.currentGoal.type = 'flee';
        pirate.ai.currentGoal.parameters.set('destination', farthestStation.id);
        
        // Increase speed temporarily
        pirate.movement.speed = pirate.movement.speed * 1.2;
      }
    }
  }

  /**
   * Attempt intimidation by pirate NPC
   */
  private attemptNPCIntimidation(pirate: NPCShip, targetId: string): void {
    // Find the target
    const target = this.npcShips.get(targetId);
    
    if (target) {
      // Calculate intimidation success based on relative stats
      const intimidationPower = pirate.ai.aggressiveness + pirate.ai.combatSkill;
      const targetResistance = target.ai.riskTolerance + (target.ai.combatSkill || 0);
      
      const intimidationSuccess = intimidationPower > targetResistance + Math.random() * 50;
      
      if (intimidationSuccess) {
        // Target flees or complies
        this.initiateNPCFlee(target);
        
        // Pirate gains confidence
        pirate.ai.aggressiveness = Math.min(100, pirate.ai.aggressiveness + 5);
      } else {
        // Intimidation failed, target may fight back or call for help
        if (target.type === 'patrol' || target.ai.aggressiveness > 60) {
          // Target becomes hostile
          target.reputation = Math.min(-20, target.reputation - 10);
        }
      }
    }
  }

  /**
   * Request backup for pirate NPC
   */
  private requestNPCBackup(pirate: NPCShip): void {
    // Find other pirates in the same system
    const backupPirates = Array.from(this.npcShips.values()).filter(npc => 
      npc.type === 'pirate' &&
      npc.id !== pirate.id &&
      npc.position.systemId === pirate.position.systemId &&
      this.calculateDistance(npc.position.coordinates, pirate.position.coordinates) < 500
    );
    
    // Call nearby pirates to assist
    for (const backup of backupPirates.slice(0, 2)) { // Max 2 backup ships
      backup.ai.currentGoal.type = 'pirate';
      backup.ai.currentGoal.parameters.set('support', pirate.id);
      
      // Move toward the requesting pirate
      this.setNPCDestination(backup, pirate.position.stationId || '');
    }
  }

  /**
   * Resume patrol behavior for pirate NPC
   */
  private resumeNPCPatrol(pirate: NPCShip): void {
    pirate.ai.currentGoal.type = 'patrol';
    pirate.ai.currentGoal.parameters.clear();
    
    // Move to a random location in the system
    const galaxy = this.worldManager.getGalaxy();
    const system = this.findSystemById(galaxy, pirate.position.systemId);
    
    if (system && system.stations.length > 0) {
      const randomStation = system.stations[Math.floor(Math.random() * system.stations.length)];
      this.setNPCDestination(pirate, randomStation.id);
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
      // Update threat assessment
      this.updateThreatAssessment(npc);
      
      // Calculate avoidance vectors for collision avoidance
      this.updateAvoidanceVector(npc);
      
      // Update NPC position with enhanced movement
      this.updateNPCPositionEnhanced(npc, deltaTime, currentTime);
    }
  }

  /**
   * Update threat assessment for an NPC
   */
  private updateThreatAssessment(npc: NPCShip): void {
    const currentTime = this.timeManager.getCurrentTimestamp();
    const threatAssessment = npc.ai.threatAssessment;
    
    // Update threat assessment every 2 seconds
    if (currentTime - threatAssessment.lastThreatUpdate < 2000) {
      return;
    }
    
    // Clear old threats
    threatAssessment.nearbyThreats = [];
    let maxThreatLevel = 0;
    
    // Check for threatening NPCs in the same system
    for (const otherNpc of this.npcShips.values()) {
      if (otherNpc.id === npc.id || otherNpc.position.systemId !== npc.position.systemId) {
        continue;
      }
      
      const distance = this.calculateDistance(npc.position.coordinates, otherNpc.position.coordinates);
      
      // Consider NPCs within 200 units as potential threats
      if (distance < 200) {
        let threatLevel = 0;
        
        // Pirates are threats to non-pirates
        if (otherNpc.type === 'pirate' && npc.type !== 'pirate') {
          threatLevel = Math.min(100, otherNpc.ai.aggressiveness + (otherNpc.ai.combatSkill / 2));
        }
        
        // Hostile reputation makes NPCs threatening
        if (otherNpc.reputation < -20) {
          threatLevel = Math.max(threatLevel, Math.abs(otherNpc.reputation));
        }
        
        if (threatLevel > 0) {
          threatAssessment.nearbyThreats.push(otherNpc.id);
          maxThreatLevel = Math.max(maxThreatLevel, threatLevel);
        }
      }
    }
    
    // Check if player is threatening (for pirates or if player has bad reputation)
    const playerLocation = this.playerManager.getPlayer().currentStationId;
    if (playerLocation) {
      const playerSystem = this.findSystemContainingStation(playerLocation);
      if (playerSystem && playerSystem.id === npc.position.systemId) {
        // Add player threat assessment logic here
        // For now, pirates consider armed players as moderate threats
        if (npc.type === 'pirate') {
          maxThreatLevel = Math.max(maxThreatLevel, 30);
        }
      }
    }
    
    threatAssessment.currentThreatLevel = maxThreatLevel;
    threatAssessment.lastThreatUpdate = currentTime;
  }

  /**
   * Update avoidance vector for collision avoidance
   */
  private updateAvoidanceVector(npc: NPCShip): void {
    const avoidanceTargets: AvoidanceTarget[] = [];
    
    // Add other NPCs as avoidance targets
    for (const otherNpc of this.npcShips.values()) {
      if (otherNpc.id === npc.id || otherNpc.position.systemId !== npc.position.systemId) {
        continue;
      }
      
      const distance = this.calculateDistance(npc.position.coordinates, otherNpc.position.coordinates);
      
      // Avoid NPCs within collision distance
      if (distance < 50) {
        avoidanceTargets.push({
          id: otherNpc.id,
          position: otherNpc.position.coordinates,
          radius: 30,
          strength: Math.max(20, 100 - distance * 2),
          type: 'ship'
        });
      }
    }
    
    // Calculate combined avoidance vector
    let avoidanceX = 0;
    let avoidanceY = 0;
    
    for (const target of avoidanceTargets) {
      const dx = npc.position.coordinates.x - target.position.x;
      const dy = npc.position.coordinates.y - target.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0 && distance < target.radius + 20) {
        const avoidanceStrength = target.strength * (1 - distance / (target.radius + 20));
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        avoidanceX += normalizedDx * avoidanceStrength;
        avoidanceY += normalizedDy * avoidanceStrength;
      }
    }
    
    npc.movement.avoidanceVector = { x: avoidanceX, y: avoidanceY };
  }

  /**
   * Enhanced NPC position update with pathfinding and collision avoidance
   */
  private updateNPCPositionEnhanced(npc: NPCShip, deltaTime: number, currentTime: number): void {
    // If NPC has waypoints, follow the path
    if (npc.movement.pathfindingWaypoints && npc.movement.pathfindingWaypoints.length > 0) {
      this.followWaypoints(npc, deltaTime);
    }
    // Otherwise, use simple movement toward target
    else if (npc.movement.targetCoordinates) {
      this.moveTowardTarget(npc, deltaTime);
    }
    
    npc.movement.lastMoveTime = currentTime;
  }

  /**
   * Follow waypoints for pathfinding navigation
   */
  private followWaypoints(npc: NPCShip, deltaTime: number): void {
    const waypoints = npc.movement.pathfindingWaypoints!;
    const currentWaypointIndex = npc.movement.currentWaypoint || 0;
    
    if (currentWaypointIndex >= waypoints.length) {
      // Reached end of path
      npc.movement.pathfindingWaypoints = undefined;
      npc.movement.currentWaypoint = 0;
      npc.movement.currentVelocity = { x: 0, y: 0 };
      return;
    }
    
    const targetWaypoint = waypoints[currentWaypointIndex];
    const dx = targetWaypoint.x - npc.position.coordinates.x;
    const dy = targetWaypoint.y - npc.position.coordinates.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) {
      // Reached waypoint, move to next
      npc.movement.currentWaypoint = currentWaypointIndex + 1;
      return;
    }
    
    // Calculate desired velocity toward waypoint
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    
    // Apply navigation skill to movement precision
    const navigationBonus = npc.ai.navigationSkill / 100;
    const effectiveSpeed = npc.movement.speed * (0.7 + 0.3 * navigationBonus);
    
    let desiredVelocityX = normalizedDx * effectiveSpeed;
    let desiredVelocityY = normalizedDy * effectiveSpeed;
    
    // Apply avoidance vector
    const avoidance = npc.movement.avoidanceVector!;
    desiredVelocityX += avoidance.x * 0.5;
    desiredVelocityY += avoidance.y * 0.5;
    
    // Apply steering with maneuverability constraints
    const maneuverabilityFactor = npc.movement.maneuverability / 100;
    const maxSteeringForce = npc.movement.maxAcceleration * maneuverabilityFactor;
    
    const steeringX = desiredVelocityX - npc.movement.currentVelocity.x;
    const steeringY = desiredVelocityY - npc.movement.currentVelocity.y;
    const steeringMagnitude = Math.sqrt(steeringX * steeringX + steeringY * steeringY);
    
    if (steeringMagnitude > maxSteeringForce) {
      const normalizedSteeringX = steeringX / steeringMagnitude;
      const normalizedSteeringY = steeringY / steeringMagnitude;
      
      npc.movement.currentVelocity.x += normalizedSteeringX * maxSteeringForce * (deltaTime / 1000);
      npc.movement.currentVelocity.y += normalizedSteeringY * maxSteeringForce * (deltaTime / 1000);
    } else {
      npc.movement.currentVelocity.x += steeringX * (deltaTime / 1000);
      npc.movement.currentVelocity.y += steeringY * (deltaTime / 1000);
    }
    
    // Limit to maximum speed
    const currentSpeed = Math.sqrt(
      npc.movement.currentVelocity.x * npc.movement.currentVelocity.x +
      npc.movement.currentVelocity.y * npc.movement.currentVelocity.y
    );
    
    if (currentSpeed > effectiveSpeed) {
      npc.movement.currentVelocity.x = (npc.movement.currentVelocity.x / currentSpeed) * effectiveSpeed;
      npc.movement.currentVelocity.y = (npc.movement.currentVelocity.y / currentSpeed) * effectiveSpeed;
    }
    
    // Update position
    npc.position.coordinates.x += npc.movement.currentVelocity.x * (deltaTime / 1000);
    npc.position.coordinates.y += npc.movement.currentVelocity.y * (deltaTime / 1000);
  }

  /**
   * Simple movement toward target with collision avoidance
   */
  private moveTowardTarget(npc: NPCShip, deltaTime: number): void {
    const dx = npc.movement.targetCoordinates!.x - npc.position.coordinates.x;
    const dy = npc.movement.targetCoordinates!.y - npc.position.coordinates.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= 5) {
      // Reached target
      npc.position.coordinates = { ...npc.movement.targetCoordinates! };
      npc.movement.currentVelocity = { x: 0, y: 0 };
      
      // If target was a station, dock there
      if (npc.movement.targetStationId) {
        npc.position.stationId = npc.movement.targetStationId;
        npc.movement.targetStationId = undefined;
      }
      
      npc.movement.targetCoordinates = undefined;
      return;
    }
    
    // Calculate braking distance based on current speed
    const currentSpeed = Math.sqrt(
      npc.movement.currentVelocity.x * npc.movement.currentVelocity.x +
      npc.movement.currentVelocity.y * npc.movement.currentVelocity.y
    );
    
    const shouldBrake = distance <= npc.movement.brakingDistance && currentSpeed > 5;
    
    // Calculate desired velocity
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    
    let targetSpeed = npc.movement.speed;
    if (shouldBrake) {
      targetSpeed = Math.max(5, npc.movement.speed * (distance / npc.movement.brakingDistance));
    }
    
    let desiredVelocityX = normalizedDx * targetSpeed;
    let desiredVelocityY = normalizedDy * targetSpeed;
    
    // Apply avoidance vector
    const avoidance = npc.movement.avoidanceVector!;
    desiredVelocityX += avoidance.x * 0.3;
    desiredVelocityY += avoidance.y * 0.3;
    
    // Update velocity with acceleration constraints
    const maxAcceleration = npc.movement.maxAcceleration * (deltaTime / 1000);
    
    const velocityChangeX = desiredVelocityX - npc.movement.currentVelocity.x;
    const velocityChangeY = desiredVelocityY - npc.movement.currentVelocity.y;
    const velocityChangeMagnitude = Math.sqrt(velocityChangeX * velocityChangeX + velocityChangeY * velocityChangeY);
    
    if (velocityChangeMagnitude > maxAcceleration) {
      const normalizedChangeX = velocityChangeX / velocityChangeMagnitude;
      const normalizedChangeY = velocityChangeY / velocityChangeMagnitude;
      
      npc.movement.currentVelocity.x += normalizedChangeX * maxAcceleration;
      npc.movement.currentVelocity.y += normalizedChangeY * maxAcceleration;
    } else {
      npc.movement.currentVelocity.x = desiredVelocityX;
      npc.movement.currentVelocity.y = desiredVelocityY;
    }
    
    // Update position
    npc.position.coordinates.x += npc.movement.currentVelocity.x * (deltaTime / 1000);
    npc.position.coordinates.y += npc.movement.currentVelocity.y * (deltaTime / 1000);
  }

  /**
   * Generate pathfinding waypoints from start to end position
   */
  generatePathfindingWaypoints(start: { x: number; y: number }, end: { x: number; y: number }, _systemId: string): { x: number; y: number }[] {
    // For now, use simple straight-line path with basic obstacle avoidance
    // In future versions, this can be enhanced with A* pathfinding
    
    const waypoints: { x: number; y: number }[] = [];
    const totalDistance = this.calculateDistance(start, end);
    
    // If it's a short distance, use direct path
    if (totalDistance < 100) {
      waypoints.push({ ...end });
      return waypoints;
    }
    
    // Create waypoints every 80 units
    const numWaypoints = Math.ceil(totalDistance / 80);
    
    for (let i = 1; i <= numWaypoints; i++) {
      const progress = i / numWaypoints;
      const waypointX = start.x + (end.x - start.x) * progress;
      const waypointY = start.y + (end.y - start.y) * progress;
      
      waypoints.push({ x: waypointX, y: waypointY });
    }
    
    return waypoints;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Find the nearest station to an NPC in a system
   */
  private findNearestStation(npc: NPCShip, system: any) {
    let nearestStation = null;
    let nearestDistance = Infinity;
    
    for (const station of system.stations) {
      const distance = this.calculateDistance(npc.position.coordinates, station.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestStation = station;
      }
    }
    
    return nearestStation;
  }

  /**
   * Find the best commodity to sell for an NPC
   */
  private findBestCommodityToSell(npc: NPCShip, _system: any): { commodity: string; quantity: number; confidence: number } | null {
    // Simplified logic - in a full implementation, this would check actual market prices
    const cargo = npc.ship.currentCargo;
    let bestCommodity = null;
    let highestValue = 0;
    
    for (const [commodity, quantity] of cargo.entries()) {
      if (quantity > 0) {
        // Estimate commodity value based on type
        const estimatedValue = this.estimateCommodityValue(commodity) * quantity;
        if (estimatedValue > highestValue) {
          highestValue = estimatedValue;
          bestCommodity = {
            commodity,
            quantity,
            confidence: Math.min(90, 50 + npc.ai.marketKnowledge / 2)
          };
        }
      }
    }
    
    return bestCommodity;
  }

  /**
   * Find the best commodity to buy for an NPC
   */
  private findBestCommodityToBuy(npc: NPCShip, _system: any): { commodity: string; targetPrice: number; confidence: number } | null {
    // Simplified logic - would use actual market data in full implementation
    const availableCommodities = ['electronics', 'medical_supplies', 'luxury_goods', 'machinery', 'raw_materials'];
    const tradingSkill = npc.ai.tradingSkill / 100;
    const marketKnowledge = npc.ai.marketKnowledge / 100;
    
    // Higher skill means better commodity selection
    const commodityIndex = Math.floor(Math.random() * availableCommodities.length * (0.5 + 0.5 * tradingSkill));
    const selectedCommodity = availableCommodities[Math.min(commodityIndex, availableCommodities.length - 1)];
    
    return {
      commodity: selectedCommodity,
      targetPrice: this.estimateCommodityValue(selectedCommodity) * (0.8 + 0.2 * marketKnowledge),
      confidence: Math.min(80, 30 + tradingSkill * 50)
    };
  }

  /**
   * Find a profitable trade route for an NPC
   */
  private findProfitableRoute(npc: NPCShip, currentSystem: any): { targetStation: string; confidence: number } | null {
    const knownRoutes = npc.ai.routeOptimization.knownProfitableRoutes;
    
    if (knownRoutes.length > 0) {
      // Sort by profit margin and recency
      const sortedRoutes = knownRoutes
        .filter(route => route.from !== npc.position.stationId)
        .sort((a, b) => b.profitMargin - a.profitMargin);
      
      if (sortedRoutes.length > 0) {
        return {
          targetStation: sortedRoutes[0].to,
          confidence: Math.min(70, sortedRoutes[0].profitMargin * 10)
        };
      }
    }
    
    // If no known routes, explore a random station
    const availableStations = currentSystem.stations.filter((s: any) => s.id !== npc.position.stationId);
    if (availableStations.length > 0) {
      const randomStation = availableStations[Math.floor(Math.random() * availableStations.length)];
      return {
        targetStation: randomStation.id,
        confidence: 30
      };
    }
    
    return null;
  }

  /**
   * Estimate commodity value (simplified)
   */
  private estimateCommodityValue(commodity: string): number {
    const baseValues: Record<string, number> = {
      'electronics': 150,
      'medical_supplies': 200,
      'luxury_goods': 300,
      'machinery': 180,
      'raw_materials': 80,
      'food': 50,
      'fuel': 40
    };
    
    return baseValues[commodity] || 100;
  }

  /**
   * Update NPC market knowledge based on current location
   */
  private updateMarketKnowledge(npc: NPCShip): void {
    // Gradually increase market knowledge when stationed
    const currentTime = this.timeManager.getCurrentTimestamp();
    const timeSinceLastUpdate = currentTime - npc.lastActionTime;
    
    if (timeSinceLastUpdate > 30000) { // 30 seconds
      npc.ai.marketKnowledge = Math.min(100, npc.ai.marketKnowledge + 1);
      npc.lastActionTime = currentTime;
    }
  }

  /**
   * Attempt NPC purchase of commodity
   */
  private attemptNPCPurchase(npc: NPCShip, commodity: string, quantity: number): void {
    const cost = this.estimateCommodityValue(commodity) * quantity;
    
    if (npc.credits >= cost) {
      npc.credits -= cost;
      const currentQuantity = npc.ship.currentCargo.get(commodity) || 0;
      npc.ship.currentCargo.set(commodity, currentQuantity + quantity);
      
      // Update market knowledge
      npc.ai.marketKnowledge = Math.min(100, npc.ai.marketKnowledge + 2);
    }
  }

  /**
   * Attempt NPC sale of commodity  
   */
  private attemptNPCSale(npc: NPCShip, commodity: string, quantity: number): void {
    const currentQuantity = npc.ship.currentCargo.get(commodity) || 0;
    const actualQuantity = Math.min(quantity, currentQuantity);
    
    if (actualQuantity > 0) {
      const revenue = this.estimateCommodityValue(commodity) * actualQuantity * (1.1 + Math.random() * 0.3);
      npc.credits += revenue;
      npc.ship.currentCargo.set(commodity, currentQuantity - actualQuantity);
      
      // Record profitable route
      if (npc.position.stationId) {
        npc.ai.routeOptimization.knownProfitableRoutes.push({
          from: npc.position.stationId,
          to: npc.position.stationId,
          commodity,
          profitMargin: 0.2,
          lastUpdated: this.timeManager.getCurrentTimestamp()
        });
        
        // Keep route history manageable
        if (npc.ai.routeOptimization.knownProfitableRoutes.length > 20) {
          npc.ai.routeOptimization.knownProfitableRoutes.shift();
        }
      }
      
      // Update market knowledge
      npc.ai.marketKnowledge = Math.min(100, npc.ai.marketKnowledge + 3);
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