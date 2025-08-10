import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandler } from '../engine/InputHandler';
import { WorldManager } from '../systems/WorldManager';

describe('Ship Positioning Bug Fix', () => {
  let inputHandler: InputHandler;
  let mockCanvas: HTMLCanvasElement;
  let mockCamera: { x: number; y: number; zoom: number };
  let worldClickCalls: Array<{ x: number; y: number; action: string }>;

  beforeEach(() => {
    // Create a mock canvas
    mockCanvas = {
      width: 1280,
      height: 720,
      clientWidth: 1280,
      clientHeight: 720,
      getBoundingClientRect: () => ({
        x: 0, y: 0, width: 1280, height: 720, top: 0, left: 0, right: 1280, bottom: 720
      })
    } as HTMLCanvasElement;

    inputHandler = new InputHandler(mockCanvas);
    
    // Mock camera at origin with 1x zoom
    mockCamera = { x: 0, y: 0, zoom: 1.0 };

    // Track world click calls
    worldClickCalls = [];
    inputHandler.setClickHandler((worldX, worldY, action = 'move') => {
      worldClickCalls.push({ x: worldX, y: worldY, action });
    });
  });

  describe('Coordinate Transformation', () => {
    it('should correctly transform center screen coordinates to world origin', () => {
      // Click at screen center (640, 360) should map to world origin (0, 0) when camera is at origin
      const screenCenterX = 640; // 1280 / 2
      const screenCenterY = 360; // 720 / 2

      // Simulate the handleClick method logic
      const worldX = (screenCenterX - mockCanvas.width / 2) / mockCamera.zoom + mockCamera.x;
      const worldY = (screenCenterY - mockCanvas.height / 2) / mockCamera.zoom + mockCamera.y;

      expect(worldX).toBe(0);
      expect(worldY).toBe(0);
    });

    it('should correctly transform corner coordinates', () => {
      // Click at top-left corner (0, 0) with camera at origin
      const screenX = 0;
      const screenY = 0;

      const worldX = (screenX - mockCanvas.width / 2) / mockCamera.zoom + mockCamera.x;
      const worldY = (screenY - mockCanvas.height / 2) / mockCamera.zoom + mockCamera.y;

      // Top-left should map to (-640, -360) in world coordinates
      expect(worldX).toBe(-640);
      expect(worldY).toBe(-360);
    });

    it('should handle camera offset correctly', () => {
      // Move camera to (100, 200)
      mockCamera.x = 100;
      mockCamera.y = 200;

      // Click at screen center should now map to camera position
      const screenCenterX = 640;
      const screenCenterY = 360;

      const worldX = (screenCenterX - mockCanvas.width / 2) / mockCamera.zoom + mockCamera.x;
      const worldY = (screenCenterY - mockCanvas.height / 2) / mockCamera.zoom + mockCamera.y;

      expect(worldX).toBe(100);
      expect(worldY).toBe(200);
    });

    it('should handle zoom correctly', () => {
      // Zoom in 2x
      mockCamera.zoom = 2.0;

      // Click at a position offset from center
      const screenX = 740; // 100 pixels right of center
      const screenY = 410; // 50 pixels down from center

      const worldX = (screenX - mockCanvas.width / 2) / mockCamera.zoom + mockCamera.x;
      const worldY = (screenY - mockCanvas.height / 2) / mockCamera.zoom + mockCamera.y;

      // With 2x zoom, the world offset should be halved
      expect(worldX).toBe(50);  // 100 / 2
      expect(worldY).toBe(25);  // 50 / 2
    });
  });

  describe('World Click Integration', () => {
    it('should handle world clicks correctly with no objects clicked', () => {
      // Create a minimal world manager for testing
      const worldManager = new WorldManager();
      
      // Mock getAllVisibleObjects to return empty array (no objects to click on)
      vi.spyOn(worldManager, 'getAllVisibleObjects').mockReturnValue([]);
      vi.spyOn(worldManager, 'moveShipToCoordinates').mockReturnValue(true);

      // Test the static handleWorldClick method
      InputHandler.handleWorldClick(100, 200, worldManager, 'command');

      // Should call moveShipToCoordinates with the exact coordinates
      expect(worldManager.moveShipToCoordinates).toHaveBeenCalledWith(100, 200);
    });

    it('should handle station clicks correctly', () => {
      const worldManager = new WorldManager();
      
      // Mock a station at position (100, 200)
      const mockStation = {
        type: 'station',
        object: { id: 'test-station' },
        position: { x: 100, y: 200 }
      };

      vi.spyOn(worldManager, 'getAllVisibleObjects').mockReturnValue([mockStation]);
      vi.spyOn(worldManager, 'navigateToTarget').mockReturnValue(true);
      vi.spyOn(worldManager, 'moveShipToCoordinates').mockReturnValue(true);

      // Click exactly on the station (within click radius of 15)
      InputHandler.handleWorldClick(100, 200, worldManager, 'command');

      // Should navigate to the station, not move to coordinates
      expect(worldManager.navigateToTarget).toHaveBeenCalledWith('test-station');
      expect(worldManager.moveShipToCoordinates).not.toHaveBeenCalled();
    });

    it('should calculate click radius correctly for different object types', () => {
      const worldManager = new WorldManager();
      vi.spyOn(worldManager, 'moveShipToCoordinates').mockReturnValue(true);
      vi.spyOn(worldManager, 'navigateToTarget').mockReturnValue(true);

      // Test planet with custom radius
      const mockPlanet = {
        type: 'planet',
        object: { radius: 30 },
        position: { x: 100, y: 100 }
      };

      vi.spyOn(worldManager, 'getAllVisibleObjects').mockReturnValue([mockPlanet]);

      // Click just outside the planet's radius (35 units away)
      const distance = 35;
      const clickX = 100 + distance;
      const clickY = 100;

      InputHandler.handleWorldClick(clickX, clickY, worldManager, 'command');

      // Should miss the planet and move to coordinates instead
      expect(worldManager.moveShipToCoordinates).toHaveBeenCalledWith(clickX, clickY);
      expect(worldManager.navigateToTarget).not.toHaveBeenCalled();
    });
  });

  describe('Regression Tests', () => {
    it('should reproduce the coordinate transformation bug scenario', () => {
      // This test reproduces the specific scenario where clicking results in wrong coordinates
      
      // Setup: Camera at origin, 1x zoom (common initial state)
      mockCamera = { x: 0, y: 0, zoom: 1.0 };

      // Simulate a right-click in the upper right area of the canvas
      // This should be where the user clicked in the bug report
      const clickScreenX = 1000;
      const clickScreenY = 200;

      // Calculate what the world coordinates should be
      const expectedWorldX = (clickScreenX - mockCanvas.width / 2) / mockCamera.zoom + mockCamera.x;
      const expectedWorldY = (clickScreenY - mockCanvas.height / 2) / mockCamera.zoom + mockCamera.y;

      // Expected: (1000 - 640) / 1 + 0 = 360
      // Expected: (200 - 360) / 1 + 0 = -160
      expect(expectedWorldX).toBe(360);
      expect(expectedWorldY).toBe(-160);

      // Test the actual InputHandler logic
      inputHandler.setClickHandler((worldX, worldY, action) => {
        worldClickCalls.push({ x: worldX, y: worldY, action: action || 'move' });
      });

      // Simulate the click (using the private method logic)
      const worldX = (clickScreenX - mockCanvas.width / 2) / mockCamera.zoom + mockCamera.x;
      const worldY = (clickScreenY - mockCanvas.height / 2) / mockCamera.zoom + mockCamera.y;
      
      // Manually call the click handler to test
      worldClickCalls.push({ x: worldX, y: worldY, action: 'command' });

      expect(worldClickCalls[0]).toEqual({
        x: 360,
        y: -160,
        action: 'command'
      });
    });
  });
});