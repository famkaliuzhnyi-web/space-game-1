import { ShipActor } from './ShipActor';
import { Ship, CargoItem } from '../types/player';
import { NPCShip } from '../types/npc';
import { Vector2D } from '../types';

/**
 * NPC Actor that extends ShipActor to provide NPC-specific behavior
 * while using the same physics-based movement system.
 * 
 * This bridges the gap between the Ship interface used by ShipActor
 * and the NPCShip interface used by the AI system.
 */
export class NPCActor extends ShipActor {
  private npcData: NPCShip;

  constructor(npcShip: NPCShip) {
    // Convert NPCShip to Ship format for ShipActor
    const ship = NPCActor.convertNPCToShip(npcShip);
    super(ship);
    
    this.npcData = npcShip;
  }

  /**
   * Convert NPCShip to Ship format for compatibility with ShipActor
   */
  private static convertNPCToShip(npcShip: NPCShip): Ship {
    // Create a ship class based on NPC ship type
    const shipClass = NPCActor.createShipClassFromNPCType(npcShip);
    
    // Convert NPC cargo format to Ship cargo format
    const cargoItems = new Map<string, CargoItem>();
    for (const [commodityId, quantity] of npcShip.ship.currentCargo.entries()) {
      if (quantity > 0) {
        cargoItems.set(commodityId, {
          commodityId,
          quantity,
          averagePurchasePrice: 100, // Default price for NPCs
          acquiredAt: Date.now()
        });
      }
    }
    
    return {
      id: npcShip.id,
      name: npcShip.name,
      class: shipClass,
      cargo: {
        capacity: npcShip.ship.cargoCapacity,
        used: Array.from(npcShip.ship.currentCargo.values()).reduce((sum, qty) => sum + qty, 0),
        items: cargoItems
      },
      equipment: {
        engines: [],
        cargo: [],
        shields: [],
        weapons: [],
        utility: []
      },
      condition: {
        hull: npcShip.ship.condition / 100, // Convert from 0-100 to 0-1
        engines: npcShip.ship.condition / 100,
        cargo: npcShip.ship.condition / 100,
        shields: npcShip.ship.condition / 100,
        lastMaintenance: npcShip.lastActionTime
      },
      location: {
        systemId: npcShip.position.systemId,
        stationId: npcShip.position.stationId,
        coordinates: npcShip.position.coordinates || { x: 0, y: 0 }, // Provide default
        isInTransit: npcShip.movement.isInTransit || false
      }
    };
  }

  /**
   * Create a ship class based on NPC type
   */
  private static createShipClassFromNPCType(npcShip: NPCShip) {
    const baseClasses = {
      trader: {
        category: 'transport' as const,
        baseSpeed: 80,
        baseCargoCapacity: 200
      },
      pirate: {
        category: 'courier' as const,
        baseSpeed: 120,
        baseCargoCapacity: 50
      },
      patrol: {
        category: 'combat' as const,
        baseSpeed: 100,
        baseCargoCapacity: 30
      },
      civilian: {
        category: 'courier' as const,
        baseSpeed: 90,
        baseCargoCapacity: 80
      },
      transport: {
        category: 'heavy-freight' as const,
        baseSpeed: 60,
        baseCargoCapacity: 500
      }
    };

    const baseClass = baseClasses[npcShip.type] || baseClasses.civilian;

    return {
      id: `${npcShip.type}-class`,
      name: npcShip.type.charAt(0).toUpperCase() + npcShip.type.slice(1),
      category: baseClass.category,
      baseCargoCapacity: baseClass.baseCargoCapacity,
      baseFuelCapacity: npcShip.ship.fuelCapacity,
      baseSpeed: baseClass.baseSpeed,
      baseShields: 50,
      equipmentSlots: {
        engines: 1,
        cargo: 1,
        shields: 1,
        weapons: 1,
        utility: 1
      }
    };
  }

  /**
   * Update the actor with enhanced NPC behavior
   */
  override update(deltaTime: number): void {
    // Update the underlying ship movement
    super.update(deltaTime);

    // Sync position back to NPC data
    this.syncPositionToNPCData();
  }

  /**
   * Sync the ship position back to the NPC data structure
   */
  private syncPositionToNPCData(): void {
    const position = this.getPosition();
    this.npcData.position.coordinates = { ...position };
    
    // Update velocity for AI use
    const velocity = this.getVelocity();
    this.npcData.movement.currentVelocity = { ...velocity };
    
    // Update transit state
    this.npcData.movement.isInTransit = this.isMoving();
    
    // Update the ship's location data
    const ship = this.getShip();
    this.npcData.position.coordinates = { ...position }; // Use actor position instead of ship location
    this.npcData.position.stationId = ship.location.stationId;
  }

  /**
   * Set movement target using pathfinding waypoints (NPC-specific)
   */
  setWaypointTarget(waypoints: Vector2D[]): void {
    if (waypoints.length > 0) {
      // Use the first waypoint as the immediate target
      // The NPC AI can update this as waypoints are reached
      this.setTarget(waypoints[0]);
      
      // Store waypoints in NPC data for AI reference
      this.npcData.movement.pathfindingWaypoints = waypoints;
      this.npcData.movement.currentWaypoint = 0;
    }
  }

  /**
   * Check if we've reached the current waypoint and advance to next
   */
  updateWaypointNavigation(): boolean {
    const waypoints = this.npcData.movement.pathfindingWaypoints;
    if (!waypoints || waypoints.length === 0) {
      return false;
    }

    const currentWaypointIndex = this.npcData.movement.currentWaypoint || 0;
    if (currentWaypointIndex >= waypoints.length) {
      // Reached end of path
      this.npcData.movement.pathfindingWaypoints = undefined;
      this.npcData.movement.currentWaypoint = 0;
      return false;
    }

    const currentWaypoint = waypoints[currentWaypointIndex];
    const distance = this.getDistanceTo(currentWaypoint);

    // If close enough to waypoint, advance to next
    if (distance < 15) {
      const nextIndex = currentWaypointIndex + 1;
      if (nextIndex < waypoints.length) {
        this.npcData.movement.currentWaypoint = nextIndex;
        this.setTarget(waypoints[nextIndex]);
        return true;
      } else {
        // Completed path
        this.npcData.movement.pathfindingWaypoints = undefined;
        this.npcData.movement.currentWaypoint = 0;
        return false;
      }
    }

    return true; // Still navigating
  }

  /**
   * Set target to a station (for docking)
   */
  setStationTarget(stationId: string, stationPosition: Vector2D): void {
    this.setTarget(stationPosition);
    this.npcData.movement.targetStationId = stationId;
  }

  /**
   * Check if the NPC has reached its target station
   */
  hasReachedStation(): boolean {
    if (!this.npcData.movement.targetStationId) {
      return false;
    }

    // Check if we're close enough to the target position and not moving
    return !this.isMoving();
  }

  /**
   * Dock at the target station
   */
  dockAtStation(): void {
    if (this.npcData.movement.targetStationId) {
      this.npcData.position.stationId = this.npcData.movement.targetStationId;
      this.npcData.movement.targetStationId = undefined;
      this.stopMovement();
    }
  }

  /**
   * Get the underlying NPC data
   */
  getNPCData(): NPCShip {
    return this.npcData;
  }

  /**
   * Get NPC type
   */
  getNPCType(): string {
    return this.npcData.type;
  }

  /**
   * Override render to show NPC-specific visual elements
   */
  override render(context: CanvasRenderingContext2D): void {
    // Call parent render for ship visuals
    super.render(context);

    // Add NPC-specific visual indicators
    this.renderNPCIndicators(context);
  }

  /**
   * Render NPC-specific visual indicators
   */
  private renderNPCIndicators(context: CanvasRenderingContext2D): void {
    context.save();
    
    const position = this.getPosition();
    context.translate(position.x, position.y);

    // Add a small indicator based on NPC type
    const colors = {
      trader: '#4a90e2',    // Blue
      pirate: '#ff4444',    // Red
      patrol: '#44aa44',    // Green  
      civilian: '#888888',  // Gray
      transport: '#aa8844'  // Brown
    };

    const color = colors[this.npcData.type as keyof typeof colors] || colors.civilian;
    
    // Draw a small indicator circle
    context.fillStyle = color;
    context.beginPath();
    context.arc(0, -15, 3, 0, Math.PI * 2);
    context.fill();

    // Add faction indicator if relevant
    if (this.npcData.faction && this.npcData.type === 'patrol') {
      context.fillStyle = '#ffffff';
      context.font = '8px monospace';
      context.textAlign = 'center';
      context.fillText(this.npcData.faction.substring(0, 3).toUpperCase(), 0, -18);
    }

    context.restore();
  }

  /**
   * Get current speed (override to return NPC movement speed if available)
   */
  override getCurrentSpeed(): number {
    const shipSpeed = super.getCurrentSpeed();
    // Use the ShipActor's calculated speed as it's more accurate
    return shipSpeed;
  }
}