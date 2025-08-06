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

export class PlayerManager implements InventoryManager {
  private player: Player;
  private transactions: TradeTransaction[] = [];
  private shipStorage: ShipStorageManager;

  constructor(playerId: string = 'player-1', playerName: string = 'Captain') {
    this.shipStorage = new ShipStorageManager();
    this.player = this.createDefaultPlayer(playerId, playerName);
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
      reputation: new Map(),
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

  // Multi-ship management
  getOwnedShips(): Ship[] {
    return Array.from(this.player.ownedShips.values());
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
      shipStorage: this.shipStorage.serialize()
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
  }
}