import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandler } from '../engine/InputHandler';

describe('Coordinate Click Fix', () => {
  let canvas: HTMLCanvasElement;
  let inputHandler: InputHandler;
  let mockInputManager: any;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    inputHandler = new InputHandler(canvas);

    // Mock InputManager
    mockInputManager = {
      getClickEvents: vi.fn(() => []),
      getDragState: vi.fn(() => ({ isDragging: false })),
      getWheelDelta: vi.fn(() => 0),
      isKeyPressed: vi.fn(() => false),
      getTouchPositions: vi.fn(() => []),
      resetDragStartPosition: vi.fn(),
      cancelDrag: vi.fn()
    };
  });

  describe('Left and Right Click Handling', () => {
    it('should handle both left and right clicks for ship movement', () => {
      const clicksReceived: Array<{ worldX: number, worldY: number, action: 'move' | 'command' }> = [];
      
      inputHandler.setClickHandler((worldX: number, worldY: number, action?: 'move' | 'command') => {
        clicksReceived.push({ worldX, worldY, action: action || 'move' });
      });

      const camera = { x: 0, y: 0, zoom: 1 };

      // Simulate left click
      mockInputManager.getClickEvents.mockReturnValueOnce([
        { button: 0, position: { x: 450, y: 350 } } // Slightly off center
      ]);
      
      inputHandler.updateCamera(camera, 0.016, mockInputManager);

      // Simulate right click
      mockInputManager.getClickEvents.mockReturnValueOnce([
        { button: 2, position: { x: 350, y: 250 } } // Different position
      ]);
      
      inputHandler.updateCamera(camera, 0.016, mockInputManager);

      // Verify both clicks were processed
      expect(clicksReceived).toHaveLength(2);
      
      // First click (left-click) should be 'move' action
      expect(clicksReceived[0].action).toBe('move');
      expect(clicksReceived[0].worldX).toBe(50); // (450 - 400) / 1 + 0 = 50
      expect(clicksReceived[0].worldY).toBe(50); // (350 - 300) / 1 + 0 = 50
      
      // Second click (right-click) should be 'command' action
      expect(clicksReceived[1].action).toBe('command');
      expect(clicksReceived[1].worldX).toBe(-50); // (350 - 400) / 1 + 0 = -50
      expect(clicksReceived[1].worldY).toBe(-50); // (250 - 300) / 1 + 0 = -50
    });

    it('should ignore left clicks during drag operations', () => {
      const clicksReceived: Array<{ action: string }> = [];
      
      inputHandler.setClickHandler((worldX: number, worldY: number, action?: 'move' | 'command') => {
        clicksReceived.push({ action: action || 'move' });
      });

      const camera = { x: 0, y: 0, zoom: 1 };

      // Mock drag state as active
      mockInputManager.getDragState.mockReturnValue({ isDragging: true, button: 0 });
      
      // Simulate left click during drag
      mockInputManager.getClickEvents.mockReturnValue([
        { button: 0, position: { x: 400, y: 300 } }
      ]);
      
      inputHandler.updateCamera(camera, 0.016, mockInputManager);

      // Should not process the left click during drag
      expect(clicksReceived).toHaveLength(0);
    });

    it('should process right clicks even during drag operations', () => {
      const clicksReceived: Array<{ action: string }> = [];
      
      inputHandler.setClickHandler((worldX: number, worldY: number, action?: 'move' | 'command') => {
        clicksReceived.push({ action: action || 'move' });
      });

      const camera = { x: 0, y: 0, zoom: 1 };

      // Mock drag state as active with left button
      mockInputManager.getDragState.mockReturnValue({ isDragging: true, button: 0 });
      
      // Simulate right click during drag
      mockInputManager.getClickEvents.mockReturnValue([
        { button: 2, position: { x: 400, y: 300 } }
      ]);
      
      inputHandler.updateCamera(camera, 0.016, mockInputManager);

      // Should process the right click even during drag
      expect(clicksReceived).toHaveLength(1);
      expect(clicksReceived[0].action).toBe('command');
    });
  });

  describe('Coordinate Transformation Accuracy', () => {
    it('should accurately convert screen coordinates to world coordinates with camera offset and zoom', () => {
      const clicksReceived: Array<{ worldX: number, worldY: number }> = [];
      
      inputHandler.setClickHandler((worldX: number, worldY: number, action?: 'move' | 'command') => {
        clicksReceived.push({ worldX, worldY });
      });

      // Test with various camera positions and zoom levels
      // Formula: worldX = (x - canvas.width/2) / camera.zoom + camera.x
      // Formula: worldY = (y - canvas.height/2) / camera.zoom + camera.y
      const testCases = [
        { camera: { x: 0, y: 0, zoom: 1 }, click: { x: 400, y: 300 }, expected: { x: 0, y: 0 } }, // Center click, no camera offset
        { camera: { x: 100, y: 50, zoom: 1 }, click: { x: 400, y: 300 }, expected: { x: 100, y: 50 } }, // Center click, camera offset
        { camera: { x: 0, y: 0, zoom: 2 }, click: { x: 400, y: 300 }, expected: { x: 0, y: 0 } }, // Center click, zoomed
        { camera: { x: 100, y: 50, zoom: 2 }, click: { x: 500, y: 400 }, expected: { x: 150, y: 100 } }, // Off-center: (500-400)/2+100=150, (400-300)/2+50=100
      ];

      testCases.forEach((testCase, index) => {
        mockInputManager.getClickEvents.mockReturnValueOnce([
          { button: 0, position: testCase.click }
        ]);
        
        inputHandler.updateCamera(testCase.camera, 0.016, mockInputManager);

        const receivedClick = clicksReceived[index];
        expect(receivedClick.worldX).toBeCloseTo(testCase.expected.x, 5);
        expect(receivedClick.worldY).toBeCloseTo(testCase.expected.y, 5);
      });
    });
  });
});