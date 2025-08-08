export interface ShipHubTemplate {
  id: string;
  name: string;
  category: HubCategory;
  description: string;
  
  // Physical properties
  size: {
    width: number;  // X dimension
    height: number; // Y dimension  
    depth: number;  // Z dimension
  };
  mass: number; // Mass units
  
  // Power and systems
  powerGeneration: number; // Positive for generators, 0 for consumers
  powerConsumption: number; // Power required to operate
  
  // Capabilities and constraints
  capabilities: HubCapabilities;
  requirements?: HubRequirements;
  
  // Economic properties
  basePrice: number;
  materials: { [materialId: string]: number };
  
  // Construction properties
  constructionTime: number; // Hours to build
  techLevel: number; // Required technology level
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export type HubCategory = 
  | 'command'     // Control and navigation
  | 'power'       // Energy generation and storage
  | 'propulsion'  // Movement and maneuvering
  | 'cargo'       // Storage and transport
  | 'defense'     // Protection and armor
  | 'utility'     // Life support, sensors, communication
  | 'structural'; // Framework and connectors

export interface HubCapabilities {
  // Command capabilities
  commandRating?: number;        // Bridge/navigation capability
  crewCapacity?: number;         // Number of crew supported
  
  // Power capabilities  
  powerStorage?: number;         // Battery capacity
  powerEfficiency?: number;      // Power conversion efficiency (0-1)
  
  // Propulsion capabilities
  thrust?: number;               // Forward thrust
  maneuverability?: number;      // Turning/rotation capability
  fuelEfficiency?: number;       // Fuel consumption modifier
  
  // Cargo capabilities
  cargoCapacity?: number;        // Cargo units
  cargoType?: string[];          // Supported cargo types
  loadingSpeed?: number;         // Loading/unloading rate
  
  // Defense capabilities
  armorValue?: number;           // Damage reduction
  shieldStrength?: number;       // Shield points
  shieldRechargeRate?: number;   // Shield regeneration per second
  pointDefense?: number;         // Anti-missile capability
  
  // Utility capabilities
  lifeSupport?: number;          // Crew life support capacity
  sensorRange?: number;          // Detection range
  communicationRange?: number;   // Communication range
  processingPower?: number;      // Computer/AI capability
}

export interface HubRequirements {
  // Structural requirements
  supportPoints?: number;        // Structural support needed
  surfaceMount?: boolean;        // Must be on ship exterior
  
  // Power requirements
  minimumPower?: number;         // Minimum power to function
  
  // System requirements
  requiredHubs?: string[];       // Other hubs that must be present
  incompatibleHubs?: string[];   // Hubs that cannot coexist
  
  // Ship requirements
  minimumShipSize?: { width: number; height: number; depth: number };
  maximumShipSize?: { width: number; height: number; depth: number };
}

export interface HubPlacement {
  hubId: string;
  templateId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number; // 0, 90, 180, 270 degrees
    y: number;
    z: number;
  };
}

export interface ShipHubDesign {
  id: string;
  name: string;
  designerId?: string;
  
  // Design constraints
  maxSize: {
    width: number;
    height: number;
    depth: number;
  };
  
  // Hub placement
  hubs: HubPlacement[];
  
  // Validation results
  isValid: boolean;
  validation: {
    errors: string[];
    warnings: string[];
  };
  
  // Performance characteristics
  performance: {
    totalMass: number;
    powerBalance: number; // Generation - consumption
    cargoCapacity: number;
    thrust: number;
    maneuverability: number;
    defenseRating: number;
    crewCapacity: number;
    fuelEfficiency: number;
  };
  
  // Construction cost
  cost: {
    totalCredits: number;
    materials: { [materialId: string]: number };
    constructionTime: number;
  };
}

export interface HubConstructionConstraints {
  // Facility constraints
  maxShipSize: {
    width: number;
    height: number;
    depth: number;
  };
  availableTechLevel: number;
  availableMaterials: { [materialId: string]: number };
  
  // Construction rules
  requirePowerBalance: boolean;     // Power generation >= consumption
  requireBasicSystems: boolean;     // Command, power, propulsion required
  requireLifeSupport: boolean;      // Life support for crew
  maxMassStructural: number;        // Maximum mass without additional support
}

// Built-in ship designs
export interface BuiltInShipDesign {
  id: string;
  name: string;
  category: 'courier' | 'transport' | 'heavy-freight' | 'explorer' | 'combat';
  description: string;
  hubDesign: ShipHubDesign;
  unlockRequirements?: {
    techLevel?: number;
    completedMissions?: string[];
    reputation?: { faction: string; minimumStanding: number }[];
  };
}