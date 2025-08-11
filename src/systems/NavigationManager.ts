/**
 * NavigationManager - Handles ship traversal and time flow for movement
 * 
 * This system manages:
 * - Travel between stations and systems
 * - Realistic travel times based on ship capabilities  
 * - Time flow integration with TimeManager
 * - Travel state tracking and completion
 */

import { Ship, ShipLocation } from '../types/player';
import { Coordinates, NavigationTarget } from '../types/world';
import { TimeManager } from './TimeManager';

export interface TravelPlan {
  id: string;
  shipId: string;
  origin: NavigationTarget;
  destination: NavigationTarget;
  startTime: Date;
  estimatedArrivalTime: Date;
  actualTravelTime: number; // in milliseconds
  travelSpeed: number; // units per hour
  status: 'planning' | 'in-transit' | 'completed' | 'cancelled';
}

export interface TravelProgress {
  travelPlan: TravelPlan;
  currentProgress: number; // 0.0 to 1.0
  remainingTime: number; // in milliseconds
  currentPosition?: Coordinates;
}

export class NavigationManager {
  private timeManager: TimeManager;
  private activeTravels: Map<string, TravelPlan> = new Map();
  private travelHistory: TravelPlan[] = [];
  private defaultSpeed: number = 100; // units per hour

  constructor(timeManager: TimeManager) {
    this.timeManager = timeManager;
  }

  /**
   * Start travel between two locations
   */
  startTravel(
    ship: Ship,
    destination: NavigationTarget,
    origin?: NavigationTarget
  ): { success: boolean; travelPlan?: TravelPlan; error?: string } {
    // Validate ship can travel (not already in transit)
    if (ship.location.isInTransit) {
      return { 
        success: false, 
        error: 'Ship is already in transit' 
      };
    }

    // Determine origin if not provided
    const actualOrigin = origin || this.getCurrentLocationAsTarget(ship.location);
    if (!actualOrigin) {
      return { 
        success: false, 
        error: 'Unable to determine current location' 
      };
    }

    // Calculate travel distance and time
    const distance = this.calculateDistance(actualOrigin.position, destination.position);
    const travelSpeed = this.calculateShipSpeed(ship);
    const travelTimeHours = Math.max(0.01, distance / travelSpeed); // Minimum 0.01 hours (36 seconds) for any travel
    const travelTimeMs = travelTimeHours * 60 * 60 * 1000; // Convert to milliseconds

    // Create travel plan
    const currentTime = this.timeManager.getCurrentDate();
    const travelPlan: TravelPlan = {
      id: `travel_${ship.id}_${Date.now()}`,
      shipId: ship.id,
      origin: actualOrigin,
      destination,
      startTime: currentTime,
      estimatedArrivalTime: new Date(currentTime.getTime() + travelTimeMs),
      actualTravelTime: travelTimeMs,
      travelSpeed,
      status: 'in-transit'
    };

    // Update ship location
    ship.location.isInTransit = true;
    ship.location.destination = destination.id;
    ship.location.arrivalTime = travelPlan.estimatedArrivalTime.getTime();
    ship.location.stationId = undefined; // No longer at a station
    
    // Store travel plan
    this.activeTravels.set(travelPlan.id, travelPlan);

    // Schedule arrival event with TimeManager
    this.timeManager.scheduleEvent({
      triggerTime: travelPlan.estimatedArrivalTime,
      callback: () => this.completeTravelForShip(ship.id),
      description: `Ship ${ship.name} arrival at ${destination.name}`
    });

    return { success: true, travelPlan };
  }

  /**
   * Cancel active travel (emergency stop)
   */
  cancelTravel(shipId: string): { success: boolean; error?: string } {
    const activeTravelPlan = Array.from(this.activeTravels.values())
      .find(plan => plan.shipId === shipId && plan.status === 'in-transit');

    if (!activeTravelPlan) {
      return { success: false, error: 'No active travel found for ship' };
    }

    // Update status
    activeTravelPlan.status = 'cancelled';
    this.activeTravels.delete(activeTravelPlan.id);
    this.travelHistory.push(activeTravelPlan);

    return { success: true };
  }

  /**
   * Get current travel progress for a ship
   */
  getTravelProgress(shipId: string): TravelProgress | null {
    const travelPlan = Array.from(this.activeTravels.values())
      .find(plan => plan.shipId === shipId && plan.status === 'in-transit');

    if (!travelPlan) return null;

    const currentTime = this.timeManager.getCurrentDate();
    const elapsedTime = currentTime.getTime() - travelPlan.startTime.getTime();
    const progress = Math.min(1.0, elapsedTime / travelPlan.actualTravelTime);
    const remainingTime = Math.max(0, travelPlan.actualTravelTime - elapsedTime);

    // Calculate current position (linear interpolation)
    const currentPosition = this.interpolatePosition(
      travelPlan.origin.position,
      travelPlan.destination.position,
      progress
    );

    return {
      travelPlan,
      currentProgress: progress,
      remainingTime,
      currentPosition
    };
  }

  /**
   * Get all active travels
   */
  getActiveTravels(): TravelPlan[] {
    return Array.from(this.activeTravels.values())
      .filter(plan => plan.status === 'in-transit');
  }

  /**
   * Update method - should be called from main game loop
   * Checks for completed travels and updates ship locations
   */
  update(): void {
    const currentTime = this.timeManager.getCurrentDate();
    const completedTravels: string[] = [];

    // Check for completed travels
    for (const [travelId, travelPlan] of this.activeTravels) {
      if (currentTime >= travelPlan.estimatedArrivalTime && travelPlan.status === 'in-transit') {
        travelPlan.status = 'completed';
        completedTravels.push(travelId);
        this.travelHistory.push(travelPlan);
      }
    }

    // Remove completed travels from active list
    completedTravels.forEach(travelId => {
      this.activeTravels.delete(travelId);
    });
  }

  /**
   * Calculate ship speed based on ship class and equipment
   */
  private calculateShipSpeed(ship: Ship): number {
    let speed = ship.class.baseSpeed || this.defaultSpeed;

    // Apply engine equipment modifiers
    if (ship.equipment.engines.length > 0) {
      for (const engine of ship.equipment.engines) {
        if (engine.effects.speed) {
          speed += engine.effects.speed * engine.condition;
        }
      }
    }

    // Apply ship condition modifier
    speed *= ship.condition.engines;

    return Math.max(10, speed); // Minimum speed of 10 units/hour
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(pos1: Coordinates, pos2: Coordinates): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = (pos2.z || 0) - (pos1.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Convert current ship location to NavigationTarget
   */
  private getCurrentLocationAsTarget(location: ShipLocation): NavigationTarget | null {
    // This would typically require access to WorldManager to get station/system data
    // If at a station
    if (location.stationId && location.coordinates) {
      return {
        type: 'station',
        id: location.stationId,
        name: location.stationId, // Would get actual name from WorldManager
        position: location.coordinates,
        distance: 0,
        estimatedTravelTime: 0
      };
    }
    
    // If in space but with coordinates
    if (location.coordinates) {
      return {
        type: 'station', // Default type for current position
        id: `current-position`,
        name: 'Current Position',
        position: location.coordinates,
        distance: 0,
        estimatedTravelTime: 0
      };
    }
    
    return null;
  }

  /**
   * Complete travel for a specific ship
   */
  private completeTravelForShip(shipId: string): void {
    const travelPlan = Array.from(this.activeTravels.values())
      .find(plan => plan.shipId === shipId && plan.status === 'in-transit');

    if (travelPlan) {
      travelPlan.status = 'completed';
      // Note: Actual ship location update would need to be handled by PlayerManager
      // This method serves as a callback notification that travel is complete
    }
  }

  /**
   * Interpolate position between two points
   */
  private interpolatePosition(start: Coordinates, end: Coordinates, progress: number): Coordinates {
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
      z: (start.z || 0) + ((end.z || 0) - (start.z || 0)) * progress
    };
  }

  /**
   * Get travel history for a ship
   */
  getTravelHistory(shipId: string): TravelPlan[] {
    return this.travelHistory
      .filter(plan => plan.shipId === shipId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Estimate travel time between two targets
   */
  estimateTravelTime(
    origin: NavigationTarget,
    destination: NavigationTarget,
    shipSpeed?: number
  ): number {
    const distance = this.calculateDistance(origin.position, destination.position);
    const speed = shipSpeed || this.defaultSpeed;
    return (distance / speed) * 60 * 60 * 1000; // Return in milliseconds
  }

  /**
   * Get navigation manager state for save/load
   */
  getState(): {
    activeTravels: TravelPlan[];
    travelHistory: TravelPlan[];
  } {
    return {
      activeTravels: Array.from(this.activeTravels.values()),
      travelHistory: [...this.travelHistory]
    };
  }

  /**
   * Restore navigation manager state
   */
  setState(state: {
    activeTravels: TravelPlan[];
    travelHistory: TravelPlan[];
  }): void {
    this.activeTravels.clear();
    state.activeTravels.forEach(plan => {
      // Restore dates from serialized data
      plan.startTime = new Date(plan.startTime);
      plan.estimatedArrivalTime = new Date(plan.estimatedArrivalTime);
      this.activeTravels.set(plan.id, plan);
    });

    this.travelHistory = state.travelHistory.map(plan => ({
      ...plan,
      startTime: new Date(plan.startTime),
      estimatedArrivalTime: new Date(plan.estimatedArrivalTime)
    }));
  }
}