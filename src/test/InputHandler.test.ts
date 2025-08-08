import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandler } from '../engine/InputHandler';
import { WorldManager } from '../systems/WorldManager';
import type { Camera } from '../engine/Renderer';

// Mock canvas
class MockCanvas {
  width = 800;
  height = 600;
}

// Mock InputManager
class MockInputManager {
  private keys: Record<string, boolean> = {};
  private mousePos = { x: 0, y: 0 };
  private mouseButtons: Record<number, boolean> = {};
  private touches: Array<{ x: number; y: number }> = [];
  private clickEvents: Array<{ button: number; position: { x: number; y: number } }> = [];

  setKey(key: string, pressed: boolean) {
    this.keys[key] = pressed;
  }

  setMousePos(x: number, y: number) {
    this.mousePos = { x, y };
  }

  setMouseButton(button: number, pressed: boolean) {
    this.mouseButtons[button] = pressed;
  }

  setTouches(touches: Array<{ x: number; y: number }>) {
    this.touches = touches;
  }

  addClickEvent(button: number, position: { x: number; y: number }) {
    this.clickEvents.push({ button, position });
  }

  isKeyPressed(key: string): boolean {
    return this.keys[key] || false;
  }

  getMousePosition() {
    return this.mousePos;
  }

  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons[button] || false;
  }

  getTouchPositions() {
    return this.touches;
  }

  getClickEvents() {
    const events = [...this.clickEvents];
    this.clickEvents = []; // Clear after reading
    return events;
  }
}

describe('InputHandler', () => {
  let inputHandler: InputHandler;
  let mockCanvas: MockCanvas;
  let mockInputManager: MockInputManager;
  let camera: Camera;

  beforeEach(() => {
    mockCanvas = new MockCanvas();
    inputHandler = new InputHandler(mockCanvas as unknown as HTMLCanvasElement);
    mockInputManager = new MockInputManager();
    camera = { x: 0, y: 0, zoom: 1 };
  });

  describe('Camera Controls', () => {
    it('should move camera up with W or ArrowUp', () => {
      mockInputManager.setKey('KeyW', true);
      inputHandler.updateCamera(camera, 0.1, mockInputManager as any);
      expect(camera.y).toBeLessThan(0);
    });

    it('should move camera down with S or ArrowDown', () => {
      mockInputManager.setKey('KeyS', true);
      inputHandler.updateCamera(camera, 0.1, mockInputManager as any);
      expect(camera.y).toBeGreaterThan(0);
    });

    it('should move camera left with A or ArrowLeft', () => {
      mockInputManager.setKey('KeyA', true);
      inputHandler.updateCamera(camera, 0.1, mockInputManager as any);
      expect(camera.x).toBeLessThan(0);
    });

    it('should move camera right with D or ArrowRight', () => {
      mockInputManager.setKey('KeyD', true);
      inputHandler.updateCamera(camera, 0.1, mockInputManager as any);
      expect(camera.x).toBeGreaterThan(0);
    });

    it('should zoom in with Equal or NumpadAdd', () => {
      mockInputManager.setKey('Equal', true);
      inputHandler.updateCamera(camera, 0.1, mockInputManager as any);
      expect(camera.zoom).toBeGreaterThan(1);
    });

    it('should zoom out with Minus or NumpadSubtract', () => {
      camera.zoom = 1.5; // Start with some zoom
      mockInputManager.setKey('Minus', true);
      inputHandler.updateCamera(camera, 0.1, mockInputManager as any);
      expect(camera.zoom).toBeLessThan(1.5);
    });

    it('should enforce zoom limits', () => {
      // Test max zoom
      camera.zoom = 2.9;
      mockInputManager.setKey('Equal', true);
      inputHandler.updateCamera(camera, 1, mockInputManager as any);
      expect(camera.zoom).toBeLessThanOrEqual(3);

      // Test min zoom
      camera.zoom = 0.2;
      mockInputManager.setKey('Minus', true);
      inputHandler.updateCamera(camera, 1, mockInputManager as any);
      expect(camera.zoom).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('Click Handling', () => {
    it('should set click handler correctly', () => {
      const clickHandler = vi.fn();
      expect(() => inputHandler.setClickHandler(clickHandler)).not.toThrow();
    });

    it('should handle mouse clicks', () => {
      const clickHandler = vi.fn();
      inputHandler.setClickHandler(clickHandler);
      
      mockInputManager.addClickEvent(0, { x: 100, y: 100 });
      
      inputHandler.updateCamera(camera, 0.1, mockInputManager as any);
      expect(clickHandler).toHaveBeenCalled();
    });

    it('should handle touch input', () => {
      const clickHandler = vi.fn();
      inputHandler.setClickHandler(clickHandler);
      
      mockInputManager.setTouches([{ x: 100, y: 100 }]);
      
      inputHandler.updateCamera(camera, 0.1, mockInputManager as any);
      expect(clickHandler).toHaveBeenCalled();
    });

    it('should convert screen coordinates to world coordinates', () => {
      const clickHandler = vi.fn();
      inputHandler.setClickHandler(clickHandler);
      
      camera.x = 50;
      camera.y = 50;
      camera.zoom = 2;
      
      mockInputManager.addClickEvent(0, { x: 400, y: 300 }); // Center of canvas
      
      inputHandler.updateCamera(camera, 0.1, mockInputManager as any);
      
      expect(clickHandler).toHaveBeenCalledWith(50, 50); // Should match camera position
    });
  });

  describe('World Click Handling', () => {
    it('should handle world click with stations', () => {
      const worldManager = new WorldManager();
      const spy = vi.spyOn(worldManager, 'navigateToTarget').mockImplementation(() => true);
      
      // Mock visible objects
      vi.spyOn(worldManager, 'getAllVisibleObjects').mockReturnValue([
        {
          type: 'station',
          position: { x: 10, y: 10 },
          object: { 
            id: 'test-station',
            name: 'Test Station',
            type: 'trade',
            position: { x: 10, y: 10 },
            faction: 'Test Faction',
            dockingCapacity: 5,
            services: [],
            description: 'Test station'
          }
        }
      ]);
      
      InputHandler.handleWorldClick(10, 10, worldManager);
      expect(spy).toHaveBeenCalledWith('test-station');
    });

    it('should respect click radius for different object types', () => {
      const worldManager = new WorldManager();
      const spy = vi.spyOn(worldManager, 'navigateToTarget').mockImplementation(() => true);
      
      // Mock visible objects
      vi.spyOn(worldManager, 'getAllVisibleObjects').mockReturnValue([
        {
          type: 'station',
          position: { x: 0, y: 0 },
          object: { 
            id: 'test-station',
            name: 'Test Station',
            type: 'trade',
            position: { x: 0, y: 0 },
            faction: 'Test Faction',
            dockingCapacity: 5,
            services: [],
            description: 'Test station'
          }
        }
      ]);
      
      // Click within station radius (15)
      InputHandler.handleWorldClick(10, 10, worldManager);
      expect(spy).toHaveBeenCalled();
      
      spy.mockClear();
      
      // Click outside station radius
      InputHandler.handleWorldClick(20, 20, worldManager);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});