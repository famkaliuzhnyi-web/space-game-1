import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThreeRenderer } from '../engine/ThreeRenderer';
import { Engine } from '../engine/Engine';

// Mock Three.js modules
vi.mock('three', () => {
  const mockScene = {
    add: vi.fn(),
    remove: vi.fn()
  };
  
  const mockRenderer = {
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn()
  };
  
  const mockCamera = {
    position: { copy: vi.fn() },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn()
  };
  
  const mockGeometry = {
    setAttribute: vi.fn(),
    dispose: vi.fn()
  };
  
  const mockMaterial = {
    dispose: vi.fn()
  };
  
  const mockMesh = {
    position: { set: vi.fn() },
    rotation: { z: 0, y: 0 },
    geometry: mockGeometry,
    material: mockMaterial
  };
  
  const mockGroup = {
    add: vi.fn(),
    position: { set: vi.fn() },
    rotation: { z: 0, y: 0 },
    children: [mockMesh]
  };
  
  const mockPoints = {
    rotation: { y: 0 },
    geometry: mockGeometry,
    material: mockMaterial
  };

  return {
    Scene: vi.fn(() => mockScene),
    WebGLRenderer: vi.fn(() => mockRenderer),
    PerspectiveCamera: vi.fn(() => mockCamera),
    AmbientLight: vi.fn(),
    DirectionalLight: vi.fn(),
    BufferGeometry: vi.fn(() => mockGeometry),
    BufferAttribute: vi.fn(),
    PointsMaterial: vi.fn(() => mockMaterial),
    Points: vi.fn(() => mockPoints),
    Group: vi.fn(() => mockGroup),
    SphereGeometry: vi.fn(() => mockGeometry),
    BoxGeometry: vi.fn(() => mockGeometry),
    MeshBasicMaterial: vi.fn(() => mockMaterial),
    MeshLambertMaterial: vi.fn(() => mockMaterial),
    Mesh: vi.fn(() => mockMesh),
    Vector3: vi.fn(() => ({ set: vi.fn(), copy: vi.fn() })),
    Color: vi.fn(),
    BackSide: 'BackSide'
  };
});

// Mock WorldManager and TimeManager
const mockWorldManager = {
  getAllVisibleObjects: vi.fn(() => []),
  getCurrentStation: vi.fn(() => null)
};

const mockTimeManager = {
  getCurrentTime: vi.fn(() => new Date()),
  getTimeAcceleration: vi.fn(() => 1),
  formatTime: vi.fn(() => '2157-01-01 00:01')
};

describe('ThreeRenderer', () => {
  let canvas: HTMLCanvasElement;
  let renderer: ThreeRenderer;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Mock canvas methods
    Object.defineProperty(canvas, 'clientWidth', { value: 800 });
    Object.defineProperty(canvas, 'clientHeight', { value: 600 });
    Object.defineProperty(canvas, 'parentElement', { value: document.body });
    
    // Initialize renderer
    renderer = new ThreeRenderer(canvas);
  });

  describe('Initialization', () => {
    it('should initialize without throwing', () => {
      expect(renderer).toBeDefined();
    });

    it('should create 3D scene components', () => {
      // The renderer should have been constructed successfully
      expect(renderer).toBeInstanceOf(ThreeRenderer);
    });
  });

  describe('Rendering', () => {
    it('should render scene without errors', () => {
      const camera = { x: 0, y: 0, zoom: 1 };
      
      expect(() => {
        renderer.render(camera, mockWorldManager as any, mockTimeManager as any);
      }).not.toThrow();
    });

    it('should handle camera updates', () => {
      const camera = { x: 100, y: 200, zoom: 2 };
      
      expect(() => {
        renderer.render(camera, mockWorldManager as any, mockTimeManager as any);
      }).not.toThrow();
    });

    it('should handle world objects rendering', () => {
      const mockObjects = [
        {
          type: 'star',
          position: { x: 0, y: 0 },
          object: {}
        },
        {
          type: 'station',
          position: { x: 100, y: 50 },
          object: { id: 'test-station' }
        },
        {
          type: 'planet',
          position: { x: -50, y: 100 },
          object: { type: 'terrestrial', habitable: true, radius: 20 }
        }
      ];
      
      mockWorldManager.getAllVisibleObjects.mockReturnValue(mockObjects);
      
      const camera = { x: 0, y: 0, zoom: 1 };
      
      expect(() => {
        renderer.render(camera, mockWorldManager as any, mockTimeManager as any);
      }).not.toThrow();
    });
  });

  describe('Resize Handling', () => {
    it('should handle resize correctly', () => {
      expect(() => {
        renderer.resizeRenderer(1024, 768);
      }).not.toThrow();
    });
  });

  describe('Disposal', () => {
    it('should dispose resources without errors', () => {
      expect(() => {
        renderer.dispose();
      }).not.toThrow();
    });
  });
});

describe('Engine 3D Integration', () => {
  let canvas: HTMLCanvasElement;
  let engine: Engine;

  beforeEach(() => {
    // Create a mock canvas with parent
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const container = document.createElement('div');
    container.appendChild(canvas);
    document.body.appendChild(container);
    
    // Mock canvas properties
    Object.defineProperty(canvas, 'clientWidth', { value: 800 });
    Object.defineProperty(canvas, 'clientHeight', { value: 600 });
    
    // Mock 2D context
    const mockContext = {
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
      strokeRect: vi.fn(),
      font: '',
      textAlign: '',
      fillText: vi.fn(),
      globalAlpha: 1,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'low'
    };
    
    canvas.getContext = vi.fn(() => mockContext);
    
    // Initialize engine
    engine = new Engine(canvas);
  });

  describe('Render Mode Management', () => {
    it('should initialize in 2D mode by default', () => {
      expect(engine.getRenderMode()).toBe('2D');
    });

    it('should check 3D availability', () => {
      const is3DAvailable = engine.is3DAvailable();
      expect(typeof is3DAvailable).toBe('boolean');
    });

    it('should switch to 3D mode when available', () => {
      if (engine.is3DAvailable()) {
        const success = engine.setRenderMode('3D');
        expect(success).toBe(true);
        expect(engine.getRenderMode()).toBe('3D');
      }
    });

    it('should switch back to 2D mode', () => {
      const success = engine.setRenderMode('2D');
      expect(success).toBe(true);
      expect(engine.getRenderMode()).toBe('2D');
    });

    it('should handle invalid mode gracefully', () => {
      const success = engine.setRenderMode('INVALID' as any);
      expect(success).toBe(false);
      expect(engine.getRenderMode()).toBe('2D'); // Should remain in current mode
    });
  });

  describe('Rendering Integration', () => {
    it('should render without errors in 2D mode', () => {
      engine.setRenderMode('2D');
      expect(() => {
        engine.render();
      }).not.toThrow();
    });

    it('should render without errors in 3D mode when available', () => {
      if (engine.is3DAvailable()) {
        engine.setRenderMode('3D');
        expect(() => {
          engine.render();
        }).not.toThrow();
      }
    });
  });

  describe('Canvas Management', () => {
    it('should handle resize in both modes', () => {
      expect(() => {
        engine.resizeCanvas(1024, 768);
      }).not.toThrow();
      
      if (engine.is3DAvailable()) {
        engine.setRenderMode('3D');
        expect(() => {
          engine.resizeCanvas(1280, 720);
        }).not.toThrow();
      }
    });
  });

  describe('Engine Lifecycle', () => {
    it('should start and stop without errors', () => {
      expect(() => {
        engine.start();
        engine.stop();
      }).not.toThrow();
    });

    it('should dispose resources properly', () => {
      expect(() => {
        engine.dispose();
      }).not.toThrow();
    });
  });
});