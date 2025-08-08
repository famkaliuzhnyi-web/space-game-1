import { ShipHubTemplate } from '../types/shipHubs';

export const HUB_TEMPLATES: Record<string, ShipHubTemplate> = {
  // COMMAND HUBS
  'cockpit-hub': {
    id: 'cockpit-hub',
    name: 'Cockpit Hub',
    category: 'command',
    description: 'Basic navigation and control center for small ships',
    size: { width: 1, height: 1, depth: 1 },
    mass: 2,
    powerGeneration: 0,
    powerConsumption: 5,
    capabilities: {
      commandRating: 1,
      crewCapacity: 1
    },
    basePrice: 5000,
    materials: {
      'electronics': 5,
      'steel': 2,
      'composites': 1
    },
    constructionTime: 4,
    techLevel: 1,
    rarity: 'common'
  },

  'bridge-block': {
    id: 'bridge-block',
    name: 'Bridge Block',
    category: 'command',
    description: 'Advanced command center with tactical systems',
    size: { width: 2, height: 2, depth: 1 },
    mass: 6,
    powerGeneration: 0,
    powerConsumption: 10,
    capabilities: {
      commandRating: 2,
      crewCapacity: 3,
      processingPower: 10
    },
    basePrice: 15000,
    materials: {
      'electronics': 15,
      'steel': 8,
      'composites': 4
    },
    constructionTime: 12,
    techLevel: 2,
    rarity: 'uncommon'
  },

  'command-center': {
    id: 'command-center',
    name: 'Command Center',
    category: 'command',
    description: 'Capital ship command center with fleet coordination',
    size: { width: 3, height: 3, depth: 2 },
    mass: 15,
    powerGeneration: 0,
    powerConsumption: 25,
    capabilities: {
      commandRating: 5,
      crewCapacity: 10,
      processingPower: 50,
      communicationRange: 10000
    },
    basePrice: 50000,
    materials: {
      'electronics': 40,
      'steel': 20,
      'composites': 15
    },
    constructionTime: 48,
    techLevel: 3,
    rarity: 'rare'
  },

  // POWER BLOCKS
  'fusion-reactor-small': {
    id: 'fusion-reactor-small',
    name: 'Fusion Reactor (Small)',
    category: 'power',
    description: 'Compact fusion reactor for small to medium ships',
    size: { width: 2, height: 2, depth: 2 },
    mass: 10,
    powerGeneration: 50,
    powerConsumption: 0,
    capabilities: {
      powerEfficiency: 0.95
    },
    requirements: {
      supportPoints: 4
    },
    basePrice: 25000,
    materials: {
      'electronics': 20,
      'steel': 15,
      'fusion-cores': 2
    },
    constructionTime: 24,
    techLevel: 2,
    rarity: 'uncommon'
  },

  'fusion-reactor-large': {
    id: 'fusion-reactor-large',
    name: 'Fusion Reactor (Large)',
    category: 'power',
    description: 'High-output fusion reactor for capital ships',
    size: { width: 3, height: 3, depth: 3 },
    mass: 30,
    powerGeneration: 150,
    powerConsumption: 0,
    capabilities: {
      powerEfficiency: 0.98
    },
    requirements: {
      supportPoints: 12,
      minimumShipSize: { width: 5, height: 5, depth: 5 }
    },
    basePrice: 75000,
    materials: {
      'electronics': 60,
      'steel': 40,
      'fusion-cores': 6
    },
    constructionTime: 72,
    techLevel: 3,
    rarity: 'rare'
  },

  'solar-array': {
    id: 'solar-array',
    name: 'Solar Array',
    category: 'power',
    description: 'Solar power generation for efficient long-range operations',
    size: { width: 1, height: 3, depth: 1 },
    mass: 1,
    powerGeneration: 10,
    powerConsumption: 0,
    capabilities: {
      powerEfficiency: 0.8 // Variable by proximity to star
    },
    requirements: {
      surfaceMount: true
    },
    basePrice: 8000,
    materials: {
      'electronics': 8,
      'composites': 6
    },
    constructionTime: 6,
    techLevel: 1,
    rarity: 'common'
  },

  'battery-pack': {
    id: 'battery-pack',
    name: 'Battery Pack',
    category: 'power',
    description: 'Energy storage system for power management',
    size: { width: 1, height: 1, depth: 1 },
    mass: 3,
    powerGeneration: 0,
    powerConsumption: 0,
    capabilities: {
      powerStorage: 25,
      powerEfficiency: 0.95
    },
    basePrice: 3000,
    materials: {
      'electronics': 8,
      'composites': 2
    },
    constructionTime: 3,
    techLevel: 1,
    rarity: 'common'
  },

  // PROPULSION BLOCKS
  'ion-drive': {
    id: 'ion-drive',
    name: 'Ion Drive',
    category: 'propulsion',
    description: 'Efficient ion propulsion system',
    size: { width: 1, height: 1, depth: 2 },
    mass: 4,
    powerGeneration: 0,
    powerConsumption: 15,
    capabilities: {
      thrust: 20,
      fuelEfficiency: 0.9
    },
    basePrice: 12000,
    materials: {
      'electronics': 10,
      'steel': 6,
      'composites': 4
    },
    constructionTime: 8,
    techLevel: 2,
    rarity: 'common'
  },

  'chemical-thruster': {
    id: 'chemical-thruster',
    name: 'Chemical Thruster',
    category: 'propulsion',
    description: 'High-thrust chemical propulsion',
    size: { width: 1, height: 1, depth: 1 },
    mass: 2,
    powerGeneration: 0,
    powerConsumption: 5,
    capabilities: {
      thrust: 15,
      fuelEfficiency: 0.6
    },
    basePrice: 6000,
    materials: {
      'steel': 8,
      'composites': 3
    },
    constructionTime: 4,
    techLevel: 1,
    rarity: 'common'
  },

  'fusion-drive': {
    id: 'fusion-drive',
    name: 'Fusion Drive',
    category: 'propulsion',
    description: 'High-performance fusion propulsion system',
    size: { width: 2, height: 2, depth: 3 },
    mass: 20,
    powerGeneration: 0,
    powerConsumption: 40,
    capabilities: {
      thrust: 100,
      fuelEfficiency: 0.85
    },
    requirements: {
      supportPoints: 8
    },
    basePrice: 45000,
    materials: {
      'electronics': 25,
      'steel': 30,
      'fusion-cores': 1
    },
    constructionTime: 36,
    techLevel: 3,
    rarity: 'uncommon'
  },

  'rcs-thrusters': {
    id: 'rcs-thrusters',
    name: 'RCS Thrusters',
    category: 'propulsion',
    description: 'Reaction control system for maneuvering',
    size: { width: 1, height: 1, depth: 1 },
    mass: 1,
    powerGeneration: 0,
    powerConsumption: 2,
    capabilities: {
      maneuverability: 10
    },
    basePrice: 2000,
    materials: {
      'steel': 4,
      'composites': 2
    },
    constructionTime: 2,
    techLevel: 1,
    rarity: 'common'
  },

  'gyroscope': {
    id: 'gyroscope',
    name: 'Gyroscope',
    category: 'propulsion',
    description: 'Gyroscopic stabilization system',
    size: { width: 1, height: 1, depth: 1 },
    mass: 3,
    powerGeneration: 0,
    powerConsumption: 8,
    capabilities: {
      maneuverability: 15
    },
    basePrice: 5000,
    materials: {
      'electronics': 6,
      'steel': 8
    },
    constructionTime: 6,
    techLevel: 1,
    rarity: 'common'
  },

  // CARGO AND STORAGE BLOCKS
  'cargo-hold-standard': {
    id: 'cargo-hold-standard',
    name: 'Cargo Hold (Standard)',
    category: 'cargo',
    description: 'Basic cargo storage compartment',
    size: { width: 2, height: 2, depth: 2 },
    mass: 5,
    powerGeneration: 0,
    powerConsumption: 0,
    capabilities: {
      cargoCapacity: 10,
      cargoType: ['general'],
      loadingSpeed: 1
    },
    basePrice: 4000,
    materials: {
      'steel': 10,
      'composites': 2
    },
    constructionTime: 6,
    techLevel: 1,
    rarity: 'common'
  },

  'cargo-hold-automated': {
    id: 'cargo-hold-automated',
    name: 'Cargo Hold (Automated)',
    category: 'cargo',
    description: 'Automated cargo handling system',
    size: { width: 2, height: 2, depth: 2 },
    mass: 8,
    powerGeneration: 0,
    powerConsumption: 3,
    capabilities: {
      cargoCapacity: 10,
      cargoType: ['general'],
      loadingSpeed: 3
    },
    basePrice: 8000,
    materials: {
      'steel': 8,
      'electronics': 6,
      'composites': 4
    },
    constructionTime: 12,
    techLevel: 2,
    rarity: 'uncommon'
  },

  'specialized-container': {
    id: 'specialized-container',
    name: 'Specialized Container',
    category: 'cargo',
    description: 'Environmental controlled storage for sensitive cargo',
    size: { width: 2, height: 2, depth: 2 },
    mass: 6,
    powerGeneration: 0,
    powerConsumption: 5,
    capabilities: {
      cargoCapacity: 8,
      cargoType: ['hazardous', 'biological', 'precious'],
      loadingSpeed: 1
    },
    basePrice: 12000,
    materials: {
      'steel': 6,
      'electronics': 8,
      'composites': 6
    },
    constructionTime: 16,
    techLevel: 2,
    rarity: 'uncommon'
  },

  'bulk-storage': {
    id: 'bulk-storage',
    name: 'Bulk Storage',
    category: 'cargo',
    description: 'Large storage for bulk materials',
    size: { width: 3, height: 3, depth: 3 },
    mass: 15,
    powerGeneration: 0,
    powerConsumption: 0,
    capabilities: {
      cargoCapacity: 40,
      cargoType: ['liquids', 'granular'],
      loadingSpeed: 0.5
    },
    basePrice: 18000,
    materials: {
      'steel': 25,
      'composites': 5
    },
    constructionTime: 24,
    techLevel: 1,
    rarity: 'common'
  },

  // DEFENSE BLOCKS
  'shield-generator-light': {
    id: 'shield-generator-light',
    name: 'Shield Generator (Light)',
    category: 'defense',
    description: 'Basic defensive shield system',
    size: { width: 1, height: 1, depth: 1 },
    mass: 3,
    powerGeneration: 0,
    powerConsumption: 20,
    capabilities: {
      shieldStrength: 100,
      shieldRechargeRate: 5
    },
    basePrice: 18000,
    materials: {
      'electronics': 15,
      'steel': 4,
      'composites': 3
    },
    constructionTime: 12,
    techLevel: 2,
    rarity: 'uncommon'
  },

  'shield-generator-heavy': {
    id: 'shield-generator-heavy',
    name: 'Shield Generator (Heavy)',
    category: 'defense',
    description: 'High-capacity shield system',
    size: { width: 2, height: 2, depth: 2 },
    mass: 12,
    powerGeneration: 0,
    powerConsumption: 60,
    capabilities: {
      shieldStrength: 400,
      shieldRechargeRate: 15
    },
    requirements: {
      supportPoints: 6
    },
    basePrice: 65000,
    materials: {
      'electronics': 50,
      'steel': 15,
      'composites': 12
    },
    constructionTime: 48,
    techLevel: 3,
    rarity: 'rare'
  },

  'armor-plating-light': {
    id: 'armor-plating-light',
    name: 'Armor Plating (Light)',
    category: 'defense',
    description: 'Basic armor protection',
    size: { width: 1, height: 1, depth: 1 },
    mass: 4,
    powerGeneration: 0,
    powerConsumption: 0,
    capabilities: {
      armorValue: 50
    },
    basePrice: 3000,
    materials: {
      'steel': 12,
      'composites': 2
    },
    constructionTime: 4,
    techLevel: 1,
    rarity: 'common'
  },

  'armor-plating-heavy': {
    id: 'armor-plating-heavy',
    name: 'Armor Plating (Heavy)',
    category: 'defense',
    description: 'Heavy armor protection',
    size: { width: 1, height: 1, depth: 1 },
    mass: 8,
    powerGeneration: 0,
    powerConsumption: 0,
    capabilities: {
      armorValue: 120
    },
    basePrice: 8000,
    materials: {
      'steel': 20,
      'composites': 4
    },
    constructionTime: 8,
    techLevel: 2,
    rarity: 'uncommon'
  },

  // UTILITY BLOCKS
  'life-support-basic': {
    id: 'life-support-basic',
    name: 'Life Support (Basic)',
    category: 'utility',
    description: 'Basic air recycling and temperature control',
    size: { width: 1, height: 1, depth: 1 },
    mass: 2,
    powerGeneration: 0,
    powerConsumption: 8,
    capabilities: {
      lifeSupport: 5
    },
    basePrice: 6000,
    materials: {
      'electronics': 8,
      'steel': 3,
      'composites': 2
    },
    constructionTime: 6,
    techLevel: 1,
    rarity: 'common'
  },

  'life-support-advanced': {
    id: 'life-support-advanced',
    name: 'Life Support (Advanced)',
    category: 'utility',
    description: 'Full environmental control and waste recycling',
    size: { width: 2, height: 2, depth: 1 },
    mass: 6,
    powerGeneration: 0,
    powerConsumption: 15,
    capabilities: {
      lifeSupport: 15
    },
    basePrice: 18000,
    materials: {
      'electronics': 20,
      'steel': 8,
      'composites': 6
    },
    constructionTime: 18,
    techLevel: 2,
    rarity: 'uncommon'
  },

  'crew-quarters': {
    id: 'crew-quarters',
    name: 'Crew Quarters',
    category: 'utility',
    description: 'Living space for crew members',
    size: { width: 2, height: 2, depth: 1 },
    mass: 4,
    powerGeneration: 0,
    powerConsumption: 3,
    capabilities: {
      crewCapacity: 4
    },
    basePrice: 8000,
    materials: {
      'steel': 6,
      'composites': 8
    },
    constructionTime: 8,
    techLevel: 1,
    rarity: 'common'
  },

  'sensor-array-basic': {
    id: 'sensor-array-basic',
    name: 'Sensor Array (Basic)',
    category: 'utility',
    description: 'Basic detection and navigation sensors',
    size: { width: 1, height: 1, depth: 1 },
    mass: 1,
    powerGeneration: 0,
    powerConsumption: 5,
    capabilities: {
      sensorRange: 1000
    },
    basePrice: 4000,
    materials: {
      'electronics': 8,
      'composites': 2
    },
    constructionTime: 4,
    techLevel: 1,
    rarity: 'common'
  },

  'sensor-array-advanced': {
    id: 'sensor-array-advanced',
    name: 'Sensor Array (Advanced)',
    category: 'utility',
    description: 'High-resolution sensor system',
    size: { width: 1, height: 1, depth: 2 },
    mass: 3,
    powerGeneration: 0,
    powerConsumption: 12,
    capabilities: {
      sensorRange: 5000,
      processingPower: 5
    },
    basePrice: 15000,
    materials: {
      'electronics': 20,
      'composites': 6
    },
    constructionTime: 12,
    techLevel: 2,
    rarity: 'uncommon'
  },

  'communication-array': {
    id: 'communication-array',
    name: 'Communication Array',
    category: 'utility',
    description: 'System-wide communication system',
    size: { width: 1, height: 1, depth: 1 },
    mass: 1,
    powerGeneration: 0,
    powerConsumption: 3,
    capabilities: {
      communicationRange: 1000
    },
    basePrice: 3000,
    materials: {
      'electronics': 6,
      'composites': 1
    },
    constructionTime: 3,
    techLevel: 1,
    rarity: 'common'
  },

  'long-range-transmitter': {
    id: 'long-range-transmitter',
    name: 'Long-Range Transmitter',
    category: 'utility',
    description: 'Inter-system quantum communication',
    size: { width: 1, height: 1, depth: 3 },
    mass: 4,
    powerGeneration: 0,
    powerConsumption: 10,
    capabilities: {
      communicationRange: 50000
    },
    requirements: {
      surfaceMount: true
    },
    basePrice: 25000,
    materials: {
      'electronics': 30,
      'composites': 8
    },
    constructionTime: 24,
    techLevel: 3,
    rarity: 'rare'
  }
};

// Helper functions
export function getHubTemplate(hubId: string): ShipHubTemplate | undefined {
  return HUB_TEMPLATES[hubId];
}

export function getHubsByCategory(category: ShipHubTemplate['category']): ShipHubTemplate[] {
  return Object.values(HUB_TEMPLATES).filter(hub => hub.category === category);
}

export function getAvailableHubs(techLevel: number, stationType: string = 'trade'): ShipHubTemplate[] {
  return Object.values(HUB_TEMPLATES).filter(hub => {
    // Filter by tech level
    if (hub.techLevel > techLevel) return false;
    
    // Filter by station type and rarity
    switch (stationType) {
      case 'trade':
        return hub.rarity !== 'legendary';
      case 'industrial':
        return hub.rarity === 'common' || hub.rarity === 'uncommon';
      case 'military':
        return true; // Military stations have all hubs
      default:
        return hub.rarity === 'common';
    }
  });
}