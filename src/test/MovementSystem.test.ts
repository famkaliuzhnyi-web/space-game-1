import { describe, test, expect, beforeEach, vi } from 'vitest';
import { MovementSystem } from '../systems/MovementSystem';
import { ShipActor } from '../engine/entities/ShipActor';
import { WorldManager } from '../systems/WorldManager';
import { TimeManager } from '../systems/TimeManager';
import { Ship } from '../types/player';

// Mock implementations
const createMockShip = (): Ship => ({
  id: 'test-ship',
  name: 'Test Ship',
  class: {
    id: 'test-class',
    name: 'Test Class',
    category: 'courier',
    baseCargoCapacity: 100,
    baseFuelCapacity: 100,
    baseSpeed: 100,
    baseShields: 100,
    equipmentSlots: {
      engines: 1,
      cargo: 1,
      shields: 1,
      weapons: 1,
      utility: 1
    }
  },
  cargo: {
    capacity: 100,
    used: 0,
    items: new Map()
  },
  equipment: {
    engines: [],
    cargo: [],
    shields: [],
    weapons: [],
    utility: []
  },
  condition: {
    hull: 1,
    engines: 1,
    cargo: 1,
    shields: 1,
    lastMaintenance: Date.now()
  },
  location: {
    systemId: 'test-system',
    stationId: 'test-station',
    coordinates: { x: 0, y: 0 },
    isInTransit: false
  }
});

describe('MovementSystem', () => {
  let movementSystem: MovementSystem;
  let worldManager: WorldManager;
  let timeManager: TimeManager;
  let mockShip: Ship;
  let shipActor: ShipActor;

  beforeEach(() => {
    worldManager = new WorldManager();
    timeManager = new TimeManager();
    movementSystem = new MovementSystem(worldManager, timeManager);
    mockShip = createMockShip();
    shipActor = new ShipActor(mockShip);
  });

  describe('Ship Movement', () => {
    test('should move ship to coordinates', () => {
      const targetPosition = { x: 100, y: 200 };
      const result = movementSystem.moveShipToCoordinates(shipActor, targetPosition.x, targetPosition.y);
      
      expect(result).toBe(true);
      expect(shipActor.isMoving()).toBe(true);
      expect(movementSystem.isShipMoving(shipActor.id)).toBe(true);
    });

    test('should stop ship movement', () => {
      const targetPosition = { x: 100, y: 200 };
      movementSystem.moveShipToCoordinates(shipActor, targetPosition.x, targetPosition.y);
      
      expect(shipActor.isMoving()).toBe(true);
      
      shipActor.stopMovement();
      expect(shipActor.isMoving()).toBe(false);
    });

    test('should calculate travel time correctly', () => {
      const from = { x: 0, y: 0 };
      const to = { x: 100, y: 0 };
      const speed = 50;
      
      const travelTime = movementSystem.calculateTravelTime(from, to, speed);
      expect(travelTime).toBe(2); // 100 distance / 50 speed = 2 seconds
    });

    test('should track movement status', () => {
      const targetPosition = { x: 100, y: 200 };
      movementSystem.moveShipToCoordinates(shipActor, targetPosition.x, targetPosition.y);
      
      const status = movementSystem.getMovementStatus(shipActor.id);
      expect(status).toBeDefined();
      expect(status?.targetPosition).toEqual(targetPosition);
    });
  });

  describe('Ship Actor', () => {
    test('should create ship actor with correct properties', () => {
      expect(shipActor.id).toBe('test-ship');
      expect(shipActor.name).toBe('Test Ship');
      expect(shipActor.getShip()).toBe(mockShip);
    });

    test('should update position during movement', () => {
      const targetPosition = { x: 100, y: 0 };
      shipActor.moveTo(targetPosition, 1); // 1 second duration
      
      expect(shipActor.isMoving()).toBe(true);
      
      // Simulate time passing (50% progress)
      const initialTime = performance.now() / 1000;
      vi.spyOn(performance, 'now').mockReturnValue((initialTime + 0.5) * 1000);
      
      shipActor.update(0.016); // Simulate frame update
      
      const currentPos = shipActor.getPosition();
      expect(currentPos.x).toBeGreaterThan(0);
      expect(currentPos.x).toBeLessThan(100);
    });

    test('should complete movement after duration', () => {
      const targetPosition = { x: 100, y: 0 };
      shipActor.moveTo(targetPosition, 1); // 1 second duration
      
      // Simulate movement completion
      const initialTime = performance.now() / 1000;
      vi.spyOn(performance, 'now').mockReturnValue((initialTime + 1.1) * 1000);
      
      shipActor.update(0.016);
      
      expect(shipActor.isMoving()).toBe(false);
      expect(shipActor.getPosition()).toEqual(targetPosition);
    });
  });

  describe('Integration', () => {
    test('should update movement system without errors', () => {
      expect(() => {
        movementSystem.update(0.016);
      }).not.toThrow();
    });

    test('should handle multiple active movements', () => {
      const ship1 = new ShipActor(createMockShip());
      const ship2 = new ShipActor({...createMockShip(), id: 'test-ship-2'});
      
      movementSystem.moveShipToCoordinates(ship1, 100, 100);
      movementSystem.moveShipToCoordinates(ship2, 200, 200);
      
      expect(movementSystem.getActiveMovements()).toHaveLength(2);
    });
  });
});