import { Ship, ShipClass, EquipmentItem } from '../types/player';
import { SHIP_CLASSES, EquipmentTemplate, getEquipmentTemplate, createEquipmentItem, getAvailableEquipment } from '../data/equipment';

export interface ShipConstructionConfig {
  shipClassId: string;
  shipName: string;
  selectedEquipment: {
    engines: string[];
    cargo: string[];
    shields: string[];
    weapons: string[];
    utility: string[];
  };
}

export interface ConstructionCost {
  totalCredits: number;
  baseShipCost: number;
  equipmentCost: number;
  constructionFee: number;
  materials: {
    [materialId: string]: number;
  };
}

export interface ConstructionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ShipPerformanceStats {
  cargoCapacity: number;
  speed: number;
  shields: number;
  fuelEfficiency: number;
  weaponDamage: number;
  scannerRange: number;
}

export class ShipConstructionSystem {
  
  /**
   * @deprecated This method is deprecated. Use HubShipConstructionSystem for block-based ship construction.
   * Get all available ship classes for construction
   */
  getAvailableShipClasses(stationType: string = 'trade', _techLevel: number = 1): ShipClass[] {
    console.warn('ShipConstructionSystem.getAvailableShipClasses is deprecated. Use HubShipConstructionSystem instead.');
    return Object.values(SHIP_CLASSES).filter(shipClass => {
      // Filter by tech level and station type
      switch (stationType) {
        case 'industrial':
          return shipClass.category === 'transport' || shipClass.category === 'heavy-freight';
        case 'military':
          return true; // Military stations can build all ship types
        case 'trade':
        default:
          return shipClass.category !== 'combat'; // Trade stations can't build combat ships
      }
    });
  }

  /**
   * Get compatible equipment for a ship class and equipment slot
   */
  getCompatibleEquipment(
    shipClassId: string, 
    slotType: keyof ShipClass['equipmentSlots'],
    stationType: string = 'trade',
    techLevel: number = 1
  ): EquipmentTemplate[] {
    const shipClass = SHIP_CLASSES[shipClassId];
    if (!shipClass) return [];

    // Get all equipment of the required category
    const availableEquipment = getAvailableEquipment(stationType, techLevel);
    
    return availableEquipment.filter(equipment => equipment.category === slotType);
  }

  /**
   * Calculate construction cost for a ship configuration
   */
  calculateConstructionCost(config: ShipConstructionConfig): ConstructionCost {
    const shipClass = SHIP_CLASSES[config.shipClassId];
    if (!shipClass) {
      throw new Error(`Unknown ship class: ${config.shipClassId}`);
    }

    const baseShipCost = this.getBaseShipCost(shipClass);
    let equipmentCost = 0;

    // Calculate equipment costs
    Object.entries(config.selectedEquipment).forEach(([_slotType, equipmentIds]) => {
      equipmentIds.forEach(equipmentId => {
        const template = getEquipmentTemplate(equipmentId);
        if (template) {
          equipmentCost += template.basePrice;
        }
      });
    });

    const constructionFee = Math.round((baseShipCost + equipmentCost) * 0.1); // 10% construction fee
    const totalCredits = baseShipCost + equipmentCost + constructionFee;

    return {
      totalCredits,
      baseShipCost,
      equipmentCost,
      constructionFee,
      materials: this.calculateMaterialCosts(shipClass)
    };
  }

  /**
   * Validate ship construction configuration
   */
  validateConfiguration(config: ShipConstructionConfig): ConstructionValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    const shipClass = SHIP_CLASSES[config.shipClassId];
    if (!shipClass) {
      errors.push(`Invalid ship class: ${config.shipClassId}`);
      return { isValid: false, errors, warnings };
    }

    // Validate ship name
    if (!config.shipName || config.shipName.trim().length === 0) {
      errors.push('Ship name is required');
    } else if (config.shipName.trim().length > 50) {
      errors.push('Ship name must be 50 characters or less');
    }

    // Validate equipment slot limits
    Object.entries(config.selectedEquipment).forEach(([slotType, equipmentIds]) => {
      const maxSlots = shipClass.equipmentSlots[slotType as keyof typeof shipClass.equipmentSlots];
      if (equipmentIds.length > maxSlots) {
        errors.push(`Too many ${slotType} modules selected (max: ${maxSlots})`);
      }
    });

    // Validate equipment compatibility
    Object.entries(config.selectedEquipment).forEach(([slotType, equipmentIds]) => {
      equipmentIds.forEach(equipmentId => {
        const template = getEquipmentTemplate(equipmentId);
        if (!template) {
          errors.push(`Unknown equipment: ${equipmentId}`);
        } else if (template.category !== slotType) {
          errors.push(`Equipment ${template.name} cannot be installed in ${slotType} slot`);
        }
      });
    });

    // Performance warnings
    const stats = this.calculatePerformanceStats(config);
    if (stats.cargoCapacity < shipClass.baseCargoCapacity * 0.5) {
      warnings.push('Low cargo capacity may limit trading opportunities');
    }
    if (stats.speed < shipClass.baseSpeed * 0.8) {
      warnings.push('Reduced speed will increase travel times');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate ship performance stats based on configuration
   */
  calculatePerformanceStats(config: ShipConstructionConfig): ShipPerformanceStats {
    const shipClass = SHIP_CLASSES[config.shipClassId];
    if (!shipClass) {
      throw new Error(`Unknown ship class: ${config.shipClassId}`);
    }

    const stats: ShipPerformanceStats = {
      cargoCapacity: shipClass.baseCargoCapacity,
      speed: shipClass.baseSpeed,
      shields: shipClass.baseShields,
      fuelEfficiency: 1.0,
      weaponDamage: 0,
      scannerRange: 100 // Base scanner range
    };

    // Apply equipment effects
    Object.values(config.selectedEquipment).flat().forEach(equipmentId => {
      const template = getEquipmentTemplate(equipmentId);
      if (template && template.effects) {
        if (template.effects.cargoCapacity) {
          stats.cargoCapacity += template.effects.cargoCapacity;
        }
        if (template.effects.speed) {
          stats.speed += template.effects.speed;
        }
        if (template.effects.shieldStrength) {
          stats.shields += template.effects.shieldStrength;
        }
        if (template.effects.fuelEfficiency) {
          stats.fuelEfficiency += template.effects.fuelEfficiency;
        }
        if (template.effects.weaponDamage) {
          stats.weaponDamage += template.effects.weaponDamage;
        }
        if (template.effects.scannerRange) {
          stats.scannerRange += template.effects.scannerRange;
        }
      }
    });

    return stats;
  }

  /**
   * Construct a ship based on configuration
   */
  constructShip(config: ShipConstructionConfig, stationId: string): Ship {
    const validation = this.validateConfiguration(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    const shipClass = SHIP_CLASSES[config.shipClassId];
    const equipment = this.createEquipmentFromConfig(config);
    
    const ship: Ship = {
      id: `ship-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: config.shipName.trim(),
      class: shipClass,
      cargo: {
        capacity: shipClass.baseCargoCapacity,
        used: 0,
        items: new Map()
      },
      equipment,
      condition: {
        hull: 1.0,
        engines: 1.0,
        cargo: 1.0,
        shields: 1.0,
        lastMaintenance: Date.now()
      },
      location: {
        systemId: 'system-001', // Would be determined by station location
        stationId: stationId,
        isInTransit: false
      }
    };

    // Update cargo capacity based on equipment
    const stats = this.calculatePerformanceStats(config);
    ship.cargo.capacity = stats.cargoCapacity;

    return ship;
  }

  /**
   * Get base cost for a ship class
   */
  private getBaseShipCost(shipClass: ShipClass): number {
    const baseCosts: Record<string, number> = {
      'courier': 50000,
      'transport': 120000,
      'heavy-freight': 250000,
      'explorer': 180000,
      'combat': 400000
    };

    return baseCosts[shipClass.category] || 100000;
  }

  /**
   * Calculate material costs for construction
   */
  private calculateMaterialCosts(shipClass: ShipClass): Record<string, number> {
    const baseMaterials: Record<string, number> = {
      'steel': Math.round(shipClass.baseCargoCapacity * 2),
      'electronics': Math.round(shipClass.baseCargoCapacity * 0.5),
      'composites': Math.round(shipClass.baseCargoCapacity * 1)
    };

    return baseMaterials;
  }

  /**
   * Create equipment items from configuration
   */
  private createEquipmentFromConfig(config: ShipConstructionConfig): Ship['equipment'] {
    const equipment: Ship['equipment'] = {
      engines: [],
      cargo: [],
      shields: [],
      weapons: [],
      utility: []
    };

    Object.entries(config.selectedEquipment).forEach(([slotType, equipmentIds]) => {
      const slot = slotType as keyof Ship['equipment'];
      equipment[slot] = equipmentIds
        .map(id => createEquipmentItem(id, 1.0))
        .filter((item): item is EquipmentItem => item !== null);
    });

    return equipment;
  }
}