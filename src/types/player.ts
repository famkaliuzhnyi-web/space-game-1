export interface Player {
  id: string;
  name: string;
  credits: number;
  currentStationId: string;
  currentShipId: string; // ID of the currently active ship
  ownedShips: Map<string, Ship>; // shipId -> ship data
  reputation: Map<string, FactionReputation>; // faction -> reputation
  contracts: string[]; // Active contract IDs
  achievements: string[]; // Achievement IDs
  statistics: PlayerStatistics;
  characterId?: string; // Optional character ID - if present, character system is active
}

// Backward compatibility - accessing current ship
export interface PlayerWithCurrentShip extends Player {
  ship: Ship; // Computed property for backward compatibility
}

export interface Ship {
  id: string;
  name: string;
  class: ShipClass;
  cargo: CargoHold;
  equipment: ShipEquipment;
  condition: ShipCondition;
  location: ShipLocation;
}

export interface CargoHold {
  capacity: number; // Total cargo capacity in units
  used: number; // Currently used capacity
  items: Map<string, CargoItem>; // commodity ID -> cargo item
}

export interface CargoItem {
  commodityId: string;
  quantity: number;
  averagePurchasePrice: number; // For profit calculations
  acquiredAt: number; // Timestamp when acquired
  expirationTime?: number; // For perishable goods
}

export interface ShipClass {
  id: string;
  name: string;
  category: 'courier' | 'transport' | 'heavy-freight' | 'explorer' | 'combat';
  baseCargoCapacity: number;
  baseFuelCapacity: number;
  baseSpeed: number;
  baseShields: number;
  equipmentSlots: {
    engines: number;
    cargo: number;
    shields: number;
    weapons: number;
    utility: number;
  };
}

export interface ShipEquipment {
  engines: EquipmentItem[];
  cargo: EquipmentItem[];
  shields: EquipmentItem[];
  weapons: EquipmentItem[];
  utility: EquipmentItem[];
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  effects: {
    cargoCapacity?: number;
    speed?: number;
    fuelEfficiency?: number;
    shieldStrength?: number;
    scannerRange?: number;
    weaponDamage?: number;
    accuracy?: number;
  };
  condition: number; // 0-1, affects performance
}

export interface ShipCondition {
  hull: number; // 0-1
  engines: number; // 0-1
  cargo: number; // 0-1
  shields: number; // 0-1
  lastMaintenance: number; // Timestamp
}

export interface ShipLocation {
  systemId: string;
  stationId?: string; // If docked
  coordinates?: { x: number; y: number }; // If in space
  isInTransit: boolean;
  destination?: string; // Station ID if traveling
  arrivalTime?: number; // Timestamp when travel completes
}

export interface FactionReputation {
  faction: string;
  standing: number; // -100 to 100
  rank: string;
  missions: number; // Completed missions for this faction
}

export interface PlayerStatistics {
  totalTradeValue: number;
  missionsCompleted: number;
  distanceTraveled: number;
  timeInGame: number; // Minutes
  profitEarned: number;
  lossesIncurred: number;
  stationsVisited: Set<string>;
  commoditiesTraded: Set<string>;
  contractsCompleted: number;
  contractsFailed: number;
}

// Trading and Transaction types
export interface TradeTransaction {
  id: string;
  playerId: string;
  stationId: string;
  commodityId: string;
  quantity: number;
  pricePerUnit: number;
  totalValue: number;
  type: 'buy' | 'sell';
  timestamp: number;
  marketConditions: {
    supply: number;
    demand: number;
    priceHistory: number[];
  };
}

export interface InventoryManager {
  addCommodity(commodityId: string, quantity: number, purchasePrice: number): { success: boolean; error?: string };
  removeCommodity(commodityId: string, quantity: number): { success: boolean; error?: string };
  getAvailableSpace(): number;
  getCargoValue(): number;
  getCommodityQuantity(commodityId: string): number;
  canFitCommodity(commodityId: string, quantity: number): boolean;
  getCargoManifest(): CargoItem[];
  clear(): void;
}