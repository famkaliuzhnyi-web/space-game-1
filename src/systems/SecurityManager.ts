import {
  SecurityLevel,
  SecurityZone,
  SecurityRestriction,
  CrimeType,
  CriminalRecord,
  CriminalOffense,
  Evidence,
  Warrant,
  LegalStatus,
  LawEnforcementAgency,
  LawEnforcementUnit,
  ResponsePattern,
  LawEnforcementEquipment,
  InvestigationResult,
  SecurityScan,
  SecurityScanResult,
  SecurityEvent,
  SecurityState
} from '../types/security';
import { TimeManager } from './TimeManager';
import { WorldManager } from './WorldManager';
import { PlayerManager } from './PlayerManager';
import { FactionManager } from './FactionManager';
import { NPCAIManager } from './NPCAIManager';

/**
 * SecurityManager handles all security and law enforcement systems in the galaxy.
 * 
 * Responsibilities:
 * - Managing sector security levels and law enforcement presence
 * - Crime detection and criminal record tracking
 * - Law enforcement AI behavior and response patterns
 * - Weapon licensing and equipment restrictions
 * - Legal consequences and reputation impacts
 * - Integration with faction reputation and NPC systems
 * 
 * Features:
 * - Sector-based security levels with realistic response times
 * - Dynamic crime detection based on security presence
 * - Complex criminal justice system with investigations and warrants
 * - Faction-specific law enforcement agencies and jurisdictions
 * - Equipment and weapon licensing requirements
 * - Realistic patrol patterns and law enforcement AI
 */
export class SecurityManager {
  private timeManager: TimeManager;
  private worldManager: WorldManager;
  private playerManager: PlayerManager;
  private factionManager: FactionManager; // Used for agency jurisdictions and faction-specific law enforcement
  private npcManager: NPCAIManager;
  
  private state: SecurityState;
  private crimeIdCounter = 0;
  private warrantIdCounter = 0;
  private eventIdCounter = 0;
  
  // Update intervals
  private readonly PATROL_UPDATE_INTERVAL = 30000; // 30 seconds
  private readonly INVESTIGATION_UPDATE_INTERVAL = 60000; // 1 minute
  private readonly CRIME_DETECTION_INTERVAL = 10000; // 10 seconds
  
  private lastPatrolUpdate = 0;
  private lastInvestigationUpdate = 0;
  private lastCrimeDetectionUpdate = 0;

  constructor(
    timeManager: TimeManager,
    worldManager: WorldManager,
    playerManager: PlayerManager,
    factionManager: FactionManager,
    npcManager: NPCAIManager
  ) {
    this.timeManager = timeManager;
    this.worldManager = worldManager;
    this.playerManager = playerManager;
    this.factionManager = factionManager;
    this.npcManager = npcManager;
    
    this.state = this.initializeSecurityState();
    this.initializeSecurityZones();
    this.initializeLawEnforcement();
    this.initializeCrimeTypes();
    this.initializeLicenseSystem();
  }

  /**
   * Initialize the security state
   */
  private initializeSecurityState(): SecurityState {
    return {
      zones: new Map(),
      agencies: new Map(),
      units: new Map(),
      criminalRecords: new Map(),
      activeInvestigations: new Map(),
      patrolRoutes: [],
      crimeDatabase: new Map(),
      licenses: new Map(),
      securityEvents: []
    };
  }

  /**
   * Initialize security zones for all systems
   */
  private initializeSecurityZones(): void {
    const galaxy = this.worldManager.getGalaxy();
    const systems: any[] = [];
    
    // Flatten all systems from all sectors
    galaxy.sectors.forEach(sector => {
      systems.push(...sector.systems);
    });
    
    // Define security levels
    const securityLevels: SecurityLevel[] = [
      {
        level: 1,
        name: 'Maximum Security',
        description: 'Core worlds with heavy military presence',
        responseTime: 30,
        patrolCoverage: 95,
        crimeRate: 5,
        inspectionChance: 80,
        characteristics: ['Continuous patrols', 'Real-time monitoring', 'Automated defenses']
      },
      {
        level: 2,
        name: 'High Security',
        description: 'Major trade routes with regular patrols',
        responseTime: 120,
        patrolCoverage: 75,
        crimeRate: 15,
        inspectionChance: 40,
        characteristics: ['Scheduled patrols', 'Defense platforms', 'Quick response']
      },
      {
        level: 3,
        name: 'Standard Security',
        description: 'Settled systems with local security forces',
        responseTime: 600,
        patrolCoverage: 50,
        crimeRate: 35,
        inspectionChance: 15,
        characteristics: ['Local police', 'Station security', 'Basic enforcement']
      },
      {
        level: 4,
        name: 'Low Security',
        description: 'Frontier regions with minimal law enforcement',
        responseTime: 1800,
        patrolCoverage: 25,
        crimeRate: 60,
        inspectionChance: 5,
        characteristics: ['Occasional patrols', 'Self-defense necessary', 'Delayed response']
      },
      {
        level: 5,
        name: 'No Security',
        description: 'Lawless space with no protection',
        responseTime: 0,
        patrolCoverage: 0,
        crimeRate: 85,
        inspectionChance: 0,
        characteristics: ['No law enforcement', 'Criminal organizations', 'Complete lawlessness']
      }
    ];

    // Assign security levels to systems based on faction control and importance
    systems.forEach((system: any) => {
      let securityLevel = 3; // Default standard security
      
      // Core faction systems get higher security
      if (system.controllingFaction) {
        switch (system.controllingFaction) {
          case 'earth-federation':
            securityLevel = Math.max(1, securityLevel - 2);
            break;
          case 'traders-guild':
            securityLevel = Math.max(2, securityLevel - 1);
            break;
          case 'security-forces':
            securityLevel = Math.max(1, securityLevel - 2);
            break;
          case 'outer-colonies':
            securityLevel = Math.min(4, securityLevel + 1);
            break;
          default:
            securityLevel = 3;
        }
      }
      
      // Frontier systems get lower security
      if (system.type === 'frontier') {
        securityLevel = Math.min(4, securityLevel + 1); // Frontier should be level 4 max
      }
      
      // Trade hub systems get better security
      if (system.hasStations && system.stations.length > 2) {
        securityLevel = Math.max(2, securityLevel - 1);
      }

      const zone: SecurityZone = {
        id: system.id,
        name: system.name,
        securityLevel: securityLevels[securityLevel - 1],
        controllingFaction: system.controllingFaction,
        enforcementAgencies: this.getEnforcementAgencies(system.controllingFaction || 'none'),
        restrictions: this.generateSecurityRestrictions(securityLevel)
      };
      
      this.state.zones.set(system.id, zone);
    });
  }

  /**
   * Get enforcement agencies for a faction
   */
  private getEnforcementAgencies(faction: string): string[] {
    const agencies: Record<string, string[]> = {
      'earth-federation': ['federation-navy', 'colonial-police'],
      'traders-guild': ['guild-security', 'merchant-patrol'],
      'security-forces': ['security-patrol', 'enforcement-division'],
      'industrial-consortium': ['corporate-security', 'industrial-guard'],
      'outer-colonies': ['militia-patrol', 'colonial-guard'],
      'none': ['bounty-hunters']
    };
    
    return agencies[faction] || ['bounty-hunters'];
  }

  /**
   * Generate security restrictions based on security level
   */
  private generateSecurityRestrictions(securityLevel: number): SecurityRestriction[] {
    const restrictions: SecurityRestriction[] = [];
    
    if (securityLevel <= 2) {
      // High security areas restrict weapons
      restrictions.push({
        type: 'weapon',
        itemId: 'military-grade',
        description: 'Military-grade weapons restricted to licensed personnel',
        violationPenalty: {
          fine: 50000,
          reputationLoss: { 'security-forces': -25, 'earth-federation': -15 }
        }
      });
      
      restrictions.push({
        type: 'cargo',
        itemId: 'restricted-tech',
        description: 'Advanced technology requires export license',
        violationPenalty: {
          fine: 25000,
          reputationLoss: { 'earth-federation': -20 }
        }
      });
      
      restrictions.push({
        type: 'cargo',
        itemId: 'military-grade',
        description: 'Military-grade equipment restricted to licensed personnel',
        violationPenalty: {
          fine: 75000,
          reputationLoss: { 'security-forces': -35, 'earth-federation': -25 }
        }
      });
    }
    
    if (securityLevel <= 3) {
      // Standard security restricts dangerous materials
      restrictions.push({
        type: 'cargo',
        itemId: 'hazardous-materials',
        description: 'Hazardous materials require special permits',
        violationPenalty: {
          fine: 15000,
          reputationLoss: { 'security-forces': -10 }
        }
      });
    }
    
    return restrictions;
  }

  /**
   * Initialize law enforcement agencies
   */
  private initializeLawEnforcement(): void {
    const agencies: LawEnforcementAgency[] = [
      {
        id: 'federation-navy',
        name: 'Earth Federation Navy',
        faction: 'earth-federation',
        jurisdiction: this.getSystemsByFaction('earth-federation'),
        authority: 'federal',
        capabilities: [
          { type: 'patrol', effectiveness: 90, resources: 100 },
          { type: 'investigation', effectiveness: 85, resources: 80 },
          { type: 'arrest', effectiveness: 95, resources: 90 },
          { type: 'pursuit', effectiveness: 90, resources: 85 }
        ],
        responsePatterns: this.createResponsePatterns('military')
      },
      {
        id: 'guild-security',
        name: 'Traders Guild Security',
        faction: 'traders-guild',
        jurisdiction: this.getSystemsByFaction('traders-guild'),
        authority: 'corporate',
        capabilities: [
          { type: 'patrol', effectiveness: 70, resources: 60 },
          { type: 'investigation', effectiveness: 60, resources: 50 },
          { type: 'arrest', effectiveness: 65, resources: 55 },
          { type: 'interdiction', effectiveness: 80, resources: 70 }
        ],
        responsePatterns: this.createResponsePatterns('corporate')
      },
      {
        id: 'security-patrol',
        name: 'Security Forces Patrol',
        faction: 'security-forces',
        jurisdiction: this.getSystemsByFaction('security-forces'),
        authority: 'military',
        capabilities: [
          { type: 'patrol', effectiveness: 95, resources: 90 },
          { type: 'pursuit', effectiveness: 90, resources: 85 },
          { type: 'arrest', effectiveness: 85, resources: 80 },
          { type: 'interdiction', effectiveness: 95, resources: 90 }
        ],
        responsePatterns: this.createResponsePatterns('enforcement')
      },
      {
        id: 'bounty-hunters',
        name: 'Independent Bounty Hunters',
        faction: 'independent',
        jurisdiction: this.getAllSystemIds(),
        authority: 'local',
        capabilities: [
          { type: 'pursuit', effectiveness: 75, resources: 40 },
          { type: 'arrest', effectiveness: 70, resources: 35 }
        ],
        responsePatterns: this.createResponsePatterns('bounty')
      }
    ];

    agencies.forEach(agency => {
      this.state.agencies.set(agency.id, agency);
      this.spawnLawEnforcementUnits(agency);
    });
  }

  /**
   * Get all systems controlled by a faction
   */
  private getSystemsByFaction(faction: string): string[] {
    // Use faction manager to get faction territories
    const factionInfo = this.factionManager.getFaction(faction);
    if (factionInfo) {
      return factionInfo.territories || [];
    }
    
    // Fallback: filter zones by controlling faction
    return Array.from(this.state.zones.values())
      .filter(zone => zone.controllingFaction === faction)
      .map(zone => zone.id);
  }

  /**
   * Get all system IDs
   */
  private getAllSystemIds(): string[] {
    return Array.from(this.state.zones.keys());
  }

  /**
   * Create response patterns for different agency types
   */
  private createResponsePatterns(type: 'military' | 'corporate' | 'enforcement' | 'bounty'): ResponsePattern[] {
    const basePatterns: ResponsePattern[] = [
      {
        crimeCategory: 'property',
        securityLevel: 1,
        responseType: 'investigate',
        responseDelay: 30,
        pursuitRange: 50,
        escalationThreshold: 30
      },
      {
        crimeCategory: 'violent',
        securityLevel: 1,
        responseType: 'arrest',
        responseDelay: 15,
        pursuitRange: 100,
        escalationThreshold: 20
      },
      {
        crimeCategory: 'economic',
        securityLevel: 1,
        responseType: 'investigate',
        responseDelay: 60,
        pursuitRange: 30,
        escalationThreshold: 50
      }
    ];

    // Modify patterns based on agency type
    return basePatterns.map(pattern => {
      switch (type) {
        case 'military':
          return {
            ...pattern,
            responseDelay: Math.floor(pattern.responseDelay * 0.7),
            pursuitRange: pattern.pursuitRange * 1.5,
            escalationThreshold: pattern.escalationThreshold * 0.8
          };
        case 'corporate':
          return {
            ...pattern,
            responseType: pattern.crimeCategory === 'economic' ? 'arrest' : pattern.responseType,
            responseDelay: pattern.responseDelay * 1.2,
            escalationThreshold: pattern.escalationThreshold * 1.3
          };
        case 'enforcement':
          return {
            ...pattern,
            responseType: pattern.responseType === 'investigate' ? 'pursue' : pattern.responseType,
            pursuitRange: pattern.pursuitRange * 1.3
          };
        case 'bounty':
          return {
            ...pattern,
            responseType: 'pursue',
            responseDelay: pattern.responseDelay * 2,
            pursuitRange: pattern.pursuitRange * 2,
            escalationThreshold: pattern.escalationThreshold * 0.5
          };
        default:
          return pattern;
      }
    });
  }

  /**
   * Spawn law enforcement units for an agency
   */
  private spawnLawEnforcementUnits(agency: LawEnforcementAgency): void {
    const unitsPerSystem = agency.authority === 'federal' ? 3 : 
                          agency.authority === 'military' ? 2 : 1;
    
    agency.jurisdiction.forEach(systemId => {
      for (let i = 0; i < unitsPerSystem; i++) {
        const unit: LawEnforcementUnit = {
          id: `${agency.id}-${systemId}-${i}`,
          agency: agency.id,
          type: this.getUnitType(agency.authority),
          currentLocation: systemId,
          status: 'patrolling',
          jurisdiction: [systemId],
          equipment: this.getUnitEquipment(agency.authority)
        };
        
        this.state.units.set(unit.id, unit);
      }
    });
  }

  /**
   * Get unit type based on agency authority
   */
  private getUnitType(authority: string): 'patrol' | 'detective' | 'swat' | 'military' {
    switch (authority) {
      case 'federal':
      case 'military':
        return 'military';
      case 'regional':
        return 'swat';
      case 'corporate':
        return 'patrol';
      default:
        return 'patrol';
    }
  }

  /**
   * Get unit equipment based on authority level
   */
  private getUnitEquipment(authority: string): LawEnforcementEquipment {
    const baseEquipment: LawEnforcementEquipment = {
      ships: ['patrol-frigate'],
      weapons: ['pulse-laser', 'ion-cannon'],
      specialEquipment: ['scanner', 'tracker'],
      personnelCount: 4
    };

    switch (authority) {
      case 'federal':
      case 'military':
        return {
          ...baseEquipment,
          ships: ['military-cruiser', 'heavy-frigate'],
          weapons: ['military-laser', 'missile-launcher', 'ion-cannon'],
          specialEquipment: ['advanced-scanner', 'quantum-tracker', 'jamming-suite'],
          personnelCount: 12
        };
      case 'corporate':
        return {
          ...baseEquipment,
          ships: ['corporate-security'],
          weapons: ['stun-laser', 'disruptor'],
          specialEquipment: ['cargo-scanner', 'identification-probe'],
          personnelCount: 6
        };
      default:
        return baseEquipment;
    }
  }

  /**
   * Initialize crime types and their penalties
   */
  private initializeCrimeTypes(): void {
    const crimeTypes: CrimeType[] = [
      {
        id: 'theft',
        name: 'Theft',
        category: 'property',
        severity: 3,
        description: 'Unauthorized taking of property',
        basePenalty: {
          fine: 5000,
          reputationLoss: { 'security-forces': -5, 'traders-guild': -3 }
        },
        factionReputationImpact: { 'security-forces': -10, 'traders-guild': -5 }
      },
      {
        id: 'piracy',
        name: 'Piracy',
        category: 'violent',
        severity: 8,
        description: 'Armed robbery of ships and cargo',
        basePenalty: {
          fine: 100000,
          imprisonment: 168, // 1 week
          reputationLoss: { 'security-forces': -50, 'earth-federation': -40, 'traders-guild': -30 }
        },
        factionReputationImpact: { 'security-forces': -75, 'earth-federation': -50, 'traders-guild': -40 }
      },
      {
        id: 'smuggling',
        name: 'Smuggling',
        category: 'economic',
        severity: 5,
        description: 'Transportation of illegal or restricted goods',
        basePenalty: {
          fine: 25000,
          assetSeizure: ['cargo'],
          reputationLoss: { 'security-forces': -15, 'earth-federation': -10 }
        },
        factionReputationImpact: { 'security-forces': -20, 'earth-federation': -15 }
      },
      {
        id: 'assault',
        name: 'Assault',
        category: 'violent',
        severity: 4,
        description: 'Physical attack on another person',
        basePenalty: {
          fine: 10000,
          imprisonment: 24, // 1 day
          reputationLoss: { 'security-forces': -10 }
        },
        factionReputationImpact: { 'security-forces': -15 }
      },
      {
        id: 'fraud',
        name: 'Fraud',
        category: 'economic',
        severity: 4,
        description: 'Deception for financial gain',
        basePenalty: {
          fine: 15000,
          reputationLoss: { 'traders-guild': -20, 'security-forces': -8 }
        },
        factionReputationImpact: { 'traders-guild': -25, 'security-forces': -10 }
      },
      {
        id: 'weapon-violation',
        name: 'Illegal Weapons',
        category: 'regulatory',
        severity: 3,
        description: 'Possession of restricted weapons without license',
        basePenalty: {
          fine: 8000,
          assetSeizure: ['weapons'],
          reputationLoss: { 'security-forces': -8 }
        },
        factionReputationImpact: { 'security-forces': -12 }
      },
      {
        id: 'espionage',
        name: 'Corporate Espionage',
        category: 'political',
        severity: 7,
        description: 'Theft of corporate or government secrets',
        basePenalty: {
          fine: 75000,
          imprisonment: 72, // 3 days
          reputationLoss: { 'industrial-consortium': -40, 'earth-federation': -30 }
        },
        factionReputationImpact: { 'industrial-consortium': -50, 'earth-federation': -40 }
      }
    ];

    crimeTypes.forEach(crime => {
      this.state.crimeDatabase.set(crime.id, crime);
    });
  }

  /**
   * Initialize the license system
   */
  private initializeLicenseSystem(): void {
    // License requirements will be populated as needed
    // This is a placeholder for the license system
  }

  /**
   * Main update method called by the game loop
   */
  update(): void {
    const currentTime = this.timeManager.getCurrentTimestamp();
    
    this.updatePatrols(currentTime);
    this.updateInvestigations(currentTime);
    this.detectCrimes(currentTime);
    this.cleanupOldEvents(currentTime);
  }

  /**
   * Update patrol units and their movements
   */
  private updatePatrols(currentTime: number): void {
    if (currentTime - this.lastPatrolUpdate < this.PATROL_UPDATE_INTERVAL) {
      return;
    }
    
    this.lastPatrolUpdate = currentTime;
    
    this.state.units.forEach(unit => {
      if (unit.status === 'patrolling') {
        // Simple patrol behavior - could be expanded
        const zone = this.state.zones.get(unit.currentLocation);
        if (zone && Math.random() < 0.1) { // 10% chance to change location
          const nearbyZones = this.getNearbyZones(unit.currentLocation);
          if (nearbyZones.length > 0) {
            unit.currentLocation = nearbyZones[Math.floor(Math.random() * nearbyZones.length)];
          }
        }
      }
    });
  }

  /**
   * Get nearby security zones
   */
  private getNearbyZones(systemId: string): string[] {
    // Simplified - in a real implementation, this would use actual system connections
    const allZoneIds = Array.from(this.state.zones.keys());
    return allZoneIds.filter(id => id !== systemId).slice(0, 3);
  }

  /**
   * Update active investigations
   */
  private updateInvestigations(currentTime: number): void {
    if (currentTime - this.lastInvestigationUpdate < this.INVESTIGATION_UPDATE_INTERVAL) {
      return;
    }
    
    this.lastInvestigationUpdate = currentTime;
    
    this.state.activeInvestigations.forEach((investigation, crimeId) => {
      // Progress investigations over time
      if (Math.random() < 0.3) { // 30% chance to make progress
        investigation.confidence = Math.min(100, investigation.confidence + 5);
        
        if (investigation.confidence >= 80) {
          this.completeInvestigation(crimeId, investigation);
        }
      }
    });
  }

  /**
   * Complete an investigation and potentially issue warrants
   */
  private completeInvestigation(crimeId: string, investigation: InvestigationResult): void {
    if (investigation.recommendedAction === 'arrest' || investigation.recommendedAction === 'bounty') {
      investigation.suspects.forEach(suspectId => {
        this.issueWarrant(crimeId, suspectId, investigation.recommendedAction === 'bounty');
      });
    }
    
    this.state.activeInvestigations.delete(crimeId);
    
    // Record investigation completion event
    this.recordSecurityEvent({
      id: `investigation-${this.eventIdCounter++}`,
      type: 'conviction',
      timestamp: this.timeManager.getCurrentTimestamp(),
      location: 'investigation-office',
      participants: investigation.suspects,
      data: {
        crimeId,
        confidence: investigation.confidence,
        action: investigation.recommendedAction
      }
    });
  }

  /**
   * Issue a warrant for a suspect
   */
  private issueWarrant(crimeId: string, suspectId: string, isBounty: boolean): void {
    const crime = this.getCrimeById(crimeId);
    if (!crime) return;
    
    const crimeType = this.state.crimeDatabase.get(crime.crimeType);
    if (!crimeType) return;
    
    const warrant: Warrant = {
      id: `warrant-${this.warrantIdCounter++}`,
      issuingFaction: crime.location, // Simplified - would be based on jurisdiction
      crimeId,
      bounty: this.calculateBounty(crimeType.severity),
      priority: this.calculateWarrantPriority(crimeType.severity),
      jurisdiction: [crime.location], // Simplified jurisdiction
      expirationTime: isBounty ? undefined : this.timeManager.getCurrentTimestamp() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    // Add warrant to criminal record
    let record = this.state.criminalRecords.get(suspectId);
    if (!record) {
      record = {
        playerId: suspectId,
        crimes: [],
        warrants: [],
        legalStatus: { overall: 'clean', factionStatus: {}, activeWarrants: 0, totalBounty: 0 },
        totalCrimeScore: 0
      };
      this.state.criminalRecords.set(suspectId, record);
    }
    
    record.warrants.push(warrant);
    this.updateLegalStatus(record);
    
    this.recordSecurityEvent({
      id: `warrant-${this.eventIdCounter++}`,
      type: 'warrant_issued',
      timestamp: this.timeManager.getCurrentTimestamp(),
      location: crime.location,
      participants: [suspectId],
      data: { warrant, crimeId }
    });
  }

  /**
   * Calculate bounty amount based on crime severity
   */
  private calculateBounty(severity: number): number {
    return severity * 5000 + Math.floor(Math.random() * 10000);
  }

  /**
   * Calculate warrant priority based on crime severity
   */
  private calculateWarrantPriority(severity: number): 'low' | 'medium' | 'high' | 'critical' {
    if (severity >= 8) return 'critical';
    if (severity >= 6) return 'high';
    if (severity >= 4) return 'medium';
    return 'low';
  }

  /**
   * Update legal status based on criminal record
   */
  private updateLegalStatus(record: CriminalRecord): void {
    record.legalStatus.activeWarrants = record.warrants.length;
    record.legalStatus.totalBounty = record.warrants.reduce((total, warrant) => total + warrant.bounty, 0);
    
    // Determine overall legal status
    if (record.legalStatus.activeWarrants === 0 && record.totalCrimeScore < 10) {
      record.legalStatus.overall = 'clean';
    } else if (record.legalStatus.activeWarrants === 0) {
      record.legalStatus.overall = 'suspected';
    } else if (record.legalStatus.activeWarrants <= 2) {
      record.legalStatus.overall = 'wanted';
    } else if (record.legalStatus.activeWarrants <= 5) {
      record.legalStatus.overall = 'criminal';
    } else {
      record.legalStatus.overall = 'fugitive';
    }
  }

  /**
   * Detect crimes in progress
   */
  private detectCrimes(currentTime: number): void {
    if (currentTime - this.lastCrimeDetectionUpdate < this.CRIME_DETECTION_INTERVAL) {
      return;
    }
    
    this.lastCrimeDetectionUpdate = currentTime;
    
    // This is where crime detection logic would go
    // For now, we'll implement basic framework
    this.scanForContrabandCargo();
    this.monitorPlayerBehavior();
  }

  /**
   * Scan for contraband cargo at stations
   */
  private scanForContrabandCargo(): void {
    const playerLocation = this.playerManager.getCurrentStation();
    const zone = this.state.zones.get(playerLocation);
    
    if (!zone) return;
    
    if (Math.random() * 100 < zone.securityLevel.inspectionChance) {
      this.performSecurityScan(playerLocation);
    }
  }

  /**
   * Perform a security scan on the player
   */
  private performSecurityScan(location: string): void {
    const scan: SecurityScan = {
      timestamp: this.timeManager.getCurrentTimestamp(),
      location,
      targetId: 'player',
      scanType: 'routine',
      results: []
    };
    
    // Scan cargo for contraband
    const playerShip = this.playerManager.getCurrentShip();
    const playerCargo = playerShip.cargo.items;
    
    playerCargo.forEach((cargoItem, commodityId) => {
      if (this.isContraband(commodityId, location)) {
        scan.results.push({
          type: 'cargo',
          status: 'contraband',
          details: `Illegal possession of ${commodityId}`,
          severity: this.getContrabandSeverity(commodityId),
          evidence: {
            type: 'physical',
            reliability: 95,
            description: `${cargoItem.quantity} units of ${commodityId} detected`,
            source: 'cargo-scanner'
          }
        });
      }
    });
    
    // Process scan results
    if (scan.results.length > 0) {
      scan.results.forEach(result => {
        if (result.status === 'contraband') {
          this.reportCrime('smuggling', location, [result.evidence!]);
        }
      });
    }
  }

  /**
   * Check if a commodity is contraband in a location
   */
  private isContraband(commodityId: string, location: string): boolean {
    const zone = this.state.zones.get(location);
    if (!zone) return false;
    
    return zone.restrictions.some(restriction => 
      restriction.type === 'cargo' && 
      (restriction.itemId === commodityId || this.matchesRestriction(commodityId, restriction.itemId))
    );
  }

  /**
   * Match commodity against restriction pattern
   */
  private matchesRestriction(commodityId: string, restrictionPattern?: string): boolean {
    if (!restrictionPattern) return false;
    
    // Simple pattern matching - could be expanded
    const patterns: Record<string, string[]> = {
      'restricted-tech': ['advanced-electronics', 'quantum-processors', 'ai-cores'],
      'hazardous-materials': ['radioactive-materials', 'toxic-chemicals', 'explosive-compounds'],
      'military-grade': ['military-electronics', 'weapon-components', 'armor-plating']
    };
    
    const matchingItems = patterns[restrictionPattern] || [];
    return matchingItems.includes(commodityId);
  }

  /**
   * Get contraband severity level
   */
  private getContrabandSeverity(commodityId: string): number {
    // Simplified severity calculation
    const severityMap: Record<string, number> = {
      'military-electronics': 8,
      'weapon-components': 7,
      'advanced-electronics': 5,
      'toxic-chemicals': 6,
      'radioactive-materials': 9
    };
    
    return severityMap[commodityId] || 3;
  }

  /**
   * Monitor player behavior for suspicious activity
   */
  private monitorPlayerBehavior(): void {
    // Placeholder for behavioral monitoring
    // Could track patterns like avoiding high-security zones,
    // unusual trading patterns, etc.
  }

  /**
   * Report a crime to the security system
   */
  reportCrime(crimeTypeId: string, location: string, evidence: Evidence[]): string {
    const crimeId = `crime-${this.crimeIdCounter++}`;
    const crimeType = this.state.crimeDatabase.get(crimeTypeId);
    
    if (!crimeType) {
      console.warn(`Unknown crime type: ${crimeTypeId}`);
      return crimeId;
    }
    
    const crime: CriminalOffense = {
      id: crimeId,
      crimeType: crimeTypeId,
      location,
      timestamp: this.timeManager.getCurrentTimestamp(),
      witnesses: this.findWitnesses(location),
      evidence,
      status: 'reported'
    };
    
    // Add to player's criminal record
    const playerId = 'player'; // Simplified - would need proper player ID
    let record = this.state.criminalRecords.get(playerId);
    if (!record) {
      record = {
        playerId,
        crimes: [],
        warrants: [],
        legalStatus: { overall: 'clean', factionStatus: {}, activeWarrants: 0, totalBounty: 0 },
        totalCrimeScore: 0
      };
      this.state.criminalRecords.set(playerId, record);
    }
    
    record.crimes.push(crime);
    record.totalCrimeScore += crimeType.severity;
    this.updateLegalStatus(record);
    
    // Apply immediate reputation penalties
    Object.entries(crimeType.factionReputationImpact).forEach(([factionId, impact]) => {
      this.playerManager.modifyFactionReputation(factionId, impact, `Crime: ${crimeType.name}`);
    });
    
    // Start investigation if warranted
    if (crimeType.severity >= 4) {
      this.startInvestigation(crimeId, crime);
    }
    
    this.recordSecurityEvent({
      id: `crime-${this.eventIdCounter++}`,
      type: 'crime_detected',
      timestamp: this.timeManager.getCurrentTimestamp(),
      location,
      participants: [playerId],
      data: { crimeId, crimeType: crimeTypeId, evidence: evidence.length }
    });
    
    return crimeId;
  }

  /**
   * Find witnesses at a location
   */
  private findWitnesses(location: string): string[] {
    const witnesses: string[] = [];
    
    // Find NPCs at location (system)
    const npcsAtLocation = this.npcManager.getNPCsInSystem(location);
    witnesses.push(...npcsAtLocation.map(npc => npc.id));
    
    // Add station security if applicable
    const zone = this.state.zones.get(location);
    if (zone && zone.securityLevel.level <= 3) {
      witnesses.push('station-security');
    }
    
    return witnesses;
  }

  /**
   * Start an investigation for a crime
   */
  private startInvestigation(crimeId: string, crime: CriminalOffense): void {
    const investigation: InvestigationResult = {
      crimeId,
      evidence: crime.evidence,
      suspects: ['player'], // Simplified
      confidence: 50, // Base confidence
      recommendedAction: 'dismiss'
    };
    
    // Calculate initial confidence based on evidence quality
    const evidenceQuality = crime.evidence.reduce((total, evidence) => total + evidence.reliability, 0) / crime.evidence.length;
    investigation.confidence = Math.min(90, 30 + (evidenceQuality * 0.6));
    
    // Determine recommended action based on confidence and crime severity
    const crimeType = this.state.crimeDatabase.get(crime.crimeType);
    if (crimeType && investigation.confidence > 60) {
      if (crimeType.severity >= 7) {
        investigation.recommendedAction = 'arrest';
      } else if (crimeType.severity >= 5) {
        investigation.recommendedAction = 'bounty';
      } else if (crimeType.severity >= 3) {
        investigation.recommendedAction = 'fine';
      } else {
        investigation.recommendedAction = 'warn';
      }
    }
    
    this.state.activeInvestigations.set(crimeId, investigation);
    crime.status = 'investigating';
  }

  /**
   * Get crime by ID
   */
  private getCrimeById(crimeId: string): CriminalOffense | undefined {
    for (const record of this.state.criminalRecords.values()) {
      const crime = record.crimes.find(c => c.id === crimeId);
      if (crime) return crime;
    }
    return undefined;
  }

  /**
   * Record a security event
   */
  private recordSecurityEvent(event: SecurityEvent): void {
    this.state.securityEvents.push(event);
    
    // Limit event history
    if (this.state.securityEvents.length > 1000) {
      this.state.securityEvents = this.state.securityEvents.slice(-500);
    }
  }

  /**
   * Clean up old events
   */
  private cleanupOldEvents(currentTime: number): void {
    const cutoffTime = currentTime - (7 * 24 * 60 * 60 * 1000); // 7 days
    
    this.state.securityEvents = this.state.securityEvents.filter(
      event => event.timestamp > cutoffTime
    );
  }

  // Public API methods

  /**
   * Get security level for a location
   */
  getSecurityLevel(location: string): SecurityLevel | undefined {
    const zone = this.state.zones.get(location);
    return zone?.securityLevel;
  }

  /**
   * Get player's legal status
   */
  getPlayerLegalStatus(): LegalStatus {
    const record = this.state.criminalRecords.get('player');
    return record?.legalStatus || {
      overall: 'clean',
      factionStatus: {},
      activeWarrants: 0,
      totalBounty: 0
    };
  }

  /**
   * Get active warrants for player
   */
  getPlayerWarrants(): Warrant[] {
    const record = this.state.criminalRecords.get('player');
    return record?.warrants || [];
  }

  /**
   * Get player's crime history
   */
  getPlayerCrimeHistory(): CriminalOffense[] {
    const record = this.state.criminalRecords.get('player');
    return record?.crimes || [];
  }

  /**
   * Get recent security events
   */
  getRecentSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.state.securityEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Check if player can carry certain items in location
   */
  checkCargoLegality(location: string, cargo: Map<string, any>): SecurityScanResult[] {
    const results: SecurityScanResult[] = [];
    const zone = this.state.zones.get(location);
    
    if (!zone) return results;
    
    cargo.forEach((_cargoItem, commodityId) => {
      if (this.isContraband(commodityId, location)) {
        results.push({
          type: 'cargo',
          status: 'violation',
          details: `${commodityId} is restricted in this zone`,
          severity: this.getContrabandSeverity(commodityId)
        });
      }
    });
    
    return results;
  }

  /**
   * Get law enforcement presence at location
   */
  getLawEnforcementPresence(location: string): LawEnforcementUnit[] {
    return Array.from(this.state.units.values())
      .filter(unit => unit.currentLocation === location);
  }

  /**
   * Serialize security state for saving
   */
  serialize(): any {
    return {
      zones: Array.from(this.state.zones.entries()),
      agencies: Array.from(this.state.agencies.entries()),
      units: Array.from(this.state.units.entries()),
      criminalRecords: Array.from(this.state.criminalRecords.entries()),
      activeInvestigations: Array.from(this.state.activeInvestigations.entries()),
      patrolRoutes: this.state.patrolRoutes,
      crimeDatabase: Array.from(this.state.crimeDatabase.entries()),
      licenses: Array.from(this.state.licenses.entries()),
      securityEvents: this.state.securityEvents.slice(-100), // Save only recent events
      counters: {
        crimeIdCounter: this.crimeIdCounter,
        warrantIdCounter: this.warrantIdCounter,
        eventIdCounter: this.eventIdCounter
      }
    };
  }

  /**
   * Deserialize security state from save data
   */
  deserialize(data: any): void {
    if (data.zones) {
      this.state.zones = new Map(data.zones);
    }
    if (data.agencies) {
      this.state.agencies = new Map(data.agencies);
    }
    if (data.units) {
      this.state.units = new Map(data.units);
    }
    if (data.criminalRecords) {
      this.state.criminalRecords = new Map(data.criminalRecords);
    }
    if (data.activeInvestigations) {
      this.state.activeInvestigations = new Map(data.activeInvestigations);
    }
    if (data.patrolRoutes) {
      this.state.patrolRoutes = data.patrolRoutes;
    }
    if (data.crimeDatabase) {
      this.state.crimeDatabase = new Map(data.crimeDatabase);
    }
    if (data.licenses) {
      this.state.licenses = new Map(data.licenses);
    }
    if (data.securityEvents) {
      this.state.securityEvents = data.securityEvents;
    }
    if (data.counters) {
      this.crimeIdCounter = data.counters.crimeIdCounter || 0;
      this.warrantIdCounter = data.counters.warrantIdCounter || 0;
      this.eventIdCounter = data.counters.eventIdCounter || 0;
    }
  }
}