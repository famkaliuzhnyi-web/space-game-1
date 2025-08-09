import { Actor, Vector2 } from '../Actor';
import { Ship } from '../../types/player';

/**
 * Movement state for ships
 */
export interface MovementState {
  isMoving: boolean;
  startPosition: Vector2;
  targetPosition: Vector2;
  startTime: number;
  duration: number; // in seconds
  easeFunction?: (t: number) => number; // For smooth movement curves
}

/**
 * ShipActor represents a ship in the game world.
 * Handles ship rendering, movement, and behavior.
 */
export class ShipActor extends Actor {
  private ship: Ship;
  private movementState: MovementState | null = null;
  private baseSpeed: number = 100; // pixels per second

  constructor(ship: Ship) {
    super(ship.id, ship.name, { x: 0, y: 0 });
    this.ship = ship;
    this.renderOrder = 10; // Ships render above background objects
    
    // Set initial position based on ship location
    this.updatePositionFromShipLocation();
  }

  /**
   * Update ship position based on ship.location data
   */
  private updatePositionFromShipLocation(): void {
    if (this.ship.location.coordinates) {
      this.setPosition(this.ship.location.coordinates.x, this.ship.location.coordinates.y);
    }
    // If docked at a station, position ship slightly offset from station for visibility
    else if (this.ship.location.stationId && !this.ship.location.isInTransit) {
      // Position will be set by SceneManager when it knows the station position
    }
  }

  /**
   * Get the ship data
   */
  getShip(): Ship {
    return this.ship;
  }

  /**
   * Update ship data
   */
  updateShip(ship: Ship): void {
    this.ship = ship;
    this.name = ship.name;
  }

  /**
   * Start movement to a target position
   */
  moveTo(targetPosition: Vector2, duration?: number): void {
    const distance = this.distanceToPoint(targetPosition);
    const calculatedDuration = duration || (distance / this.baseSpeed);

    this.movementState = {
      isMoving: true,
      startPosition: { ...this.transform.position },
      targetPosition: { ...targetPosition },
      startTime: performance.now() / 1000, // Convert to seconds
      duration: calculatedDuration,
      easeFunction: this.easeInOutCubic
    };

    // Update ship location to reflect that it's in transit
    this.ship.location.isInTransit = true;
    this.ship.location.coordinates = { ...targetPosition };
  }

  /**
   * Stop current movement
   */
  stopMovement(): void {
    if (this.movementState) {
      this.movementState.isMoving = false;
      this.ship.location.isInTransit = false;
    }
    this.movementState = null;
  }

  /**
   * Check if ship is currently moving
   */
  isMoving(): boolean {
    return this.movementState?.isMoving || false;
  }

  /**
   * Get movement progress (0-1)
   */
  getMovementProgress(): number {
    if (!this.movementState || !this.movementState.isMoving) return 1;

    const currentTime = performance.now() / 1000;
    const elapsed = currentTime - this.movementState.startTime;
    return Math.min(elapsed / this.movementState.duration, 1);
  }

  /**
   * Smooth easing function for movement
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Update ship movement
   */
  update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.movementState && this.movementState.isMoving) {
      const progress = this.getMovementProgress();
      
      if (progress >= 1) {
        // Movement complete
        this.setPosition(this.movementState.targetPosition.x, this.movementState.targetPosition.y);
        this.ship.location.isInTransit = false;
        this.movementState = null;
      } else {
        // Interpolate position
        const easedProgress = this.movementState.easeFunction 
          ? this.movementState.easeFunction(progress) 
          : progress;

        const x = this.movementState.startPosition.x + 
                 (this.movementState.targetPosition.x - this.movementState.startPosition.x) * easedProgress;
        const y = this.movementState.startPosition.y + 
                 (this.movementState.targetPosition.y - this.movementState.startPosition.y) * easedProgress;

        this.setPosition(x, y);
      }
    }
  }

  /**
   * Render the ship
   */
  render(context: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }): void {
    context.save();

    const pos = this.getPosition();
    
    // Draw ship hull
    context.fillStyle = this.isMoving() ? '#00ff00' : '#4a90e2'; // Green when moving, blue when stationary
    context.fillRect(pos.x - 6, pos.y - 3, 12, 6);
    
    // Draw ship detail
    context.fillStyle = '#ffffff';
    context.fillRect(pos.x - 4, pos.y - 1, 8, 2);
    
    // Draw engine glow if moving
    if (this.isMoving()) {
      context.fillStyle = '#ff6600';
      context.globalAlpha = 0.7;
      context.fillRect(pos.x - 8, pos.y - 2, 4, 4);
      context.globalAlpha = 1;
    }

    // Draw ship name
    context.fillStyle = '#ffffff';
    context.font = '10px monospace';
    context.textAlign = 'center';
    context.fillText(this.ship.name, pos.x, pos.y + 15);

    // Draw movement trail if moving
    if (this.movementState && this.movementState.isMoving) {
      this.renderMovementTrail(context);
    }

    context.restore();
  }

  /**
   * Render movement trail to show direction
   */
  private renderMovementTrail(context: CanvasRenderingContext2D): void {
    if (!this.movementState) return;

    const pos = this.getPosition();
    const start = this.movementState.startPosition;
    
    // Draw a faint line from start to current position
    context.strokeStyle = '#00ff00';
    context.globalAlpha = 0.3;
    context.lineWidth = 1;
    context.setLineDash([2, 4]);
    
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(pos.x, pos.y);
    context.stroke();
    
    context.setLineDash([]);
    context.globalAlpha = 1;
  }

  /**
   * Set movement speed
   */
  setSpeed(speed: number): void {
    this.baseSpeed = speed;
  }

  /**
   * Get movement speed
   */
  getSpeed(): number {
    return this.baseSpeed;
  }
}