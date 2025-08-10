import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Renderer } from '../engine/Renderer';
import { WorldManager } from '../systems/WorldManager';
import { TimeManager } from '../systems/TimeManager';
import type { Camera } from '../engine/Renderer';

describe('Renderer', () => {
  let renderer: Renderer;
  let worldManager: WorldManager;
  let timeManager: TimeManager;
  let camera: Camera;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create proper mocks for Canvas and Context
    mockContext = {
      imageSmoothingEnabled: true,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      globalAlpha: 1,
      canvas: { width: 800, height: 600 },
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn()
      }),
      // Add canvas path methods for shape rendering
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn()
    } as any;

    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn().mockReturnValue(mockContext)
    } as any;

    renderer = new Renderer(mockCanvas);
    worldManager = new WorldManager();
    timeManager = new TimeManager();
    camera = { x: 0, y: 0, zoom: 1 };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize correctly with valid canvas', () => {
      expect(() => new Renderer(mockCanvas)).not.toThrow();
    });

    it('should throw error with invalid canvas', () => {
      const badCanvas = { getContext: vi.fn().mockReturnValue(null) } as any;
      expect(() => new Renderer(badCanvas)).toThrow();
    });

    it('should disable image smoothing on context', () => {
      expect(mockContext.imageSmoothingEnabled).toBe(false);
    });
  });

  describe('Basic Rendering', () => {
    it('should clear canvas with dark background', () => {
      renderer.render(camera, worldManager, timeManager);
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should set up and restore camera transformations', () => {
      renderer.render(camera, worldManager, timeManager);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should apply camera transformations correctly', () => {
      camera.x = 100;
      camera.y = 50;
      camera.zoom = 2;
      
      renderer.render(camera, worldManager, timeManager);
      
      expect(mockContext.translate).toHaveBeenCalledWith(400, 300); // Canvas center
      expect(mockContext.scale).toHaveBeenCalledWith(2, 2); // Zoom
      expect(mockContext.translate).toHaveBeenCalledWith(-100, -50); // Camera offset
    });
  });

  describe('Canvas Resize', () => {
    it('should resize canvas correctly', () => {
      renderer.resizeCanvas(1024, 768);
      
      expect(mockCanvas.width).toBe(1024);
      expect(mockCanvas.height).toBe(768);
      expect(mockContext.imageSmoothingEnabled).toBe(false);
    });
  });
});