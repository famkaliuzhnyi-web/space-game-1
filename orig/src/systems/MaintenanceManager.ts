import { Ship, EquipmentItem, ShipCondition } from '../types/player';
import { Character } from '../types/character';
import { TimeManager } from './TimeManager';

// Forward declaration to avoid circular dependency
interface ICharacterProgressionSystem {
  awardTechnicalExperience(activity: string, data: {value?: number; complexity?: number}): boolean;
}

export interface MaintenanceRecord {
  type: 'equipment' | 'hull' | 'engines' | 'cargo' | 'shields';
  equipmentId?: string; // For equipment maintenance
  performedAt: number;
  cost: number;
  stationId: string;
  description: string;
}

export interface MaintenanceScheduleItem {
  type: 'equipment' | 'hull' | 'engines' | 'cargo' | 'shields';
  equipmentId?: string;
  condition: number;
  degradationRate: number; // Per hour
  nextMaintenanceRecommended: number; // Timestamp
  maintenanceCost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceQuote {
  items: MaintenanceQuoteItem[];
  totalCost: number;
  estimatedTime: number; // Hours
}

export interface MaintenanceQuoteItem {
  type: 'equipment' | 'hull' | 'engines' | 'cargo' | 'shields';
  equipmentId?: string;
  description: string;
  currentCondition: number;
  targetCondition: number;
  cost: number;
  timeRequired: number; // Hours
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class MaintenanceManager {
  private maintenanceHistory: Map<string, MaintenanceRecord[]> = new Map(); // shipId -> records
  private timeManager: TimeManager;
  private progressionSystem: ICharacterProgressionSystem | null = null;

  // Degradation rates per hour for different components
  private static readonly DEGRADATION_RATES = {
    hull: 0.001, // 0.1% per hour
    engines: 0.002, // 0.2% per hour
    cargo: 0.0005, // 0.05% per hour
    shields: 0.0015, // 0.15% per hour
    equipment: 0.001 // 0.1% per hour (base rate, varies by type)
  };

  // Cost multipliers for different maintenance types
  private static readonly MAINTENANCE_COSTS = {
    hull: 1000, // Base cost for full hull repair
    engines: 1500, // Base cost for full engine repair
    cargo: 500, // Base cost for full cargo bay repair
    shields: 800, // Base cost for full shield repair
    equipment: 300 // Base cost for equipment repair (varies by type)
  };

  constructor(timeManager: TimeManager) {
    this.timeManager = timeManager;
  }

  /**
   * Set the progression system for experience awards (dependency injection)
   */
  setProgressionSystem(progressionSystem: ICharacterProgressionSystem): void {
    this.progressionSystem = progressionSystem;
  }

  /**
   * Update ship and equipment condition based on time passage
   */
  updateConditions(ship: Ship): void {
    const currentTime = this.timeManager.getCurrentDate().getTime();
    const timeSinceLastMaintenance = currentTime - ship.condition.lastMaintenance;
    const hoursElapsed = timeSinceLastMaintenance / (1000 * 60 * 60);

    // Update ship condition components
    this.degradeShipCondition(ship.condition, hoursElapsed);

    // Update equipment conditions for all equipment types
    const allEquipment = [
      ...ship.equipment.engines,
      ...ship.equipment.cargo,
      ...ship.equipment.shields,
      ...ship.equipment.weapons,
      ...ship.equipment.utility
    ];
    
    allEquipment.forEach((equipment) => {
      this.degradeEquipmentCondition(equipment, hoursElapsed);
    });
  }

  /**
   * Degrade ship condition components over time
   */
  private degradeShipCondition(condition: ShipCondition, hoursElapsed: number): void {
    condition.hull = Math.max(0, condition.hull - (MaintenanceManager.DEGRADATION_RATES.hull * hoursElapsed));
    condition.engines = Math.max(0, condition.engines - (MaintenanceManager.DEGRADATION_RATES.engines * hoursElapsed));
    condition.cargo = Math.max(0, condition.cargo - (MaintenanceManager.DEGRADATION_RATES.cargo * hoursElapsed));
    condition.shields = Math.max(0, condition.shields - (MaintenanceManager.DEGRADATION_RATES.shields * hoursElapsed));
  }

  /**
   * Degrade equipment condition over time
   */
  private degradeEquipmentCondition(equipment: EquipmentItem, hoursElapsed: number): void {
    // Different equipment types degrade at different rates
    const typeMultiplier = this.getEquipmentDegradationMultiplier(equipment.type);
    const degradationRate = MaintenanceManager.DEGRADATION_RATES.equipment * typeMultiplier;
    
    equipment.condition = Math.max(0, equipment.condition - (degradationRate * hoursElapsed));
  }

  /**
   * Get degradation rate multiplier based on equipment type
   */
  private getEquipmentDegradationMultiplier(equipmentType: string): number {
    switch (equipmentType) {
      case 'engine': return 2.0; // Engines degrade faster
      case 'shield': return 1.5; // Shields degrade moderately
      case 'weapon': return 1.8; // Weapons degrade from use
      case 'scanner': return 0.8; // Scanners degrade slowly
      case 'cargo': return 0.6; // Cargo modules are sturdy
      default: return 1.0; // Default rate
    }
  }

  /**
   * Generate maintenance schedule for a ship
   */
  generateMaintenanceSchedule(ship: Ship): MaintenanceScheduleItem[] {
    const schedule: MaintenanceScheduleItem[] = [];
    const currentTime = this.timeManager.getCurrentDate().getTime();

    // Add ship condition items
    this.addShipConditionToSchedule(ship.condition, currentTime, schedule);

    // Add equipment items
    const allEquipment = [
      ...ship.equipment.engines,
      ...ship.equipment.cargo,
      ...ship.equipment.shields,
      ...ship.equipment.weapons,
      ...ship.equipment.utility
    ];
    
    allEquipment.forEach(equipment => {
      this.addEquipmentToSchedule(equipment, currentTime, schedule);
    });

    // Sort by priority and condition
    return schedule.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.condition - b.condition; // Lower condition first
    });
  }

  /**
   * Add ship condition items to maintenance schedule
   */
  private addShipConditionToSchedule(
    condition: ShipCondition, 
    currentTime: number, 
    schedule: MaintenanceScheduleItem[]
  ): void {
    const components = [
      { type: 'hull' as const, condition: condition.hull },
      { type: 'engines' as const, condition: condition.engines },
      { type: 'cargo' as const, condition: condition.cargo },
      { type: 'shields' as const, condition: condition.shields }
    ];

    components.forEach(component => {
      if (component.condition < 1.0) {
        const degradationRate = MaintenanceManager.DEGRADATION_RATES[component.type];
        const priority = this.getMaintenancePriority(component.condition);
        const maintenanceCost = this.calculateMaintenanceCost(component.type, component.condition);
        
        schedule.push({
          type: component.type,
          condition: component.condition,
          degradationRate,
          nextMaintenanceRecommended: currentTime + this.getRecommendedMaintenanceInterval(component.condition),
          maintenanceCost,
          priority
        });
      }
    });
  }

  /**
   * Add equipment to maintenance schedule
   */
  private addEquipmentToSchedule(
    equipment: EquipmentItem, 
    currentTime: number, 
    schedule: MaintenanceScheduleItem[]
  ): void {
    if (equipment.condition < 1.0) {
      const typeMultiplier = this.getEquipmentDegradationMultiplier(equipment.type);
      const degradationRate = MaintenanceManager.DEGRADATION_RATES.equipment * typeMultiplier;
      const priority = this.getMaintenancePriority(equipment.condition);
      const maintenanceCost = this.calculateEquipmentMaintenanceCost(equipment);

      schedule.push({
        type: 'equipment',
        equipmentId: equipment.id,
        condition: equipment.condition,
        degradationRate,
        nextMaintenanceRecommended: currentTime + this.getRecommendedMaintenanceInterval(equipment.condition),
        maintenanceCost,
        priority
      });
    }
  }

  /**
   * Get maintenance priority based on condition
   */
  private getMaintenancePriority(condition: number): 'low' | 'medium' | 'high' | 'critical' {
    if (condition <= 0.2) return 'critical';
    if (condition <= 0.4) return 'high';
    if (condition <= 0.7) return 'medium';
    return 'low';
  }

  /**
   * Calculate recommended maintenance interval based on condition
   */
  private getRecommendedMaintenanceInterval(condition: number): number {
    // Worse condition = sooner maintenance (in milliseconds)
    const baseInterval = 7 * 24 * 60 * 60 * 1000; // 1 week
    return baseInterval * Math.max(0.1, condition);
  }

  /**
   * Generate maintenance quote for selected items
   */
  generateMaintenanceQuote(ship: Ship, selectedItems: MaintenanceScheduleItem[]): MaintenanceQuote {
    const quoteItems: MaintenanceQuoteItem[] = [];
    let totalCost = 0;
    let totalTime = 0;

    selectedItems.forEach(item => {
      const targetCondition = 1.0; // Repair to full condition
      const cost = item.maintenanceCost * (targetCondition - item.condition);
      const timeRequired = this.calculateMaintenanceTime(item.type, item.condition, targetCondition);

      const description = this.getMaintenanceDescription(item, ship);

      quoteItems.push({
        type: item.type,
        equipmentId: item.equipmentId,
        description,
        currentCondition: item.condition,
        targetCondition,
        cost,
        timeRequired,
        priority: item.priority
      });

      totalCost += cost;
      totalTime += timeRequired;
    });

    return {
      items: quoteItems,
      totalCost: Math.round(totalCost),
      estimatedTime: Math.round(totalTime * 10) / 10 // Round to 1 decimal
    };
  }

  /**
   * Calculate maintenance cost for ship components
   */
  private calculateMaintenanceCost(type: 'hull' | 'engines' | 'cargo' | 'shields', condition: number): number {
    return this.calculateMaintenanceCostWithCharacter(type, condition, null);
  }

  /**
   * Calculate maintenance cost for ship components with character bonuses
   */
  calculateMaintenanceCostWithCharacter(type: 'hull' | 'engines' | 'cargo' | 'shields', condition: number, character: Character | null): number {
    const baseCost = MaintenanceManager.MAINTENANCE_COSTS[type];
    const repairNeeded = 1.0 - condition;
    let cost = baseCost * repairNeeded;
    
    // Apply character engineering skill bonus
    if (character && character.skills && character.skills.engineering) {
      const engineeringBonus = this.calculateEngineeringBonus(character);
      cost *= engineeringBonus;
    }
    
    return cost;
  }

  /**
   * Calculate maintenance cost for equipment
   */
  private calculateEquipmentMaintenanceCost(equipment: EquipmentItem): number {
    return this.calculateEquipmentMaintenanceCostWithCharacter(equipment, null);
  }

  /**
   * Calculate maintenance cost for equipment with character bonuses
   */
  calculateEquipmentMaintenanceCostWithCharacter(equipment: EquipmentItem, character: Character | null): number {
    const baseCost = MaintenanceManager.MAINTENANCE_COSTS.equipment;
    const typeMultiplier = this.getEquipmentMaintenanceCostMultiplier(equipment.type);
    const repairNeeded = 1.0 - equipment.condition;
    let cost = baseCost * typeMultiplier * repairNeeded;
    
    // Apply character engineering skill bonus
    if (character && character.skills && character.skills.engineering) {
      const engineeringBonus = this.calculateEngineeringBonus(character);
      cost *= engineeringBonus;
    }
    
    return cost;
  }

  /**
   * Calculate engineering bonus for maintenance costs
   */
  private calculateEngineeringBonus(character: Character): number {
    // Engineering skill reduces maintenance costs (1% per skill point)
    const engineeringBonus = 1.0 - (character.skills.engineering * 0.01);
    
    // Intelligence also helps with maintenance efficiency (0.5% per point above 10)
    const intelligenceBonus = 1.0 - Math.max(0, character.attributes.intelligence - 10) * 0.005;
    
    // Combine bonuses, ensure minimum cost is 50% of normal
    const finalBonus = Math.max(0.5, engineeringBonus * intelligenceBonus);
    
    return finalBonus;
  }

  /**
   * Get cost multiplier for equipment maintenance
   */
  private getEquipmentMaintenanceCostMultiplier(equipmentType: string): number {
    switch (equipmentType) {
      case 'engine': return 3.0; // Expensive to maintain
      case 'shield': return 2.5;
      case 'weapon': return 2.0;
      case 'scanner': return 1.5;
      case 'cargo': return 1.0; // Cheapest to maintain
      default: return 1.5;
    }
  }

  /**
   * Calculate time required for maintenance
   */
  private calculateMaintenanceTime(
    type: 'equipment' | 'hull' | 'engines' | 'cargo' | 'shields',
    currentCondition: number,
    targetCondition: number
  ): number {
    const repairAmount = targetCondition - currentCondition;
    const baseTimeHours = type === 'equipment' ? 2 : 4; // Base time in hours
    return baseTimeHours * repairAmount;
  }

  /**
   * Get human-readable maintenance description
   */
  private getMaintenanceDescription(item: MaintenanceScheduleItem, ship: Ship): string {
    if (item.type === 'equipment' && item.equipmentId) {
      // Find equipment in all equipment arrays
      const allEquipment = [
        ...ship.equipment.engines,
        ...ship.equipment.cargo,
        ...ship.equipment.shields,
        ...ship.equipment.weapons,
        ...ship.equipment.utility
      ];
      const equipment = allEquipment.find(e => e.id === item.equipmentId);
      const equipmentName = equipment?.name || 'Unknown Equipment';
      return `Repair ${equipmentName} (${Math.round(item.condition * 100)}% condition)`;
    } else {
      const componentName = item.type.charAt(0).toUpperCase() + item.type.slice(1);
      return `Repair ship ${componentName} (${Math.round(item.condition * 100)}% condition)`;
    }
  }

  /**
   * Perform maintenance on selected items
   */
  performMaintenance(
    ship: Ship, 
    quoteItems: MaintenanceQuoteItem[], 
    stationId: string
  ): MaintenanceRecord[] {
    const records: MaintenanceRecord[] = [];
    const currentTime = this.timeManager.getCurrentDate().getTime();

    quoteItems.forEach(item => {
      if (item.type === 'equipment' && item.equipmentId) {
        // Repair equipment - find in all equipment arrays
        const allEquipment = [
          ...ship.equipment.engines,
          ...ship.equipment.cargo,
          ...ship.equipment.shields,
          ...ship.equipment.weapons,
          ...ship.equipment.utility
        ];
        const equipment = allEquipment.find(e => e.id === item.equipmentId);
        if (equipment) {
          equipment.condition = item.targetCondition;
          
          records.push({
            type: 'equipment',
            equipmentId: item.equipmentId,
            performedAt: currentTime,
            cost: item.cost,
            stationId,
            description: item.description
          });
        }
      } else {
        // Repair ship component
        switch (item.type) {
          case 'hull':
            ship.condition.hull = item.targetCondition;
            break;
          case 'engines':
            ship.condition.engines = item.targetCondition;
            break;
          case 'cargo':
            ship.condition.cargo = item.targetCondition;
            break;
          case 'shields':
            ship.condition.shields = item.targetCondition;
            break;
        }

        records.push({
          type: item.type,
          performedAt: currentTime,
          cost: item.cost,
          stationId,
          description: item.description
        });
      }
    });

    // Update last maintenance time
    ship.condition.lastMaintenance = currentTime;

    // Store records in history
    const shipRecords = this.maintenanceHistory.get(ship.id) || [];
    shipRecords.push(...records);
    this.maintenanceHistory.set(ship.id, shipRecords);

    // Award technical experience for maintenance work
    if (this.progressionSystem && records.length > 0) {
      const totalCost = records.reduce((sum, record) => sum + record.cost, 0);
      const complexity = this.calculateMaintenanceComplexity(records);
      
      // Award base maintenance experience
      this.progressionSystem.awardTechnicalExperience('ship_maintenance', { 
        value: totalCost,
        complexity: complexity
      });
      
      // Award repair experience for significant repairs (over 50% condition restored)
      const hasSignificantRepairs = quoteItems.some(item => {
        const conditionRestored = item.targetCondition - item.currentCondition;
        return conditionRestored > 0.5;
      });
      
      if (hasSignificantRepairs) {
        this.progressionSystem.awardTechnicalExperience('ship_repair', { 
          value: totalCost,
          complexity: complexity
        });
      }
    }

    return records;
  }

  /**
   * Get maintenance history for a ship
   */
  getMaintenanceHistory(shipId: string, limit: number = 10): MaintenanceRecord[] {
    const records = this.maintenanceHistory.get(shipId) || [];
    return records
      .sort((a, b) => b.performedAt - a.performedAt)
      .slice(0, limit);
  }

  /**
   * Get condition effect on performance
   */
  getConditionEffects(ship: Ship): {
    cargoCapacityMultiplier: number;
    speedMultiplier: number;
    shieldMultiplier: number;
    fuelEfficiencyMultiplier: number;
  } {
    const avgCondition = (
      ship.condition.hull + 
      ship.condition.engines + 
      ship.condition.cargo + 
      ship.condition.shields
    ) / 4;

    // Poor condition reduces performance
    const conditionEffect = Math.max(0.3, avgCondition); // Minimum 30% performance

    return {
      cargoCapacityMultiplier: Math.max(0.5, ship.condition.cargo), // Cargo condition affects capacity
      speedMultiplier: Math.max(0.3, ship.condition.engines), // Engine condition affects speed
      shieldMultiplier: Math.max(0.2, ship.condition.shields), // Shield condition affects protection
      fuelEfficiencyMultiplier: Math.max(0.4, conditionEffect) // Overall condition affects fuel efficiency
    };
  }

  /**
   * Serialize maintenance data for saving
   */
  serialize(): { maintenanceHistory: Array<[string, MaintenanceRecord[]]> } {
    return {
      maintenanceHistory: Array.from(this.maintenanceHistory.entries())
    };
  }

  /**
   * Load maintenance data from save
   */
  deserialize(data: { maintenanceHistory: Array<[string, MaintenanceRecord[]]> }): void {
    if (data.maintenanceHistory) {
      this.maintenanceHistory = new Map(data.maintenanceHistory);
    }
  }

  /**
   * Calculate the complexity of maintenance work for experience calculation
   */
  private calculateMaintenanceComplexity(records: MaintenanceRecord[]): number {
    let complexity = 0;
    
    records.forEach(record => {
      switch (record.type) {
        case 'hull':
          complexity += 3; // Hull repair is complex
          break;
        case 'engines':
          complexity += 4; // Engine work is very complex
          break;
        case 'shields':
          complexity += 3; // Shield systems are complex
          break;
        case 'cargo':
          complexity += 2; // Cargo bay work is moderate
          break;
        case 'equipment':
          complexity += 2; // Equipment repair is moderate
          break;
      }
    });
    
    return complexity;
  }
}