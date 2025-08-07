import { FactionReputation } from '../types/player';
import { FactionRelationship } from '../types/contacts';
import { ContactManager, ContactFactory } from './ContactManager';

export interface FactionInfo {
  id: string;
  name: string;
  description: string;
  homeStation?: string;
  colors: {
    primary: string;
    secondary: string;
  };
  // Enhanced faction properties for Phase 4.2
  influence: number; // 1-10, how powerful this faction is
  relationships: Record<string, number>; // relationships with other factions (-1 to 1)
  territories: string[]; // stations/systems they control
  specializations: string[]; // what they're known for
}

export interface ReputationChange {
  factionId: string;
  change: number;
  reason: string;
  timestamp: number;
}

export interface FactionBenefits {
  tradingDiscount: number; // Percentage discount on purchases
  contractAccess: string[]; // Special contract types available
  equipmentAccess: string[]; // Special equipment available
  serviceDiscount: number; // Discount on repairs/maintenance
}

export class FactionManager {
  private factions: Map<string, FactionInfo> = new Map();
  private reputationHistory: ReputationChange[] = [];
  private factionRelationships: Map<string, FactionRelationship> = new Map();
  private contactManager: ContactManager;

  constructor() {
    this.contactManager = new ContactManager();
    this.initializeFactions();
  }

  /**
   * Initialize default factions with enhanced properties
   */
  private initializeFactions(): void {
    const defaultFactions: FactionInfo[] = [
      {
        id: 'traders-guild',
        name: 'Traders Guild',
        description: 'Independent merchant organization focused on free trade',
        homeStation: 'trade-hub-1',
        colors: { primary: '#4ade80', secondary: '#22c55e' },
        influence: 7,
        relationships: {
          'industrial-consortium': 0.3,
          'security-forces': -0.2,
          'outer-colonies': 0.2,
          'earth-federation': 0.1
        },
        territories: ['trade-hub-1', 'merchant-outpost-2'],
        specializations: ['Commerce', 'Trade Routes', 'Market Intelligence']
      },
      {
        id: 'earth-federation',
        name: 'Earth Federation',
        description: 'Government alliance representing Earth and core worlds',
        homeStation: 'earth-station',
        colors: { primary: '#3b82f6', secondary: '#1d4ed8' },
        influence: 9,
        relationships: {
          'outer-colonies': -0.5,
          'security-forces': 0.4,
          'industrial-consortium': 0.2,
          'traders-guild': 0.1
        },
        territories: ['earth-station', 'core-world-1', 'core-world-2'],
        specializations: ['Governance', 'Military', 'Infrastructure']
      },
      {
        id: 'outer-colonies',
        name: 'Outer Colonies Coalition',
        description: 'Alliance of frontier settlements seeking independence',
        homeStation: 'frontier-station-1',
        colors: { primary: '#f59e0b', secondary: '#d97706' },
        influence: 6,
        relationships: {
          'earth-federation': -0.5,
          'traders-guild': 0.2,
          'industrial-consortium': -0.3,
          'security-forces': -0.4
        },
        territories: ['frontier-station-1', 'frontier-station-2', 'mining-outpost-3'],
        specializations: ['Mining', 'Frontier Survival', 'Independence Movement']
      },
      {
        id: 'industrial-consortium',
        name: 'Industrial Consortium',
        description: 'Corporate alliance controlling heavy industry and mining',
        homeStation: 'industrial-complex-1',
        colors: { primary: '#8b5cf6', secondary: '#7c3aed' },
        influence: 8,
        relationships: {
          'traders-guild': 0.3,
          'outer-colonies': -0.3,
          'earth-federation': 0.2,
          'security-forces': 0.1
        },
        territories: ['industrial-complex-1', 'manufacturing-hub-1', 'research-station-alpha'],
        specializations: ['Manufacturing', 'Research & Development', 'Heavy Industry']
      },
      {
        id: 'security-forces',
        name: 'Security Forces',
        description: 'Joint law enforcement and defense organization',
        homeStation: 'security-outpost-1',
        colors: { primary: '#ef4444', secondary: '#dc2626' },
        influence: 7,
        relationships: {
          'earth-federation': 0.4,
          'traders-guild': -0.2,
          'outer-colonies': -0.4,
          'industrial-consortium': 0.1
        },
        territories: ['security-outpost-1', 'patrol-base-beta'],
        specializations: ['Law Enforcement', 'Defense', 'Intelligence']
      }
    ];

    defaultFactions.forEach(faction => {
      this.factions.set(faction.id, faction);
    });

    // Initialize faction relationships for player
    this.initializeFactionRelationships();
  }

  /**
   * Initialize faction relationships for player
   */
  private initializeFactionRelationships(): void {
    this.factions.forEach((faction) => {
      const relationship: FactionRelationship = {
        factionId: faction.id,
        trustLevel: 50, // Neutral starting trust
        influence: 0, // No starting influence
        accessLevel: 1, // Basic access
        specialPrivileges: [],
        restrictions: []
      };
      this.factionRelationships.set(faction.id, relationship);
    });
  }

  /**
   * Get contact manager instance
   */
  getContactManager(): ContactManager {
    return this.contactManager;
  }

  /**
   * Get faction relationship data
   */
  getFactionRelationship(factionId: string): FactionRelationship | undefined {
    return this.factionRelationships.get(factionId);
  }

  /**
   * Update faction relationship based on reputation changes
   */
  private updateFactionRelationship(factionId: string, reputationChange: number): void {
    const relationship = this.factionRelationships.get(factionId);
    if (!relationship) return;

    // Trust level changes more slowly than reputation
    const trustChange = Math.round(reputationChange * 0.5);
    relationship.trustLevel = Math.max(0, Math.min(100, relationship.trustLevel + trustChange));

    // Update access level based on trust and reputation
    const faction = this.factions.get(factionId);
    if (faction) {
      const newAccessLevel = this.calculateAccessLevel(relationship.trustLevel, factionId);
      if (newAccessLevel > relationship.accessLevel) {
        relationship.accessLevel = newAccessLevel;
        console.log(`${faction.name}: Access level increased to ${newAccessLevel}`);
      }
    }

    // Update restrictions and privileges
    this.updateFactionPrivileges(relationship);
  }

  /**
   * Calculate access level based on trust and reputation
   */
  private calculateAccessLevel(trustLevel: number, _factionId: string): number {
    if (trustLevel >= 90) return 5; // Maximum access
    if (trustLevel >= 75) return 4; // High access
    if (trustLevel >= 60) return 3; // Moderate access
    if (trustLevel >= 40) return 2; // Limited access
    return 1; // Basic access
  }

  /**
   * Update faction privileges and restrictions
   */
  private updateFactionPrivileges(relationship: FactionRelationship): void {
    const faction = this.factions.get(relationship.factionId);
    if (!faction) return;

    // Clear existing privileges/restrictions
    relationship.specialPrivileges = [];
    relationship.restrictions = [];

    // Add privileges based on access level and faction specialization
    switch (relationship.accessLevel) {
      case 5:
        relationship.specialPrivileges.push('executive-access', 'classified-contracts', 'prototype-equipment');
        break;
      case 4:
        relationship.specialPrivileges.push('priority-contracts', 'advanced-equipment', 'bulk-discounts');
        break;
      case 3:
        relationship.specialPrivileges.push('exclusive-contracts', 'faction-equipment');
        break;
      case 2:
        relationship.specialPrivileges.push('member-discounts');
        break;
    }

    // Add faction-specific privileges
    if (relationship.accessLevel >= 3) {
      faction.specializations.forEach(spec => {
        switch (spec) {
          case 'Commerce':
            relationship.specialPrivileges.push('trade-insider-access');
            break;
          case 'Military':
            relationship.specialPrivileges.push('military-contracts');
            break;
          case 'Research & Development':
            relationship.specialPrivileges.push('research-access');
            break;
        }
      });
    }

    // Add restrictions for low trust
    if (relationship.trustLevel < 30) {
      relationship.restrictions.push('limited-contracts', 'no-credit-extension');
    }
    if (relationship.trustLevel < 15) {
      relationship.restrictions.push('no-sensitive-cargo', 'increased-scrutiny');
    }
  }

  /**
   * Check if player has access to specific content
   */
  hasAccess(factionId: string, requiredAccess: string): boolean {
    const relationship = this.factionRelationships.get(factionId);
    if (!relationship) return false;

    // Check if it's a restriction
    if (relationship.restrictions.includes(requiredAccess)) return false;

    // Check if it's a special privilege
    if (relationship.specialPrivileges.includes(requiredAccess)) return true;

    // Check access level requirements
    const accessLevelRequirements: Record<string, number> = {
      'basic-contracts': 1,
      'member-discounts': 2,
      'exclusive-contracts': 3,
      'priority-contracts': 4,
      'executive-access': 5
    };

    const requiredLevel = accessLevelRequirements[requiredAccess] || 1;
    return relationship.accessLevel >= requiredLevel;
  }

  /**
   * Create default contact at a station
   */
  createStationContact(stationId: string, factionId: string): void {
    const faction = this.factions.get(factionId);
    if (!faction) return;

    // Create a default contact for this station
    const contactData = ContactFactory.createStationContact(stationId, factionId);
    const contact = this.contactManager.meetContact(contactData);

    console.log(`Created station contact: ${contact.name} at station ${stationId}`);
  }

  /**
   * Get faction influence in a territory
   */
  getFactionInfluenceInTerritory(territoryId: string): Array<{factionId: string, influence: number}> {
    const influences: Array<{factionId: string, influence: number}> = [];

    this.factions.forEach((faction, factionId) => {
      if (faction.territories.includes(territoryId)) {
        influences.push({ factionId, influence: faction.influence });
      }
    });

    return influences.sort((a, b) => b.influence - a.influence);
  }
  getFactions(): FactionInfo[] {
    return Array.from(this.factions.values());
  }

  /**
   * Get faction information by ID
   */
  getFaction(factionId: string): FactionInfo | null {
    return this.factions.get(factionId) || null;
  }

  /**
   * Initialize reputation for a new player
   */
  initializePlayerReputation(): Map<string, FactionReputation> {
    const reputation = new Map<string, FactionReputation>();
    
    this.factions.forEach((faction) => {
      reputation.set(faction.id, {
        faction: faction.id,
        standing: 0, // Neutral starting reputation
        rank: this.calculateRank(0),
        missions: 0
      });
    });

    return reputation;
  }

  /**
   * Modify faction reputation with enhanced relationship effects
   */
  modifyReputation(
    playerReputation: Map<string, FactionReputation>,
    factionId: string,
    change: number,
    reason: string
  ): { success: boolean; newReputation?: FactionReputation; error?: string } {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return { success: false, error: 'Unknown faction' };
    }

    const currentRep = playerReputation.get(factionId);
    if (!currentRep) {
      return { success: false, error: 'Player has no reputation with this faction' };
    }

    // Apply reputation change with bounds checking
    const newStanding = Math.max(-100, Math.min(100, currentRep.standing + change));
    const newRank = this.calculateRank(newStanding);

    const updatedReputation: FactionReputation = {
      ...currentRep,
      standing: newStanding,
      rank: newRank
    };

    playerReputation.set(factionId, updatedReputation);

    // Update faction relationship (Phase 4.2 enhancement)
    this.updateFactionRelationship(factionId, change);

    // Record the change
    this.reputationHistory.push({
      factionId,
      change,
      reason,
      timestamp: Date.now()
    });

    console.log(`Reputation change: ${faction.name} ${change > 0 ? '+' : ''}${change} (${reason})`);
    
    return { success: true, newReputation: updatedReputation };
  }

  /**
   * Calculate rank based on standing
   */
  calculateRank(standing: number): string {
    if (standing >= 80) return 'Hero';
    if (standing >= 60) return 'Champion';
    if (standing >= 40) return 'Ally';
    if (standing >= 20) return 'Friend';
    if (standing >= 5) return 'Liked';
    if (standing >= -5) return 'Neutral';
    if (standing >= -20) return 'Disliked';
    if (standing >= -40) return 'Enemy';
    if (standing >= -60) return 'Hostile';
    if (standing >= -80) return 'Hated';
    return 'Nemesis';
  }

  /**
   * Get faction benefits based on reputation
   */
  getFactionBenefits(standing: number): FactionBenefits {
    let tradingDiscount = 0;
    let serviceDiscount = 0;
    const contractAccess: string[] = [];
    const equipmentAccess: string[] = [];

    // Calculate benefits based on standing
    if (standing >= 20) {
      tradingDiscount = Math.min(20, Math.floor(standing / 4)); // Up to 20% discount
      serviceDiscount = Math.min(15, Math.floor(standing / 5)); // Up to 15% discount
    }

    if (standing >= 40) {
      contractAccess.push('priority-contracts');
    }

    if (standing >= 60) {
      contractAccess.push('exclusive-contracts');
      equipmentAccess.push('faction-equipment');
    }

    if (standing >= 80) {
      contractAccess.push('legendary-contracts');
      equipmentAccess.push('prototype-equipment');
    }

    return {
      tradingDiscount,
      contractAccess,
      equipmentAccess,
      serviceDiscount
    };
  }

  /**
   * Check reputation consequences using enhanced faction relationships
   */
  checkReputationConsequences(
    actionFactionId: string,
    reputationChange: number
  ): ReputationChange[] {
    const consequences: ReputationChange[] = [];
    const actionFaction = this.factions.get(actionFactionId);
    
    if (!actionFaction) return consequences;

    // Use faction relationship data instead of hardcoded relationships
    const relationships = actionFaction.relationships;
    
    Object.entries(relationships).forEach(([otherFactionId, relationshipValue]) => {
      const consequenceChange = Math.round(reputationChange * relationshipValue);
      
      if (Math.abs(consequenceChange) >= 1) {
        consequences.push({
          factionId: otherFactionId,
          change: consequenceChange,
          reason: `Association with ${actionFaction.name}`,
          timestamp: Date.now()
        });
      }
    });

    return consequences;
  }

  /**
   * Get recent reputation changes
   */
  getReputationHistory(limit: number = 10): ReputationChange[] {
    return this.reputationHistory
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Handle trade completion reputation effects
   */
  handleTradeCompletion(
    playerReputation: Map<string, FactionReputation>,
    stationFactionId: string,
    tradeValue: number
  ): ReputationChange[] {
    const changes: ReputationChange[] = [];
    
    // Base reputation gain from trade
    const baseGain = Math.min(5, Math.floor(tradeValue / 10000)); // 1 point per 10k credits, max 5
    
    if (baseGain > 0) {
      const result = this.modifyReputation(
        playerReputation,
        stationFactionId,
        baseGain,
        `Trade completion (${tradeValue.toLocaleString()} CR)`
      );
      
      if (result.success) {
        changes.push({
          factionId: stationFactionId,
          change: baseGain,
          reason: `Trade completion`,
          timestamp: Date.now()
        });

        // Check for consequences with other factions
        const consequences = this.checkReputationConsequences(
          stationFactionId,
          baseGain
        );
        
        consequences.forEach(consequence => {
          this.modifyReputation(
            playerReputation,
            consequence.factionId,
            consequence.change,
            consequence.reason
          );
          changes.push(consequence);
        });
      }
    }

    return changes;
  }

  /**
   * Handle mission completion reputation effects
   */
  handleMissionCompletion(
    playerReputation: Map<string, FactionReputation>,
    factionId: string,
    missionType: string,
    success: boolean
  ): ReputationChange[] {
    const changes: ReputationChange[] = [];
    const reputation = playerReputation.get(factionId);
    
    if (!reputation) return changes;

    // Calculate reputation change based on mission outcome
    let reputationChange = 0;
    
    if (success) {
      switch (missionType) {
        case 'delivery':
          reputationChange = 3;
          break;
        case 'urgent-delivery':
          reputationChange = 5;
          break;
        case 'bulk-transport':
          reputationChange = 4;
          break;
        default:
          reputationChange = 2;
      }
      
      // Update mission count
      reputation.missions += 1;
    } else {
      reputationChange = -5; // Penalty for mission failure
    }

    const result = this.modifyReputation(
      playerReputation,
      factionId,
      reputationChange,
      success ? `Mission completed: ${missionType}` : `Mission failed: ${missionType}`
    );

    if (result.success) {
      changes.push({
        factionId,
        change: reputationChange,
        reason: success ? 'Mission completed' : 'Mission failed',
        timestamp: Date.now()
      });

      // Check for consequences if mission was significant
      if (Math.abs(reputationChange) >= 3) {
        const consequences = this.checkReputationConsequences(
          factionId,
          reputationChange
        );
        
        consequences.forEach(consequence => {
          this.modifyReputation(
            playerReputation,
            consequence.factionId,
            consequence.change,
            consequence.reason
          );
          changes.push(consequence);
        });
      }
    }

    return changes;
  }

  /**
   * Serialize faction manager state with enhanced data
   */
  serialize(): any {
    return {
      reputationHistory: this.reputationHistory,
      factionRelationships: Array.from(this.factionRelationships.entries()),
      contactManager: this.contactManager.serialize()
    };
  }

  /**
   * Deserialize faction manager state with enhanced data
   */
  deserialize(data: any): void {
    if (data?.reputationHistory) {
      this.reputationHistory = data.reputationHistory;
    }
    if (data?.factionRelationships) {
      this.factionRelationships = new Map(data.factionRelationships);
    }
    if (data?.contactManager) {
      this.contactManager.deserialize(data.contactManager);
    }
  }
}