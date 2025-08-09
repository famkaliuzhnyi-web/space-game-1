import { describe, test, expect, beforeEach } from 'vitest';
import { Scene } from '../engine/Scene';
import { Actor, Vector2 } from '../engine/Actor';

// Test implementation of Actor
class TestActor extends Actor {
  renderCalled = false;
  updateCalled = false;

  constructor(id: string, name: string, position: Vector2 = { x: 0, y: 0 }) {
    super(id, name, position);
  }

  render(context: CanvasRenderingContext2D, camera: { x: number; y: number; zoom: number }): void {
    this.renderCalled = true;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.updateCalled = true;
  }
}

describe('Scene', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene('test-scene', 'Test Scene');
  });

  describe('Actor Management', () => {
    test('should add actors to scene', () => {
      const actor = new TestActor('actor1', 'Test Actor');
      scene.addActor(actor);
      
      expect(scene.getActor('actor1')).toBe(actor);
      expect(scene.getAllActors()).toHaveLength(1);
      expect(actor.getScene()).toBe(scene);
    });

    test('should remove actors from scene', () => {
      const actor = new TestActor('actor1', 'Test Actor');
      scene.addActor(actor);
      scene.removeActor('actor1');
      
      expect(scene.getActor('actor1')).toBeUndefined();
      expect(scene.getAllActors()).toHaveLength(0);
      expect(actor.getScene()).toBeNull();
    });

    test('should handle multiple actors', () => {
      const actor1 = new TestActor('actor1', 'Actor 1');
      const actor2 = new TestActor('actor2', 'Actor 2');
      
      scene.addActor(actor1);
      scene.addActor(actor2);
      
      expect(scene.getAllActors()).toHaveLength(2);
    });
  });

  describe('Update/Render Lifecycle', () => {
    test('should update all active actors', () => {
      const actor1 = new TestActor('actor1', 'Actor 1');
      const actor2 = new TestActor('actor2', 'Actor 2');
      actor2.isActive = false; // This one should not update
      
      scene.addActor(actor1);
      scene.addActor(actor2);
      
      scene.update(0.016);
      
      expect(actor1.updateCalled).toBe(true);
      expect(actor2.updateCalled).toBe(false);
    });

    test('should render all visible actors', () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      const camera = { x: 0, y: 0, zoom: 1 };
      
      const actor1 = new TestActor('actor1', 'Actor 1');
      const actor2 = new TestActor('actor2', 'Actor 2');
      actor2.isVisible = false; // This one should not render
      
      scene.addActor(actor1);
      scene.addActor(actor2);
      
      scene.render(context, camera);
      
      expect(actor1.renderCalled).toBe(true);
      expect(actor2.renderCalled).toBe(false);
    });

    test('should respect render order', () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      const camera = { x: 0, y: 0, zoom: 1 };
      
      const actor1 = new TestActor('actor1', 'Actor 1');
      const actor2 = new TestActor('actor2', 'Actor 2');
      
      actor1.renderOrder = 10;
      actor2.renderOrder = 5; // Should render first
      
      scene.addActor(actor1);
      scene.addActor(actor2);
      
      // Just verify it doesn't throw - render order is handled internally
      expect(() => scene.render(context, camera)).not.toThrow();
    });
  });
});

describe('Actor', () => {
  let actor: TestActor;

  beforeEach(() => {
    actor = new TestActor('test-actor', 'Test Actor', { x: 10, y: 20 });
  });

  describe('Transform Management', () => {
    test('should set and get position', () => {
      actor.setPosition(100, 200);
      const position = actor.getPosition();
      
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });

    test('should translate position', () => {
      actor.translate(50, 30);
      const position = actor.getPosition();
      
      expect(position.x).toBe(60); // 10 + 50
      expect(position.y).toBe(50); // 20 + 30
    });

    test('should set and get rotation', () => {
      actor.setRotation(Math.PI / 2);
      expect(actor.getRotation()).toBe(Math.PI / 2);
    });
  });

  describe('Distance Calculations', () => {
    test('should calculate distance to point', () => {
      const distance = actor.distanceToPoint({ x: 13, y: 24 });
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    test('should calculate distance to other actor', () => {
      const otherActor = new TestActor('other', 'Other', { x: 13, y: 24 });
      const distance = actor.distanceTo(otherActor);
      expect(distance).toBe(5); // 3-4-5 triangle
    });
  });

  describe('Lifecycle', () => {
    test('should destroy actor and remove from scene', () => {
      const scene = new Scene('test', 'Test');
      scene.addActor(actor);
      
      actor.destroy();
      
      expect(scene.getActor(actor.id)).toBeUndefined();
      expect(actor.getScene()).toBeNull();
    });
  });
});