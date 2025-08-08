import {
  CombatState,
  CombatEncounter,
  CombatParticipant,
  CombatAction,
  CombatResult,
  CombatAI,
  Weapon,
  Shield,
  WeaponLicense,
  PlayerWeaponLicense,
  EncounterType,
  CombatStats,
  DamageResult,
  CombatEffect
} from '../types/combat';
import { TimeManager } from './TimeManager';
import { WorldManager } from './WorldManager';
import { PlayerManager } from './PlayerManager';
import { FactionManager } from './FactionManager';
import { SecurityManager } from './SecurityManager';
import { NPCAIManager } from './NPCAIManager';
import { EventManager } from './EventManager';

/**
 * CombatManager handles all combat encounters, weapon systems, and shield mechanics.
 * 
 * Responsibilities:
 * - Managing combat encounters and turn-based combat
 * - Weapon and shield systems with damage calculations
 * - Combat AI integration and threat assessment
 * - Weapon licensing and legal restrictions
 * - Environmental combat conditions and hazards
 * - Combat statistics and progression tracking
 * 
 * Features:
 * - Realistic kinetic and energy weapon systems
 * - Advanced magnetic shield mechanics with damage types
 * - Dynamic combat encounters with procedural generation
 * - Integrated weapon licensing system
 * - Environmental effects on combat performance
 * - AI-driven combat behavior and tactics
 */
export class CombatManager {
  private timeManager: TimeManager;
  private worldManager: WorldManager;
  private playerManager: PlayerManager;

  // System state
  private combatState: CombatState;
  private nextEncounterId = 1;
  private nextActionId = 1;

  // Weapon and shield databases
  private weaponDatabase: Map<string, Weapon> = new Map();
  private shieldDatabase: Map<string, Shield> = new Map();
  private licenseDatabase: Map<string, WeaponLicense> = new Map();

  constructor(
    timeManager: TimeManager,
    worldManager: WorldManager,
    playerManager: PlayerManager,
    _factionManager: FactionManager,
    _securityManager: SecurityManager,
    _npcaiManager: NPCAIManager,
    _eventManager: EventManager
  ) {
    this.timeManager = timeManager;
    this.worldManager = worldManager;
    this.playerManager = playerManager;

    // Initialize combat state
    this.combatState = {
      activeEncounters: new Map(),
      combatHistory: [],
      playerWeapons: [],
      playerLicenses: [],
      stats: {
        encountersTotal: 0,
        encountersWon: 0,
        encountersLost: 0,
        encountersFled: 0,
        damageDealt: 0,
        damageTaken: 0,
        shipsDestroyed: 0,
        shipsDisabled: 0,
        weaponsFired: 0,
        accuracyPercentage: 0,
        criticalHits: 0,
        boardingActions: 0,
        successfulBoarding: 0,
        highestThreatDefeated: 0,
        longestBattle: 0,
        reputation: {}
      },
      turnOrder: [],
      currentTurn: 0,
      combatPhase: 'setup'
    };

    this.initializeWeapons();
    this.initializeShields();
    this.initializeLicenses();
  }

  /**
   * Initialize weapon database
   */
  private initializeWeapons(): void {
    const weapons: Weapon[] = [
      // Energy Weapons
      {
        id: 'pulse-laser-mk1',
        name: 'Pulse Laser Mk I',
        type: 'energy',
        size: 'light',
        damageType: 'energy',
        stats: {
          damage: 25,
          accuracy: 0.85,
          range: 8000,
          fireRate: 120,
          energyCost: 15,
          chargeTime: 0.5
        },
        license: {
          required: false,
          restrictions: [],
          cost: 0,
          validityPeriod: 0
        },
        description: 'Standard civilian defense laser system',
        cost: 3500,
        availability: 'civilian'
      },
      {
        id: 'plasma-cannon-mk2',
        name: 'Plasma Cannon Mk II',
        type: 'plasma',
        size: 'medium',
        damageType: 'energy',
        stats: {
          damage: 55,
          accuracy: 0.75,
          range: 6000,
          fireRate: 60,
          energyCost: 35,
          chargeTime: 1.0
        },
        license: {
          required: true,
          type: 'commercial',
          issuingAuthority: 'Traders Guild',
          restrictions: [
            {
              type: 'location',
              description: 'Prohibited in civilian sectors',
              prohibited: ['earth-system', 'civilian-stations'],
              penalty: {
                type: 'confiscation',
                severity: 'moderate',
                description: 'Weapon confiscation and fine'
              }
            }
          ],
          cost: 1500,
          validityPeriod: 365
        },
        description: 'Military-grade plasma weapon for commerce protection',
        cost: 12000,
        availability: 'restricted'
      },

      // Kinetic Weapons
      {
        id: 'rail-gun-heavy',
        name: 'Heavy Rail Gun',
        type: 'kinetic',
        size: 'heavy',
        damageType: 'kinetic',
        stats: {
          damage: 80,
          accuracy: 0.90,
          range: 12000,
          fireRate: 30,
          ammoCapacity: 100,
          energyCost: 25,
          chargeTime: 2.0
        },
        license: {
          required: true,
          type: 'security',
          issuingAuthority: 'Security Forces',
          restrictions: [
            {
              type: 'activity',
              description: 'Only for licensed security operations',
              prohibited: ['piracy', 'smuggling', 'mercenary'],
              penalty: {
                type: 'arrest',
                severity: 'major',
                description: 'Criminal charges for illegal weapon use'
              }
            }
          ],
          cost: 5000,
          validityPeriod: 180
        },
        description: 'High-velocity kinetic weapon system',
        cost: 25000,
        availability: 'military'
      },

      // Missile Systems
      {
        id: 'torpedo-launcher-mk3',
        name: 'Torpedo Launcher Mk III',
        type: 'missile',
        size: 'heavy',
        damageType: 'explosive',
        stats: {
          damage: 120,
          accuracy: 0.70,
          range: 15000,
          fireRate: 10,
          ammoCapacity: 20,
          energyCost: 10,
          chargeTime: 5.0
        },
        license: {
          required: true,
          type: 'military',
          issuingAuthority: 'Earth Federation Navy',
          restrictions: [
            {
              type: 'faction',
              description: 'Prohibited for hostile faction members',
              prohibited: ['pirates', 'rebels', 'criminals'],
              penalty: {
                type: 'bounty',
                severity: 'extreme',
                amount: 100000,
                description: 'Military bounty for illegal possession'
              }
            }
          ],
          cost: 25000,
          validityPeriod: 90
        },
        description: 'Advanced guided missile system with explosive warheads',
        cost: 75000,
        availability: 'military'
      }
    ];

    weapons.forEach(weapon => this.weaponDatabase.set(weapon.id, weapon));
  }

  /**
   * Initialize shield database
   */
  private initializeShields(): void {
    const shields: Shield[] = [
      {
        id: 'magnetic-deflector-basic',
        name: 'Basic Magnetic Deflector',
        type: 'magnetic',
        stats: {
          strength: 100,
          rechargeRate: 5,
          rechargeDelay: 3,
          efficiency: 0.7,
          coverage: 0.8
        },
        resistances: {
          kinetic: 0.3,
          energy: 0.6,
          explosive: 0.2,
          electromagnetic: 0.1
        },
        description: 'Standard magnetic field deflector for debris and light weapons',
        cost: 2500,
        powerRequirement: 20
      },
      {
        id: 'adaptive-shield-matrix',
        name: 'Adaptive Shield Matrix',
        type: 'adaptive',
        stats: {
          strength: 250,
          rechargeRate: 12,
          rechargeDelay: 2,
          efficiency: 0.85,
          coverage: 0.95
        },
        resistances: {
          kinetic: 0.5,
          energy: 0.7,
          explosive: 0.4,
          electromagnetic: 0.8
        },
        description: 'Advanced adaptive shielding that adjusts to incoming damage types',
        cost: 15000,
        powerRequirement: 45
      },
      {
        id: 'military-ablative-armor',
        name: 'Military Ablative Armor',
        type: 'ablative',
        stats: {
          strength: 400,
          rechargeRate: 0, // Ablative armor doesn't recharge
          rechargeDelay: 0,
          efficiency: 1.0,
          coverage: 1.0
        },
        resistances: {
          kinetic: 0.8,
          energy: 0.4,
          explosive: 0.9,
          electromagnetic: 0.2
        },
        description: 'Military-grade ablative armor plating for maximum protection',
        cost: 50000,
        powerRequirement: 10
      }
    ];

    shields.forEach(shield => this.shieldDatabase.set(shield.id, shield));
  }

  /**
   * Initialize weapon license database
   */
  private initializeLicenses(): void {
    const licenses: Record<string, WeaponLicense> = {
      'civilian': {
        required: false,
        restrictions: [],
        cost: 0,
        validityPeriod: 0
      },
      'commercial': {
        required: true,
        type: 'commercial',
        issuingAuthority: 'Traders Guild',
        restrictions: [
          {
            type: 'location',
            description: 'Restricted in civilian sectors',
            prohibited: ['civilian-space'],
            penalty: {
              type: 'fine',
              severity: 'moderate',
              amount: 5000,
              description: 'Commercial weapons violation'
            }
          }
        ],
        cost: 1500,
        validityPeriod: 365
      },
      'security': {
        required: true,
        type: 'security',
        issuingAuthority: 'Security Forces',
        restrictions: [
          {
            type: 'activity',
            description: 'Only for licensed security operations',
            prohibited: ['piracy', 'illegal-activity'],
            penalty: {
              type: 'arrest',
              severity: 'major',
              description: 'Illegal use of security weapons'
            }
          }
        ],
        cost: 5000,
        validityPeriod: 180
      },
      'military': {
        required: true,
        type: 'military',
        issuingAuthority: 'Earth Federation Navy',
        restrictions: [
          {
            type: 'faction',
            description: 'Restricted to military personnel and allies',
            prohibited: ['hostile-factions'],
            penalty: {
              type: 'bounty',
              severity: 'extreme',
              amount: 100000,
              description: 'Military weapons violation'
            }
          }
        ],
        cost: 25000,
        validityPeriod: 90
      }
    };

    Object.entries(licenses).forEach(([key, license]) => {
      this.licenseDatabase.set(key, license);
    });
  }

  /**
   * Generate a combat encounter
   */
  generateEncounter(type: EncounterType, systemId: string): CombatEncounter {
    const encounterId = `encounter-${this.nextEncounterId++}`;
    const currentTime = this.timeManager.getCurrentTimestamp();

    // Generate participants based on encounter type
    const participants = this.generateParticipants(type, systemId);

    const encounter: CombatEncounter = {
      id: encounterId,
      type,
      location: {
        systemId,
        coordinates: { x: Math.random() * 1000, y: Math.random() * 1000 }
      },
      participants,
      environment: this.generateEnvironment(),
      objectives: this.generateObjectives(type, participants),
      rewards: this.generateRewards(type, participants),
      startTime: currentTime,
      status: 'active'
    };

    this.combatState.activeEncounters.set(encounterId, encounter);
    this.combatState.stats.encountersTotal++;

    return encounter;
  }

  /**
   * Generate combat participants based on encounter type
   */
  private generateParticipants(type: EncounterType, systemId: string): CombatParticipant[] {
    const participants: CombatParticipant[] = [];

    // Add player participant
    participants.push(this.createPlayerParticipant());

    // Generate AI participants based on encounter type
    switch (type) {
      case 'pirate-attack':
        participants.push(...this.generatePirateAttackers(1 + Math.floor(Math.random() * 2)));
        break;
      case 'patrol-inspection':
        participants.push(this.generatePatrolShip(systemId));
        break;
      case 'faction-conflict':
        participants.push(...this.generateFactionalForces(systemId));
        break;
      case 'bounty-hunter':
        participants.push(this.generateBountyHunter());
        break;
      case 'ambush':
        participants.push(...this.generateAmbushForce());
        break;
      default:
        participants.push(this.generateGenericEnemy());
    }

    return participants;
  }

  /**
   * Create player combat participant
   */
  private createPlayerParticipant(): CombatParticipant {
    // Use simplified player data for combat
    return {
      id: 'player',
      name: 'Player Ship',
      type: 'player',
      ship: {
        id: 'player-ship',
        name: 'Player Ship',
        class: 'courier',
        hull: {
          current: 100,
          maximum: 100,
          armor: 10 // Basic hull armor
        },
        shields: {
          current: 50,
          maximum: 50,
          type: 'magnetic',
          recharging: false,
          rechargeCooldown: 0
        },
        weapons: [], // Would be populated from player's equipped weapons
        systems: {
          engines: 1.0,
          life_support: 1.0,
          sensors: 1.0,
          communications: 1.0,
          navigation: 1.0,
          power: 1.0
        },
        crew: {
          count: 1,
          morale: 75,
          experience: 50,
          casualties: 0
        },
        maneuverability: this.calculateManeuverability('courier'),
        size: this.getShipSizeCategory('courier')
      },
      position: { x: 500, y: 500 },
      status: 'active'
    };
  }

  /**
   * Generate pirate attackers
   */
  private generatePirateAttackers(count: number): CombatParticipant[] {
    const pirates: CombatParticipant[] = [];
    
    for (let i = 0; i < count; i++) {
      const pirateNames = ['Crimson Corsair', 'Void Stalker', 'Solar Scavenger', 'Nebula Raider'];
      const name = pirateNames[Math.floor(Math.random() * pirateNames.length)];
      
      pirates.push({
        id: `pirate-${i}`,
        name: name,
        type: 'ai',
        faction: 'pirates',
        ship: this.generateEnemyShip('light-combat'),
        position: { 
          x: Math.random() * 200 + 800, 
          y: Math.random() * 200 + 400 
        },
        status: 'active',
        ai: this.generatePirateAI()
      });
    }
    
    return pirates;
  }

  /**
   * Generate patrol ship
   */
  private generatePatrolShip(_systemId: string): CombatParticipant {
    const faction = 'Security Forces';
    
    return {
      id: 'patrol-ship',
      name: 'Security Patrol',
      type: 'ai',
      faction,
      ship: this.generateEnemyShip('patrol'),
      position: { x: Math.random() * 100 + 450, y: Math.random() * 100 + 450 },
      status: 'active',
      ai: this.generatePatrolAI()
    };
  }

  /**
   * Generate enemy ship data
   */
  private generateEnemyShip(shipType: string): any {
    const baseStats = {
      'light-combat': { hull: 80, shields: 60, weapons: 2 },
      'patrol': { hull: 120, shields: 100, weapons: 2 },
      'heavy-combat': { hull: 200, shields: 150, weapons: 4 }
    }[shipType] || { hull: 100, shields: 80, weapons: 2 };

    return {
      id: `ship-${Date.now()}-${Math.random()}`,
      name: `${shipType} vessel`,
      class: shipType,
      hull: {
        current: baseStats.hull,
        maximum: baseStats.hull,
        armor: 5
      },
      shields: {
        current: baseStats.shields,
        maximum: baseStats.shields,
        type: 'magnetic',
        recharging: false,
        rechargeCooldown: 0
      },
      weapons: [], // Would be populated with appropriate weapons
      systems: {
        engines: 1.0,
        life_support: 1.0,
        sensors: 1.0,
        communications: 1.0,
        navigation: 1.0,
        power: 1.0
      },
      crew: {
        count: 2 + Math.floor(Math.random() * 3),
        morale: 60 + Math.random() * 30,
        experience: 40 + Math.random() * 40,
        casualties: 0
      },
      maneuverability: 0.6 + Math.random() * 0.3,
      size: 'corvette'
    };
  }

  /**
   * Generate combat AI for pirates
   */
  private generatePirateAI(): CombatAI {
    return {
      personality: {
        aggression: 0.7 + Math.random() * 0.2,
        riskTolerance: 0.6 + Math.random() * 0.3,
        loyalty: 0.3 + Math.random() * 0.3,
        intelligence: 0.4 + Math.random() * 0.4
      },
      tactics: {
        preferredRange: Math.random() < 0.6 ? 'close' : 'medium',
        formation: 'aggressive',
        targeting: 'weakest',
        retreatThreshold: 0.2 + Math.random() * 0.2
      },
      objectives: [
        {
          type: 'disable',
          priority: 8,
          completed: false
        },
        {
          type: 'retreat',
          priority: 3,
          completed: false
        }
      ],
      threatAssessment: {
        targets: {},
        overallThreat: 0,
        recommendedAction: 'attack'
      },
      decisionCooldown: 0
    };
  }

  /**
   * Generate combat AI for patrol ships
   */
  private generatePatrolAI(): CombatAI {
    return {
      personality: {
        aggression: 0.3 + Math.random() * 0.3,
        riskTolerance: 0.4 + Math.random() * 0.2,
        loyalty: 0.8 + Math.random() * 0.2,
        intelligence: 0.6 + Math.random() * 0.3
      },
      tactics: {
        preferredRange: 'medium',
        formation: 'defensive',
        targeting: 'strongest',
        retreatThreshold: 0.15
      },
      objectives: [
        {
          type: 'protect',
          priority: 9,
          completed: false
        },
        {
          type: 'retreat',
          priority: 2,
          completed: false
        }
      ],
      threatAssessment: {
        targets: {},
        overallThreat: 0,
        recommendedAction: 'defend'
      },
      decisionCooldown: 0
    };
  }

  /**
   * Execute a combat action
   */
  executeCombatAction(action: CombatAction): CombatResult {
    const actor = this.findParticipant(action.actorId);
    if (!actor) {
      return {
        action,
        success: false,
        effects: [],
        message: 'Actor not found'
      };
    }

    switch (action.type) {
      case 'attack':
        return this.executeAttack(action, actor);
      case 'move':
        return this.executeMove(action, actor);
      case 'defend':
        return this.executeDefend(action, actor);
      case 'retreat':
        return this.executeRetreat(action, actor);
      default:
        return {
          action,
          success: false,
          effects: [],
          message: 'Unknown action type'
        };
    }
  }

  /**
   * Execute attack action
   */
  private executeAttack(action: CombatAction, actor: CombatParticipant): CombatResult {
    const target = this.findParticipant(action.targetId!);
    if (!target) {
      return {
        action,
        success: false,
        effects: [],
        message: 'Target not found'
      };
    }

    // Get weapon (simplified - would select from actor's equipped weapons)
    const weapon = this.weaponDatabase.get('pulse-laser-mk1')!;
    
    // Track weapon fired (regardless of hit/miss)
    this.combatState.stats.weaponsFired++;
    
    // Calculate hit chance
    const distance = this.calculateDistance(actor.position, target.position);
    const baseAccuracy = weapon.stats.accuracy;
    const rangeModifier = Math.max(0.1, 1 - (distance / weapon.stats.range));
    const finalAccuracy = baseAccuracy * rangeModifier;

    const hit = Math.random() < finalAccuracy;
    
    if (!hit) {
      return {
        action,
        success: false,
        effects: [],
        message: `${actor.name} missed ${target.name}`
      };
    }

    // Calculate damage
    const baseDamage = weapon.stats.damage;
    const damageVariation = 0.8 + Math.random() * 0.4; // ±20% variation
    const finalDamage = Math.floor(baseDamage * damageVariation);

    // Apply damage to target
    const damageResult = this.applyDamage(target, finalDamage, weapon.damageType);
    
    this.combatState.stats.damageDealt += finalDamage;

    return {
      action,
      success: true,
      damage: damageResult,
      effects: this.generateDamageEffects(damageResult, target),
      message: `${actor.name} hit ${target.name} for ${finalDamage} damage`
    };
  }

  /**
   * Apply damage to a target
   */
  private applyDamage(target: CombatParticipant, damage: number, damageType: any): DamageResult {
    const ship = target.ship;
    let remainingDamage = damage;
    let shieldsHit = false;
    let penetration = false;

    // Apply to shields first
    if (ship.shields.current > 0) {
      const shieldAbsorbed = Math.min(remainingDamage, ship.shields.current);
      ship.shields.current -= shieldAbsorbed;
      remainingDamage -= shieldAbsorbed;
      shieldsHit = true;

      // Start shield recharge cooldown
      ship.shields.recharging = false;
      ship.shields.rechargeCooldown = 3; // 3 seconds
    }

    // Apply remaining damage to hull
    if (remainingDamage > 0) {
      ship.hull.current = Math.max(0, ship.hull.current - remainingDamage);
      penetration = true;

      // Check for system damage
      if (penetration && Math.random() < 0.3) {
        this.applySystemDamage(ship);
      }

      // Check for destruction
      if (ship.hull.current <= 0) {
        target.status = 'destroyed';
        this.combatState.stats.shipsDestroyed++;
      }
    }

    return {
      amount: damage,
      type: damageType,
      target: shieldsHit && !penetration ? 'shields' : 'hull',
      penetration
    };
  }

  /**
   * Apply system damage
   */
  private applySystemDamage(ship: any): void {
    const systems = ['engines', 'sensors', 'communications', 'navigation', 'power'];
    const damagedSystem = systems[Math.floor(Math.random() * systems.length)];
    const damage = 0.1 + Math.random() * 0.3; // 10-40% damage
    
    ship.systems[damagedSystem] = Math.max(0, ship.systems[damagedSystem] - damage);
  }

  /**
   * Generate damage effects
   */
  private generateDamageEffects(damage: DamageResult, target: CombatParticipant): CombatEffect[] {
    const effects: CombatEffect[] = [
      {
        type: 'damage',
        target: target.id,
        value: damage.amount,
        description: `${damage.amount} ${damage.type} damage`
      }
    ];

    if (damage.penetration) {
      effects.push({
        type: 'shield_down',
        target: target.id,
        value: 1,
        description: 'Shields penetrated'
      });
    }

    return effects;
  }

  /**
   * Purchase weapon license
   */
  purchaseWeaponLicense(licenseType: string): boolean {
    const license = this.licenseDatabase.get(licenseType);
    if (!license || !license.required) return false;

    if (!this.playerManager.spendCredits(license.cost)) {
      return false;
    }

    const playerLicense: PlayerWeaponLicense = {
      licenseType: license.type!,
      issuingAuthority: license.issuingAuthority!,
      issueDate: this.timeManager.getCurrentTimestamp(),
      expiryDate: this.timeManager.getCurrentTimestamp() + (license.validityPeriod * 24 * 60 * 60 * 1000),
      cost: license.cost,
      restrictions: [...license.restrictions],
      status: 'active'
    };

    this.combatState.playerLicenses.push(playerLicense);
    return true;
  }

  /**
   * Check if player can legally use a weapon
   */
  canUseWeapon(weaponId: string, currentLocation: string): boolean {
    const weapon = this.weaponDatabase.get(weaponId);
    if (!weapon || !weapon.license.required) return true;

    const requiredLicense = weapon.license.type;
    const playerLicense = this.combatState.playerLicenses.find(
      license => license.licenseType === requiredLicense && license.status === 'active'
    );

    if (!playerLicense) return false;

    // Check license expiry
    if (playerLicense.expiryDate < this.timeManager.getCurrentTimestamp()) {
      playerLicense.status = 'expired';
      return false;
    }

    // Check restrictions
    for (const restriction of playerLicense.restrictions) {
      if (restriction.type === 'location' && restriction.prohibited.includes(currentLocation)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update combat system
   */
  update(): void {
    const currentTime = this.timeManager.getCurrentTimestamp();

    // Update active encounters
    for (const encounter of this.combatState.activeEncounters.values()) {
      this.updateEncounter(encounter, currentTime);
    }

    // Update shield recharge for all participants
    this.updateShieldRecharge();

    // Update weapon cooldowns
    this.updateWeaponCooldowns();

    // Check for encounter timeouts
    this.checkEncounterTimeouts(currentTime);
  }

  /**
   * Update individual encounter
   */
  private updateEncounter(encounter: CombatEncounter, currentTime: number): void {
    if (encounter.status !== 'active') return;

    // Update AI decision making
    for (const participant of encounter.participants) {
      if (participant.type === 'ai' && participant.ai && participant.status === 'active') {
        this.updateCombatAI(participant, encounter, currentTime);
      }
    }

    // Check victory conditions
    this.checkVictoryConditions(encounter);
  }

  /**
   * Update combat AI for participant
   */
  private updateCombatAI(participant: CombatParticipant, encounter: CombatEncounter, currentTime: number): void {
    const ai = participant.ai!;
    
    if (currentTime - ai.decisionCooldown < 1000) return; // 1 second cooldown

    // Update threat assessment
    this.updateThreatAssessment(participant, encounter);

    // Make AI decision
    const action = this.generateAIAction(participant, encounter);
    if (action) {
      this.executeCombatAction(action);
      ai.decisionCooldown = currentTime;
    }
  }

  /**
   * Update threat assessment
   */
  private updateThreatAssessment(participant: CombatParticipant, encounter: CombatEncounter): void {
    const ai = participant.ai!;
    let totalThreat = 0;

    for (const other of encounter.participants) {
      if (other.id === participant.id || other.status !== 'active') continue;

      // Calculate threat level based on weapons, shields, hull, etc.
      const threat = this.calculateThreatLevel(other, participant);
      ai.threatAssessment.targets[other.id] = {
        threatLevel: threat,
        priority: threat * (other.type === 'player' ? 2 : 1),
        lastUpdate: this.timeManager.getCurrentTimestamp()
      };
      totalThreat += threat;
    }

    ai.threatAssessment.overallThreat = totalThreat;

    // Determine recommended action
    if (totalThreat > 8) {
      ai.threatAssessment.recommendedAction = 'retreat';
    } else if (totalThreat > 5) {
      ai.threatAssessment.recommendedAction = 'defend';
    } else {
      ai.threatAssessment.recommendedAction = 'attack';
    }
  }

  /**
   * Calculate threat level of a target
   */
  private calculateThreatLevel(target: CombatParticipant, _observer: CombatParticipant): number {
    const ship = target.ship;
    let threat = 0;

    // Hull and shields contribute to threat
    threat += (ship.hull.current / ship.hull.maximum) * 3;
    threat += (ship.shields.current / ship.shields.maximum) * 2;

    // Weapons contribute to threat (simplified)
    threat += ship.weapons.length * 1.5;

    // Player ships are inherently more threatening
    if (target.type === 'player') {
      threat *= 1.5;
    }

    return Math.min(10, threat);
  }

  /**
   * Generate AI action
   */
  private generateAIAction(participant: CombatParticipant, encounter: CombatEncounter): CombatAction | null {
    const ai = participant.ai!;
    
    // Check retreat conditions
    const hullPercentage = participant.ship.hull.current / participant.ship.hull.maximum;
    if (hullPercentage < ai.tactics.retreatThreshold) {
      return {
        id: `action-${this.nextActionId++}`,
        actorId: participant.id,
        type: 'retreat',
        parameters: {},
        timestamp: this.timeManager.getCurrentTimestamp(),
        resolved: false
      };
    }

    // Find best target
    const target = this.findBestTarget(participant, encounter);
    if (!target) return null;

    // Generate attack action
    return {
      id: `action-${this.nextActionId++}`,
      actorId: participant.id,
      type: 'attack',
      targetId: target.id,
      parameters: {
        weaponId: 'pulse-laser-mk1' // Simplified weapon selection
      },
      timestamp: this.timeManager.getCurrentTimestamp(),
      resolved: false
    };
  }

  /**
   * Find best target for AI
   */
  private findBestTarget(participant: CombatParticipant, encounter: CombatEncounter): CombatParticipant | null {
    const ai = participant.ai!;
    let bestTarget: CombatParticipant | null = null;
    let bestScore = 0;

    for (const other of encounter.participants) {
      if (other.id === participant.id || other.status !== 'active') continue;
      if (participant.faction && other.faction === participant.faction) continue;

      const threat = ai.threatAssessment.targets[other.id];
      if (!threat) continue;

      let score = threat.priority;
      
      // Modify score based on targeting preference
      switch (ai.tactics.targeting) {
        case 'nearest': {
          const distance = this.calculateDistance(participant.position, other.position);
          score += Math.max(0, 10 - distance / 100);
          break;
        }
        case 'weakest': {
          const weakness = 1 - (other.ship.hull.current / other.ship.hull.maximum);
          score += weakness * 5;
          break;
        }
        case 'strongest': {
          const strength = other.ship.hull.current / other.ship.hull.maximum;
          score += strength * 5;
          break;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = other;
      }
    }

    return bestTarget;
  }

  // Helper methods
  private findParticipant(id: string): CombatParticipant | null {
    for (const encounter of this.combatState.activeEncounters.values()) {
      const participant = encounter.participants.find(p => p.id === id);
      if (participant) return participant;
    }
    return null;
  }

  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateManeuverability(shipClass: string): number {
    const maneuverabilityMap: Record<string, number> = {
      'courier': 0.9,
      'light-freighter': 0.7,
      'heavy-freighter': 0.5,
      'combat': 0.8
    };
    return maneuverabilityMap[shipClass] || 0.6;
  }

  private getShipSizeCategory(shipClass: string): any {
    const sizeMap: Record<string, any> = {
      'courier': 'corvette',
      'light-freighter': 'corvette',
      'heavy-freighter': 'frigate',
      'combat': 'corvette'
    };
    return sizeMap[shipClass] || 'corvette';
  }

  private generateEnvironment(): any {
    // Simplified environment generation
    return {
      location: 'open_space',
      conditions: [],
      visibility: 1.0,
      gravity: 0.0,
      hazards: []
    };
  }

  private generateObjectives(_type: EncounterType, _participants: CombatParticipant[]): any[] {
    return [
      {
        id: 'survive',
        type: 'survive',
        description: 'Survive the encounter',
        completed: false,
        optional: false,
        rewards: []
      }
    ];
  }

  private generateRewards(_type: EncounterType, _participants: CombatParticipant[]): any[] {
    return [
      {
        type: 'credits',
        amount: 500 + Math.floor(Math.random() * 1000),
        description: 'Combat pay'
      }
    ];
  }

  private generateFactionalForces(_systemId: string): CombatParticipant[] {
    return [this.generateGenericEnemy()];
  }

  private generateBountyHunter(): CombatParticipant {
    return {
      id: 'bounty-hunter',
      name: 'Bounty Hunter',
      type: 'ai',
      ship: this.generateEnemyShip('heavy-combat'),
      position: { x: 700, y: 300 },
      status: 'active',
      ai: this.generatePirateAI()
    };
  }

  private generateAmbushForce(): CombatParticipant[] {
    return [
      this.generateGenericEnemy(),
      this.generateGenericEnemy()
    ];
  }

  private generateGenericEnemy(): CombatParticipant {
    return {
      id: `enemy-${Math.random()}`,
      name: 'Unknown Vessel',
      type: 'ai',
      ship: this.generateEnemyShip('light-combat'),
      position: { x: Math.random() * 200 + 700, y: Math.random() * 200 + 300 },
      status: 'active',
      ai: this.generatePirateAI()
    };
  }

  private executeMove(action: CombatAction, actor: CombatParticipant): CombatResult {
    // Simplified move implementation
    return {
      action,
      success: true,
      effects: [],
      message: `${actor.name} moved`
    };
  }

  private executeDefend(action: CombatAction, actor: CombatParticipant): CombatResult {
    // Simplified defend implementation
    return {
      action,
      success: true,
      effects: [],
      message: `${actor.name} is defending`
    };
  }

  private executeRetreat(action: CombatAction, actor: CombatParticipant): CombatResult {
    actor.status = 'fled';
    this.combatState.stats.encountersFled++;
    
    return {
      action,
      success: true,
      effects: [],
      message: `${actor.name} has fled the battle`
    };
  }

  private updateShieldRecharge(): void {
    // Simplified shield recharge update
    for (const encounter of this.combatState.activeEncounters.values()) {
      for (const participant of encounter.participants) {
        if (participant.status !== 'active') continue;
        
        const ship = participant.ship;
        if (ship.shields.rechargeCooldown > 0) {
          ship.shields.rechargeCooldown -= 1;
        } else if (ship.shields.current < ship.shields.maximum) {
          ship.shields.current = Math.min(
            ship.shields.maximum,
            ship.shields.current + 5 // 5 shield points per update
          );
        }
      }
    }
  }

  private updateWeaponCooldowns(): void {
    // Weapon cooldown updates would be implemented here
  }

  private checkEncounterTimeouts(currentTime: number): void {
    // Check for encounters that have been running too long
    for (const [encounterId, encounter] of this.combatState.activeEncounters) {
      if (currentTime - encounter.startTime > 30 * 60 * 1000) { // 30 minutes
        encounter.status = 'resolved';
        this.combatState.activeEncounters.delete(encounterId);
        this.combatState.combatHistory.push(encounter);
      }
    }
  }

  private checkVictoryConditions(encounter: CombatEncounter): void {
    const activeParticipants = encounter.participants.filter(p => p.status === 'active');
    const playerAlive = activeParticipants.some(p => p.type === 'player');
    const enemiesAlive = activeParticipants.some(p => p.type === 'ai');

    if (!playerAlive) {
      encounter.status = 'resolved';
      this.combatState.stats.encountersLost++;
    } else if (!enemiesAlive) {
      encounter.status = 'resolved';
      this.combatState.stats.encountersWon++;
    }
  }

  // Public API methods
  
  /**
   * Get available weapons
   */
  getAvailableWeapons(): Weapon[] {
    return Array.from(this.weaponDatabase.values());
  }

  /**
   * Get available shields
   */
  getAvailableShields(): Shield[] {
    return Array.from(this.shieldDatabase.values());
  }

  /**
   * Get combat state
   */
  getCombatState(): CombatState {
    return this.combatState;
  }

  /**
   * Get active encounters
   */
  getActiveEncounters(): CombatEncounter[] {
    return Array.from(this.combatState.activeEncounters.values());
  }

  /**
   * Get combat statistics
   */
  getCombatStats(): CombatStats {
    return this.combatState.stats;
  }

  /**
   * Get player weapon licenses
   */
  getPlayerLicenses(): PlayerWeaponLicense[] {
    return this.combatState.playerLicenses;
  }

  /**
   * Purchase weapon
   */
  purchaseWeapon(weaponId: string): boolean {
    const weapon = this.weaponDatabase.get(weaponId);
    if (!weapon) return false;

    if (this.playerManager.spendCredits(weapon.cost)) {
      this.combatState.playerWeapons.push(weapon);
      return true;
    }
    
    return false;
  }

  /**
   * Start random encounter
   */
  triggerRandomEncounter(): CombatEncounter | null {
    // Get current system from player's current station via world manager
    const currentStation = this.playerManager.getCurrentStation();
    if (!currentStation) {
      return null;
    }
    
    // Use the galaxy's current player location for the system
    const galaxy = this.worldManager.getGalaxy();
    const currentSystem = galaxy.currentPlayerLocation.systemId || 'default-system';
    
    const encounterTypes: EncounterType[] = ['pirate-attack', 'patrol-inspection', 'bounty-hunter'];
    const randomType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
    
    return this.generateEncounter(randomType, currentSystem);
  }

  /**
   * Serialize combat state
   */
  serialize(): any {
    return {
      combatState: {
        ...this.combatState,
        activeEncounters: Array.from(this.combatState.activeEncounters.entries())
      },
      nextEncounterId: this.nextEncounterId,
      nextActionId: this.nextActionId
    };
  }

  /**
   * Deserialize combat state
   */
  deserialize(data: any): void {
    if (data.combatState) {
      this.combatState = {
        ...data.combatState,
        activeEncounters: new Map(data.combatState.activeEncounters || [])
      };
    }
    
    if (data.nextEncounterId) this.nextEncounterId = data.nextEncounterId;
    if (data.nextActionId) this.nextActionId = data.nextActionId;
  }
}