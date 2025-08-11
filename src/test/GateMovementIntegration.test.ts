import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Engine } from '../engine/Engine';
import { Ship } from '../types/player';
import { createShipCoords } from '../utils/coordinates';

describe('Gate Movement Integration', () => {
  let engine: Engine;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create a mock canvas
    mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1,
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 50 }),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        setTransform: vi.fn(),
        transform: vi.fn(),
      }),
      width: 1024,
      height: 768,
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: vi.fn().mockReturnValue({ 
        left: 0, 
        top: 0, 
        width: 1024, 
        height: 768 
      }),
      parentElement: {
        clientWidth: 1024,
        clientHeight: 768
      },
      clientWidth: 1024,
      clientHeight: 768
    } as unknown as HTMLCanvasElement;

    // Mock WebGL context for ThreeRenderer
    const mockWebGLContext = {
      getExtension: vi.fn().mockReturnValue(null),
      getContextAttributes: vi.fn().mockReturnValue({}),
      createProgram: vi.fn(),
      createShader: vi.fn(),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      useProgram: vi.fn(),
      createBuffer: vi.fn(),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      drawArrays: vi.fn(),
      clear: vi.fn(),
      clearColor: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      viewport: vi.fn(),
      getUniformLocation: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      uniform4f: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      canvas: mockCanvas
    };

    // Mock both 2D and WebGL contexts
    (mockCanvas.getContext as any)
      .mockImplementation((type: string) => {
        if (type === '2d') {
          return {
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            scale: vi.fn(),
            rotate: vi.fn(),
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            globalAlpha: 1,
            drawImage: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            arc: vi.fn(),
            closePath: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            measureText: vi.fn().mockReturnValue({ width: 50 }),
            fillText: vi.fn(),
            strokeText: vi.fn(),
            setTransform: vi.fn(),
            transform: vi.fn(),
          };
        } else if (type === 'webgl' || type === 'webgl2') {
          return mockWebGLContext;
        }
        return null;
      });

    try {
      engine = new Engine(mockCanvas);
    } catch (error) {
      console.error('Failed to create engine in test:', error);
      throw error;
    }
  });

  describe('Position Update Callback Integration', () => {
    it('should have position update callback set when ship is set in scene manager', async () => {
      // Start the engine to initialize all systems
      engine.start();
      
      // Get the systems
      const worldManager = engine.getWorldManager();
      const sceneManager = engine.getSceneManager();
      const playerManager = engine.getPlayerManager();
      
      // Ensure player ship is set
      const ship = playerManager.getShip();
      expect(ship).toBeDefined();
      
      // Set initial ship position
      ship.location.coordinates = createShipCoords(100, 100);
      
      // Set ship in world manager (this should set up position callback)
      worldManager.setPlayerShip(ship);
      
      // Get the ship actor from scene manager
      const shipActor = sceneManager.getPlayerShipActor();
      expect(shipActor).toBeDefined();
      
      // Verify that position update callback is set by checking if it's called during movement
      let positionUpdateCallCount = 0;
      
      // Mock the checkGateCollisions method to track calls
      const checkGateCollisionsSpy = vi.spyOn(worldManager as any, 'checkGateCollisions')
        .mockImplementation(() => {
          positionUpdateCallCount++;
          console.log(`Position update callback called ${positionUpdateCallCount} times`);
        });
      
      // Start ship movement to a new position
      const success = sceneManager.moveShipTo(200, 200);
      expect(success).toBe(true);
      
      // Simulate some update cycles to allow movement
      for (let i = 0; i < 10; i++) {
        sceneManager.update(0.016); // 60fps = 16ms per frame
        
        // Break early if movement is complete
        if (!sceneManager.isPlayerShipMoving()) {
          break;
        }
      }
      
      // Verify that position update callback was called during movement
      expect(positionUpdateCallCount).toBeGreaterThan(0);
      expect(checkGateCollisionsSpy).toHaveBeenCalled();
    });

    it('should trigger gate collision during actual ship movement', async () => {
      // Start the engine
      engine.start();
      
      // Get systems
      const worldManager = engine.getWorldManager();
      const sceneManager = engine.getSceneManager();
      const playerManager = engine.getPlayerManager();
      
      // Get current system and find a gate
      const currentSystem = worldManager.getCurrentSystem();
      expect(currentSystem).toBeDefined();
      expect(currentSystem!.gates.length).toBeGreaterThan(0);
      
      const gate = currentSystem!.gates[0];
      console.log('Testing movement to gate:', gate.name, 'at position', gate.position);
      
      // Ensure ship is initialized
      const ship = playerManager.getShip();
      expect(ship).toBeDefined();
      
      // Set ship to a position away from the gate
      ship.location.coordinates = createShipCoords(gate.position.x - 100, gate.position.y - 100);
      worldManager.setPlayerShip(ship);
      
      // Mock the useGate method to track gate usage attempts
      let gateUsageAttempted = false;
      const useGateSpy = vi.spyOn(worldManager as any, 'useGate')
        .mockImplementation((gateId: string) => {
          gateUsageAttempted = true;
          console.log(`Gate usage attempted for gate: ${gateId}`);
          return true; // Simulate successful gate usage
        });
      
      // Mock player credits for gate usage
      vi.spyOn(playerManager, 'getPlayer').mockReturnValue({
        credits: 1000,
        name: 'Test Player',
        id: 'test-player'
      } as any);
      vi.spyOn(playerManager, 'spendCredits').mockImplementation(() => true);
      
      // Move ship directly to gate position
      console.log(`Moving ship from (${ship.location.coordinates!.x}, ${ship.location.coordinates!.y}) to gate at (${gate.position.x}, ${gate.position.y})`);
      
      const success = sceneManager.moveShipTo(gate.position.x, gate.position.y);
      expect(success).toBe(true);
      
      // Simulate movement updates until ship reaches gate or collision happens
      let updateCount = 0;
      const maxUpdates = 200; // Prevent infinite loop
      
      while (sceneManager.isPlayerShipMoving() && updateCount < maxUpdates && !gateUsageAttempted) {
        sceneManager.update(0.016);
        updateCount++;
        
        // Check ship position
        const currentShipPos = ship.location.coordinates;
        if (currentShipPos) {
          const distanceToGate = Math.sqrt(
            Math.pow(currentShipPos.x - gate.position.x, 2) + 
            Math.pow(currentShipPos.y - gate.position.y, 2)
          );
          
          if (distanceToGate <= 25) { // Gate collision radius
            console.log(`Ship reached gate collision distance: ${distanceToGate.toFixed(2)}`);
            break;
          }
        }
      }
      
      console.log(`Movement simulation complete after ${updateCount} updates`);
      console.log('Ship still moving:', sceneManager.isPlayerShipMoving());
      console.log('Gate usage attempted:', gateUsageAttempted);
      
      // Verify that gate collision was detected
      expect(gateUsageAttempted).toBe(true);
      expect(useGateSpy).toHaveBeenCalledWith(gate.id);
    });
  });

  afterEach(() => {
    if (engine) {
      engine.dispose();
    }
  });
});