import { FactionReputation } from '../types/player';

export interface FactionInfo {
  id: string;
  name: string;
  description: string;
  homeStation?: string;
  colors: {
    primary: string;
    secondary: string;
  };
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

  constructor() {
    this.initializeFactions();
  }

  /**
   * Initialize default factions
   */
  private initializeFactions(): void {
    const defaultFactions: FactionInfo[] = [
      {
        id: 'traders-guild',
        name: 'Traders Guild',
        description: 'Independent merchant organization focused on free trade',
        homeStation: 'trade-hub-1',
        colors: { primary: '#4ade80', secondary: '#22c55e' }
      },
      {
        id: 'earth-federation',
        name: 'Earth Federation',
        description: 'Government alliance representing Earth and core worlds',
        homeStation: 'earth-station',
        colors: { primary: '#3b82f6', secondary: '#1d4ed8' }
      },
      {
        id: 'outer-colonies',
        name: 'Outer Colonies Coalition',
        description: 'Alliance of frontier settlements seeking independence',
        homeStation: 'frontier-station-1',
        colors: { primary: '#f59e0b', secondary: '#d97706' }
      },
      {
        id: 'industrial-consortium',
        name: 'Industrial Consortium',
        description: 'Corporate alliance controlling heavy industry and mining',
        homeStation: 'industrial-complex-1',
        colors: { primary: '#8b5cf6', secondary: '#7c3aed' }
      },
      {
        id: 'security-forces',
        name: 'Security Forces',
        description: 'Joint law enforcement and defense organization',
        homeStation: 'security-outpost-1',
        colors: { primary: '#ef4444', secondary: '#dc2626' }
      }
    ];

    defaultFactions.forEach(faction => {
      this.factions.set(faction.id, faction);
    });
  }

  /**
   * Get all available factions
   */
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
   * Modify faction reputation
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
   * Check if an action would affect reputation with other factions
   */
  checkReputationConsequences(
    actionFactionId: string,
    reputationChange: number
  ): ReputationChange[] {
    const consequences: ReputationChange[] = [];
    const actionFaction = this.factions.get(actionFactionId);
    
    if (!actionFaction) return consequences;

    // Define faction relationships (simplified)
    const factionRelationships: Record<string, Record<string, number>> = {
      'traders-guild': {
        'industrial-consortium': 0.3, // Positive relationship
        'security-forces': -0.2 // Slight negative
      },
      'earth-federation': {
        'outer-colonies': -0.5, // Opposed
        'security-forces': 0.4 // Allied
      },
      'outer-colonies': {
        'earth-federation': -0.5, // Opposed
        'traders-guild': 0.2 // Friendly
      },
      'industrial-consortium': {
        'traders-guild': 0.3, // Business partners
        'outer-colonies': -0.3 // Competitive
      },
      'security-forces': {
        'earth-federation': 0.4, // Allied
        'traders-guild': -0.2 // Suspicious
      }
    };

    // Calculate consequences for other factions
    const relationships = factionRelationships[actionFactionId] || {};
    
    Object.entries(relationships).forEach(([otherFactionId, relationship]) => {
      const consequenceChange = Math.round(reputationChange * relationship);
      
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
   * Serialize faction manager state
   */
  serialize(): any {
    return {
      reputationHistory: this.reputationHistory
    };
  }

  /**
   * Deserialize faction manager state
   */
  deserialize(data: any): void {
    if (data?.reputationHistory) {
      this.reputationHistory = data.reputationHistory;
    }
  }
}