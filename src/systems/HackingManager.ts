import {
  HackingEquipment,
  HackingSoftware,
  HackingTarget,
  HackingTargetType,
  HackingAttempt,
  HackingMinigame,
  HackingResult,
  HackedData,
  DataType,
  SystemAccess,
  HackingSession,
  HackingStats,
  HackingState,
  DataMarket,
  DataTransaction,
  ElectronicWarfare,
  WarfareType,
  Countermeasure,
  HackingPhase,
  AccessLevel,
  AccessLevelInfo
} from '../types/hacking';
import { TimeManager } from './TimeManager';
import { WorldManager } from './WorldManager';
import { PlayerManager } from './PlayerManager';
import { FactionManager } from './FactionManager';
import { SecurityManager } from './SecurityManager';
import { CharacterManager } from './CharacterManager';

/**
 * HackingManager handles all hacking and electronic warfare systems.
 * 
 * Responsibilities:
 * - Managing hacking equipment and software
 * - Coordinating hacking attempts and minigames
 * - Data theft and information market mechanics
 * - Electronic warfare capabilities
 * - Countermeasure systems and defensive mechanics
 * - Integration with security, reputation, and legal systems
 * 
 * Features:
 * - Realistic hacking minigames with skill-based success
 * - Comprehensive data types and information marketplace
 * - Electronic warfare for ship-to-ship and system disruption
 * - Dynamic countermeasure systems
 * - Legal consequences and reputation impacts
 * - Integration with character progression and faction systems
 */
export class HackingManager {
  private timeManager: TimeManager;
  private worldManager: WorldManager;
  private playerManager: PlayerManager;
  private factionManager: FactionManager;
  private securityManager: SecurityManager;
  private characterManager: CharacterManager;

  // System state
  private hackingState: HackingState;
  private nextAttemptId = 1;
  private nextSessionId = 1;
  private nextDataId = 1;

  // Equipment and software databases
  private equipmentDatabase: Map<string, HackingEquipment> = new Map();
  private softwareDatabase: Map<string, HackingSoftware> = new Map();
  private targetDatabase: Map<string, HackingTarget> = new Map();
  private dataMarkets: Map<string, DataMarket> = new Map();
  private countermeasuresDatabase: Map<string, Countermeasure> = new Map();

  // Access level definitions
  private accessLevels: Map<AccessLevel, AccessLevelInfo> = new Map([
    [0, { level: 0, name: 'Public', description: 'Publicly accessible information', difficulty: 1.0 }],
    [1, { level: 1, name: 'User', description: 'Basic authenticated user access', difficulty: 2.0 }],
    [2, { level: 2, name: 'Administrative', description: 'System management access', difficulty: 4.0 }],
    [3, { level: 3, name: 'Security', description: 'Security monitoring access', difficulty: 8.0 }],
    [4, { level: 4, name: 'Root', description: 'Complete system control', difficulty: 16.0 }]
  ]);

  constructor(
    timeManager: TimeManager,
    worldManager: WorldManager,
    playerManager: PlayerManager,
    factionManager: FactionManager,
    securityManager: SecurityManager,
    characterManager: CharacterManager
  ) {
    this.timeManager = timeManager;
    this.worldManager = worldManager;
    this.playerManager = playerManager;
    this.factionManager = factionManager;
    this.securityManager = securityManager;
    this.characterManager = characterManager;

    // Initialize hacking state
    this.hackingState = {
      activeAttempts: new Map(),
      activeSessions: new Map(),
      ownedEquipment: [],
      ownedSoftware: [],
      stolenData: [],
      systemAccess: [],
      stats: {
        attemptsTotal: 0,
        attemptsSuccessful: 0,
        timesDetected: 0,
        dataStolen: 0,
        creditsEarned: 0,
        systemsCompromised: 0,
        skillLevel: 1,
        experience: 0,
        specializations: [],
        highestAccessLevel: 0,
        mostValuableDataStolen: 0,
        longestSessionDuration: 0
      },
      knownMarkets: [],
      marketReputation: new Map(),
      activeWarrants: [],
      criminalRecord: []
    };

    this.initializeEquipment();
    this.initializeSoftware();
    this.initializeTargets();
    this.initializeDataMarkets();
    this.initializeCountermeasures();
  }

  /**
   * Initialize hacking equipment database
   */
  private initializeEquipment(): void {
    const equipment: HackingEquipment[] = [
      {
        id: 'handheld-basic',
        name: 'Basic Handheld Computer',
        type: 'handheld',
        capabilities: {
          maxAccessLevel: 1,
          encryptionBreaking: 2,
          stealthBonus: 0.1,
          processingPower: 1
        },
        requirements: {
          powerConsumption: 10,
          skillRequired: 0
        },
        cost: 2000,
        availability: 'common',
        description: 'Basic portable hacking device for simple intrusions'
      },
      {
        id: 'professional-rig',
        name: 'Professional Hacking Rig',
        type: 'professional',
        capabilities: {
          maxAccessLevel: 3,
          encryptionBreaking: 4,
          stealthBonus: 0.25,
          processingPower: 3
        },
        requirements: {
          powerConsumption: 50,
          skillRequired: 25
        },
        cost: 15000,
        availability: 'restricted',
        description: 'Advanced system for serious hackers and corporate espionage'
      },
      {
        id: 'military-cyber-suite',
        name: 'Military-Grade Cyber Warfare Suite',
        type: 'military',
        capabilities: {
          maxAccessLevel: 4,
          encryptionBreaking: 5,
          stealthBonus: 0.4,
          processingPower: 5
        },
        requirements: {
          powerConsumption: 150,
          skillRequired: 75
        },
        cost: 75000,
        availability: 'military',
        description: 'Top-tier military hacking system with warfare capabilities'
      }
    ];

    equipment.forEach(eq => this.equipmentDatabase.set(eq.id, eq));
  }

  /**
   * Initialize hacking software database
   */
  private initializeSoftware(): void {
    const software: HackingSoftware[] = [
      // Intrusion Programs
      {
        id: 'password-cracker-1',
        name: 'QuickCrack',
        category: 'intrusion',
        type: 'password-cracker',
        effectiveness: 2,
        detectionRisk: 0.3,
        cost: 500,
        skillRequired: 5,
        description: 'Basic password cracking utility'
      },
      {
        id: 'vuln-scanner-2',
        name: 'SysProbe Advanced',
        category: 'intrusion',
        type: 'vulnerability-scanner',
        effectiveness: 4,
        detectionRisk: 0.2,
        cost: 2500,
        skillRequired: 30,
        description: 'Advanced vulnerability detection system'
      },
      {
        id: 'privilege-escalation-3',
        name: 'AdminBoost Pro',
        category: 'intrusion',
        type: 'privilege-escalation',
        effectiveness: 5,
        detectionRisk: 0.4,
        cost: 8000,
        skillRequired: 50,
        description: 'Professional privilege escalation toolkit'
      },
      
      // Data Tools
      {
        id: 'encryption-breaker-2',
        name: 'CipherBreak',
        category: 'data',
        type: 'encryption-breaker',
        effectiveness: 3,
        detectionRisk: 0.1,
        cost: 3000,
        skillRequired: 25,
        description: 'Moderate encryption breaking capabilities'
      },
      {
        id: 'data-recovery-1',
        name: 'UnDelete Plus',
        category: 'data',
        type: 'data-recovery',
        effectiveness: 3,
        detectionRisk: 0.05,
        cost: 1200,
        skillRequired: 15,
        description: 'Recover deleted files and hidden data'
      },
      
      // Warfare Programs
      {
        id: 'system-disruptor-3',
        name: 'ChaosEngine',
        category: 'warfare',
        type: 'system-disruptor',
        effectiveness: 4,
        detectionRisk: 0.8,
        cost: 12000,
        skillRequired: 60,
        description: 'Causes widespread system malfunctions'
      },
      {
        id: 'stealth-tool-2',
        name: 'GhostCloak',
        category: 'intrusion',
        type: 'stealth-tool',
        effectiveness: 3,
        detectionRisk: -0.3, // Reduces detection risk
        cost: 4500,
        skillRequired: 35,
        description: 'Advanced stealth and anonymity tools'
      }
    ];

    software.forEach(sw => this.softwareDatabase.set(sw.id, sw));
  }

  /**
   * Initialize hacking targets database
   */
  private initializeTargets(): void {
    const stations = this.worldManager.getAllStations();
    
    stations.forEach(station => {
      // Create station-based targets
      const targets: HackingTarget[] = [
        {
          id: `${station.id}-security`,
          name: `${station.name} Security Network`,
          type: 'station-security',
          location: { stationId: station.id },
          security: {
            accessLevel: 3,
            encryptionStrength: 4,
            monitoring: 5,
            countermeasures: true
          },
          value: {
            informationWorth: 15000,
            strategicValue: 8,
            riskLevel: 9
          },
          description: 'Station security monitoring and access control systems'
        },
        {
          id: `${station.id}-economic`,
          name: `${station.name} Economic Database`,
          type: 'station-economic',
          location: { stationId: station.id },
          security: {
            accessLevel: 2,
            encryptionStrength: 3,
            monitoring: 4,
            countermeasures: false
          },
          value: {
            informationWorth: 8000,
            strategicValue: 6,
            riskLevel: 5
          },
          description: 'Trading records, financial data, and market intelligence'
        },
        {
          id: `${station.id}-communications`,
          name: `${station.name} Communication Hub`,
          type: 'network-communication',
          location: { stationId: station.id },
          security: {
            accessLevel: 1,
            encryptionStrength: 2,
            monitoring: 3,
            countermeasures: false
          },
          value: {
            informationWorth: 5000,
            strategicValue: 4,
            riskLevel: 3
          },
          description: 'Station communications and message routing'
        }
      ];
      
      targets.forEach(target => this.targetDatabase.set(target.id, target));
    });
  }

  /**
   * Initialize data markets
   */
  private initializeDataMarkets(): void {
    const markets: DataMarket[] = [
      {
        id: 'underground-nexus',
        name: 'Data Nexus',
        location: 'outer-station',
        reputation: 'underground',
        accessibility: {
          reputationRequired: -20,
          skillRequired: 15,
          contactRequired: undefined
        },
        pricing: {
          basePriceMultiplier: 0.6,
          qualityBonus: 0.3,
          freshnessBonus: 0.2,
          riskPenalty: 0.1
        }
      },
      {
        id: 'corporate-broker',
        name: 'InfoTech Solutions',
        location: 'earth-station',
        reputation: 'gray-market',
        accessibility: {
          reputationRequired: 10,
          skillRequired: 25,
          contactRequired: undefined
        },
        pricing: {
          basePriceMultiplier: 1.2,
          qualityBonus: 0.5,
          freshnessBonus: 0.4,
          riskPenalty: -0.2
        }
      }
    ];

    markets.forEach(market => this.dataMarkets.set(market.id, market));
  }

  /**
   * Initialize countermeasures database
   */
  private initializeCountermeasures(): void {
    const countermeasures: Countermeasure[] = [
      {
        type: 'firewall',
        effectiveness: 3,
        cost: 5000,
        powerRequirement: 20,
        description: 'Basic network firewall protection',
        activeResponse: false
      },
      {
        type: 'intrusion-detection',
        effectiveness: 4,
        cost: 8000,
        powerRequirement: 30,
        description: 'Monitors for unauthorized access attempts',
        activeResponse: false
      },
      {
        type: 'trace-back',
        effectiveness: 5,
        cost: 15000,
        powerRequirement: 50,
        description: 'Attempts to trace hackers back to their location',
        activeResponse: true
      },
      {
        type: 'auto-lockout',
        effectiveness: 6,
        cost: 12000,
        powerRequirement: 25,
        description: 'Automatically locks out suspicious connections',
        activeResponse: true
      }
    ];

    countermeasures.forEach(cm => this.countermeasuresDatabase.set(cm.type, cm));
  }

  /**
   * Start a new hacking attempt
   */
  startHackingAttempt(targetId: string, equipmentId: string, softwareIds: string[]): HackingAttempt | null {
    const target = this.targetDatabase.get(targetId);
    const equipment = this.equipmentDatabase.get(equipmentId);
    
    if (!target || !equipment) {
      return null;
    }

    // Check if player owns the equipment
    if (!this.hackingState.ownedEquipment.find(eq => eq.id === equipmentId)) {
      return null;
    }

    // Check if equipment can handle target's security level
    if (equipment.capabilities.maxAccessLevel < target.security.accessLevel) {
      return null;
    }

    // Create new attempt
    const attemptId = `attempt-${this.nextAttemptId++}`;
    const attempt: HackingAttempt = {
      id: attemptId,
      targetId,
      playerId: 'player-1', // TODO: Get actual player ID
      startTime: this.timeManager.getCurrentTimestamp(),
      phase: 'reconnaissance',
      progress: {
        currentPhase: 'reconnaissance',
        phaseProgress: 0,
        overallProgress: 0
      },
      equipment: {
        hardwareId: equipmentId,
        softwareIds: softwareIds.filter(id => this.softwareDatabase.has(id))
      },
      status: 'active',
      detection: {
        riskAccumulated: 0,
        detected: false,
        tracebackLevel: 0
      }
    };

    // Create hacking session
    const session: HackingSession = {
      attemptId,
      target,
      equipment,
      software: softwareIds.map(id => this.softwareDatabase.get(id)!).filter(Boolean),
      phaseResults: {},
      totalDetectionRisk: 0,
      startTime: this.timeManager.getCurrentTimestamp()
    };

    this.hackingState.activeAttempts.set(attemptId, attempt);
    this.hackingState.activeSessions.set(attemptId, session);
    this.hackingState.stats.attemptsTotal++;

    return attempt;
  }

  /**
   * Generate a minigame for the current hacking phase
   */
  generateMinigame(attemptId: string): HackingMinigame | null {
    const session = this.hackingState.activeSessions.get(attemptId);
    if (!session) return null;

    const attempt = this.hackingState.activeAttempts.get(attemptId);
    if (!attempt) return null;

    const difficulty = this.calculateDifficulty(session.target, session.equipment, attempt.phase);
    
    // Choose minigame type based on phase
    let minigameType: HackingMinigame['type'];
    switch (attempt.phase) {
      case 'reconnaissance':
        minigameType = 'pattern-match';
        break;
      case 'penetration':
        minigameType = 'password-crack';
        break;
      case 'exploitation':
        minigameType = 'circuit-bypass';
        break;
      case 'cleanup':
        minigameType = 'code-inject';
        break;
      default:
        minigameType = 'password-crack';
    }

    const minigame: HackingMinigame = {
      type: minigameType,
      difficulty,
      timeLimit: Math.max(30, 120 - difficulty * 10), // 30-120 seconds based on difficulty
      parameters: this.generateMinigameParameters(minigameType, difficulty),
      success: false,
      score: 0
    };

    session.currentMinigame = minigame;
    return minigame;
  }

  /**
   * Process minigame completion
   */
  completeMinigame(attemptId: string, success: boolean, score: number): boolean {
    const session = this.hackingState.activeSessions.get(attemptId);
    const attempt = this.hackingState.activeAttempts.get(attemptId);
    
    if (!session || !attempt || !session.currentMinigame) {
      return false;
    }

    const minigame = session.currentMinigame;
    minigame.success = success;
    minigame.score = score;

    // Calculate detection risk based on performance
    const baseRisk = this.calculateBaseDetectionRisk(session.target, attempt.phase);
    const performanceModifier = success ? (score / 100) : 1.5; // Good performance reduces risk
    const stealthBonus = session.equipment.capabilities.stealthBonus;
    
    const detectionRisk = Math.max(0, baseRisk * performanceModifier * (1 - stealthBonus));
    
    // Update phase results
    session.phaseResults[attempt.phase] = {
      success,
      timeSpent: (this.timeManager.getCurrentTimestamp() - session.startTime) / 1000,
      detectionRisk
    };

    session.totalDetectionRisk += detectionRisk;
    attempt.detection.riskAccumulated = session.totalDetectionRisk;

    // Check for detection
    if (session.totalDetectionRisk > 75 && Math.random() < 0.3) {
      attempt.detection.detected = true;
      attempt.status = 'detected';
      this.handleDetection(attemptId);
      return false;
    }

    if (success) {
      // Advance to next phase or complete
      const phases: HackingPhase[] = ['reconnaissance', 'penetration', 'exploitation', 'cleanup'];
      const currentIndex = phases.indexOf(attempt.phase);
      
      if (currentIndex < phases.length - 1) {
        attempt.phase = phases[currentIndex + 1];
        attempt.progress.currentPhase = attempt.phase;
        attempt.progress.phaseProgress = 0;
        attempt.progress.overallProgress = ((currentIndex + 1) / phases.length) * 100;
      } else {
        // Hacking completed successfully
        attempt.status = 'success';
        attempt.progress.overallProgress = 100;
        this.completeHackingAttempt(attemptId);
      }
    } else {
      // Phase failed
      attempt.status = 'failed';
      this.failHackingAttempt(attemptId);
    }

    session.currentMinigame = undefined;
    return true;
  }

  /**
   * Complete successful hacking attempt
   */
  private completeHackingAttempt(attemptId: string): void {
    const session = this.hackingState.activeSessions.get(attemptId);
    const attempt = this.hackingState.activeAttempts.get(attemptId);
    
    if (!session || !attempt) return;

    // Generate hacking results
    const result = this.generateHackingResult(session);
    
    // Store stolen data
    if (result.data) {
      this.hackingState.stolenData.push(...result.data);
      this.hackingState.stats.dataStolen += result.data.length;
      
      const totalValue = result.data.reduce((sum, data) => sum + data.marketValue, 0);
      if (totalValue > this.hackingState.stats.mostValuableDataStolen) {
        this.hackingState.stats.mostValuableDataStolen = totalValue;
      }
    }

    // Store system access
    if (result.systemAccess) {
      this.hackingState.systemAccess.push(...result.systemAccess);
      this.hackingState.stats.systemsCompromised += result.systemAccess.length;
      
      const maxAccessLevel = Math.max(...result.systemAccess.map(access => access.accessLevel));
      if (maxAccessLevel > this.hackingState.stats.highestAccessLevel) {
        this.hackingState.stats.highestAccessLevel = maxAccessLevel as AccessLevel;
      }
    }

    // Update statistics
    this.hackingState.stats.attemptsSuccessful++;
    
    const sessionDuration = (this.timeManager.getCurrentTimestamp() - session.startTime) / 1000;
    if (sessionDuration > this.hackingState.stats.longestSessionDuration) {
      this.hackingState.stats.longestSessionDuration = sessionDuration;
    }

    // Award experience
    this.awardHackingExperience(session.target.security.accessLevel, session.target.value.strategicValue);

    // Handle consequences
    this.processConsequences(result, session.target);

    // Clean up
    this.hackingState.activeAttempts.delete(attemptId);
    this.hackingState.activeSessions.delete(attemptId);
  }

  /**
   * Handle failed hacking attempt
   */
  private failHackingAttempt(attemptId: string): void {
    const session = this.hackingState.activeSessions.get(attemptId);
    const attempt = this.hackingState.activeAttempts.get(attemptId);
    
    if (!session || !attempt) return;

    // Award minimal experience for the attempt
    this.awardHackingExperience(1, 1);

    // Clean up
    this.hackingState.activeAttempts.delete(attemptId);
    this.hackingState.activeSessions.delete(attemptId);
  }

  /**
   * Handle detection during hacking
   */
  private handleDetection(attemptId: string): void {
    const session = this.hackingState.activeSessions.get(attemptId);
    const attempt = this.hackingState.activeAttempts.get(attemptId);
    
    if (!session || !attempt) return;

    this.hackingState.stats.timesDetected++;

    // Calculate trace-back level
    const traceLevel = Math.min(3, Math.floor(session.totalDetectionRisk / 30));
    attempt.detection.tracebackLevel = traceLevel;

    // Trigger security response
    if (session.target.location.stationId) {
      this.securityManager.reportCrime(
        'hacking',
        session.target.location.stationId || 'unknown-location',
        [{ type: 'digital', reliability: 75, description: `Digital intrusion attempt on ${session.target.name}`, source: 'intrusion-detection-system' }]
      );
    }

    // Add to criminal record if identified
    if (traceLevel >= 2) {
      this.hackingState.criminalRecord.push(`Hacking attempt on ${session.target.name} at ${new Date().toISOString()}`);
    }

    // Clean up
    this.hackingState.activeAttempts.delete(attemptId);
    this.hackingState.activeSessions.delete(attemptId);
  }

  /**
   * Generate hacking result based on target and success
   */
  private generateHackingResult(session: HackingSession): HackingResult {
    const target = session.target;
    const data: HackedData[] = [];
    const systemAccess: SystemAccess[] = [];

    // Generate stolen data based on target type
    const dataTypes = this.getDataTypesForTarget(target.type);
    dataTypes.forEach(dataType => {
      if (Math.random() < 0.7) { // 70% chance for each data type
        const hackedData: HackedData = {
          id: `data-${this.nextDataId++}`,
          type: dataType,
          sourceTargetId: target.id,
          quality: Math.floor(Math.random() * 3) + 3, // 3-5 quality
          freshness: Math.floor(Math.random() * 48), // 0-48 hours old
          marketValue: this.calculateDataValue(dataType, target),
          content: {
            title: this.generateDataTitle(dataType, target),
            description: this.generateDataDescription(dataType, target),
            details: this.generateDataDetails(dataType, target)
          },
          restrictions: {
            sellable: true,
            factionSensitive: [target.location.stationId ? this.worldManager.getAllStations().find(s => s.id === target.location.stationId)?.faction || '' : ''],
            legalRisk: Math.floor(target.value.riskLevel / 2)
          }
        };
        data.push(hackedData);
      }
    });

    // Generate system access
    systemAccess.push({
      targetId: target.id,
      accessLevel: target.security.accessLevel,
      capabilities: this.getCapabilitiesForAccessLevel(target.type, target.security.accessLevel),
      duration: 60 + Math.random() * 180, // 1-4 hours
      persistent: Math.random() < 0.3 // 30% chance for persistent access
    });

    return {
      success: true,
      data,
      systemAccess,
      consequences: {
        legal: [],
        reputation: [],
        security: []
      },
      detection: {
        detected: false,
        traceLevel: 0,
        evidenceLeft: []
      }
    };
  }

  /**
   * Electronic warfare capabilities
   */
  launchElectronicAttack(targetId: string, warfareType: WarfareType): ElectronicWarfare | null {
    // Check if player has appropriate software
    const requiredSoftware = this.hackingState.ownedSoftware.find(sw => sw.category === 'warfare');
    if (!requiredSoftware) {
      return null;
    }

    // Check skill requirements
    const character = this.characterManager.getCharacter();
    const hackingSkill = character?.skills.security || 0;
    
    if (hackingSkill < 40) {
      return null; // Electronic warfare requires advanced hacking skills
    }

    const warfare: ElectronicWarfare = {
      type: warfareType,
      targetId,
      duration: 30 + Math.random() * 120, // 30 seconds to 2.5 minutes
      effectiveness: Math.min(95, hackingSkill + Math.random() * 30),
      detectability: 0.8 - (hackingSkill / 200), // Higher skill reduces detection
      reversible: warfareType !== 'life-support-sabotage' // Life support sabotage is permanent
    };

    // Apply the attack effects
    this.applyElectronicWarfareEffects(warfare);

    return warfare;
  }

  /**
   * Apply electronic warfare effects
   */
  private applyElectronicWarfareEffects(warfare: ElectronicWarfare): void {
    // This would integrate with ship/station systems to apply actual effects
    console.log(`Electronic warfare attack: ${warfare.type} on ${warfare.targetId} (${warfare.effectiveness}% effective)`);
    
    // Report crime if detected
    if (Math.random() < warfare.detectability) {
      this.securityManager.reportCrime(
        'cyber-warfare',
        warfare.targetId,
        [{ type: 'digital', reliability: 90, description: `Electronic warfare attack detected: ${warfare.type}`, source: 'security-monitoring-system' }]
      );
    }
  }

  /**
   * Sell stolen data to information market
   */
  sellDataToMarket(dataId: string, marketId: string): DataTransaction | null {
    const data = this.hackingState.stolenData.find(d => d.id === dataId);
    const market = this.dataMarkets.get(marketId);
    
    if (!data || !market) return null;
    if (!data.restrictions.sellable) return null;

    // Check market access
    const reputation = this.hackingState.marketReputation.get(marketId) || 0;
    if (reputation < market.accessibility.reputationRequired) return null;

    const character = this.characterManager.getCharacter();
    const hackingSkill = character?.skills.security || 0;
    if (hackingSkill < market.accessibility.skillRequired) return null;

    // Calculate sale price
    let price = data.marketValue * market.pricing.basePriceMultiplier;
    price *= 1 + (data.quality / 5) * market.pricing.qualityBonus;
    price *= 1 + (Math.max(0, 168 - data.freshness) / 168) * market.pricing.freshnessBonus;
    price *= 1 - (data.restrictions.legalRisk / 10) * market.pricing.riskPenalty;
    
    price = Math.floor(price);

    const transaction: DataTransaction = {
      id: `transaction-${Date.now()}`,
      marketId,
      dataId,
      type: 'sell',
      price,
      timestamp: this.timeManager.getCurrentTimestamp(),
      seller: 'player-1',
      anonymous: market.reputation === 'underground'
    };

    // Execute transaction
    this.playerManager.addCredits(price);
    this.hackingState.stolenData = this.hackingState.stolenData.filter(d => d.id !== dataId);
    this.hackingState.stats.creditsEarned += price;

    // Improve market reputation
    const currentRep = this.hackingState.marketReputation.get(marketId) || 0;
    this.hackingState.marketReputation.set(marketId, currentRep + 1);

    return transaction;
  }

  /**
   * Update hacking system (called by main game loop)
   */
  update(): void {
    const currentTime = this.timeManager.getCurrentTimestamp();

    // Update active attempts
    for (const [attemptId, attempt] of this.hackingState.activeAttempts) {
      // Time out inactive attempts after 30 minutes
      if (currentTime - attempt.startTime > 30 * 60 * 1000) {
        attempt.status = 'aborted';
        this.hackingState.activeAttempts.delete(attemptId);
        this.hackingState.activeSessions.delete(attemptId);
      }
    }

    // Expire system access
    this.hackingState.systemAccess = this.hackingState.systemAccess.filter(access => {
      const expireTime = access.duration * 60 * 1000; // Convert minutes to milliseconds
      return currentTime - access.duration < expireTime;
    });

    // Age data (reduces freshness)
    this.hackingState.stolenData.forEach(data => {
      data.freshness += 0.1; // Age by 6 minutes per hour
    });
  }

  // Helper methods

  private calculateDifficulty(target: HackingTarget, equipment: HackingEquipment, phase: HackingPhase): number {
    const accessLevelInfo = this.accessLevels.get(target.security.accessLevel);
    const baseDifficulty = accessLevelInfo?.difficulty || 1;
    
    const encryptionModifier = target.security.encryptionStrength / equipment.capabilities.encryptionBreaking;
    const monitoringModifier = target.security.monitoring / 5;
    const phaseModifier = phase === 'penetration' ? 1.5 : 1.0;
    
    return Math.floor(baseDifficulty * encryptionModifier * monitoringModifier * phaseModifier);
  }

  private calculateBaseDetectionRisk(target: HackingTarget, phase: HackingPhase): number {
    const baseRisk = target.security.monitoring * 2;
    const phaseMultiplier = {
      'reconnaissance': 0.5,
      'penetration': 1.5,
      'exploitation': 1.0,
      'cleanup': 0.3
    }[phase];
    
    return baseRisk * phaseMultiplier;
  }

  private generateMinigameParameters(type: HackingMinigame['type'], difficulty: number): any {
    switch (type) {
      case 'password-crack':
        return {
          length: Math.min(12, 4 + difficulty),
          complexity: Math.min(4, 1 + Math.floor(difficulty / 3)),
          attempts: Math.max(3, 8 - difficulty)
        };
      case 'pattern-match':
        return {
          gridSize: Math.min(6, 3 + Math.floor(difficulty / 2)),
          patternCount: Math.min(8, 2 + difficulty),
          timePerPattern: Math.max(2, 10 - difficulty)
        };
      case 'circuit-bypass':
        return {
          complexity: Math.min(10, 3 + difficulty),
          components: Math.min(15, 5 + difficulty * 2),
          errorTolerance: Math.max(1, 5 - Math.floor(difficulty / 2))
        };
      case 'code-inject':
        return {
          codeLength: Math.min(100, 20 + difficulty * 10),
          syntaxComplexity: Math.min(5, 1 + Math.floor(difficulty / 2)),
          injectionPoints: Math.min(8, 2 + difficulty)
        };
      default:
        return {};
    }
  }

  private getDataTypesForTarget(targetType: HackingTargetType): DataType[] {
    const typeMap: Record<HackingTargetType, DataType[]> = {
      'ship-navigation': ['personal-communications', 'trade-routes'],
      'ship-communication': ['personal-communications', 'faction-intelligence'],
      'ship-cargo': ['trade-routes', 'market-intelligence'],
      'station-security': ['security-protocols', 'faction-intelligence'],
      'station-economic': ['market-intelligence', 'financial-records', 'trade-routes'],
      'station-industrial': ['research-data', 'trade-routes'],
      'network-data': ['research-data', 'faction-intelligence'],
      'network-communication': ['personal-communications', 'faction-intelligence']
    };
    
    return typeMap[targetType] || [];
  }

  private calculateDataValue(dataType: DataType, target: HackingTarget): number {
    const baseValues: Record<DataType, number> = {
      'market-intelligence': 5000,
      'trade-routes': 3000,
      'personal-communications': 2000,
      'financial-records': 8000,
      'security-protocols': 10000,
      'research-data': 6000,
      'faction-intelligence': 12000,
      'military-data': 15000
    };
    
    const baseValue = baseValues[dataType] || 1000;
    const targetMultiplier = target.value.informationWorth / 10000;
    
    return Math.floor(baseValue * targetMultiplier);
  }

  private generateDataTitle(dataType: DataType, _target: HackingTarget): string {
    const templates: Record<DataType, string[]> = {
      'market-intelligence': ['Market Analysis Report', 'Commodity Price Forecast', 'Trade Volume Data'],
      'trade-routes': ['Shipping Manifests', 'Route Optimization Data', 'Cargo Schedule'],
      'personal-communications': ['Private Messages', 'Communication Logs', 'Personal Correspondence'],
      'financial-records': ['Financial Statements', 'Transaction Records', 'Account Ledgers'],
      'security-protocols': ['Security Procedures', 'Access Control Lists', 'Incident Reports'],
      'research-data': ['Research Documents', 'Technical Specifications', 'Development Plans'],
      'faction-intelligence': ['Internal Memos', 'Strategic Plans', 'Political Analysis'],
      'military-data': ['Classified Reports', 'Tactical Data', 'Defense Protocols']
    };
    
    const options = templates[dataType] || ['Data File'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateDataDescription(dataType: DataType, target: HackingTarget): string {
    return `${this.generateDataTitle(dataType, target)} obtained from ${target.name}`;
  }

  private generateDataDetails(_dataType: DataType, target: HackingTarget): any {
    // This would generate detailed data structures based on the data type
    return {
      source: target.name,
      accessLevel: target.security.accessLevel,
      timestamp: this.timeManager.getCurrentTime()
    };
  }

  private getCapabilitiesForAccessLevel(targetType: HackingTargetType, accessLevel: AccessLevel): string[] {
    const capabilities: string[] = [];
    
    if (accessLevel >= 1) capabilities.push('read-data');
    if (accessLevel >= 2) capabilities.push('modify-data', 'access-logs');
    if (accessLevel >= 3) capabilities.push('security-control', 'user-management');
    if (accessLevel >= 4) capabilities.push('system-control', 'complete-access');
    
    // Add target-specific capabilities
    switch (targetType) {
      case 'ship-navigation':
        if (accessLevel >= 2) capabilities.push('navigation-control');
        break;
      case 'station-security':
        if (accessLevel >= 3) capabilities.push('camera-access', 'door-control');
        break;
      case 'station-economic':
        if (accessLevel >= 2) capabilities.push('financial-transactions');
        break;
    }
    
    return capabilities;
  }



  private awardHackingExperience(accessLevel: AccessLevel, strategicValue: number): void {
    const baseExperience = accessLevel * 50 + strategicValue * 10;
    const experience = Math.floor(baseExperience * (1 + Math.random() * 0.5));
    
    this.hackingState.stats.experience += experience;
    
    // Level up check
    const requiredExp = this.hackingState.stats.skillLevel * 1000;
    if (this.hackingState.stats.experience >= requiredExp) {
      this.hackingState.stats.skillLevel++;
      this.hackingState.stats.experience -= requiredExp;
    }
  }

  private processConsequences(_result: HackingResult, target: HackingTarget): void {
    // Handle legal consequences through SecurityManager integration
    if (target.value.riskLevel > 5) {
      // Report crime to security system
      const stationId = target.location.stationId;
      if (stationId) {
        this.securityManager.reportCrime(
          'data-theft',
          stationId,
          [{ type: 'digital', reliability: 80, description: `Unauthorized access to ${target.name}`, source: 'system-audit-log' }]
        );
      }
    }

    // Handle reputation consequences
    if (target.location.stationId) {
      const station = this.worldManager.getAllStations().find(s => s.id === target.location.stationId);
      if (station) {
        this.factionManager.modifyReputation(
          this.playerManager.getPlayerReputation(),
          station.faction, 
          -Math.floor(target.value.riskLevel / 2), 
          'Data theft detected'
        );
      }
    }
  }

  // Public API methods

  /**
   * Get available hacking equipment
   */
  getAvailableEquipment(): HackingEquipment[] {
    return Array.from(this.equipmentDatabase.values());
  }

  /**
   * Get available hacking software
   */
  getAvailableSoftware(): HackingSoftware[] {
    return Array.from(this.softwareDatabase.values());
  }

  /**
   * Get available hacking targets
   */
  getAvailableTargets(): HackingTarget[] {
    return Array.from(this.targetDatabase.values());
  }

  /**
   * Get player's hacking state
   */
  getHackingState(): HackingState {
    return this.hackingState;
  }

  /**
   * Get active hacking attempts
   */
  getActiveAttempts(): HackingAttempt[] {
    return Array.from(this.hackingState.activeAttempts.values());
  }

  /**
   * Get active hacking sessions
   */
  getActiveSessions(): HackingSession[] {
    return Array.from(this.hackingState.activeSessions.values());
  }

  /**
   * Get stolen data
   */
  getStolenData(): HackedData[] {
    return this.hackingState.stolenData;
  }

  /**
   * Get available data markets
   */
  getAvailableDataMarkets(): DataMarket[] {
    return Array.from(this.dataMarkets.values()).filter(market => {
      const reputation = this.hackingState.marketReputation.get(market.id) || 0;
      return reputation >= market.accessibility.reputationRequired;
    });
  }

  /**
   * Purchase hacking equipment
   */
  purchaseEquipment(equipmentId: string): boolean {
    const equipment = this.equipmentDatabase.get(equipmentId);
    if (!equipment) return false;

    if (this.playerManager.spendCredits(equipment.cost)) {
      this.hackingState.ownedEquipment.push(equipment);
      return true;
    }
    
    return false;
  }

  /**
   * Purchase hacking software
   */
  purchaseSoftware(softwareId: string): boolean {
    const software = this.softwareDatabase.get(softwareId);
    if (!software) return false;

    if (this.playerManager.spendCredits(software.cost)) {
      this.hackingState.ownedSoftware.push(software);
      return true;
    }
    
    return false;
  }

  /**
   * Get hacking statistics
   */
  getHackingStats(): HackingStats {
    return this.hackingState.stats;
  }

  /**
   * Serialize hacking state for save system
   */
  serialize(): any {
    return {
      hackingState: {
        ...this.hackingState,
        activeAttempts: Array.from(this.hackingState.activeAttempts.entries()),
        activeSessions: Array.from(this.hackingState.activeSessions.entries()),
        marketReputation: Array.from(this.hackingState.marketReputation.entries())
      },
      nextAttemptId: this.nextAttemptId,
      nextSessionId: this.nextSessionId,
      nextDataId: this.nextDataId
    };
  }

  /**
   * Deserialize hacking state from save system
   */
  deserialize(data: any): void {
    if (data.hackingState) {
      this.hackingState = {
        ...data.hackingState,
        activeAttempts: new Map(data.hackingState.activeAttempts || []),
        activeSessions: new Map(data.hackingState.activeSessions || []),
        marketReputation: new Map(data.hackingState.marketReputation || [])
      };
    }
    
    if (data.nextAttemptId) this.nextAttemptId = data.nextAttemptId;
    if (data.nextSessionId) this.nextSessionId = data.nextSessionId;
    if (data.nextDataId) this.nextDataId = data.nextDataId;
  }
}