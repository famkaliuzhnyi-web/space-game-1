import { 
  ShipHubDesign, 
  HubPlacement, 
  HubConstructionConstraints,
  ShipHubTemplate 
} from '../types/shipHubs';
import { Ship } from '../types/player';
import { getHubTemplate, getAvailableHubs } from '../data/shipHubs';

export interface HubValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

export interface HubGridCell {
  occupied: boolean;
  hubId?: string;
  partOfHub?: string; // For multi-cell hubs
}

export class HubShipConstructionSystem {
  
  /**
   * Create a new empty ship design
   */
  createNewDesign(
    name: string, 
    maxSize: { width: number; height: number; depth: number }
  ): ShipHubDesign {
    return {
      id: `hub-design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      maxSize,
      hubs: [],
      isValid: false,
      validation: { errors: [], warnings: [] },
      performance: {
        totalMass: 0,
        powerBalance: 0,
        cargoCapacity: 0,
        thrust: 0,
        maneuverability: 0,
        defenseRating: 0,
        crewCapacity: 0,
        fuelEfficiency: 1.0
      },
      cost: {
        totalCredits: 0,
        materials: {},
        constructionTime: 0
      }
    };
  }

  /**
   * Get available hub templates based on constraints
   */
  getAvailableHubTemplates(
    constraints: HubConstructionConstraints
  ): ShipHubTemplate[] {
    return getAvailableHubs(constraints.availableTechLevel, 'trade')
      .filter(hub => {
        // Check material availability
        const hasRequiredMaterials = Object.entries(hub.materials).every(
          ([materialId, required]) => {
            const available = constraints.availableMaterials[materialId] || 0;
            return available >= required;
          }
        );
        
        return hasRequiredMaterials;
      });
  }

  /**
   * Check if a hub can be placed at a specific position
   */
  canPlaceHub(
    design: ShipHubDesign,
    templateId: string,
    position: GridPosition
  ): { canPlace: boolean; reason?: string } {
    const template = getHubTemplate(templateId);
    if (!template) {
      return { canPlace: false, reason: 'Invalid hub template' };
    }

    // Check bounds
    if (position.x < 0 || position.y < 0 || position.z < 0) {
      return { canPlace: false, reason: 'Position out of bounds' };
    }

    if (position.x + template.size.width > design.maxSize.width ||
        position.y + template.size.height > design.maxSize.height ||
        position.z + template.size.depth > design.maxSize.depth) {
      return { canPlace: false, reason: 'Hub exceeds ship size limits' };
    }

    // Check for overlaps
    const grid = this.createOccupancyGrid(design);
    for (let x = position.x; x < position.x + template.size.width; x++) {
      for (let y = position.y; y < position.y + template.size.height; y++) {
        for (let z = position.z; z < position.z + template.size.depth; z++) {
          if (grid[x]?.[y]?.[z]?.occupied) {
            return { canPlace: false, reason: 'Position already occupied' };
          }
        }
      }
    }

    return { canPlace: true };
  }

  /**
   * Add a hub to the ship design
   */
  addHub(
    design: ShipHubDesign,
    templateId: string,
    position: GridPosition
  ): { success: boolean; error?: string } {
    const placementCheck = this.canPlaceHub(design, templateId, position);
    if (!placementCheck.canPlace) {
      return { success: false, error: placementCheck.reason };
    }

    const hubPlacement: HubPlacement = {
      hubId: `hub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      position,
      rotation: { x: 0, y: 0, z: 0 }
    };

    design.hubs.push(hubPlacement);
    this.updateDesignMetrics(design);
    
    return { success: true };
  }

  /**
   * Remove a hub from the ship design
   */
  removeHub(design: ShipHubDesign, hubId: string): boolean {
    const initialLength = design.hubs.length;
    design.hubs = design.hubs.filter(hub => hub.hubId !== hubId);
    
    if (design.hubs.length < initialLength) {
      this.updateDesignMetrics(design);
      return true;
    }
    
    return false;
  }

  /**
   * Move a hub to a new position
   */
  moveHub(
    design: ShipHubDesign,
    hubId: string,
    newPosition: GridPosition
  ): { success: boolean; error?: string } {
    const hubIndex = design.hubs.findIndex(h => h.hubId === hubId);
    if (hubIndex === -1) {
      return { success: false, error: 'Hub not found' };
    }

    const hub = design.hubs[hubIndex];
    const templateId = hub.templateId;

    // Temporarily remove the hub to check placement
    const tempHubs = design.hubs.filter(h => h.hubId !== hubId);
    const tempDesign = { ...design, hubs: tempHubs };

    const placementCheck = this.canPlaceHub(tempDesign, templateId, newPosition);
    if (!placementCheck.canPlace) {
      return { success: false, error: placementCheck.reason };
    }

    // Update position
    design.hubs[hubIndex].position = newPosition;
    this.updateDesignMetrics(design);
    
    return { success: true };
  }

  /**
   * Validate the complete ship design
   */
  validateDesign(
    design: ShipHubDesign,
    constraints: HubConstructionConstraints
  ): HubValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required systems
    if (constraints.requireBasicSystems) {
      const hasCommand = design.hubs.some(hub => {
        const template = getHubTemplate(hub.templateId);
        return template?.category === 'command';
      });
      
      const hasPower = design.hubs.some(hub => {
        const template = getHubTemplate(hub.templateId);
        return template?.category === 'power' && (template.powerGeneration > 0);
      });
      
      const hasPropulsion = design.hubs.some(hub => {
        const template = getHubTemplate(hub.templateId);
        return template?.category === 'propulsion' && (template.capabilities?.thrust || 0) > 0;
      });

      if (!hasCommand) errors.push('Ship requires a command hub');
      if (!hasPower) errors.push('Ship requires a power generation hub');
      if (!hasPropulsion) errors.push('Ship requires a propulsion hub');
    }

    // Check power balance
    if (constraints.requirePowerBalance && design.performance.powerBalance < 0) {
      errors.push('Power consumption exceeds generation');
    }

    // Check life support requirements
    if (constraints.requireLifeSupport && design.performance.crewCapacity > 0) {
      const totalLifeSupport = design.hubs
        .map(hub => getHubTemplate(hub.templateId)?.capabilities?.lifeSupport || 0)
        .reduce((sum, ls) => sum + ls, 0);
      
      if (totalLifeSupport < design.performance.crewCapacity) {
        errors.push('Insufficient life support for crew capacity');
      }
    }

    // Check structural mass limits
    if (design.performance.totalMass > constraints.maxMassStructural) {
      errors.push(`Ship mass (${design.performance.totalMass}) exceeds structural limit (${constraints.maxMassStructural})`);
    }

    // Performance warnings
    if (design.performance.thrust < design.performance.totalMass * 0.1) {
      warnings.push('Low thrust-to-mass ratio will result in poor acceleration');
    }

    if (design.performance.maneuverability < design.performance.totalMass * 0.05) {
      warnings.push('Poor maneuverability due to insufficient RCS systems');
    }

    if (design.performance.cargoCapacity === 0) {
      warnings.push('No cargo capacity - ship cannot carry goods');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate construction cost for a ship design
   */
  calculateConstructionCost(design: ShipHubDesign): {
    totalCredits: number;
    materials: { [materialId: string]: number };
    constructionTime: number;
  } {
    let totalCredits = 0;
    let constructionTime = 0;
    const materials: { [materialId: string]: number } = {};

    design.hubs.forEach(hub => {
      const template = getHubTemplate(hub.templateId);
      if (template) {
        totalCredits += template.basePrice;
        constructionTime = Math.max(constructionTime, template.constructionTime);

        Object.entries(template.materials).forEach(([materialId, amount]) => {
          materials[materialId] = (materials[materialId] || 0) + amount;
        });
      }
    });

    // Add construction fees and complexity multipliers
    const complexityMultiplier = 1 + (design.hubs.length * 0.05); // 5% per hub
    totalCredits *= complexityMultiplier;
    
    const constructionFee = totalCredits * 0.15; // 15% construction fee
    totalCredits += constructionFee;

    return {
      totalCredits: Math.round(totalCredits),
      materials,
      constructionTime
    };
  }

  /**
   * Construct a ship from a hub design
   */
  constructShipFromHubDesign(
    design: ShipHubDesign,
    shipName: string,
    stationId: string,
    constraints: HubConstructionConstraints
  ): Ship {
    const validation = this.validateDesign(design, constraints);
    if (!validation.isValid) {
      throw new Error(`Invalid design: ${validation.errors.join(', ')}`);
    }

    // Create equivalent ship class based on hub design
    const shipClass = {
      id: `hub-ship-${design.id}`,
      name: shipName,
      category: this.determineShipCategory(design),
      baseCargoCapacity: design.performance.cargoCapacity,
      baseFuelCapacity: Math.max(100, design.performance.totalMass * 2),
      baseSpeed: Math.max(50, design.performance.thrust * 2),
      baseShields: design.performance.defenseRating,
      equipmentSlots: {
        engines: 0,
        cargo: 0,
        shields: 0,
        weapons: 0,
        utility: 0
      }
    };

    const ship: Ship = {
      id: `ship-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: shipName,
      class: shipClass,
      cargo: {
        capacity: design.performance.cargoCapacity,
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
        systemId: 'system-001',
        stationId: stationId,
        isInTransit: false
      }
    };

    return ship;
  }

  /**
   * Create an occupancy grid for the ship design
   */
  private createOccupancyGrid(design: ShipHubDesign): HubGridCell[][][] {
    const grid: HubGridCell[][][] = [];

    // Initialize empty grid
    for (let x = 0; x < design.maxSize.width; x++) {
      grid[x] = [];
      for (let y = 0; y < design.maxSize.height; y++) {
        grid[x][y] = [];
        for (let z = 0; z < design.maxSize.depth; z++) {
          grid[x][y][z] = { occupied: false };
        }
      }
    }

    // Mark occupied cells
    design.hubs.forEach(hub => {
      const template = getHubTemplate(hub.templateId);
      if (template) {
        for (let x = hub.position.x; x < hub.position.x + template.size.width; x++) {
          for (let y = hub.position.y; y < hub.position.y + template.size.height; y++) {
            for (let z = hub.position.z; z < hub.position.z + template.size.depth; z++) {
              if (grid[x] && grid[x][y] && grid[x][y][z]) {
                grid[x][y][z] = {
                  occupied: true,
                  hubId: hub.hubId,
                  partOfHub: hub.templateId
                };
              }
            }
          }
        }
      }
    });

    return grid;
  }

  /**
   * Update design metrics based on current hubs
   */
  private updateDesignMetrics(design: ShipHubDesign): void {
    let totalMass = 0;
    let powerGeneration = 0;
    let powerConsumption = 0;
    let cargoCapacity = 0;
    let thrust = 0;
    let maneuverability = 0;
    let shieldStrength = 0;
    let armorValue = 0;
    let crewCapacity = 0;
    let fuelEfficiencyFactors: number[] = [];

    design.hubs.forEach(hub => {
      const template = getHubTemplate(hub.templateId);
      if (template) {
        totalMass += template.mass;
        powerGeneration += template.powerGeneration;
        powerConsumption += template.powerConsumption;
        
        const caps = template.capabilities;
        if (caps) {
          cargoCapacity += caps.cargoCapacity || 0;
          thrust += caps.thrust || 0;
          maneuverability += caps.maneuverability || 0;
          shieldStrength += caps.shieldStrength || 0;
          armorValue += caps.armorValue || 0;
          crewCapacity += caps.crewCapacity || 0;
          
          if (caps.fuelEfficiency) {
            fuelEfficiencyFactors.push(caps.fuelEfficiency);
          }
        }
      }
    });

    // Calculate derived metrics
    const powerBalance = powerGeneration - powerConsumption;
    const defenseRating = shieldStrength + (armorValue * 0.5);
    const avgFuelEfficiency = fuelEfficiencyFactors.length > 0 
      ? fuelEfficiencyFactors.reduce((sum, eff) => sum + eff, 0) / fuelEfficiencyFactors.length
      : 1.0;

    design.performance = {
      totalMass,
      powerBalance,
      cargoCapacity,
      thrust,
      maneuverability,
      defenseRating,
      crewCapacity,
      fuelEfficiency: avgFuelEfficiency
    };

    // Update cost
    design.cost = this.calculateConstructionCost(design);

    // Update validation
    const constraints: HubConstructionConstraints = {
      maxShipSize: design.maxSize,
      availableTechLevel: 10,
      availableMaterials: {},
      requirePowerBalance: true,
      requireBasicSystems: true,
      requireLifeSupport: true,
      maxMassStructural: 1000
    };
    
    const validation = this.validateDesign(design, constraints);
    design.isValid = validation.isValid;
    design.validation = validation;
  }

  /**
   * Determine ship category based on hub configuration
   */
  private determineShipCategory(design: ShipHubDesign): 'courier' | 'transport' | 'heavy-freight' | 'explorer' | 'combat' {
    const { cargoCapacity, thrust, totalMass, defenseRating } = design.performance;
    
    // Simple heuristics based on ship characteristics
    if (defenseRating > 200) return 'combat';
    if (cargoCapacity > 100) return 'heavy-freight';
    if (cargoCapacity >= 20) return 'transport'; // Changed from > 50 to >= 20
    if (thrust > totalMass * 0.8) return 'courier';
    
    return 'explorer';
  }
}