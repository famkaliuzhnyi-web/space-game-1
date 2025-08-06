import { 
  Player, 
  Ship, 
  CargoItem, 
  ShipClass, 
  TradeTransaction, 
  InventoryManager,
  PlayerStatistics
} from '../types/player';
import { getCommodity } from '../data/commodities';

export class PlayerManager implements InventoryManager {
  private player: Player;
  private transactions: TradeTransaction[] = [];

  constructor(playerId: string = 'player-1', playerName: string = 'Captain') {
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

    return {
      id,
      name,
      credits: 10000,
      currentStationId: 'earth-station',
      ship: defaultShip,
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
    this.player.ship.location.stationId = stationId;
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

    // Add to cargo
    const cargo = this.player.ship.cargo;
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
    const cargo = this.player.ship.cargo;
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
    return this.player.ship.cargo.capacity - this.player.ship.cargo.used;
  }

  getCargoValue(): number {
    let totalValue = 0;
    for (const item of this.player.ship.cargo.items.values()) {
      totalValue += item.quantity * item.averagePurchasePrice;
    }
    return totalValue;
  }

  getCommodityQuantity(commodityId: string): number {
    const item = this.player.ship.cargo.items.get(commodityId);
    return item ? item.quantity : 0;
  }

  canFitCommodity(commodityId: string, quantity: number): boolean {
    const commodity = getCommodity(commodityId);
    if (!commodity) return false;

    const spaceNeeded = quantity * commodity.unitSize;
    return this.getAvailableSpace() >= spaceNeeded;
  }

  getCargoManifest(): CargoItem[] {
    return Array.from(this.player.ship.cargo.items.values());
  }

  clear(): void {
    this.player.ship.cargo.items.clear();
    this.player.ship.cargo.used = 0;
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
    const cargoItem = this.player.ship.cargo.items.get(commodityId);
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
    return this.player.ship;
  }

  getCargoCapacity(): number {
    return this.player.ship.cargo.capacity;
  }

  getCargoUsed(): number {
    return this.player.ship.cargo.used;
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
        ship: {
          ...this.player.ship,
          cargo: {
            ...this.player.ship.cargo,
            items: Array.from(this.player.ship.cargo.items.entries())
          }
        }
      },
      transactions: this.transactions
    };
  }

  deserialize(data: any): void {
    if (data.player) {
      this.player = {
        ...data.player,
        reputation: new Map(data.player.reputation || []),
        statistics: {
          ...data.player.statistics,
          stationsVisited: new Set(data.player.statistics?.stationsVisited || []),
          commoditiesTraded: new Set(data.player.statistics?.commoditiesTraded || [])
        },
        ship: {
          ...data.player.ship,
          cargo: {
            ...data.player.ship.cargo,
            items: new Map(data.player.ship.cargo?.items || [])
          }
        }
      };
    }

    if (data.transactions) {
      this.transactions = data.transactions;
    }
  }
}