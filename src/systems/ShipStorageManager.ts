import { Ship, ShipClass } from '../types/player';
import { SHIP_CLASSES } from '../data/equipment';

export interface ShipStorageSlot {
  shipId: string;
  stationId: string;
  storedAt: number; // Timestamp when stored
  maintenanceDue: number; // Timestamp when maintenance is due
  storageFee: number; // Daily storage fee
}

export interface ShipYardOffer {
  shipClassId: string;
  shipClass: ShipClass;
  basePrice: number;
  discount: number; // 0-1, percentage discount
  condition: number; // 0-1, condition of the ship
  availableCount: number;
}

export class ShipStorageManager {
  private storedShips: Map<string, ShipStorageSlot> = new Map(); // shipId -> storage slot
  private shipYards: Map<string, ShipYardOffer[]> = new Map(); // stationId -> available ships
  private lastStorageFeesCollected: number = Date.now();
  private storageFeesInterval: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeShipYards();
  }

  /**
   * Store a ship at a station
   */
  storeShip(ship: Ship, stationId: string): { success: boolean; dailyFee?: number; error?: string } {
    if (ship.location.stationId !== stationId) {
      return { success: false, error: 'Ship must be at the station to store it' };
    }

    if (this.storedShips.has(ship.id)) {
      return { success: false, error: 'Ship is already in storage' };
    }

    const dailyFee = this.calculateStorageFee(ship);
    const storageDueDate = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days maintenance due

    const storageSlot: ShipStorageSlot = {
      shipId: ship.id,
      stationId,
      storedAt: Date.now(),
      maintenanceDue: storageDueDate,
      storageFee: dailyFee
    };

    this.storedShips.set(ship.id, storageSlot);

    // Update ship location to indicate it's in storage
    ship.location.stationId = stationId;
    ship.location.isInTransit = false;

    return { success: true, dailyFee };
  }

  /**
   * Retrieve a ship from storage
   */
  retrieveShip(shipId: string, _playerId: string, playerCredits: number): { 
    success: boolean; 
    ship?: Ship; 
    totalFees?: number; 
    error?: string 
  } {
    const storageSlot = this.storedShips.get(shipId);
    if (!storageSlot) {
      return { success: false, error: 'Ship not found in storage' };
    }

    // Calculate accumulated storage fees
    const daysStored = Math.ceil((Date.now() - storageSlot.storedAt) / (24 * 60 * 60 * 1000));
    const totalFees = daysStored * storageSlot.storageFee;

    if (playerCredits < totalFees) {
      return { 
        success: false, 
        totalFees, 
        error: `Insufficient credits to pay storage fees. Need ${totalFees}, have ${playerCredits}` 
      };
    }

    // Remove from storage
    this.storedShips.delete(shipId);

    return { success: true, totalFees };
  }

  /**
   * Get ships stored at a specific station
   */
  getShipsAtStation(stationId: string): ShipStorageSlot[] {
    return Array.from(this.storedShips.values()).filter(slot => slot.stationId === stationId);
  }

  /**
   * Get storage info for a specific ship
   */
  getShipStorageInfo(shipId: string): ShipStorageSlot | null {
    return this.storedShips.get(shipId) || null;
  }

  /**
   * Calculate daily storage fee for a ship
   */
  private calculateStorageFee(ship: Ship): number {
    const baseFee = 50; // Base daily fee
    const cargoFactor = ship.cargo.capacity / 100; // Higher cargo = higher fee
    const conditionFactor = 2 - ship.condition.hull; // Lower condition = higher fee (maintenance)
    
    return Math.round(baseFee * cargoFactor * conditionFactor);
  }

  /**
   * Get available ships for purchase at a station
   */
  getShipYardOffers(stationId: string): ShipYardOffer[] {
    return this.shipYards.get(stationId) || [];
  }

  /**
   * Purchase a ship from a shipyard
   */
  purchaseShip(
    stationId: string, 
    shipClassId: string, 
    playerCredits: number,
    playerId: string
  ): { success: boolean; ship?: Ship; cost?: number; error?: string } {
    const offers = this.getShipYardOffers(stationId);
    const offer = offers.find(o => o.shipClassId === shipClassId);
    
    if (!offer) {
      return { success: false, error: 'Ship not available at this station' };
    }

    if (offer.availableCount <= 0) {
      return { success: false, error: 'Ship out of stock' };
    }

    const totalCost = Math.round(offer.basePrice * (1 - offer.discount));

    if (playerCredits < totalCost) {
      return { success: false, error: `Insufficient credits. Need ${totalCost}, have ${playerCredits}` };
    }

    // Create new ship
    const ship = this.createNewShip(offer.shipClass, stationId, playerId, offer.condition);
    
    // Reduce availability
    offer.availableCount -= 1;

    return { success: true, ship, cost: totalCost };
  }

  /**
   * Create a new ship instance
   */
  private createNewShip(shipClass: ShipClass, stationId: string, playerId: string, condition: number = 1.0): Ship {
    const shipId = `ship-${playerId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    return {
      id: shipId,
      name: `${shipClass.name} ${Math.floor(Math.random() * 1000)}`, // Default name with number
      class: { ...shipClass }, // Clone the ship class
      cargo: {
        capacity: shipClass.baseCargoCapacity,
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
        hull: condition,
        engines: condition,
        cargo: condition,
        shields: condition,
        lastMaintenance: Date.now()
      },
      location: {
        systemId: 'sol', // Default system - would be determined by station
        stationId,
        isInTransit: false
      }
    };
  }

  /**
   * Initialize shipyard inventories
   */
  private initializeShipYards(): void {
    // Earth Station - Full selection
    this.shipYards.set('earth-station', [
      {
        shipClassId: 'light-freighter',
        shipClass: SHIP_CLASSES['light-freighter'],
        basePrice: 25000,
        discount: 0,
        condition: 1.0,
        availableCount: 3
      },
      {
        shipClassId: 'heavy-freighter',
        shipClass: SHIP_CLASSES['heavy-freighter'],
        basePrice: 75000,
        discount: 0,
        condition: 1.0,
        availableCount: 2
      },
      {
        shipClassId: 'courier-ship',
        shipClass: SHIP_CLASSES['courier-ship'],
        basePrice: 35000,
        discount: 0.1, // 10% discount
        condition: 1.0,
        availableCount: 2
      }
    ]);

    // Mars Station - Limited selection
    this.shipYards.set('mars-station', [
      {
        shipClassId: 'light-freighter',
        shipClass: SHIP_CLASSES['light-freighter'],
        basePrice: 25000,
        discount: 0.05, // 5% discount
        condition: 0.85, // Used ships
        availableCount: 2
      },
      {
        shipClassId: 'courier-ship',
        shipClass: SHIP_CLASSES['courier-ship'],
        basePrice: 35000,
        discount: 0,
        condition: 1.0,
        availableCount: 1
      }
    ]);

    // Alpha Station - Specialty ships
    this.shipYards.set('alpha-station', [
      {
        shipClassId: 'heavy-freighter',
        shipClass: SHIP_CLASSES['heavy-freighter'],
        basePrice: 75000,
        discount: 0.15, // 15% discount for bulk freight
        condition: 0.9,
        availableCount: 3
      }
    ]);
  }

  /**
   * Update shipyard inventories (call periodically)
   */
  updateShipYards(): void {
    this.shipYards.forEach((offers) => {
      offers.forEach(offer => {
        // Small chance to restock
        if (Math.random() < 0.1 && offer.availableCount < 3) {
          offer.availableCount += 1;
        }
        
        // Price fluctuation
        const priceChange = 0.95 + Math.random() * 0.1; // 95% to 105%
        offer.basePrice = Math.round(offer.basePrice * priceChange);
        
        // Discount changes
        if (Math.random() < 0.05) { // 5% chance
          offer.discount = Math.random() * 0.2; // Up to 20% discount
        }
      });
    });
  }

  /**
   * Calculate and collect storage fees (should be called daily)
   */
  collectStorageFees(): { totalFees: number; shipsAffected: number } {
    const currentTime = Date.now();
    if (currentTime - this.lastStorageFeesCollected < this.storageFeesInterval) {
      return { totalFees: 0, shipsAffected: 0 };
    }

    let totalFees = 0;
    let shipsAffected = 0;

    this.storedShips.forEach((slot) => {
      // Calculate daily fees - not currently using daysStored for anything specific
      totalFees += slot.storageFee;
      shipsAffected += 1;
      
      // Update stored timestamp for next calculation
      slot.storedAt = currentTime;
    });

    this.lastStorageFeesCollected = currentTime;
    return { totalFees, shipsAffected };
  }

  /**
   * Serialize storage data for save/load
   */
  serialize(): any {
    return {
      storedShips: Array.from(this.storedShips.entries()),
      shipYards: Array.from(this.shipYards.entries()),
      lastStorageFeesCollected: this.lastStorageFeesCollected
    };
  }

  /**
   * Deserialize storage data from save
   */
  deserialize(data: any): void {
    if (data.storedShips) {
      this.storedShips = new Map(data.storedShips);
    }
    if (data.shipYards) {
      this.shipYards = new Map(data.shipYards);
    }
    if (data.lastStorageFeesCollected) {
      this.lastStorageFeesCollected = data.lastStorageFeesCollected;
    }
  }
}