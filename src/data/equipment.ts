import { EquipmentItem } from '../types/player';

export interface EquipmentTemplate {
  id: string;
  name: string;
  type: string;
  category: 'engines' | 'cargo' | 'shields' | 'weapons' | 'utility';
  description: string;
  basePrice: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  effects: {
    cargoCapacity?: number;
    speed?: number;
    fuelEfficiency?: number;
    shieldStrength?: number;
    scannerRange?: number;
    weaponDamage?: number;
    accuracy?: number;
  };
  requirements?: {
    minShipClass?: string[];
    techLevel?: number;
  };
}

export const EQUIPMENT_TEMPLATES: Record<string, EquipmentTemplate> = {
  // ENGINE EQUIPMENT
  'basic-ion-drive': {
    id: 'basic-ion-drive',
    name: 'Basic Ion Drive',
    type: 'Ion Propulsion',
    category: 'engines',
    description: 'Standard ion propulsion system providing reliable acceleration',
    basePrice: 2500,
    rarity: 'common',
    effects: {
      speed: 10,
      fuelEfficiency: 0.1
    }
  },

  'advanced-fusion-drive': {
    id: 'advanced-fusion-drive',
    name: 'Advanced Fusion Drive',
    type: 'Fusion Propulsion',
    category: 'engines',
    description: 'High-performance fusion drive with superior speed and efficiency',
    basePrice: 8500,
    rarity: 'uncommon',
    effects: {
      speed: 25,
      fuelEfficiency: 0.2
    }
  },

  'quantum-thrust-engine': {
    id: 'quantum-thrust-engine',
    name: 'Quantum Thrust Engine',
    type: 'Quantum Propulsion',
    category: 'engines',
    description: 'Cutting-edge quantum propulsion technology for maximum performance',
    basePrice: 25000,
    rarity: 'rare',
    effects: {
      speed: 50,
      fuelEfficiency: 0.35
    },
    requirements: {
      techLevel: 3
    }
  },

  // CARGO EQUIPMENT
  'cargo-expansion-mk1': {
    id: 'cargo-expansion-mk1',
    name: 'Cargo Expansion Mk I',
    type: 'Storage Module',
    category: 'cargo',
    description: 'Basic cargo hold expansion providing additional storage space',
    basePrice: 1200,
    rarity: 'common',
    effects: {
      cargoCapacity: 25
    }
  },

  'cargo-expansion-mk2': {
    id: 'cargo-expansion-mk2',
    name: 'Cargo Expansion Mk II',
    type: 'Advanced Storage',
    category: 'cargo',
    description: 'Enhanced cargo system with improved space utilization',
    basePrice: 3500,
    rarity: 'uncommon',
    effects: {
      cargoCapacity: 50
    }
  },

  'specialized-cargo-bay': {
    id: 'specialized-cargo-bay',
    name: 'Specialized Cargo Bay',
    type: 'Specialty Storage',
    category: 'cargo',
    description: 'High-capacity storage system with environmental controls',
    basePrice: 8000,
    rarity: 'rare',
    effects: {
      cargoCapacity: 80
    }
  },

  // SHIELD EQUIPMENT
  'basic-deflector': {
    id: 'basic-deflector',
    name: 'Basic Deflector',
    type: 'Magnetic Shield',
    category: 'shields',
    description: 'Standard magnetic deflector shield for basic protection',
    basePrice: 1800,
    rarity: 'common',
    effects: {
      shieldStrength: 15
    }
  },

  'reinforced-shielding': {
    id: 'reinforced-shielding',
    name: 'Reinforced Shielding',
    type: 'Enhanced Magnetic Shield',
    category: 'shields',
    description: 'Upgraded deflector system with improved energy absorption',
    basePrice: 4500,
    rarity: 'uncommon',
    effects: {
      shieldStrength: 35
    }
  },

  'adaptive-shield-matrix': {
    id: 'adaptive-shield-matrix',
    name: 'Adaptive Shield Matrix',
    type: 'Adaptive Defense',
    category: 'shields',
    description: 'Advanced shield system that adapts to incoming threats',
    basePrice: 12000,
    rarity: 'rare',
    effects: {
      shieldStrength: 60
    },
    requirements: {
      techLevel: 2
    }
  },

  // WEAPON EQUIPMENT
  'pulse-laser': {
    id: 'pulse-laser',
    name: 'Pulse Laser',
    type: 'Energy Weapon',
    category: 'weapons',
    description: 'Basic energy weapon for ship defense',
    basePrice: 3200,
    rarity: 'common',
    effects: {
      weaponDamage: 20,
      accuracy: 0.8
    }
  },

  'plasma-cannon': {
    id: 'plasma-cannon',
    name: 'Plasma Cannon',
    type: 'Plasma Weapon',
    category: 'weapons',
    description: 'High-energy plasma weapon with devastating firepower',
    basePrice: 8500,
    rarity: 'uncommon',
    effects: {
      weaponDamage: 45,
      accuracy: 0.7
    }
  },

  'antimatter-torpedo': {
    id: 'antimatter-torpedo',
    name: 'Antimatter Torpedo Launcher',
    type: 'Missile System',
    category: 'weapons',
    description: 'Devastating antimatter weapon system for capital ship combat',
    basePrice: 25000,
    rarity: 'legendary',
    effects: {
      weaponDamage: 100,
      accuracy: 0.9
    },
    requirements: {
      minShipClass: ['heavy-freight', 'combat'],
      techLevel: 4
    }
  },

  // UTILITY EQUIPMENT
  'basic-scanner': {
    id: 'basic-scanner',
    name: 'Basic Scanner Array',
    type: 'Sensor System',
    category: 'utility',
    description: 'Standard sensor package for navigation and detection',
    basePrice: 1500,
    rarity: 'common',
    effects: {
      scannerRange: 50
    }
  },

  'advanced-sensors': {
    id: 'advanced-sensors',
    name: 'Advanced Sensor Suite',
    type: 'Enhanced Sensors',
    category: 'utility',
    description: 'High-resolution sensor array with extended range',
    basePrice: 4200,
    rarity: 'uncommon',
    effects: {
      scannerRange: 120
    }
  },

  'quantum-scanner': {
    id: 'quantum-scanner',
    name: 'Quantum Scanner Array',
    type: 'Quantum Sensors',
    category: 'utility',
    description: 'Cutting-edge quantum sensor technology for maximum detection range',
    basePrice: 15000,
    rarity: 'rare',
    effects: {
      scannerRange: 250
    },
    requirements: {
      techLevel: 3
    }
  }
};

export const SHIP_CLASSES: Record<string, any> = {
  'light-freighter': {
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
  },
  'heavy-freighter': {
    id: 'heavy-freighter',
    name: 'Heavy Freighter',
    category: 'heavy-freight',
    baseCargoCapacity: 250,
    baseFuelCapacity: 80,
    baseSpeed: 80,
    baseShields: 40,
    equipmentSlots: {
      engines: 2,
      cargo: 4,
      shields: 2,
      weapons: 2,
      utility: 2
    }
  },
  'courier-ship': {
    id: 'courier-ship',
    name: 'Courier Ship',
    category: 'courier',
    baseCargoCapacity: 50,
    baseFuelCapacity: 40,
    baseSpeed: 200,
    baseShields: 15,
    equipmentSlots: {
      engines: 2,
      cargo: 1,
      shields: 1,
      weapons: 1,
      utility: 2
    }
  }
};

/**
 * Get equipment template by ID
 */
export function getEquipmentTemplate(equipmentId: string): EquipmentTemplate | undefined {
  return EQUIPMENT_TEMPLATES[equipmentId];
}

/**
 * Get all equipment templates for a specific category
 */
export function getEquipmentByCategory(category: EquipmentTemplate['category']): EquipmentTemplate[] {
  return Object.values(EQUIPMENT_TEMPLATES).filter(eq => eq.category === category);
}

/**
 * Create an equipment item from a template
 */
export function createEquipmentItem(templateId: string, condition: number = 1.0): EquipmentItem | null {
  const template = getEquipmentTemplate(templateId);
  if (!template) return null;

  return {
    id: `${templateId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    type: template.type,
    effects: { ...template.effects },
    condition: Math.max(0, Math.min(1, condition))
  };
}

/**
 * Calculate effective equipment stats based on condition
 */
export function getEffectiveStats(equipment: EquipmentItem): EquipmentItem['effects'] {
  const conditionMultiplier = Math.max(0.1, equipment.condition); // Minimum 10% effectiveness
  const effectiveStats: EquipmentItem['effects'] = {};

  Object.entries(equipment.effects).forEach(([key, value]) => {
    if (typeof value === 'number') {
      effectiveStats[key as keyof EquipmentItem['effects']] = value * conditionMultiplier;
    }
  });

  return effectiveStats;
}

/**
 * Check if equipment can be installed on a ship class
 */
export function canInstallEquipment(templateId: string, shipClassId: string): boolean {
  const template = getEquipmentTemplate(templateId);
  if (!template) return false;

  // Check ship class requirements
  if (template.requirements?.minShipClass) {
    const shipClass = SHIP_CLASSES[shipClassId];
    if (!shipClass || !template.requirements.minShipClass.includes(shipClass.category)) {
      return false;
    }
  }

  return true;
}

/**
 * Get equipment market availability based on station type and tech level
 */
export function getAvailableEquipment(stationType: string, techLevel: number = 1): EquipmentTemplate[] {
  return Object.values(EQUIPMENT_TEMPLATES).filter(template => {
    // Basic availability based on tech level
    const reqTechLevel = template.requirements?.techLevel || 1;
    if (reqTechLevel > techLevel) return false;

    // Station type affects rarity availability
    switch (stationType) {
      case 'trade':
        return template.rarity !== 'legendary';
      case 'industrial':
        return template.rarity === 'common' || template.rarity === 'uncommon';
      case 'military':
        return true; // Military stations have all equipment
      default:
        return template.rarity === 'common';
    }
  });
}