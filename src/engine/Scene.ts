import { Actor } from './Actor';

/**
 * Scene represents a game scene that contains and manages actors.
 * Follows the scene-actor pattern common in game engines.
 */
export interface IScene {
  id: string;
  name: string;
  actors: Map<string, Actor>;
  
  addActor(actor: Actor): void;
  removeActor(actorId: string): void;
  getActor(actorId: string): Actor | undefined;
  getAllActors(): Actor[];
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }): void;
}

/**
 * Base Scene implementation for the space game.
 * Manages actors and provides update/render lifecycle.
 */
export class Scene implements IScene {
  id: string;
  name: string;
  actors: Map<string, Actor> = new Map();

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * Add an actor to the scene
   */
  addActor(actor: Actor): void {
    this.actors.set(actor.id, actor);
    actor.setScene(this);
  }

  /**
   * Remove an actor from the scene
   */
  removeActor(actorId: string): void {
    const actor = this.actors.get(actorId);
    if (actor) {
      actor.setScene(null);
      this.actors.delete(actorId);
    }
  }

  /**
   * Get a specific actor by ID
   */
  getActor(actorId: string): Actor | undefined {
    return this.actors.get(actorId);
  }

  /**
   * Get all actors in the scene
   */
  getAllActors(): Actor[] {
    return Array.from(this.actors.values());
  }

  /**
   * Update all actors in the scene
   */
  update(deltaTime: number): void {
    for (const actor of this.actors.values()) {
      if (actor.isActive) {
        actor.update(deltaTime);
      }
    }
  }

  /**
   * Render all actors in the scene
   */
  render(context: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }): void {
    // Sort actors by render order (lower values render first)
    const sortedActors = Array.from(this.actors.values())
      .filter(actor => actor.isVisible)
      .sort((a, b) => a.renderOrder - b.renderOrder);

    for (const actor of sortedActors) {
      actor.render(context, camera);
    }
  }
}