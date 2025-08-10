import { Actor } from './Actor';
import { Ship } from '../types/player';
import { Vector2D } from '../types';
import { shipTextureManager } from './ShipTextureManager';

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
  private useTextures: boolean = true;

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
   * Calculate acceleration based on ship class (simplified: reach max speed in 1 second)
   */
  private calculateAcceleration(): number {
    // Acceleration = max speed (since we want to reach max speed in exactly 1 second)
    return this.maxSpeed;
  }

  /**
   * Calculate rotation speed based on ship class and mass
   */
  private calculateRotationSpeed(): number {
    // Base turn speed in radians per second, inversely related to mass/size
    const baseTurnSpeed = 3.0; // radians per second
    
    switch (this.ship.class.category) {
      case 'courier': return baseTurnSpeed * 1.5; // Light and agile
      case 'combat': return baseTurnSpeed * 1.2;  // Balanced
      case 'explorer': return baseTurnSpeed * 1.0; // Balanced
      case 'transport': return baseTurnSpeed * 0.8; // Heavier, slower turn
      case 'heavy-freight': return baseTurnSpeed * 0.5; // Heavy and slow turning
      default: return baseTurnSpeed;
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
   * Update ship movement with simplified physics model
   * Each ship has turn speed and straight speed based on mass and engines
   * Acceleration to max speed always happens within 1 second
   */
  update(deltaTime: number): void {
    if (!this.targetPosition) {
      // No target - stop immediately (no complex friction)
      this.velocity = { x: 0, y: 0 };
      this.ship.location.isInTransit = false;
      return;
    }

    // Calculate direction to target
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Simple arrival threshold 
    const arrivalRadius = 5; 
    
    if (distance <= arrivalRadius) {
      // Arrived at target
      this.velocity = { x: 0, y: 0 };
      this.targetPosition = null;
      this.ship.location.isInTransit = false;
      
      // Call movement completion callback if set
      if (this.movementCompleteCallback) {
        const callback = this.movementCompleteCallback;
        this.movementCompleteCallback = undefined;
        callback();
      }
      return;
    }

    // Calculate direction to target
    const directionX = dx / distance;
    const directionY = dy / distance;
    
    // Calculate target rotation (ship should face movement direction)
    const targetRotation = Math.atan2(dy, dx);
    
    // Apply rotation towards target with turn speed limit
    let rotationDiff = targetRotation - this.rotation;
    
    // Normalize rotation difference to [-π, π]
    while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
    while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
    
    // Apply turn speed limit
    const maxRotationChange = this.rotationSpeed * deltaTime;
    if (Math.abs(rotationDiff) <= maxRotationChange) {
      this.rotation = targetRotation;
    } else {
      this.rotation += Math.sign(rotationDiff) * maxRotationChange;
    }
    
    // Simple speed control based on distance
    const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    
    // Target speed based on distance - start slowing down early enough to stop
    let targetSpeed = this.maxSpeed;
    const brakingDistance = (this.maxSpeed * this.maxSpeed) / (2 * this.acceleration); // Physics: v²/(2a)
    
    if (distance < brakingDistance) {
      // Calculate the speed needed to stop exactly at the target
      // Using: v = √(2*a*d) where v=speed, a=deceleration, d=distance
      targetSpeed = Math.sqrt(2 * this.acceleration * Math.max(0, distance - arrivalRadius));
      targetSpeed = Math.max(targetSpeed, this.maxSpeed * 0.1); // Minimum 10% of max speed
    }
    
    // Apply acceleration or deceleration to reach target speed
    if (currentSpeed < targetSpeed) {
      // Accelerate at exactly the rate to reach max speed in 1 second
      const newSpeed = currentSpeed + this.acceleration * deltaTime;
      const finalSpeed = Math.min(newSpeed, targetSpeed);
      
      this.velocity.x = directionX * finalSpeed;
      this.velocity.y = directionY * finalSpeed;
    } else if (currentSpeed > targetSpeed) {
      // Decelerate at the same rate as acceleration 
      const newSpeed = currentSpeed - this.acceleration * deltaTime;
      const finalSpeed = Math.max(newSpeed, targetSpeed);
      
      this.velocity.x = directionX * finalSpeed;
      this.velocity.y = directionY * finalSpeed;
    } else {
      // Maintain current speed in target direction
      this.velocity.x = directionX * currentSpeed;
      this.velocity.y = directionY * currentSpeed;
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
    
    // Try to render with textures first
    if (this.useTextures && this.renderWithTextures(context, category)) {
      return;
    }
    
    // Fallback to original solid color rendering
    this.renderSolidColorHull(context, category);
  }

  /**
   * Render ship hull using textures
   */
  private renderWithTextures(context: CanvasRenderingContext2D, category: string): boolean {
    // Get appropriate textures for this ship class
    const hullTexture = this.getHullTexture(category);
    const engineTexture = shipTextureManager.getTexture('engine-thruster-small');
    const cockpitTexture = this.getCockpitTexture(category);
    
    if (!hullTexture) {
      return false; // Texture not loaded, fallback to solid colors
    }
    
    try {
      // Render main hull texture
      const hullWidth = this.getHullWidth(category);
      const hullHeight = this.getHullHeight(category);
      
      context.drawImage(
        hullTexture, 
        -hullWidth/2, -hullHeight/2, 
        hullWidth, hullHeight
      );
      
      // Render engine texture if available
      if (engineTexture) {
        const engineX = -hullWidth/2 - 8;
        const engineY = -6;
        context.drawImage(engineTexture, engineX, engineY, 12, 12);
      }
      
      // Render cockpit texture if available
      if (cockpitTexture) {
        const cockpitX = hullWidth/4;
        const cockpitY = -4;
        context.drawImage(cockpitTexture, cockpitX, cockpitY, 8, 8);
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to render textured ship hull:', error);
      return false;
    }
  }

  /**
   * Get hull texture based on ship category
   */
  private getHullTexture(category: string): HTMLImageElement | null {
    switch (category) {
      case 'heavy-freight':
        return shipTextureManager.getTexture('hull-panel-large');
      case 'transport':
        return shipTextureManager.getTexture('hull-panel-medium');
      case 'courier':
      case 'combat':
      case 'explorer':
      default:
        return shipTextureManager.getTexture('hull-panel-small');
    }
  }

  /**
   * Get cockpit texture based on ship category
   */
  private getCockpitTexture(category: string): HTMLImageElement | null {
    if (category === 'heavy-freight' || category === 'transport') {
      return shipTextureManager.getTexture('bridge-section');
    } else {
      return shipTextureManager.getTexture('cockpit-small');
    }
  }

  /**
   * Get hull dimensions based on ship category
   */
  private getHullWidth(category: string): number {
    switch (category) {
      case 'heavy-freight': return 20;
      case 'transport': return 16;
      case 'combat': return 14;
      case 'courier': return 10;
      case 'explorer':
      default: return 12;
    }
  }

  private getHullHeight(category: string): number {
    switch (category) {
      case 'heavy-freight': return 16;
      case 'transport': return 12;
      case 'combat': return 10;
      case 'courier': return 8;
      case 'explorer':
      default: return 10;
    }
  }

  /**
   * Fallback solid color hull rendering (original implementation)
   */
  private renderSolidColorHull(context: CanvasRenderingContext2D, category: string): void {
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
    return this.targetPosition !== null || Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.y) > 0.5;
  }

  /**
   * Get current movement speed
   */
  getCurrentSpeed(): number {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
  }

  /**
   * Enable or disable texture rendering
   */
  setUseTextures(use: boolean): void {
    this.useTextures = use;
  }

  /**
   * Preload textures for this ship
   */
  async preloadTextures(): Promise<void> {
    const category = this.ship.class.category;
    const texturesToLoad = [];
    
    // Add hull texture
    switch (category) {
      case 'heavy-freight':
        texturesToLoad.push('hull-panel-large');
        break;
      case 'transport':
        texturesToLoad.push('hull-panel-medium');
        break;
      default:
        texturesToLoad.push('hull-panel-small');
    }
    
    // Add engine and cockpit textures
    texturesToLoad.push('engine-thruster-small');
    
    if (category === 'heavy-freight' || category === 'transport') {
      texturesToLoad.push('bridge-section');
    } else {
      texturesToLoad.push('cockpit-small');
    }
    
    await shipTextureManager.loadTextures(texturesToLoad);
  }
}