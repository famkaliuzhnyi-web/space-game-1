import { Actor } from './Actor';
import { Ship } from '../types/player';
import { Vector2D } from '../types';

/**
 * Ship Actor implementing physics-based movement and behavior.
 * Extends the base Actor class with ship-specific functionality.
 */
export class ShipActor extends Actor {
  private ship: Ship;
  private targetPosition: Vector2D | null = null;
  private maxSpeed: number;
  private acceleration: number;
  private rotationSpeed: number;
  private thrustParticles: Array<{ x: number; y: number; life: number }> = [];
  private movementCompleteCallback?: () => void;

  constructor(ship: Ship) {
    super(ship.id, ship.location.coordinates || { x: 0, y: 0 });
    this.ship = ship;
    
    // Movement parameters based on ship class
    this.maxSpeed = this.calculateMaxSpeed();
    this.acceleration = this.calculateAcceleration();
    this.rotationSpeed = this.calculateRotationSpeed();
  }

  /**
   * Calculate maximum speed based on ship class and equipment
   */
  private calculateMaxSpeed(): number {
    const baseSpeed = this.ship.class.baseSpeed || 100;
    
    // Apply equipment modifiers
    let speedModifier = 1.0;
    for (const engine of this.ship.equipment.engines) {
      if (engine.effects.speed) {
        speedModifier += engine.effects.speed * 0.01; // Convert percentage to decimal
      }
    }
    
    return baseSpeed * speedModifier;
  }

  /**
   * Calculate acceleration based on ship class
   */
  private calculateAcceleration(): number {
    switch (this.ship.class.category) {
      case 'courier': return 200; // Fast acceleration
      case 'combat': return 150;
      case 'explorer': return 120;
      case 'transport': return 80;
      case 'heavy-freight': return 50; // Slow acceleration
      default: return 100;
    }
  }

  /**
   * Calculate rotation speed based on ship class
   */
  private calculateRotationSpeed(): number {
    switch (this.ship.class.category) {
      case 'courier': return 4.0; // Fast turning
      case 'combat': return 3.0;
      case 'explorer': return 2.5;
      case 'transport': return 2.0;
      case 'heavy-freight': return 1.5; // Slow turning
      default: return 2.0;
    }
  }

  /**
   * Set target position for the ship to move towards
   */
  setTarget(target: Vector2D): void {
    this.targetPosition = { ...target };
    this.ship.location.isInTransit = true;
  }

  /**
   * Set callback to be called when movement completes
   */
  setMovementCompleteCallback(callback: () => void): void {
    this.movementCompleteCallback = callback;
  }

  /**
   * Stop the ship movement
   */
  stopMovement(): void {
    this.targetPosition = null;
    this.velocity = { x: 0, y: 0 };
    this.ship.location.isInTransit = false;
  }

  /**
   * Update ship movement with improved physics
   */
  update(deltaTime: number): void {
    if (!this.targetPosition) {
      // Apply friction to gradually stop
      this.velocity.x *= 0.95;
      this.velocity.y *= 0.95;
      
      // Stop if velocity is very low
      if (Math.abs(this.velocity.x) < 1 && Math.abs(this.velocity.y) < 1) {
        this.velocity = { x: 0, y: 0 };
        this.ship.location.isInTransit = false;
      }
    } else {
      // Calculate direction to target
      const dx = this.targetPosition.x - this.position.x;
      const dy = this.targetPosition.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Improved arrival threshold - larger and more forgiving
      const arrivalRadius = 15;
      
      if (distance < arrivalRadius) {
        // Smooth arrival - gradually reduce speed as we approach
        const arrivalFactor = Math.max(0.2, distance / arrivalRadius);
        
        // More aggressive deceleration when very close
        if (distance < 8) {
          this.velocity.x *= 0.5;
          this.velocity.y *= 0.5;
        } else {
          this.velocity.x *= arrivalFactor;
          this.velocity.y *= arrivalFactor;
        }
        
        // Only stop completely when very close and moving slowly
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (distance < 10 && currentSpeed < 8) {
          // Final stop - set position close to target and stop all movement
          this.position.x = this.targetPosition.x;
          this.position.y = this.targetPosition.y;
          this.velocity = { x: 0, y: 0 };
          this.targetPosition = null;
          this.ship.location.isInTransit = false;
          
          // Call movement completion callback if set
          if (this.movementCompleteCallback) {
            const callback = this.movementCompleteCallback;
            this.movementCompleteCallback = undefined; // Clear callback after use
            callback();
          }
        }
      } else {
        // Calculate desired direction
        const directionX = dx / distance;
        const directionY = dy / distance;
        
        // Calculate target rotation
        const targetRotation = Math.atan2(dy, dx);
        
        // Smooth rotation towards target
        let rotationDiff = targetRotation - this.rotation;
        
        // Normalize rotation difference to [-π, π]
        while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
        while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
        
        // Apply rotation
        const maxRotationChange = this.rotationSpeed * deltaTime;
        if (Math.abs(rotationDiff) <= maxRotationChange) {
          this.rotation = targetRotation;
        } else {
          this.rotation += Math.sign(rotationDiff) * maxRotationChange;
        }
        
        // Predictive deceleration - start slowing down before reaching target
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        const brakingDistance = Math.max(40, (currentSpeed * currentSpeed) / (2 * this.acceleration * 0.8));
        
        let targetAcceleration;
        if (distance < brakingDistance) {
          // Deceleration phase - reduce thrust as we approach target
          const decelerationFactor = Math.max(0.2, distance / brakingDistance);
          targetAcceleration = this.acceleration * decelerationFactor * 0.4; // Stronger deceleration
        } else {
          // Normal acceleration phase
          targetAcceleration = this.acceleration;
          
          // Only apply full thrust if we're reasonably aligned with target
          const alignmentFactor = Math.max(0.4, Math.cos(Math.abs(rotationDiff)));
          targetAcceleration *= alignmentFactor;
        }
        
        // Apply acceleration towards target
        const accelerationForce = targetAcceleration * deltaTime;
        this.velocity.x += directionX * accelerationForce;
        this.velocity.y += directionY * accelerationForce;
        
        // Dynamic speed limiting based on distance to target to prevent overshoot
        let effectiveMaxSpeed = this.maxSpeed;
        if (distance < 80) {
          // More aggressive speed reduction when close to target
          effectiveMaxSpeed = Math.max(15, this.maxSpeed * Math.pow(distance / 80, 1.5));
        }
        
        // Limit maximum speed
        if (currentSpeed > effectiveMaxSpeed) {
          const speedReduction = effectiveMaxSpeed / currentSpeed;
          this.velocity.x *= speedReduction;
          this.velocity.y *= speedReduction;
        }
      }
    }
    
    // Apply velocity to position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    // Update ship's location in the ship object
    this.ship.location.coordinates = { ...this.position };
    
    // Update thrust particles
    this.updateThrustParticles(deltaTime);
  }

  /**
   * Update thrust particle effects
   */
  private updateThrustParticles(deltaTime: number): void {
    // Remove expired particles
    this.thrustParticles = this.thrustParticles.filter(particle => {
      particle.life -= deltaTime;
      return particle.life > 0;
    });
    
    // Add new thrust particles if ship is moving
    const isThrusting = Math.abs(this.velocity.x) > 5 || Math.abs(this.velocity.y) > 5;
    if (isThrusting && this.thrustParticles.length < 10) {
      // Calculate engine position (behind the ship)
      const engineX = this.position.x - Math.cos(this.rotation) * 8;
      const engineY = this.position.y - Math.sin(this.rotation) * 8;
      
      this.thrustParticles.push({
        x: engineX + (Math.random() - 0.5) * 4,
        y: engineY + (Math.random() - 0.5) * 4,
        life: 0.5 + Math.random() * 0.3
      });
    }
  }

  /**
   * Render the ship actor with enhanced visuals
   */
  render(context: CanvasRenderingContext2D): void {
    context.save();
    
    // Move to ship position
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation);
    
    // Render thrust particles first (behind ship)
    this.renderThrustParticles(context);
    
    // Ship hull based on class
    this.renderShipHull(context);
    
    // Ship name label (not rotated)
    context.rotate(-this.rotation);
    context.fillStyle = '#ffffff';
    context.font = '10px monospace';
    context.textAlign = 'center';
    context.fillText(this.ship.name, 0, 25);
    
    context.restore();
  }

  /**
   * Render ship hull based on ship class
   */
  private renderShipHull(context: CanvasRenderingContext2D): void {
    const category = this.ship.class.category;
    
    switch (category) {
      case 'courier':
        // Small, sleek design
        context.fillStyle = '#4a90e2';
        context.beginPath();
        context.moveTo(8, 0);           // Nose
        context.lineTo(-4, -3);         // Top wing
        context.lineTo(-6, -1);         // Engine mount
        context.lineTo(-6, 1);          // Engine mount
        context.lineTo(-4, 3);          // Bottom wing
        context.closePath();
        context.fill();
        break;
        
      case 'combat':
        // Angular, aggressive design
        context.fillStyle = '#ff4444';
        context.beginPath();
        context.moveTo(10, 0);          // Sharp nose
        context.lineTo(-2, -6);         // Wide wings
        context.lineTo(-8, -3);         // Engine
        context.lineTo(-8, 3);          // Engine
        context.lineTo(-2, 6);          // Wide wings
        context.closePath();
        context.fill();
        break;
        
      case 'transport':
        // Boxy, practical design
        context.fillStyle = '#44aa44';
        context.fillRect(-6, -4, 12, 8);  // Main hull
        context.fillRect(4, -2, 4, 4);    // Cockpit
        break;
        
      case 'heavy-freight':
        // Large, bulky design
        context.fillStyle = '#aa8844';
        context.fillRect(-8, -6, 16, 12); // Large hull
        context.fillRect(6, -3, 4, 6);    // Cockpit
        context.fillRect(-10, -2, 3, 4);  // Engines
        break;
        
      case 'explorer':
      default:
        // Balanced design (original triangle)
        context.fillStyle = '#4a90e2';
        context.beginPath();
        context.moveTo(8, 0);           // Forward point
        context.lineTo(-6, -6);         // Port wing
        context.lineTo(-6, 6);          // Starboard wing
        context.closePath();
        context.fill();
        break;
    }
  }

  /**
   * Render thrust particles for visual feedback
   */
  private renderThrustParticles(context: CanvasRenderingContext2D): void {
    for (const particle of this.thrustParticles) {
      const alpha = particle.life / 0.8; // Fade out based on life
      context.globalAlpha = alpha;
      context.fillStyle = `hsl(${Math.random() * 60 + 15}, 100%, ${50 + Math.random() * 30}%)`; // Orange-red flames
      
      const size = 2 + Math.random() * 2;
      const localX = particle.x - this.position.x;
      const localY = particle.y - this.position.y;
      
      context.fillRect(localX - size/2, localY - size/2, size, size);
    }
    context.globalAlpha = 1.0;
  }

  /**
   * Get the ship data
   */
  getShip(): Ship {
    return this.ship;
  }

  /**
   * Check if ship is currently moving
   */
  isMoving(): boolean {
    return this.targetPosition !== null || Math.abs(this.velocity.x) > 1 || Math.abs(this.velocity.y) > 1;
  }

  /**
   * Get current movement speed
   */
  getCurrentSpeed(): number {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
  }
}