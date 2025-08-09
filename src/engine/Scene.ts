import { Actor } from './Actor';

/**
 * Scene class manages a collection of actors and their interactions.
 * Follows game engine pattern for organizing and updating game objects.
 */
export class Scene {
  private actors: Map<string, Actor> = new Map();
  private actorsByType: Map<string, Set<string>> = new Map();

  /**
   * Add an actor to the scene
   */
  addActor(actor: Actor, type?: string): void {
    this.actors.set(actor.id, actor);
    
    if (type) {
      if (!this.actorsByType.has(type)) {
        this.actorsByType.set(type, new Set());
      }
      this.actorsByType.get(type)!.add(actor.id);
    }
  }

  /**
   * Remove an actor from the scene
   */
  removeActor(actorId: string): void {
    const actor = this.actors.get(actorId);
    if (actor) {
      actor.destroy();
      this.actors.delete(actorId);
      
      // Remove from type maps
      for (const [type, actorSet] of this.actorsByType) {
        if (actorSet.has(actorId)) {
          actorSet.delete(actorId);
          if (actorSet.size === 0) {
            this.actorsByType.delete(type);
          }
          break;
        }
      }
    }
  }

  /**
   * Get an actor by ID
   */
  getActor(actorId: string): Actor | undefined {
    return this.actors.get(actorId);
  }

  /**
   * Get all actors of a specific type
   */
  getActorsByType(type: string): Actor[] {
    const actorIds = this.actorsByType.get(type);
    if (!actorIds) return [];
    
    return Array.from(actorIds)
      .map(id => this.actors.get(id))
      .filter((actor): actor is Actor => actor !== undefined && actor.isActive);
  }

  /**
   * Get all actors in the scene
   */
  getAllActors(): Actor[] {
    return Array.from(this.actors.values()).filter(actor => actor.isActive);
  }

  /**
   * Update all active actors in the scene
   */
  update(deltaTime: number): void {
    for (const actor of this.actors.values()) {
      if (actor.isActive) {
        actor.update(deltaTime);
      }
    }
  }

  /**
   * Render all active actors in the scene
   */
  render(context: CanvasRenderingContext2D): void {
    for (const actor of this.actors.values()) {
      if (actor.isActive) {
        actor.render(context);
      }
    }
  }

  /**
   * Find actors within a certain radius of a position
   */
  findActorsInRadius(position: { x: number; y: number }, radius: number): Actor[] {
    const result: Actor[] = [];
    
    for (const actor of this.actors.values()) {
      if (!actor.isActive) continue;
      
      const distance = Math.sqrt(
        Math.pow(actor.position.x - position.x, 2) + 
        Math.pow(actor.position.y - position.y, 2)
      );
      
      if (distance <= radius) {
        result.push(actor);
      }
    }
    
    return result;
  }

  /**
   * Clear all actors from the scene
   */
  clear(): void {
    for (const actor of this.actors.values()) {
      actor.destroy();
    }
    this.actors.clear();
    this.actorsByType.clear();
  }

  /**
   * Get the number of active actors
   */
  getActorCount(): number {
    return Array.from(this.actors.values()).filter(actor => actor.isActive).length;
  }
}