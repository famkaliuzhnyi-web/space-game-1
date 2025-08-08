import { TradeContract } from '../types/economy';

// Forward declaration to avoid circular dependency
interface ICharacterProgressionSystem {
  awardTradingExperience(activity: string, data: {value?: number; profitMargin?: number}): boolean;
}

export class ContractManager {
  private contracts: Map<string, TradeContract> = new Map();
  private contractIdCounter: number = 1;
  private lastGenerationTime: number = 0;
  private generationInterval: number = 1800000; // Generate new contracts every 30 minutes
  private progressionSystem: ICharacterProgressionSystem | null = null;

  constructor() {
    this.lastGenerationTime = Date.now();
    // Generate initial contracts for testing
    this.generateRandomContracts();
  }

  /**
   * Set the progression system for experience awards (dependency injection)
   */
  setProgressionSystem(progressionSystem: ICharacterProgressionSystem): void {
    this.progressionSystem = progressionSystem;
  }

  /**
   * Update contract system - generate new contracts and clean up expired ones
   */
  update(_deltaTime: number): void {
    const currentTime = Date.now();
    
    // Generate new contracts periodically
    if (currentTime - this.lastGenerationTime >= this.generationInterval) {
      this.generateRandomContracts();
      this.lastGenerationTime = currentTime;
    }

    // Remove expired contracts
    this.cleanupExpiredContracts();
    
    // Update contract deadlines
    this.updateContractStatus();
  }

  /**
   * Generate new trade contracts based on market conditions
   */
  generateRandomContracts(): void {
    // Generate 2-5 new contracts
    const contractCount = 2 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < contractCount; i++) {
      const contract = this.generateContract();
      if (contract) {
        this.contracts.set(contract.id, contract);
      }
    }
  }

  /**
   * Generate a single contract based on economic conditions
   */
  private generateContract(): TradeContract | null {
    const contractTypes: TradeContract['type'][] = ['delivery', 'transport', 'bulk'];
    const type = contractTypes[Math.floor(Math.random() * contractTypes.length)];
    
    // For now, create basic delivery contracts
    const commodities = ['iron-ore', 'electronics', 'carbon-crystals', 'protein-rations', 'fusion-cells'];
    const commodityId = commodities[Math.floor(Math.random() * commodities.length)];
    
    // Simple station selection (would be improved with actual economic data)
    const stations = ['earth-station', 'alpha-station', 'sirius-station'];
    const originId = stations[Math.floor(Math.random() * stations.length)];
    let destinationId = stations[Math.floor(Math.random() * stations.length)];
    
    // Ensure origin and destination are different
    while (destinationId === originId) {
      destinationId = stations[Math.floor(Math.random() * stations.length)];
    }

    const quantity = 10 + Math.floor(Math.random() * 50); // 10-60 units
    const pricePerUnit = 50 + Math.floor(Math.random() * 200); // 50-250 credits per unit
    const totalValue = quantity * pricePerUnit;
    
    // Calculate base reward (10-30% of cargo value)
    const baseReward = Math.floor(totalValue * (0.1 + Math.random() * 0.2));
    
    // Time limit: 2-12 hours based on difficulty
    const timeLimit = 2 + Math.floor(Math.random() * 10);
    
    const contract: TradeContract = {
      id: `contract-${this.contractIdCounter++}`,
      type,
      issuer: this.generateIssuerName(),
      title: this.generateContractTitle(type, commodityId, destinationId),
      description: this.generateContractDescription(type, commodityId, originId, destinationId, quantity),
      
      origin: originId,
      destination: destinationId,
      commodity: commodityId,
      quantity,
      pricePerUnit,
      totalValue,
      
      timeLimit,
      minimumCargoCapacity: quantity,
      securityClearance: this.generateSecurityRequirement(),
      
      baseReward,
      bonusReward: Math.floor(baseReward * 0.5), // 50% bonus for fast completion
      reputationReward: {
        faction: this.getFactionForStation(destinationId),
        amount: 10 + Math.floor(Math.random() * 20)
      },
      
      status: 'available',
      deadline: Date.now() + (timeLimit * 3600000) // Convert hours to milliseconds
    };

    return contract;
  }

  /**
   * Accept a contract for the player
   */
  acceptContract(contractId: string, playerId: string): {success: boolean, error?: string} {
    const contract = this.contracts.get(contractId);
    
    if (!contract) {
      return { success: false, error: 'Contract not found' };
    }
    
    if (contract.status !== 'available') {
      return { success: false, error: 'Contract is no longer available' };
    }
    
    if (Date.now() > contract.deadline) {
      return { success: false, error: 'Contract has expired' };
    }
    
    contract.status = 'accepted';
    contract.acceptedBy = playerId;
    
    return { success: true };
  }

  /**
   * Complete a contract
   */
  completeContract(contractId: string): {success: boolean, reward?: number, error?: string} {
    const contract = this.contracts.get(contractId);
    
    if (!contract) {
      return { success: false, error: 'Contract not found' };
    }
    
    if (contract.status !== 'accepted') {
      return { success: false, error: 'Contract not accepted or already completed' };
    }
    
    const currentTime = Date.now();
    const timeRemaining = contract.deadline - currentTime;
    
    if (timeRemaining <= 0) {
      contract.status = 'failed';
      return { success: false, error: 'Contract deadline exceeded' };
    }
    
    contract.status = 'completed';
    contract.completedAt = currentTime;
    
    // Calculate reward with time bonus
    let totalReward = contract.baseReward;
    const completionTime = currentTime - (contract.deadline - (contract.timeLimit * 3600000));
    const timeUsedRatio = completionTime / (contract.timeLimit * 3600000);
    
    // Bonus for completing in first 50% of time limit
    if (timeUsedRatio <= 0.5 && contract.bonusReward) {
      totalReward += contract.bonusReward;
    }
    
    // Award contract completion experience
    if (this.progressionSystem) {
      this.progressionSystem.awardTradingExperience('contract_complete', { 
        value: totalReward 
      });
    }
    
    return { success: true, reward: totalReward };
  }

  /**
   * Get all available contracts
   */
  getAvailableContracts(): TradeContract[] {
    return Array.from(this.contracts.values())
      .filter(contract => contract.status === 'available' && Date.now() < contract.deadline)
      .sort((a, b) => b.baseReward - a.baseReward); // Sort by reward, highest first
  }

  /**
   * Get player's active contracts
   */
  getPlayerContracts(playerId: string): TradeContract[] {
    return Array.from(this.contracts.values())
      .filter(contract => contract.acceptedBy === playerId && 
                         (contract.status === 'accepted' || contract.status === 'in-progress'));
  }

  /**
   * Get contract by ID
   */
  getContract(contractId: string): TradeContract | undefined {
    return this.contracts.get(contractId);
  }

  /**
   * Remove expired contracts
   */
  private cleanupExpiredContracts(): void {
    const currentTime = Date.now();
    
    for (const [id, contract] of this.contracts.entries()) {
      if (currentTime > contract.deadline && contract.status === 'available') {
        contract.status = 'expired';
      }
      
      // Remove very old contracts (completed/failed/expired more than 24 hours ago)
      if (contract.status !== 'available' && contract.status !== 'accepted' && 
          contract.status !== 'in-progress' && 
          currentTime - contract.deadline > 86400000) {
        this.contracts.delete(id);
      }
    }
  }

  /**
   * Update contract status based on time
   */
  private updateContractStatus(): void {
    const currentTime = Date.now();
    
    for (const contract of this.contracts.values()) {
      if (contract.status === 'accepted' && currentTime > contract.deadline) {
        contract.status = 'failed';
      }
    }
  }

  /**
   * Generate a realistic contract title
   */
  private generateContractTitle(type: string, commodityId: string, destination: string): string {
    const commodity = this.getCommodityDisplayName(commodityId);
    const destName = this.getStationDisplayName(destination);
    
    switch (type) {
      case 'delivery':
        return `Deliver ${commodity} to ${destName}`;
      case 'transport':
        return `Transport ${commodity} - ${destName}`;
      case 'bulk':
        return `Bulk ${commodity} Shipment - ${destName}`;
      default:
        return `Trade Mission - ${commodity}`;
    }
  }

  /**
   * Generate contract description
   */
  private generateContractDescription(_type: string, commodityId: string, origin: string, destination: string, quantity: number): string {
    const commodity = this.getCommodityDisplayName(commodityId);
    const originName = this.getStationDisplayName(origin);
    const destName = this.getStationDisplayName(destination);
    
    const descriptions = [
      `We need ${quantity} units of ${commodity} transported from ${originName} to ${destName}. Standard freight rates apply.`,
      `Urgent delivery required: ${quantity} units of ${commodity} from ${originName} to ${destName}. Time-sensitive cargo.`,
      `Commercial shipping contract for ${quantity} units of ${commodity}. Pick up at ${originName}, deliver to ${destName}.`,
      `Supply run needed: Transport ${quantity} units of ${commodity} from ${originName} to ${destName}. Reliable transport required.`,
      `Contract shipping: ${quantity} units of ${commodity} from ${originName} to ${destName}. Payment on delivery.`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  /**
   * Generate issuer name
   */
  private generateIssuerName(): string {
    const companies = [
      'Stellar Logistics Corp',
      'Interworld Shipping',
      'Galactic Freight Solutions',
      'Cosmic Commerce Inc',
      'Deep Space Transport',
      'Orbital Trade Consortium',
      'Nebula Express',
      'Starline Cargo Services'
    ];
    
    return companies[Math.floor(Math.random() * companies.length)];
  }

  /**
   * Generate security clearance requirement
   */
  private generateSecurityRequirement(): number | undefined {
    // 30% chance of requiring security clearance
    if (Math.random() < 0.3) {
      return 5 + Math.floor(Math.random() * 5); // 5-9 security level required
    }
    return undefined;
  }

  /**
   * Get faction for station (simplified)
   */
  private getFactionForStation(stationId: string): string {
    const factions: Record<string, string> = {
      'earth-station': 'Earth Federation',
      'alpha-station': 'Alpha Centauri Alliance',
      'sirius-station': 'Sirius Consortium'
    };
    
    return factions[stationId] || 'Independent Traders';
  }

  /**
   * Get display name for commodity
   */
  private getCommodityDisplayName(commodityId: string): string {
    const names: Record<string, string> = {
      'iron-ore': 'Iron Ore',
      'electronics': 'Electronics',
      'carbon-crystals': 'Carbon Crystals',
      'protein-rations': 'Protein Rations',
      'fusion-cells': 'Fusion Cells',
      'machinery': 'Machinery',
      'medical-supplies': 'Medical Supplies'
    };
    
    return names[commodityId] || commodityId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get display name for station
   */
  private getStationDisplayName(stationId: string): string {
    const names: Record<string, string> = {
      'earth-station': 'Earth Station Alpha',
      'alpha-station': 'Alpha Centauri Station',
      'sirius-station': 'Sirius Trade Hub'
    };
    
    return names[stationId] || stationId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}