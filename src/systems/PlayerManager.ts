import { 
  Player, 
  PlayerWithCurrentShip,
  Ship, 
  CargoItem, 
  ShipClass, 
  TradeTransaction, 
  InventoryManager,
  PlayerStatistics,
  EquipmentItem
} from '../types/player';
import { getCommodity } from '../data/commodities';
import { ShipStorageManager } from './ShipStorageManager';
import { FactionManager, ReputationChange } from './FactionManager';
import { ContactFactory } from './ContactManager';
import { CharacterManager } from './CharacterManager';
import { Character } from '../types/character';
import { Contact } from '../types/contacts';
import { NavigationManager, TravelPlan, TravelProgress } from './NavigationManager';
import { NavigationTarget } from '../types/world';
import { TimeManager } from './TimeManager';

// Forward declaration to avoid circular dependency
interface ICharacterProgressionSystem {
  awardTradingExperience(activity: string, data: {value?: number; profitMargin?: number}): boolean;
}

export class PlayerManager implements InventoryManager {
  private player: Player;
  private transactions: TradeTransaction[] = [];
  private shipStorage: ShipStorageManager;
  private factionManager: FactionManager;
  private characterManager: CharacterManager;
  private navigationManager: NavigationManager | null = null;
  private worldManager: any = null; // WorldManager reference for navigation
  private progressionSystem: ICharacterProgressionSystem | null = null;
  private equipmentInventory: EquipmentItem[] = []; // Store uninstalled equipment

  constructor(playerId: string = 'player-1', playerName: string = 'Captain') {
    this.shipStorage = new ShipStorageManager();
    this.factionManager = new FactionManager();
    this.characterManager = new CharacterManager();
    this.player = this.createDefaultPlayer(playerId, playerName);
  }

  /**
   * Set the progression system for experience awards (dependency injection)
   */
  setProgressionSystem(progressionSystem: ICharacterProgressionSystem): void {
    this.progressionSystem = progressionSystem;
  }

  /**
   * Set the navigation manager (dependency injection)
   */
  setNavigationManager(navigationManager: NavigationManager): void {
    this.navigationManager = navigationManager;
  }

  /**
   * Set the world manager (dependency injection) - needed for navigation
   */
  setWorldManager(worldManager: any): void {
    this.worldManager = worldManager;
  }

  private createDefaultPlayer(id: string, name: string): Player {
    const defaultShipClass: ShipClass = {
      id: 'light-freighter',
      name: 'Light Freighter',
      category: 'transport',
      baseCargoCapacity: 100,
      baseFuelCapacity: 50,
      baseSpeed: 120,
      baseShields: 25,
      equipmentSlots: {
        engines: 1,
        cargo: 2,
        shields: 1,
        weapons: 1,
        utility: 1
      }
    };

    const defaultShip: Ship = {
      id: 'player-ship-1',
      name: 'Stellar Venture',
      class: defaultShipClass,
      cargo: {
        capacity: 100,
        used: 0,
        items: new Map()
      },
      equipment: {
        engines: [],
        cargo: [],
        shields: [],
        weapons: [],
        utility: []
      },
      condition: {
        hull: 1.0,
        engines: 1.0,
        cargo: 1.0,
        shields: 1.0,
        lastMaintenance: Date.now()
      },
      location: {
        systemId: 'sol',
        stationId: 'earth-station',
        isInTransit: false
      }
    };

    const defaultStatistics: PlayerStatistics = {
      totalTradeValue: 0,
      missionsCompleted: 0,
      distanceTraveled: 0,
      timeInGame: 0,
      profitEarned: 0,
      lossesIncurred: 0,
      stationsVisited: new Set(['earth-station']),
      commoditiesTraded: new Set(),
      contractsCompleted: 0,
      contractsFailed: 0
    };

    const ownedShips = new Map<string, Ship>();
    ownedShips.set(defaultShip.id, defaultShip);

    return {
      id,
      name,
      credits: 10000,
      currentStationId: 'earth-station',
      currentShipId: defaultShip.id,
      ownedShips,
      reputation: this.factionManager.initializePlayerReputation(),
      contracts: [],
      achievements: [],
      statistics: defaultStatistics
    };
  }

  // Core player data accessors
  getPlayer(): Player {
    return this.player;
  }

  // Backward compatibility - returns player with current ship as 'ship' property
  getPlayerWithCurrentShip(): PlayerWithCurrentShip {
    const currentShip = this.getCurrentShip();
    return {
      ...this.player,
      ship: currentShip
    };
  }

  getCurrentShip(): Ship {
    const ship = this.player.ownedShips.get(this.player.currentShipId);
    if (!ship) {
      throw new Error(`Current ship ${this.player.currentShipId} not found in owned ships`);
    }
    return ship;
  }

  getCurrentShipId(): string {
    return this.player.currentShipId;
  }

  getId(): string {
    return this.player.id;
  }

  getShipStorageManager(): ShipStorageManager {
    return this.shipStorage;
  }

  // Multi-ship management
  getOwnedShips(): Ship[] {
    return Array.from(this.player.ownedShips.values());
  }

  getOwnedShipsMap(): Map<string, Ship> {
    return this.player.ownedShips;
  }

  getShipById(shipId: string): Ship | null {
    return this.player.ownedShips.get(shipId) || null;
  }

  switchToShip(shipId: string): { success: boolean; error?: string } {
    const ship = this.player.ownedShips.get(shipId);
    if (!ship) {
      return { success: false, error: 'Ship not found in owned ships' };
    }

    // Check if ship is at the same station
    if (ship.location.stationId !== this.player.currentStationId) {
      return { 
        success: false, 
        error: `Ship is at ${ship.location.stationId}, but you are at ${this.player.currentStationId}` 
      };
    }

    // Check if ship is in storage
    const storageInfo = this.shipStorage.getShipStorageInfo(shipId);
    if (storageInfo) {
      return { 
        success: false, 
        error: 'Ship is in storage. Retrieve it first before switching.' 
      };
    }

    this.player.currentShipId = shipId;
    return { success: true };
  }

  purchaseShip(shipClassId: string, stationId: string): { success: boolean; ship?: Ship; cost?: number; error?: string } {
    if (stationId !== this.player.currentStationId) {
      return { success: false, error: 'You must be at the station to purchase a ship' };
    }

    const result = this.shipStorage.purchaseShip(stationId, shipClassId, this.player.credits, this.player.id);
    
    if (result.success && result.ship && result.cost !== undefined) {
      // Add ship to owned ships
      this.player.ownedShips.set(result.ship.id, result.ship);
      
      // Deduct credits
      this.player.credits -= result.cost;
      
      return { success: true, ship: result.ship, cost: result.cost };
    }

    return result;
  }

  storeShip(shipId: string): { success: boolean; dailyFee?: number; error?: string } {
    if (shipId === this.player.currentShipId) {
      return { success: false, error: 'Cannot store your current ship. Switch to another ship first.' };
    }

    const ship = this.player.ownedShips.get(shipId);
    if (!ship) {
      return { success: false, error: 'Ship not found in owned ships' };
    }

    return this.shipStorage.storeShip(ship, this.player.currentStationId);
  }

  retrieveShip(shipId: string): { success: boolean; ship?: Ship; totalFees?: number; error?: string } {
    const result = this.shipStorage.retrieveShip(shipId, this.player.id, this.player.credits);
    
    if (result.success && result.totalFees !== undefined) {
      // Deduct storage fees
      this.player.credits -= result.totalFees;
      
      return { success: true, totalFees: result.totalFees };
    }

    return result;
  }

  getShipsAtCurrentStation(): { owned: Ship[]; stored: any[]; forSale: any[] } {
    const ownedAtStation = this.getOwnedShips().filter(ship => 
      ship.location.stationId === this.player.currentStationId
    );
    
    const storedAtStation = this.shipStorage.getShipsAtStation(this.player.currentStationId);
    const shipsForSale = this.shipStorage.getShipYardOffers(this.player.currentStationId);

    return {
      owned: ownedAtStation,
      stored: storedAtStation,
      forSale: shipsForSale
    };
  }

  getCredits(): number {
    return this.player.credits;
  }

  addCredits(amount: number): void {
    this.player.credits += amount;
  }

  spendCredits(amount: number): boolean {
    if (this.player.credits >= amount) {
      this.player.credits -= amount;
      return true;
    }
    return false;
  }

  getCurrentStation(): string {
    return this.player.currentStationId;
  }

  setCurrentStation(stationId: string): void {
    this.player.currentStationId = stationId;
    const currentShip = this.getCurrentShip();
    currentShip.location.stationId = stationId;
    this.player.statistics.stationsVisited.add(stationId);
  }

  // InventoryManager implementation
  addCommodity(commodityId: string, quantity: number, purchasePrice: number): { success: boolean; error?: string } {
    const commodity = getCommodity(commodityId);
    if (!commodity) {
      return { success: false, error: `Unknown commodity: ${commodityId}` };
    }

    // Check cargo space
    const spaceNeeded = quantity * commodity.unitSize;
    if (!this.canFitCommodity(commodityId, quantity)) {
      return { success: false, error: `Insufficient cargo space. Need ${spaceNeeded} units, have ${this.getAvailableSpace()}` };
    }

    // Add to current ship's cargo
    const currentShip = this.getCurrentShip();
    const cargo = currentShip.cargo;
    const existingItem = cargo.items.get(commodityId);

    if (existingItem) {
      // Calculate weighted average price
      const totalQuantity = existingItem.quantity + quantity;
      const totalValue = (existingItem.quantity * existingItem.averagePurchasePrice) + 
                        (quantity * purchasePrice);
      existingItem.averagePurchasePrice = totalValue / totalQuantity;
      existingItem.quantity = totalQuantity;
    } else {
      const newItem: CargoItem = {
        commodityId,
        quantity,
        averagePurchasePrice: purchasePrice,
        acquiredAt: Date.now(),
        expirationTime: commodity.perishable ? Date.now() + (commodity.shelfLife! * 24 * 60 * 60 * 1000) : undefined
      };
      cargo.items.set(commodityId, newItem);
    }

    cargo.used += spaceNeeded;
    this.player.statistics.commoditiesTraded.add(commodityId);

    return { success: true };
  }

  removeCommodity(commodityId: string, quantity: number): { success: boolean; error?: string } {
    const currentShip = this.getCurrentShip();
    const cargo = currentShip.cargo;
    const existingItem = cargo.items.get(commodityId);

    if (!existingItem) {
      return { success: false, error: `No ${commodityId} in cargo` };
    }

    if (existingItem.quantity < quantity) {
      return { success: false, error: `Insufficient quantity. Have ${existingItem.quantity}, need ${quantity}` };
    }

    const commodity = getCommodity(commodityId);
    if (!commodity) {
      return { success: false, error: `Unknown commodity: ${commodityId}` };
    }

    // Remove from cargo
    const spaceFreed = quantity * commodity.unitSize;
    existingItem.quantity -= quantity;
    cargo.used -= spaceFreed;

    // Remove item completely if quantity reaches zero
    if (existingItem.quantity === 0) {
      cargo.items.delete(commodityId);
    }

    return { success: true };
  }

  getAvailableSpace(): number {
    const currentShip = this.getCurrentShip();
    return currentShip.cargo.capacity - currentShip.cargo.used;
  }

  getCargoValue(): number {
    let totalValue = 0;
    const currentShip = this.getCurrentShip();
    for (const item of currentShip.cargo.items.values()) {
      totalValue += item.quantity * item.averagePurchasePrice;
    }
    return totalValue;
  }

  getCommodityQuantity(commodityId: string): number {
    const currentShip = this.getCurrentShip();
    const item = currentShip.cargo.items.get(commodityId);
    return item ? item.quantity : 0;
  }

  canFitCommodity(commodityId: string, quantity: number): boolean {
    const commodity = getCommodity(commodityId);
    if (!commodity) return false;

    const spaceNeeded = quantity * commodity.unitSize;
    return this.getAvailableSpace() >= spaceNeeded;
  }

  getCargoManifest(): CargoItem[] {
    const currentShip = this.getCurrentShip();
    return Array.from(currentShip.cargo.items.values());
  }

  clear(): void {
    const currentShip = this.getCurrentShip();
    currentShip.cargo.items.clear();
    currentShip.cargo.used = 0;
  }

  // Trading functionality
  executeBuy(stationId: string, commodityId: string, quantity: number, pricePerUnit: number): { success: boolean; error?: string } {
    const totalCost = quantity * pricePerUnit;

    // Check if player has enough credits
    if (!this.spendCredits(totalCost)) {
      return { success: false, error: `Insufficient credits. Need ${totalCost}, have ${this.player.credits + totalCost}` };
    }

    // Try to add to cargo
    const result = this.addCommodity(commodityId, quantity, pricePerUnit);
    if (!result.success) {
      // Refund credits if cargo addition failed
      this.addCredits(totalCost);
      return result;
    }

    // Record transaction
    this.recordTransaction({
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: this.player.id,
      stationId,
      commodityId,
      quantity,
      pricePerUnit,
      totalValue: totalCost,
      type: 'buy',
      timestamp: Date.now(),
      marketConditions: {
        supply: 0, // Would be filled by market system
        demand: 0,
        priceHistory: []
      }
    });

    // Update statistics
    this.player.statistics.totalTradeValue += totalCost;

    // Award trading experience
    if (this.progressionSystem) {
      this.progressionSystem.awardTradingExperience('trade_buy', { 
        value: totalCost 
      });
      
      // High-value trade bonus (over 5000 credits)
      if (totalCost > 5000) {
        this.progressionSystem.awardTradingExperience('high_value_trade', { 
          value: totalCost 
        });
      }
    }

    return { success: true };
  }

  executeSell(stationId: string, commodityId: string, quantity: number, pricePerUnit: number): { success: boolean; error?: string } {
    // Try to remove from cargo
    const result = this.removeCommodity(commodityId, quantity);
    if (!result.success) {
      return result;
    }

    const totalEarnings = quantity * pricePerUnit;
    this.addCredits(totalEarnings);

    // Calculate profit/loss
    const currentShip = this.getCurrentShip();
    const cargoItem = currentShip.cargo.items.get(commodityId);
    const averageCost = cargoItem?.averagePurchasePrice || 0;
    const profit = (pricePerUnit - averageCost) * quantity;
    
    if (profit > 0) {
      this.player.statistics.profitEarned += profit;
    } else {
      this.player.statistics.lossesIncurred += Math.abs(profit);
    }

    // Record transaction
    this.recordTransaction({
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: this.player.id,
      stationId,
      commodityId,
      quantity,
      pricePerUnit,
      totalValue: totalEarnings,
      type: 'sell',
      timestamp: Date.now(),
      marketConditions: {
        supply: 0,
        demand: 0,
        priceHistory: []
      }
    });

    // Update statistics
    this.player.statistics.totalTradeValue += totalEarnings;

    // Award trading experience
    if (this.progressionSystem) {
      const profitMargin = averageCost > 0 ? ((pricePerUnit - averageCost) / averageCost) * 100 : 0;
      
      this.progressionSystem.awardTradingExperience('trade_sell', { 
        value: totalEarnings,
        profitMargin: profitMargin
      });
      
      // Profitable trade bonus (over 10% profit)
      if (profitMargin > 10) {
        this.progressionSystem.awardTradingExperience('profitable_trade', { 
          value: totalEarnings,
          profitMargin: profitMargin
        });
      }
      
      // High-value trade bonus (over 5000 credits)
      if (totalEarnings > 5000) {
        this.progressionSystem.awardTradingExperience('high_value_trade', { 
          value: totalEarnings 
        });
      }
    }

    return { success: true };
  }

  private recordTransaction(transaction: TradeTransaction): void {
    this.transactions.push(transaction);
    
    // Keep only last 100 transactions to prevent memory bloat
    if (this.transactions.length > 100) {
      this.transactions = this.transactions.slice(-100);
    }
  }

  getTransactionHistory(): TradeTransaction[] {
    return [...this.transactions]; // Return copy
  }

  // Ship and equipment management
  getShip(): Ship {
    return this.getCurrentShip();
  }

  getCargoCapacity(): number {
    const currentShip = this.getCurrentShip();
    return currentShip.cargo.capacity;
  }

  getCargoUsed(): number {
    const currentShip = this.getCurrentShip();
    return currentShip.cargo.used;
  }

  // Ship repair and maintenance
  repairShipComponent(component: 'hull' | 'engines' | 'cargo' | 'shields'): { success: boolean; cost: number; error?: string } {
    const currentShip = this.getCurrentShip();
    const currentCondition = currentShip.condition[component];
    
    if (currentCondition >= 0.99) {
      return { success: false, cost: 0, error: `${component} doesn't need repair` };
    }

    const baseCost = {
      hull: 1000,
      engines: 800,
      cargo: 500,
      shields: 600
    };

    const damageFactor = (1 - currentCondition);
    const repairCost = Math.round(baseCost[component] * damageFactor);

    if (!this.spendCredits(repairCost)) {
      return { success: false, cost: repairCost, error: `Insufficient credits. Need ${repairCost}, have ${this.player.credits}` };
    }

    // Repair to 100%
    currentShip.condition[component] = 1.0;
    
    return { success: true, cost: repairCost };
  }

  performMaintenance(serviceType: 'basic' | 'full'): { success: boolean; cost: number; error?: string } {
    const costs = {
      basic: 500,
      full: 2500
    };

    const cost = costs[serviceType];

    if (!this.spendCredits(cost)) {
      return { success: false, cost, error: `Insufficient credits. Need ${cost}, have ${this.player.credits}` };
    }

    const currentShip = this.getCurrentShip();
    // Update last maintenance time
    currentShip.condition.lastMaintenance = Date.now();

    if (serviceType === 'full') {
      // Full service improves all conditions slightly
      Object.keys(currentShip.condition).forEach(key => {
        if (key !== 'lastMaintenance') {
          const current = currentShip.condition[key as keyof typeof currentShip.condition] as number;
          currentShip.condition[key as keyof typeof currentShip.condition] = Math.min(1.0, current + 0.05);
        }
      });

      // Improve equipment condition
      Object.values(currentShip.equipment).forEach(equipmentArray => {
        equipmentArray.forEach((item: EquipmentItem) => {
          item.condition = Math.min(1.0, item.condition + 0.1);
        });
      });
    }

    return { success: true, cost };
  }

  // Ship degradation over time (should be called periodically)
  degradeShipCondition(deltaTime: number): void {
    const degradationRate = 0.000001; // Very slow degradation
    const timeFactor = deltaTime * degradationRate;

    const currentShip = this.getCurrentShip();
    // Degrade ship condition based on time and usage
    Object.keys(currentShip.condition).forEach(key => {
      if (key !== 'lastMaintenance') {
        const current = currentShip.condition[key as keyof typeof currentShip.condition] as number;
        currentShip.condition[key as keyof typeof currentShip.condition] = Math.max(0.1, current - timeFactor);
      }
    });

    // Degrade equipment condition
    Object.values(currentShip.equipment).forEach(equipmentArray => {
      equipmentArray.forEach((item: EquipmentItem) => {
        item.condition = Math.max(0.1, item.condition - timeFactor);
      });
    });
  }

  // Testing/debugging methods
  simulateShipDamage(damageAmount: number = 0.3): void {
    const currentShip = this.getCurrentShip();
    // Damage hull most, others less
    currentShip.condition.hull = Math.max(0.1, currentShip.condition.hull - damageAmount);
    currentShip.condition.engines = Math.max(0.1, currentShip.condition.engines - damageAmount * 0.7);
    currentShip.condition.cargo = Math.max(0.1, currentShip.condition.cargo - damageAmount * 0.5);
    currentShip.condition.shields = Math.max(0.1, currentShip.condition.shields - damageAmount * 0.8);
    
    console.log('Ship damaged for testing - use Ship Management panel to repair');
  }

  // Faction management
  getFactionManager(): FactionManager {
    return this.factionManager;
  }

  getPlayerReputation(): Map<string, import('../types/player').FactionReputation> {
    return this.player.reputation;
  }

  /**
   * Enhanced Phase 4.2: Get reputation for a specific faction
   */
  getReputationForFaction(factionId: string): import('../types/player').FactionReputation | undefined {
    return this.player.reputation.get(factionId);
  }

  modifyFactionReputation(factionId: string, change: number, reason: string): ReputationChange[] {
    const result = this.factionManager.modifyReputation(this.player.reputation, factionId, change, reason);
    return result.success ? [{ factionId, change, reason, timestamp: Date.now() }] : [];
  }

  handleTradeReputationGain(stationFactionId: string, tradeValue: number): ReputationChange[] {
    return this.factionManager.handleTradeCompletion(this.player.reputation, stationFactionId, tradeValue);
  }

  handleMissionReputation(factionId: string, missionType: string, success: boolean): ReputationChange[] {
    return this.factionManager.handleMissionCompletion(this.player.reputation, factionId, missionType, success);
  }

  /**
   * Enhanced Phase 4.2: Discover and meet contacts at a specific station
   */
  discoverStationContacts(stationId: string, stationFactionId: string): Contact[] {
    const contactManager = this.factionManager.getContactManager();
    
    // Check if we already have contacts at this station
    const existingContacts = contactManager.getContactsAtStation(stationId);
    
    // Generate contacts if none exist at this station
    if (existingContacts.length === 0) {
      const playerReputation = this.getReputationForFaction(stationFactionId);
      const stationType = this.determineStationType(stationId);
      
      // Use enhanced contact generation
      const contactsToGenerate = ContactFactory.createEnhancedStationContacts(
        stationId, 
        stationFactionId, 
        stationType,
        playerReputation?.standing
      );

      const discoveredContacts: Contact[] = [];
      
      contactsToGenerate.forEach(contactData => {
        // Some contacts might require reputation to discover
        if (this.canDiscoverContact(contactData, playerReputation?.standing || 0)) {
          const newContact = contactManager.meetContact(contactData);
          discoveredContacts.push(newContact);
        }
      });
      
      return discoveredContacts;
    }
    
    return existingContacts;
  }

  /**
   * Enhanced Phase 4.2: Determine station type for better contact generation
   */
  private determineStationType(stationId: string): string {
    // This could be enhanced to use actual station data
    // For now, use simple heuristics based on station ID
    if (stationId.includes('military') || stationId.includes('defense')) return 'military';
    if (stationId.includes('industrial') || stationId.includes('mining')) return 'industrial';
    if (stationId.includes('research') || stationId.includes('lab')) return 'research';
    return 'trading';
  }

  /**
   * Enhanced Phase 4.2: Check if player can discover certain contacts
   */
  private canDiscoverContact(contactData: any, playerReputation: number): boolean {
    // Special contacts require reputation
    if (contactData.role?.id === 'research_director' && playerReputation < 30) return false;
    if (contactData.role?.id === 'information_broker' && playerReputation < 40) return false;
    if (contactData.role?.id === 'faction_representative' && playerReputation < 60) return false;
    
    return true;
  }

  /**
   * Enhanced Phase 4.2: Discover contacts through referrals from existing contacts
   */
  discoverContactsViaReferral(existingContactId: string, targetFactionId?: string): Contact[] {
    const contactManager = this.factionManager.getContactManager();
    return contactManager.discoverContactsViaReferral(existingContactId, targetFactionId);
  }

  /**
   * Get all contacts at current station
   */
  getCurrentStationContacts(currentStationId?: string): Contact[] {
    if (!currentStationId) return [];
    const contactManager = this.factionManager.getContactManager();
    return contactManager.getContactsAtStation(currentStationId);
  }

  // Save/load support
  serialize(): any {
    return {
      player: {
        ...this.player,
        reputation: Array.from(this.player.reputation.entries()),
        statistics: {
          ...this.player.statistics,
          stationsVisited: Array.from(this.player.statistics.stationsVisited),
          commoditiesTraded: Array.from(this.player.statistics.commoditiesTraded)
        },
        ownedShips: Array.from(this.player.ownedShips.entries()).map(([shipId, ship]) => [
          shipId,
          {
            ...ship,
            cargo: {
              ...ship.cargo,
              items: Array.from(ship.cargo.items.entries())
            }
          }
        ])
      },
      transactions: this.transactions,
      shipStorage: this.shipStorage.serialize(),
      factionManager: this.factionManager.serialize(),
      characterManager: this.characterManager.serialize()
    };
  }

  deserialize(data: any): void {
    if (data.player) {
      // Handle owned ships conversion
      const ownedShips = new Map<string, Ship>();
      if (data.player.ownedShips) {
        data.player.ownedShips.forEach(([shipId, shipData]: [string, any]) => {
          ownedShips.set(shipId, {
            ...shipData,
            cargo: {
              ...shipData.cargo,
              items: new Map(shipData.cargo?.items || [])
            }
          });
        });
      } else if (data.player.ship) {
        // Backward compatibility: convert old single ship to multi-ship format
        const legacyShip = {
          ...data.player.ship,
          cargo: {
            ...data.player.ship.cargo,
            items: new Map(data.player.ship.cargo?.items || [])
          }
        };
        ownedShips.set(legacyShip.id, legacyShip);
      }

      this.player = {
        ...data.player,
        currentShipId: data.player.currentShipId || (ownedShips.size > 0 ? Array.from(ownedShips.keys())[0] : 'player-ship-1'),
        ownedShips,
        reputation: new Map(data.player.reputation || []),
        statistics: {
          ...data.player.statistics,
          stationsVisited: new Set(data.player.statistics?.stationsVisited || []),
          commoditiesTraded: new Set(data.player.statistics?.commoditiesTraded || [])
        }
      };

      // Remove the old ship property if it exists
      delete (this.player as any).ship;
    }

    if (data.transactions) {
      this.transactions = data.transactions;
    }

    if (data.shipStorage) {
      this.shipStorage.deserialize(data.shipStorage);
    }

    if (data.factionManager) {
      this.factionManager.deserialize(data.factionManager);
    }

    if (data.characterManager) {
      this.characterManager.deserialize(data.characterManager);
    }
  }

  // Character System Integration
  
  /**
   * Get the character manager
   */
  getCharacterManager(): CharacterManager {
    return this.characterManager;
  }

  /**
   * Get current character (if character system is active)
   */
  getCharacter(): Character | null {
    return this.characterManager.getCharacter();
  }

  /**
   * Enable character system by creating a character
   */
  createCharacter(characterData: {
    name: string;
    appearance: any;
    backgroundId: string;
    allocatedAttributes?: any;
    allocatedSkills?: any;
  }): boolean {
    try {
      const character = this.characterManager.createCharacter(
        `${this.player.id}-character`,
        characterData.name,
        characterData.appearance,
        characterData.backgroundId,
        characterData.allocatedAttributes,
        characterData.allocatedSkills
      );
      
      this.player.characterId = character.id;
      return true;
    } catch (error) {
      console.error('Failed to create character:', error);
      return false;
    }
  }

  /**
   * Award experience to character (if character system is active)
   */
  awardExperience(amount: number, source: string, category: any): boolean {
    if (!this.player.characterId) return false;
    return this.characterManager.awardExperience(amount, source, category);
  }

  /**
   * Check if character system is active
   */
  hasCharacter(): boolean {
    return !!this.player.characterId && !!this.characterManager.getCharacter();
  }

  // Equipment Inventory Management
  
  /**
   * Add equipment to player inventory
   */
  addEquipmentToInventory(equipment: EquipmentItem): void {
    this.equipmentInventory.push(equipment);
  }

  /**
   * Remove equipment from player inventory
   */
  removeEquipmentFromInventory(equipmentId: string): boolean {
    const index = this.equipmentInventory.findIndex(item => item.id === equipmentId);
    if (index !== -1) {
      this.equipmentInventory.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all equipment in player inventory
   */
  getEquipmentInventory(): EquipmentItem[] {
    return [...this.equipmentInventory];
  }

  // Navigation and Travel Management

  /**
   * Start travel to a destination
   */
  startTravel(destination: NavigationTarget, origin?: NavigationTarget): { success: boolean; travelPlan?: TravelPlan; error?: string } {
    if (!this.navigationManager) {
      return { success: false, error: 'Navigation system not available' };
    }

    const currentShip = this.getCurrentShip();
    return this.navigationManager.startTravel(currentShip, destination, origin);
  }

  /**
   * Cancel current travel
   */
  cancelTravel(): { success: boolean; error?: string } {
    if (!this.navigationManager) {
      return { success: false, error: 'Navigation system not available' };
    }

    const currentShip = this.getCurrentShip();
    return this.navigationManager.cancelTravel(currentShip.id);
  }

  /**
   * Get current travel progress
   */
  getTravelProgress(): TravelProgress | null {
    if (!this.navigationManager) {
      return null;
    }

    const currentShip = this.getCurrentShip();
    return this.navigationManager.getTravelProgress(currentShip.id);
  }

  /**
   * Check if current ship is traveling
   */
  isInTransit(): boolean {
    const currentShip = this.getCurrentShip();
    return currentShip.location.isInTransit;
  }

  /**
   * Get travel history for current ship
   */
  getTravelHistory(): TravelPlan[] {
    if (!this.navigationManager) {
      return [];
    }

    const currentShip = this.getCurrentShip();
    return this.navigationManager.getTravelHistory(currentShip.id);
  }

  /**
   * Estimate travel time to destination
   */
  estimateTravelTime(destination: NavigationTarget, origin?: NavigationTarget): number {
    if (!this.navigationManager) {
      return 0;
    }

    const currentShip = this.getCurrentShip();
    const actualOrigin = origin || this.getCurrentLocationAsNavigationTarget();
    
    if (!actualOrigin) {
      return 0;
    }

    // Calculate ship speed for more accurate estimation
    let speed = currentShip.class.baseSpeed || 100;
    if (currentShip.equipment.engines.length > 0) {
      for (const engine of currentShip.equipment.engines) {
        if (engine.effects.speed) {
          speed += engine.effects.speed * engine.condition;
        }
      }
    }
    speed *= currentShip.condition.engines;

    return this.navigationManager.estimateTravelTime(actualOrigin, destination, speed);
  }

  /**
   * Complete travel when arrival time is reached (called by NavigationManager)
   */
  completeTravelArrival(): void {
    const currentShip = this.getCurrentShip();
    if (currentShip.location.isInTransit && currentShip.location.destination) {
      // Update ship location
      currentShip.location.isInTransit = false;
      
      // For station travel, update station ID
      if (currentShip.location.destination.startsWith('station:') || 
          currentShip.location.destination.includes('-station')) {
        currentShip.location.stationId = currentShip.location.destination;
        currentShip.location.coordinates = undefined;
      }
      
      // Clear travel data
      currentShip.location.destination = undefined;
      currentShip.location.arrivalTime = undefined;

      // Update statistics
      this.player.statistics.distanceTraveled += 1; // Basic increment, could be enhanced
    }
  }

  /**
   * Convert current location to NavigationTarget for travel calculations
   */
  private getCurrentLocationAsNavigationTarget(): NavigationTarget | null {
    const currentShip = this.getCurrentShip();
    const location = currentShip.location;

    // If we have worldManager, use it to create proper navigation targets
    if (this.worldManager && location.stationId) {
      return this.worldManager.createStationTarget(location.stationId);
    }

    // Fallback to basic implementation
    if (location.stationId) {
      return {
        type: 'station',
        id: location.stationId,
        name: location.stationId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        position: location.coordinates || { x: 0, y: 0 },
        distance: 0,
        estimatedTravelTime: 0
      };
    }

    if (location.coordinates) {
      return {
        type: 'station', // Default type for unknown coordinates
        id: `position-${location.coordinates.x}-${location.coordinates.y}`,
        name: `Current Position`,
        position: location.coordinates,
        distance: 0,
        estimatedTravelTime: 0
      };
    }

    return null;
  }

  /**
   * Get available travel destinations
   */
  getAvailableTravelDestinations(): NavigationTarget[] {
    if (!this.worldManager) {
      return [];
    }

    // Get nearby stations and systems
    const stations = this.worldManager.getAllReachableStations();
    const systems = this.worldManager.getAllReachableSystems();
    
    return [...stations, ...systems];
  }

  /**
   * Travel to a station by ID
   */
  travelToStation(stationId: string): { success: boolean; travelPlan?: TravelPlan; error?: string } {
    if (!this.worldManager) {
      return { success: false, error: 'World manager not available' };
    }

    const destination = this.worldManager.createStationTarget(stationId);
    if (!destination) {
      return { success: false, error: 'Station not found' };
    }

    return this.startTravel(destination);
  }

  /**
   * Travel to a system by ID
   */
  travelToSystem(systemId: string): { success: boolean; travelPlan?: TravelPlan; error?: string } {
    if (!this.worldManager) {
      return { success: false, error: 'World manager not available' };
    }

    const destination = this.worldManager.createSystemTarget(systemId);
    if (!destination) {
      return { success: false, error: 'System not found' };
    }

    return this.startTravel(destination);
  }
}