import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandler } from '../engine/InputHandler';
import { ShipActor } from '../engine/ShipActor';
import { Ship, ShipClass } from '../types/player';

describe('Ship Positioning Integration Test', () => {
  let shipActor: ShipActor;
  let ship: Ship;

  beforeEach(() => {
    const shipClass: ShipClass = {
      id: 'test-courier',
      name: 'Test Courier',
      category: 'courier',
      baseCargoCapacity: 50,
      baseFuelCapacity: 100,
      baseSpeed: 120,
      baseShields: 50,
      equipmentSlots: {
        engines: 1,
        cargo: 1,
        shields: 1,
        weapons: 1,
        utility: 1
      }
    };

    ship = {
      id: 'test-ship-integration',
      name: 'Test Ship Integration',
      class: shipClass,
      cargo: { capacity: 50, used: 0, items: new Map() },
      equipment: { engines: [], cargo: [], shields: [], weapons: [], utility: [] },
      condition: { hull: 1.0, engines: 1.0, cargo: 1.0, shields: 1.0, lastMaintenance: Date.now() },
      location: {
        systemId: 'test-system',
        coordinates: { x: 150, y: 100, z: 50 }, // Initial position from console log
        isInTransit: false
      }
    };

    shipActor = new ShipActor(ship);
  });

  describe('Ship Movement Accuracy', () => {
    it('should reproduce the positioning issue from live game', () => {
      // Initial position based on console log: "Player ship initialized in scene: Stellar Venture at {x: 150, y: 100, z: 50}"
      expect(shipActor.position.x).toBe(150);
      expect(shipActor.position.y).toBe(100);
      expect(shipActor.position.z).toBe(50);

      // Now test movement to a specific coordinate that was logged
      // Console showed "Right-click: Moving ship to coordinates (0, 0)"
      const targetX = 0;
      const targetY = 0;

      shipActor.setTarget({ x: targetX, y: targetY });
      
      // Verify target was set correctly
      expect(shipActor['targetPosition']).toEqual({
        x: targetX,
        y: targetY,
        z: 50 // Should preserve ship layer
      });

      // Simulate several updates to let the ship move
      const deltaTime = 1/60; // 60 FPS
      for (let i = 0; i < 60; i++) { // 1 second of movement
        shipActor.update(deltaTime);
        
        // Check rotation is being calculated
        const dx = targetX - shipActor.position.x;
        const dy = targetY - shipActor.position.y;
        
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) { // Still moving
          const expectedRotation = Math.atan2(dy, dx);
          
          // Rotation should be approaching the correct value
          // Allow for some tolerance due to turn speed limiting
          const rotationDiff = Math.abs(shipActor.rotation - expectedRotation);
          const normalizedDiff = Math.min(rotationDiff, 2 * Math.PI - rotationDiff);
          
          // If we're still far from target, rotation should be close to correct
          if (Math.sqrt(dx*dx + dy*dy) > 10) {
            expect(normalizedDiff).toBeLessThan(0.5); // Within ~28 degrees
          }
        }
      }

      // After 1 second, ship should be significantly closer to target
      const finalDistance = Math.sqrt(
        Math.pow(shipActor.position.x - targetX, 2) + 
        Math.pow(shipActor.position.y - targetY, 2)
      );
      
      // Ship should have moved closer (started at distance ~180, should be much less now)
      const initialDistance = Math.sqrt(150*150 + 100*100); // ~180
      expect(finalDistance).toBeLessThan(initialDistance * 0.7); // At least 30% closer
    });

    it('should demonstrate coordinate transformation from screen to world', () => {
      // Simulate the coordinate conversion that happens in InputHandler
      const canvasWidth = 1280;
      const canvasHeight = 720;
      
      // Camera at origin (as seen in Engine.ts initialization)
      const camera = { x: 0, y: 0, zoom: 1.0 };

      // Test the coordinate conversion for a right-click at position (1000, 200)
      // This is roughly where the user clicked in upper right
      const screenX = 1000;
      const screenY = 200;
      
      const worldX = (screenX - canvasWidth / 2) / camera.zoom + camera.x;
      const worldY = (screenY - canvasHeight / 2) / camera.zoom + camera.y;
      
      // Expected: (1000 - 640) / 1 + 0 = 360
      // Expected: (200 - 360) / 1 + 0 = -160
      expect(worldX).toBe(360);
      expect(worldY).toBe(-160);
      
      // Now test if the ship would move to this position correctly
      shipActor.setTarget({ x: worldX, y: worldY });
      
      // Verify the target was set correctly
      expect(shipActor['targetPosition']?.x).toBe(360);
      expect(shipActor['targetPosition']?.y).toBe(-160);
    });

    it('should calculate rotation correctly for different target directions', () => {
      // Set ship at origin for easy testing
      shipActor.setPosition({ x: 0, y: 0, z: 50 });
      
      const testCases = [
        { target: { x: 100, y: 0 }, expectedRotation: 0, description: 'Right' },
        { target: { x: 0, y: 100 }, expectedRotation: Math.PI/2, description: 'Down' },
        { target: { x: -100, y: 0 }, expectedRotation: Math.PI, description: 'Left' },
        { target: { x: 0, y: -100 }, expectedRotation: -Math.PI/2, description: 'Up' }
      ];

      testCases.forEach(testCase => {
        // Reset ship position and rotation
        shipActor.setPosition({ x: 0, y: 0, z: 50 });
        shipActor['rotation'] = 0; // Reset rotation
        
        shipActor.setTarget(testCase.target);
        
        // Update multiple times to allow rotation to settle (give it 0.5 seconds)
        for (let i = 0; i < 30; i++) {
          shipActor.update(1/60);
        }
        
        // Calculate what the rotation should be
        const dx = testCase.target.x - 0;
        const dy = testCase.target.y - 0;
        const expectedRotation = Math.atan2(dy, dx);
        
        const rotationDiff = Math.abs(shipActor.rotation - expectedRotation);
        const normalizedDiff = Math.min(rotationDiff, 2 * Math.PI - rotationDiff);
        
        console.log(`${testCase.description}: Expected ${expectedRotation.toFixed(3)}, Got ${shipActor.rotation.toFixed(3)}, Diff ${normalizedDiff.toFixed(3)}`);
        
        // After 0.5 seconds, rotation should be very close
        expect(normalizedDiff).toBeLessThan(0.1); // Within ~6 degrees
      });
    });
  });

  describe('Visual Rotation Alignment', () => {
    it('should verify that render rotation matches movement rotation', () => {
      // This test would normally require a mock canvas context
      // For now, we'll just verify the rotation value is being applied correctly
      
      const mockContext = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        font: '',
        textAlign: 'center' as CanvasTextAlign,
        fillText: vi.fn(),
        globalAlpha: 1,
        drawImage: vi.fn()
      } as unknown as CanvasRenderingContext2D;

      // Set up ship movement
      shipActor.setTarget({ x: 200, y: 0 }); // Move right
      
      // Let ship rotate towards target (give it enough time to complete rotation)
      for (let i = 0; i < 30; i++) {
        shipActor.update(1/60);
      }
      
      const currentRotation = shipActor.rotation;
      
      // Render the ship
      shipActor.render(mockContext);
      
      // Verify that rotate was called with the current rotation
      expect(mockContext.rotate).toHaveBeenCalledWith(currentRotation);
      
      // After 0.5 seconds, the rotation should be approximately 0 (pointing right)
      expect(Math.abs(currentRotation)).toBeLessThan(0.1);
    });
  });
});