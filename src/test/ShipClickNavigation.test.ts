import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandler } from '../engine/InputHandler';
import { Camera } from '../engine/Renderer';
import { WorldManager } from '../systems/WorldManager';

describe('Ship Click Navigation - Ray-Plane Intersection Fix', () => {
  let mockCanvas: HTMLCanvasElement;
  let inputHandler: InputHandler;
  let mockWorldManager: WorldManager;
  let clickedCoordinates: { x: number; y: number } | null = null;

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = {
      width: 800,
      height: 600,
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600
      }))
    } as any;

    // Create input handler
    inputHandler = new InputHandler(mockCanvas);

    // Mock world manager
    mockWorldManager = {
      moveShipToCoordinates: vi.fn((x: number, y: number) => {
        clickedCoordinates = { x, y };
      }),
      getAllVisibleObjects: vi.fn(() => [])
    } as any;

    // Set up click handler
    inputHandler.setClickHandler((worldX: number, worldY: number) => {
      InputHandler.handleWorldClick(worldX, worldY, mockWorldManager);
    });

    // Reset clicked coordinates
    clickedCoordinates = null;
  });

  describe('Ray-Plane Intersection Coordinate Transformation', () => {
    it('should produce same results as old method for center clicks', () => {
      const camera: Camera = {
        x: 100,
        y: 200,
        zoom: 1
      };

      // Click center of canvas
      const centerX = mockCanvas.width / 2; // 400
      const centerY = mockCanvas.height / 2; // 300

      // Test the new ray-plane intersection method
      const newMethod = (inputHandler as any).screenToWorldRayIntersection(centerX, centerY, camera);
      
      // Old method calculation for comparison
      const oldWorldX = (centerX - mockCanvas.width / 2) / camera.zoom + camera.x;
      const oldWorldY = (centerY - mockCanvas.height / 2) / camera.zoom + camera.y;

      expect(newMethod.x).toBeCloseTo(oldWorldX, 5);
      expect(newMethod.y).toBeCloseTo(oldWorldY, 5);
      
      // Both should result in the camera position for center clicks
      expect(newMethod.x).toBe(camera.x);
      expect(newMethod.y).toBe(camera.y);
    });

    it('should handle zoom correctly with ray-plane intersection', () => {
      const camera: Camera = {
        x: 0,
        y: 0,
        zoom: 2 // Zoomed in 2x
      };

      // Click 100 pixels right of center
      const clickX = mockCanvas.width / 2 + 100; // 500
      const clickY = mockCanvas.height / 2; // 300 (center)

      const newMethod = (inputHandler as any).screenToWorldRayIntersection(clickX, clickY, camera);
      
      // Old method for comparison
      const oldWorldX = (clickX - mockCanvas.width / 2) / camera.zoom + camera.x;
      const oldWorldY = (clickY - mockCanvas.height / 2) / camera.zoom + camera.y;

      expect(newMethod.x).toBeCloseTo(oldWorldX, 5);
      expect(newMethod.y).toBeCloseTo(oldWorldY, 5);
      
      // With 2x zoom, 100 screen pixels should map to 50 world units
      expect(newMethod.x).toBe(50); // 0 + 50
      expect(newMethod.y).toBe(0);  // 0 + 0
    });

    it('should handle camera movement with ray-plane intersection', () => {
      const camera: Camera = {
        x: 500,
        y: -300,
        zoom: 1
      };

      // Click various positions
      const testCases = [
        { screenX: mockCanvas.width / 2, screenY: mockCanvas.height / 2, expectedX: 500, expectedY: -300 }, // Center
        { screenX: mockCanvas.width / 2 + 200, screenY: mockCanvas.height / 2, expectedX: 700, expectedY: -300 }, // Right
        { screenX: mockCanvas.width / 2, screenY: mockCanvas.height / 2 + 150, expectedX: 500, expectedY: -150 }, // Down
      ];

      testCases.forEach(({ screenX, screenY, expectedX, expectedY }) => {
        const newMethod = (inputHandler as any).screenToWorldRayIntersection(screenX, screenY, camera);
        
        expect(newMethod.x).toBeCloseTo(expectedX, 1);
        expect(newMethod.y).toBeCloseTo(expectedY, 1);
      });
    });

    it('should handle complex camera and zoom combinations', () => {
      const camera: Camera = {
        x: 1000,
        y: -500,
        zoom: 0.5 // Zoomed out 2x
      };

      // Click 200 pixels right and 150 pixels down from center
      const clickX = mockCanvas.width / 2 + 200; // 600
      const clickY = mockCanvas.height / 2 + 150; // 450

      const newMethod = (inputHandler as any).screenToWorldRayIntersection(clickX, clickY, camera);
      
      // Old method for comparison
      const oldWorldX = (clickX - mockCanvas.width / 2) / camera.zoom + camera.x;
      const oldWorldY = (clickY - mockCanvas.height / 2) / camera.zoom + camera.y;

      expect(newMethod.x).toBeCloseTo(oldWorldX, 5);
      expect(newMethod.y).toBeCloseTo(oldWorldY, 5);
      
      // With 0.5x zoom, screen pixels are magnified 2x in world space
      expect(newMethod.x).toBe(1400); // 1000 + (200 / 0.5)
      expect(newMethod.y).toBe(-200); // -500 + (150 / 0.5)
    });

    it('should handle normalized device coordinate conversion correctly', () => {
      const camera: Camera = {
        x: 0,
        y: 0,
        zoom: 1
      };

      // Test corner cases
      const testCases = [
        { screenX: 0, screenY: 0, description: 'top-left corner' },
        { screenX: mockCanvas.width, screenY: 0, description: 'top-right corner' },
        { screenX: 0, screenY: mockCanvas.height, description: 'bottom-left corner' },
        { screenX: mockCanvas.width, screenY: mockCanvas.height, description: 'bottom-right corner' },
      ];

      testCases.forEach(({ screenX, screenY, description }) => {
        const newMethod = (inputHandler as any).screenToWorldRayIntersection(screenX, screenY, camera);
        const oldWorldX = (screenX - mockCanvas.width / 2) / camera.zoom + camera.x;
        const oldWorldY = (screenY - mockCanvas.height / 2) / camera.zoom + camera.y;

        expect(newMethod.x).toBeCloseTo(oldWorldX, 1);
        expect(newMethod.y).toBeCloseTo(oldWorldY, 1);
      });
    });
  });

  describe('Y-Axis Coordinate System Consistency', () => {
    it('should maintain consistent Y-axis direction', () => {
      const camera: Camera = { x: 0, y: 0, zoom: 1 };

      // Click top of screen (Y=0)
      const topResult = (inputHandler as any).screenToWorldRayIntersection(mockCanvas.width / 2, 0, camera);
      
      // Click bottom of screen (Y=height)
      const bottomResult = (inputHandler as any).screenToWorldRayIntersection(mockCanvas.width / 2, mockCanvas.height, camera);

      // Top of screen should give negative world Y, bottom should give positive world Y
      // This matches the standard screen coordinate system where Y increases downward
      expect(topResult.y).toBeLessThan(0);    // Top -> negative world Y
      expect(bottomResult.y).toBeGreaterThan(0); // Bottom -> positive world Y
      
      // The magnitude should be half the viewport height in world units
      expect(Math.abs(topResult.y)).toBe(mockCanvas.height / 2);
      expect(Math.abs(bottomResult.y)).toBe(mockCanvas.height / 2);
    });

    it('should handle Y-axis flipping correctly in NDC conversion', () => {
      const camera: Camera = { x: 0, y: 0, zoom: 1 };

      // Click 100 pixels down from center (should be positive world Y)
      const screenX = mockCanvas.width / 2;
      const screenY = mockCanvas.height / 2 + 100;

      const result = (inputHandler as any).screenToWorldRayIntersection(screenX, screenY, camera);
      
      expect(result.x).toBe(0);   // Should be at camera X (center)
      expect(result.y).toBe(100); // Should be positive (down in world = positive Y)
    });
  });

  describe('Integration with InputHandler', () => {
    it('should use the new coordinate transformation in handleClick', () => {
      const camera: Camera = {
        x: 250,
        y: 150,
        zoom: 1.5
      };

      // Access private method to test coordinate transformation
      const screenX = mockCanvas.width / 2 + 75;  // 75 pixels right of center
      const screenY = mockCanvas.height / 2 - 45; // 45 pixels up from center

      // Use the actual handleClick method (through click handler)
      inputHandler.setClickHandler((worldX: number, worldY: number) => {
        clickedCoordinates = { x: worldX, y: worldY };
      });

      // Simulate the internal handleClick call
      (inputHandler as any).handleClick(screenX, screenY, camera);

      // Verify the coordinates were calculated using the new method
      expect(clickedCoordinates).not.toBeNull();
      
      // Calculate expected coordinates using the new method
      const expected = (inputHandler as any).screenToWorldRayIntersection(screenX, screenY, camera);
      
      expect(clickedCoordinates!.x).toBeCloseTo(expected.x, 5);
      expect(clickedCoordinates!.y).toBeCloseTo(expected.y, 5);
    });
  });
});