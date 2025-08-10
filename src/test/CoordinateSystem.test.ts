import { describe, test, expect } from 'vitest';
import { 
  COORDINATE_LAYERS,
  to3D,
  to2D,
  distance2D,
  distance3D,
  positionsEqual2D,
  getLayerForObjectType,
  createLayeredPosition,
  normalizeCoordinates,
  isValidCoordinate,
  calculateBoundingBox2D,
  convertLegacyCoords
} from '../utils/coordinates';
import { Vector2D, Vector3D } from '../types';

describe('Unified Coordinate System', () => {
  describe('Layer Constants', () => {
    test('should have correct layer values', () => {
      expect(COORDINATE_LAYERS.SHIPS).toBe(50);
      expect(COORDINATE_LAYERS.STATIONS).toBe(30);
      expect(COORDINATE_LAYERS.PLANETS).toBe(0);
      expect(COORDINATE_LAYERS.STARS).toBe(0);
      expect(COORDINATE_LAYERS.CAMERA).toBe(5000);
    });
  });

  describe('Coordinate Conversion', () => {
    test('should convert 2D to 3D coordinates', () => {
      const coords2D: Vector2D = { x: 100, y: 200 };
      const coords3D = to3D(coords2D, 50);
      
      expect(coords3D).toEqual({ x: 100, y: 200, z: 50 });
    });

    test('should convert 3D to 2D coordinates', () => {
      const coords3D: Vector3D = { x: 100, y: 200, z: 50 };
      const coords2D = to2D(coords3D);
      
      expect(coords2D).toEqual({ x: 100, y: 200 });
    });

    test('should convert legacy coordinates with appropriate layer', () => {
      const legacyCoords = { x: 100, y: 200 };
      const shipCoords = convertLegacyCoords(legacyCoords, 'ship');
      const stationCoords = convertLegacyCoords(legacyCoords, 'station');
      
      expect(shipCoords).toEqual({ x: 100, y: 200, z: 50 });
      expect(stationCoords).toEqual({ x: 100, y: 200, z: 30 });
    });
  });

  describe('Distance Calculations', () => {
    test('should calculate 2D distance correctly', () => {
      const pos1: Vector3D = { x: 0, y: 0, z: 50 };
      const pos2: Vector3D = { x: 3, y: 4, z: 30 };
      const distance = distance2D(pos1, pos2);
      
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    test('should calculate 3D distance correctly', () => {
      const pos1: Vector3D = { x: 0, y: 0, z: 0 };
      const pos2: Vector3D = { x: 1, y: 1, z: 1 };
      const distance = distance3D(pos1, pos2);
      
      expect(distance).toBeCloseTo(Math.sqrt(3));
    });

    test('should ignore Z coordinate in 2D distance', () => {
      const ship: Vector3D = { x: 0, y: 0, z: 50 };
      const station: Vector3D = { x: 0, y: 0, z: 30 };
      const distance = distance2D(ship, station);
      
      expect(distance).toBe(0); // Same XY position, different layers
    });
  });

  describe('Position Comparison', () => {
    test('should compare positions in XY plane only', () => {
      const ship: Vector3D = { x: 100, y: 200, z: 50 };
      const station: Vector3D = { x: 100, y: 200, z: 30 };
      
      expect(positionsEqual2D(ship, station)).toBe(true);
    });

    test('should respect tolerance in comparison', () => {
      const pos1: Vector3D = { x: 100, y: 200, z: 50 };
      const pos2: Vector3D = { x: 100.05, y: 200.05, z: 30 };
      
      expect(positionsEqual2D(pos1, pos2, 0.1)).toBe(true);
      expect(positionsEqual2D(pos1, pos2, 0.01)).toBe(false);
    });
  });

  describe('Layer Assignment', () => {
    test('should assign correct layers for object types', () => {
      expect(getLayerForObjectType('ship')).toBe(50);
      expect(getLayerForObjectType('npc-ship')).toBe(50);
      expect(getLayerForObjectType('station')).toBe(30);
      expect(getLayerForObjectType('planet')).toBe(0);
      expect(getLayerForObjectType('star')).toBe(0);
      expect(getLayerForObjectType('unknown')).toBe(30); // Default to station layer
    });

    test('should create layered positions correctly', () => {
      const shipPos = createLayeredPosition(100, 200, 'ship');
      const stationPos = createLayeredPosition(150, 250, 'station');
      const planetPos = createLayeredPosition(300, 400, 'planet');
      
      expect(shipPos).toEqual({ x: 100, y: 200, z: 50 });
      expect(stationPos).toEqual({ x: 150, y: 250, z: 30 });
      expect(planetPos).toEqual({ x: 300, y: 400, z: 0 });
    });
  });

  describe('Coordinate Validation', () => {
    test('should normalize coordinates to 3 decimal places', () => {
      const coords: Vector3D = { x: 100.123456, y: 200.987654, z: 50.555555 };
      const normalized = normalizeCoordinates(coords);
      
      expect(normalized).toEqual({ x: 100.123, y: 200.988, z: 50.556 });
    });

    test('should validate coordinate bounds', () => {
      const validCoords: Vector3D = { x: 1000, y: 2000, z: 50 };
      const invalidCoords: Vector3D = { x: 2000000, y: 200, z: 50 };
      
      expect(isValidCoordinate(validCoords)).toBe(true);
      expect(isValidCoordinate(invalidCoords)).toBe(false);
    });
  });

  describe('Bounding Box Calculation', () => {
    test('should calculate bounding box for multiple positions', () => {
      const positions: Vector3D[] = [
        { x: 0, y: 0, z: 50 },
        { x: 100, y: 200, z: 30 },
        { x: -50, y: 150, z: 0 }
      ];
      
      const bbox = calculateBoundingBox2D(positions);
      
      expect(bbox.min).toEqual({ x: -50, y: 0 });
      expect(bbox.max).toEqual({ x: 100, y: 200 });
      expect(bbox.center).toEqual({ x: 25, y: 100 });
    });

    test('should handle empty position array', () => {
      const bbox = calculateBoundingBox2D([]);
      
      expect(bbox.min).toEqual({ x: 0, y: 0 });
      expect(bbox.max).toEqual({ x: 0, y: 0 });
      expect(bbox.center).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Game Integration', () => {
    test('should maintain layering for collision detection', () => {
      // Ships can collide with each other (same layer)
      const ship1 = createLayeredPosition(100, 100, 'ship');
      const ship2 = createLayeredPosition(105, 105, 'ship');
      
      // Ships and stations should interact despite different layers
      const station = createLayeredPosition(100, 100, 'station');
      
      expect(distance2D(ship1, ship2)).toBeLessThan(10);
      expect(distance2D(ship1, station)).toBe(0); // Same XY position
      expect(ship1.z).not.toBe(station.z); // Different layers
    });

    test('should work with camera positioning', () => {
      const ship = createLayeredPosition(100, 200, 'ship');
      const cameraZ = COORDINATE_LAYERS.CAMERA;
      
      // Camera should be far above all game objects
      expect(cameraZ).toBeGreaterThan(ship.z);
      expect(cameraZ).toBeGreaterThan(COORDINATE_LAYERS.STATIONS);
      expect(cameraZ).toBeGreaterThan(COORDINATE_LAYERS.PLANETS);
    });
  });
});