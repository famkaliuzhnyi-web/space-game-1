import { EquipmentItem, Ship } from '../types/player';
import { 
  EquipmentTemplate, 
  getEquipmentTemplate, 
  createEquipmentItem, 
  getEffectiveStats,
  getAvailableEquipment,
  canInstallEquipment,
  getTemplateIdFromEquipmentId
} from '../data/equipment';

export interface EquipmentMarket {
  stationId: string;
  availableEquipment: EquipmentMarketItem[];
  lastUpdated: number;
}

export interface EquipmentMarketItem {
  template: EquipmentTemplate;
  price: number;
  quantity: number;
  condition: number;
}

export class EquipmentManager {
  private markets: Map<string, EquipmentMarket> = new Map();
  private lastMarketUpdate: number = 0;
  private updateInterval: number = 1800000; // Update every 30 minutes

  constructor() {
    this.lastMarketUpdate = Date.now();
  }

  /**
   * Initialize equipment market for a station
   */
  initializeStationMarket(stationId: string, stationType: string, techLevel: number = 1): EquipmentMarket {
    const availableTemplates = getAvailableEquipment(stationType, techLevel);
    const marketItems: EquipmentMarketItem[] = [];

    availableTemplates.forEach(template => {
      // Determine availability based on rarity
      const baseChance = this.getRarityChance(template.rarity);
      if (Math.random() < baseChance) {
        const priceVariation = 0.8 + Math.random() * 0.4; // 80% to 120% of base price
        const conditionVariation = 0.7 + Math.random() * 0.3; // 70% to 100% condition
        
        marketItems.push({
          template,
          price: Math.round(template.basePrice * priceVariation),
          quantity: this.generateQuantity(template.rarity),
          condition: Math.min(1.0, conditionVariation)
        });
      }
    });

    const market: EquipmentMarket = {
      stationId,
      availableEquipment: marketItems,
      lastUpdated: Date.now()
    };

    this.markets.set(stationId, market);
    return market;
  }

  /**
   * Get equipment market for a station
   */
  getStationMarket(stationId: string): EquipmentMarket | null {
    return this.markets.get(stationId) || null;
  }

  /**
   * Install equipment on a ship
   */
  installEquipment(ship: Ship, equipmentItem: EquipmentItem, slotCategory: keyof Ship['equipment']): { success: boolean; error?: string } {
    // Check if ship has available slots
    const currentCount = ship.equipment[slotCategory].length;
    const maxSlots = ship.class.equipmentSlots[slotCategory];
    
    if (currentCount >= maxSlots) {
      return { success: false, error: `No available ${slotCategory} slots` };
    }

    // Check compatibility with ship class
    const templateId = getTemplateIdFromEquipmentId(equipmentItem.id);
    if (!templateId || !canInstallEquipment(templateId, ship.class.id)) {
      return { 
        success: false, 
        error: `Equipment '${equipmentItem.name}' is not compatible with ship class '${ship.class.name}'` 
      };
    }

    // Install the equipment
    ship.equipment[slotCategory].push(equipmentItem);
    
    return { success: true };
  }

  /**
   * Remove equipment from a ship
   */
  removeEquipment(ship: Ship, slotCategory: keyof Ship['equipment'], equipmentIndex: number): EquipmentItem | null {
    const equipment = ship.equipment[slotCategory];
    if (equipmentIndex < 0 || equipmentIndex >= equipment.length) {
      return null;
    }

    return equipment.splice(equipmentIndex, 1)[0];
  }

  /**
   * Calculate total ship performance with installed equipment
   */
  calculateShipPerformance(ship: Ship): {
    cargoCapacity: number;
    speed: number;
    fuelEfficiency: number;
    shieldStrength: number;
    scannerRange: number;
    weaponDamage: number;
  } {
    const base = {
      cargoCapacity: ship.class.baseCargoCapacity,
      speed: ship.class.baseSpeed,
      fuelEfficiency: 1.0,
      shieldStrength: ship.class.baseShields,
      scannerRange: 100, // Base scanner range
      weaponDamage: 0
    };

    // Apply equipment effects
    Object.values(ship.equipment).flat().forEach(equipment => {
      const effectiveStats = getEffectiveStats(equipment);
      
      if (effectiveStats.cargoCapacity) {
        base.cargoCapacity += effectiveStats.cargoCapacity;
      }
      if (effectiveStats.speed) {
        base.speed += effectiveStats.speed;
      }
      if (effectiveStats.fuelEfficiency) {
        base.fuelEfficiency += effectiveStats.fuelEfficiency;
      }
      if (effectiveStats.shieldStrength) {
        base.shieldStrength += effectiveStats.shieldStrength;
      }
      if (effectiveStats.scannerRange) {
        base.scannerRange += effectiveStats.scannerRange;
      }
      // Check if weaponDamage exists in the effective stats
      if ('weaponDamage' in effectiveStats && effectiveStats.weaponDamage) {
        base.weaponDamage += effectiveStats.weaponDamage;
      }
    });

    return base;
  }

  /**
   * Purchase equipment from station market
   */
  purchaseEquipment(
    stationId: string, 
    equipmentTemplateId: string, 
    playerCredits: number
  ): { success: boolean; equipment?: EquipmentItem; cost?: number; error?: string } {
    const market = this.getStationMarket(stationId);
    if (!market) {
      return { success: false, error: 'Station market not available' };
    }

    const marketItem = market.availableEquipment.find(item => item.template.id === equipmentTemplateId);
    if (!marketItem) {
      return { success: false, error: 'Equipment not available at this station' };
    }

    if (marketItem.quantity <= 0) {
      return { success: false, error: 'Equipment out of stock' };
    }

    if (playerCredits < marketItem.price) {
      return { success: false, error: 'Insufficient credits' };
    }

    // Create equipment item from template
    const equipment = createEquipmentItem(equipmentTemplateId, marketItem.condition);
    if (!equipment) {
      return { success: false, error: 'Failed to create equipment' };
    }

    // Reduce quantity in market
    marketItem.quantity -= 1;

    return { 
      success: true, 
      equipment, 
      cost: marketItem.price 
    };
  }

  /**
   * Sell equipment to station market
   */
  sellEquipment(
    equipment: EquipmentItem
  ): { success: boolean; value?: number; error?: string } {
    // Extract template ID from equipment ID
    // Format: templateId-timestamp-randomString
    const parts = equipment.id.split('-');
    const templateId = parts.slice(0, -2).join('-'); // Remove last 2 parts (timestamp and random)
    const template = getEquipmentTemplate(templateId);
    
    if (!template) {
      return { success: false, error: 'Unknown equipment type' };
    }

    // Calculate sell value based on condition and base price
    const conditionMultiplier = Math.max(0.1, equipment.condition);
    const sellValue = Math.round(template.basePrice * 0.6 * conditionMultiplier); // 60% of base price at full condition

    return { 
      success: true, 
      value: sellValue 
    };
  }

  /**
   * Update all station markets
   */
  updateMarkets(): void {
    const currentTime = Date.now();
    if (currentTime - this.lastMarketUpdate < this.updateInterval) {
      return;
    }

    // Refresh market inventories
    this.markets.forEach((market) => {
      // Add some randomization to existing items
      market.availableEquipment.forEach(item => {
        // Small chance to restock
        if (Math.random() < 0.1 && item.quantity === 0) {
          item.quantity = this.generateQuantity(item.template.rarity);
        }
        
        // Price fluctuation
        const priceChange = 0.95 + Math.random() * 0.1; // 95% to 105%
        item.price = Math.round(item.price * priceChange);
      });

      market.lastUpdated = currentTime;
    });

    this.lastMarketUpdate = currentTime;
  }

  /**
   * Get equipment installation preview
   */
  getInstallationPreview(ship: Ship, equipment: EquipmentItem, slotCategory: keyof Ship['equipment']): {
    canInstall: boolean;
    performanceBefore: ReturnType<EquipmentManager['calculateShipPerformance']>;
    performanceAfter: ReturnType<EquipmentManager['calculateShipPerformance']>;
    error?: string;
  } {
    const performanceBefore = this.calculateShipPerformance(ship);
    
    // Check if installation is possible
    const currentCount = ship.equipment[slotCategory].length;
    const maxSlots = ship.class.equipmentSlots[slotCategory];
    
    if (currentCount >= maxSlots) {
      return {
        canInstall: false,
        performanceBefore,
        performanceAfter: performanceBefore,
        error: `No available ${slotCategory} slots`
      };
    }

    // Calculate performance after installation
    const tempShip = JSON.parse(JSON.stringify(ship)); // Deep copy
    tempShip.equipment[slotCategory].push(equipment);
    const performanceAfter = this.calculateShipPerformance(tempShip);

    return {
      canInstall: true,
      performanceBefore,
      performanceAfter
    };
  }

  private getRarityChance(rarity: EquipmentTemplate['rarity']): number {
    switch (rarity) {
      case 'common': return 0.8;
      case 'uncommon': return 0.4;
      case 'rare': return 0.15;
      case 'legendary': return 0.05;
      default: return 0.5;
    }
  }

  private generateQuantity(rarity: EquipmentTemplate['rarity']): number {
    switch (rarity) {
      case 'common': return 3 + Math.floor(Math.random() * 5); // 3-7
      case 'uncommon': return 1 + Math.floor(Math.random() * 3); // 1-3
      case 'rare': return Math.floor(Math.random() * 2) + 1; // 1-2
      case 'legendary': return 1; // Always 1
      default: return 1;
    }
  }
}